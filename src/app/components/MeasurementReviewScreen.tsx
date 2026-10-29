import { useState } from "react";
import { useNavigate } from "react-router";
import { CheckCircle2, MinusCircle, RotateCcw, Save } from "lucide-react";
import { stationCall } from "../../../services/stationApi";
import { useCheckupStore, type MeasureStep } from "../../stores/useCheckupStore";
import { useStation } from "../hooks/useStation";
import { MEASURE_STEPS, MeasureShell } from "./measure/MeasureShell";

const fmt = (v: number | null | undefined, dp = 1) => (v == null ? "--" : Number(v).toFixed(dp));

function bmiCategory(bmi: number) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

// Step 4 · Review & save (test.html step 5): summary, save to backend/test_results.json,
// and redo any single measurement. Collected results are in the control panel (#/control).
export function MeasurementReviewScreen() {
  const navigate = useNavigate();
  const station = useStation();
  const vitals = useCheckupStore((s) => s.vitals);
  const stepStatus = useCheckupStore((s) => s.stepStatus);
  const resetMeasurements = useCheckupStore((s) => s.resetMeasurements);

  const [savedId, setSavedId] = useState<number | null>(null);
  const [saveMsg, setSaveMsg] = useState<{ text: string; ok: boolean }>({ text: "", ok: true });

  const bmi = vitals.height_cm && vitals.weight_kg ? vitals.weight_kg / (vitals.height_cm / 100) ** 2 : null;
  const anyDone = Object.values(stepStatus).includes("done");

  const rows: { label: string; value: string; unit: string; step: MeasureStep | null }[] = [
    { label: "កម្ពស់ (Height)", value: fmt(vitals.height_cm), unit: "cm", step: "height" },
    { label: "ទម្ងន់ (Weight)", value: fmt(vitals.weight_kg), unit: "kg", step: "weight" },
    { label: "BMI", value: bmi ? `${fmt(bmi)} · ${bmiCategory(bmi)}` : "--", unit: "", step: null },
    { label: "ចង្វាក់បេះដូង (Heart rate)", value: fmt(vitals.heart_rate_bpm, 0), unit: "bpm", step: "vitals" },
    { label: "SpO2", value: fmt(vitals.spo2_percent, 0), unit: "%", step: "vitals" },
    {
      label: "សម្ពាធឈាម (Blood pressure)",
      value: vitals.systolic_mmhg ? `${vitals.systolic_mmhg} / ${vitals.diastolic_mmhg}` : "--",
      unit: "mmHg",
      step: "bp",
    },
    { label: "Pulse (BP monitor)", value: fmt(vitals.pulse_bpm, 0), unit: "/min", step: "bp" },
  ];

  const stepPath = (k: MeasureStep) => MEASURE_STEPS.find((s) => s.keys.includes(k))!.path;

  const save = async () => {
    const body = {
      heightCm: vitals.height_cm ?? null,
      weightKg: vitals.weight_kg ?? null,
      heartRate: vitals.heart_rate_bpm ?? null,
      spo2: vitals.spo2_percent ?? null,
      systolic: vitals.systolic_mmhg ?? null,
      diastolic: vitals.diastolic_mmhg ?? null,
      pulse: vitals.pulse_bpm ?? null,
    };
    const r = await stationCall("POST", "/api/test/results", body);
    if (!r.ok) return setSaveMsg({ text: r.json?.error || r.json?.message || "Save failed", ok: false });
    setSavedId(r.json.id);
    setSaveMsg({ text: `បានរក្សាទុក (Saved as #${r.json.id})`, ok: true });
  };

  const newTest = async () => {
    resetMeasurements();
    setSavedId(null);
    await stationCall("POST", "/api/station/reset");
    navigate("/instructions/1");
  };

  return (
    <MeasureShell
      step={3}
      title="៤. ពិនិត្យលទ្ធផល និងរក្សាទុក"
      subtitle="Step 4 — Review & save · redo any measurement on its own, then continue"
      busy={false}
      station={station}
      footerDone={savedId != null}
      footer={
        savedId != null
          ? `លទ្ធផលបានរក្សាទុក #${savedId} — សូមចុចបន្តដើម្បីវិភាគ (Saved — continue to analysis)`
          : "ពិនិត្យលទ្ធផល ហើយចុច 'រក្សាទុក' (Review the readings and press Save)"
      }
      next={{ label: "វិភាគ (Analyze)", onClick: () => navigate("/payment"), enabled: anyDone }}
    >
      <div className="w-full max-w-xl">
        {/* Summary */}
        <div className="bg-white rounded-3xl shadow-xl border border-teal-100 p-5 flex flex-col">
          <div>
            <table className="w-full text-sm">
              <tbody>
                {rows.map((r) => {
                  const s = r.step ? stepStatus[r.step] : null;
                  return (
                    <tr key={r.label} className="border-b border-slate-100">
                      <td className="py-2 pr-2 text-slate-600">{r.label}</td>
                      <td className="py-2 text-right tabular-nums">
                        <b className="text-teal-950">{r.value}</b>{" "}
                        {r.value !== "--" && <span className="text-slate-400 text-xs">{r.unit}</span>}
                      </td>
                      <td className="py-2 pl-3 w-28 text-right">
                        {r.step && (
                          <button
                            onClick={() => navigate(stepPath(r.step!))}
                            className={`text-[11px] font-bold px-2 py-1 rounded-lg inline-flex items-center gap-1 ${
                              s === "done"
                                ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                : s === "skipped"
                                  ? "text-amber-700 bg-amber-50 hover:bg-amber-100"
                                  : "text-slate-500 bg-slate-100 hover:bg-slate-200"
                            }`}
                          >
                            {s === "done" ? <CheckCircle2 size={12} /> : s === "skipped" ? <MinusCircle size={12} /> : null}
                            {s === "done" ? "Redo" : s === "skipped" ? "Skipped" : "Measure"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className={`text-xs font-semibold min-h-[1.5em] mt-2 ${saveMsg.ok ? "text-emerald-700" : "text-rose-600"}`}>{saveMsg.text}</p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={save}
              disabled={savedId != null || !anyDone}
              className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Save size={18} />
              <span>រក្សាទុក (Save result)</span>
            </button>
            <button
              onClick={newTest}
              className="px-4 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-2xl flex items-center gap-1.5 active:scale-95"
            >
              <RotateCcw size={16} />
              <span>តេស្តថ្មី (New test)</span>
            </button>
          </div>
        </div>
      </div>
    </MeasureShell>
  );
}
