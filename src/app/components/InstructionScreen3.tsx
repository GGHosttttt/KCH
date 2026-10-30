import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, Delete, HeartPulse, Play, SkipForward, Square } from "lucide-react";
import { BP_LIMITS, stationCall } from "../../../services/stationApi";
import { useCheckupStore } from "../../stores/useCheckupStore";
import { useStation } from "../hooks/useStation";
import { MeasureShell } from "./measure/MeasureShell";

type Field = keyof typeof BP_LIMITS;

const FIELDS: { key: Field; km: string; en: string; unit: string; normal: string }[] = [
  { key: "systolic", km: "សម្ពាធលើ", en: "SYS / Systolic", unit: "mmHg", normal: "90 - 120" },
  { key: "diastolic", km: "សម្ពាធក្រោម", en: "DIA / Diastolic", unit: "mmHg", normal: "60 - 80" },
  { key: "pulse", km: "ចង្វាក់បេះដូង", en: "PUL / Pulse", unit: "/min", normal: "60 - 100" },
];

// Step 3 · Blood pressure (test.html step 4): press the monitor's button from here,
// then type the three numbers shown on its screen.
export function InstructionScreen3() {
  const navigate = useNavigate();
  const station = useStation();
  const vitals = useCheckupStore((s) => s.vitals);
  const status = useCheckupStore((s) => s.stepStatus.bp);
  const updateVitals = useCheckupStore((s) => s.updateVitals);
  const setStepStatus = useCheckupStore((s) => s.setStepStatus);

  const [values, setValues] = useState<Record<Field, string>>({
    systolic: vitals.systolic_mmhg ? String(vitals.systolic_mmhg) : "",
    diastolic: vitals.diastolic_mmhg ? String(vitals.diastolic_mmhg) : "",
    pulse: vitals.pulse_bpm ? String(vitals.pulse_bpm) : "",
  });
  const [active, setActive] = useState<Field>("systolic");
  const [bad, setBad] = useState<Set<Field>>(new Set());
  const [inputMsg, setInputMsg] = useState("");
  const [cuffMsg, setCuffMsg] = useState("");

  const bp = station.st?.device.bp;
  const online = Boolean(station.st?.device.online);
  const cuffState = !station.st
    ? "--"
    : bp?.measuring
      ? "កំពុងវាស់... (Measuring)"
      : "រួចរាល់ (Ready)";

  const cuff = async (action: "start" | "stop") => {
    const r = await stationCall("POST", "/api/bp/" + action);
    setCuffMsg(r.ok ? "" : r.json?.message || r.json?.error || "Failed");
    station.refresh();
  };

  // Keypad
  const type = (d: string) =>
    setValues((v) => (v[active].length < 3 ? { ...v, [active]: v[active] + d } : v));
  const del = () => setValues((v) => ({ ...v, [active]: v[active].slice(0, -1) }));
  const clear = () => setValues((v) => ({ ...v, [active]: "" }));

  // Returns the typed values, or null (with the bad boxes marked) if any is missing/out of range.
  const read = () => {
    const out = {} as Record<Field, number>;
    const wrong = new Set<Field>();
    for (const [f, [lo, hi]] of Object.entries(BP_LIMITS) as [Field, number[]][]) {
      const n = Number(values[f]);
      if (values[f] === "" || !Number.isInteger(n) || n < lo || n > hi) wrong.add(f);
      out[f] = n;
    }
    setBad(wrong);
    return wrong.size ? null : out;
  };

  const saveAndNext = () => {
    const v = read();
    if (!v) return setInputMsg("Enter SYS 60-260, DIA 30-160, PUL 30-250 (whole numbers), or Skip");
    if (v.systolic <= v.diastolic) return setInputMsg("SYS must be higher than DIA");
    setInputMsg("");
    updateVitals({ systolic_mmhg: v.systolic, diastolic_mmhg: v.diastolic, pulse_bpm: v.pulse });
    setStepStatus("bp", "done");
    // navigate("/instructions/review");
    navigate("/payment");
  };

  const skip = () => {
    setValues({ systolic: "", diastolic: "", pulse: "" });
    setBad(new Set());
    updateVitals({ systolic_mmhg: undefined, diastolic_mmhg: undefined, pulse_bpm: undefined });
    setStepStatus("bp", "skipped");
    // navigate("/instructions/review");
    navigate("/payment");
  };

  const nextField = () => {
    const i = FIELDS.findIndex((f) => f.key === active);
    if (i < FIELDS.length - 1) setActive(FIELDS[i + 1].key);
    else saveAndNext();
  };

  const filled = FIELDS.every((f) => values[f.key].length >= 2);

  return (
    <MeasureShell
      step={2}
      title="៣. វាស់សម្ពាធឈាម"
      subtitle="Step 3 — Blood pressure · put the cuff on, press Start, then type the numbers from the monitor"
      busy={false}
      station={station}
      footerDone={Boolean(status)}
      footer={
        bp?.measuring
          ? "កំពុងវាស់សម្ពាធឈាម... សូមអង្គុយស្ងៀម (Measuring — sit still)"
          : status === "done"
            ? "សម្ពាធឈាមបានរក្សាទុក (Blood pressure saved)"
            : "បញ្ចូលតម្លៃទាំង ៣ (SYS, DIA, PUL) ពីអេក្រង់ម៉ាស៊ីន"
      }
      next={{ label: "បន្តទៅមុខ (Next)", onClick: saveAndNext, enabled: filled }}
    >
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-5 flex flex-col md:flex-row gap-5 max-w-5xl w-full">
        {/* Cuff control */}
        <div className="md:w-60 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-5">
          <div className="relative flex items-center justify-center my-1">
            {bp?.measuring && (
              <motion.div
                className="absolute w-28 h-28 rounded-full border-4 border-rose-200"
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.2, 0.6] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center shadow-inner border-2 border-rose-200 text-rose-600 relative z-10">
              <HeartPulse size={40} />
            </div>
          </div>
          <h3 className="font-['Moul'] text-base text-teal-950 mt-2 leading-relaxed">ពាក់ខ្សែវាស់</h3>
          <p className="text-xs text-slate-500 mb-2">Put the cuff on, sit relaxed, then press Start.</p>
          <div className="text-lg font-black text-teal-950">{cuffState}</div>
          <p className="text-[11px] text-slate-500 min-h-[1.5em]">{station.bpMsg || ""}</p>
          {cuffMsg && <p className="text-[11px] text-rose-600">{cuffMsg}</p>}

          <button
            onClick={() => cuff("start")}
            disabled={!online || Boolean(bp?.measuring)}
            className="mt-2 w-full py-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-40"
          >
            <Play size={18} className="fill-white" />
            <span>ចាប់ផ្តើម (Start)</span>
          </button>
          <button
            onClick={() => cuff("stop")}
            disabled={!bp?.measuring}
            className="mt-2 w-full py-2.5 bg-white border border-rose-300 text-rose-700 font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40"
          >
            <Square size={16} />
            <span>Stop (deflate)</span>
          </button>
          {!online && station.st && <p className="text-[11px] text-rose-600 mt-2">ឧបករណ៍មិនទាន់ភ្ជាប់ — សូមចុច START លើម៉ាស៊ីនផ្ទាល់ (Press START on the monitor itself)</p>}
        </div>

        {/* Typed readings */}
        <div className="flex-1 flex flex-col">
          <p className="text-xs text-slate-500 mb-3">Type the 3 readings shown on the blood pressure monitor's screen.</p>
          <div className="space-y-2.5">
            {FIELDS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setActive(f.key)}
                className={`w-full p-3 rounded-2xl border-2 flex items-center justify-between text-left transition-all ${
                  bad.has(f.key)
                    ? "border-rose-400 bg-rose-50"
                    : active === f.key
                      ? "border-teal-600 bg-teal-50/50 shadow-sm ring-2 ring-teal-600/20"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">
                    {f.km} ({f.en})
                  </span>
                  <span className="text-xs text-slate-400">ធម្មតា: {f.normal}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl font-black font-mono ${f.key === "pulse" ? "text-rose-600" : "text-slate-900"}`}>
                    {values[f.key] || "--"}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">{f.unit}</span>
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-rose-600 font-semibold min-h-[1.5em] mt-2">{inputMsg}</p>
          <div className="mt-auto flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={skip}
              className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 active:scale-95"
            >
              <SkipForward size={16} />
              <span>រំលង (Skip)</span>
            </button>
          </div>
        </div>

        {/* Keypad */}
        <div className="w-full md:w-64 bg-slate-50 border border-slate-200 rounded-3xl p-3.5 flex flex-col">
          <div className="text-center pb-2 mb-2 border-b border-slate-200/60 text-xs font-bold text-teal-800">
            កំពុងបញ្ចូល: {FIELDS.find((f) => f.key === active)!.km}
          </div>
          <div className="grid grid-cols-3 gap-2 flex-1">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => type(n)}
                className="bg-white hover:bg-teal-50 active:bg-teal-100 border border-slate-200 rounded-2xl py-3 text-2xl font-black text-slate-800 shadow-sm transition-all active:scale-95"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={clear}
              className="bg-slate-200 hover:bg-slate-300 border border-slate-300 rounded-2xl py-3 text-xs font-bold text-slate-700 active:scale-95"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => type("0")}
              className="bg-white hover:bg-teal-50 active:bg-teal-100 border border-slate-200 rounded-2xl py-3 text-2xl font-black text-slate-800 shadow-sm active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={del}
              className="bg-slate-200 hover:bg-slate-300 border border-slate-300 rounded-2xl py-3 text-slate-700 active:scale-95 flex items-center justify-center"
            >
              <Delete size={20} />
            </button>
          </div>
          <button
            type="button"
            onClick={nextField}
            className="mt-3 w-full py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
          >
            {active === "pulse" ? (
              <>
                <CheckCircle2 size={16} />
                <span>រួចរាល់ (Finish BP)</span>
              </>
            ) : (
              <>
                <span>ប្រអប់បន្ទាប់ (Next Field)</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </MeasureShell>
  );
}
