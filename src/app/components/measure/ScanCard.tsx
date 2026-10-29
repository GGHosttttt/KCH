import { useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { CheckCircle2, MinusCircle, Play, RefreshCw, SkipForward, Square } from "lucide-react";
import { SCANS, stationCall } from "../../../../services/stationApi";
import { useCheckupStore, type VitalsData } from "../../../stores/useCheckupStore";
import type { ScanEvent, ScanKind } from "../../hooks/useStation";

export interface ScanValue {
  label: string;
  field: keyof VitalsData;
  unit: string;
  dp: number;
  live: (e: ScanEvent) => number | undefined;   // live reading from a running scan event
}

interface Props {
  kind: ScanKind;
  title: string;
  hint: string;
  seconds?: number;
  icon: ReactNode;
  values: ScanValue[];
  running: ScanKind | null;
  setRunning: (k: ScanKind | null) => void;
  scan: ScanEvent | null;
  onFinished?: (ok: boolean) => void;
}

const fmt = (v: number | null | undefined, dp: number) => (v == null ? "--" : Number(v).toFixed(dp));

// One measurement, run on its own: Start · (Stop) · Skip · Retry — same as a step in test.html.
export function ScanCard({ kind, title, hint, seconds, icon, values, running, setRunning, scan, onFinished }: Props) {
  const vitals = useCheckupStore((s) => s.vitals);
  const status = useCheckupStore((s) => s.stepStatus[kind]);
  const updateVitals = useCheckupStore((s) => s.updateVitals);
  const setStepStatus = useCheckupStore((s) => s.setStepStatus);

  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState<{ text: string; cls: "" | "ok" | "bad" }>({ text: "", cls: "" });

  const isRunning = running === kind;
  const locked = running != null && !isRunning;   // another scan is running
  const live = isRunning && scan?.scan === kind ? scan : null;
  const shownProgress = live ? Math.round((live.progress || 0) * 100) : progress;

  const clear = () => {
    const empty: Partial<VitalsData> = {};
    for (const v of values) empty[v.field] = undefined;
    updateVitals(empty);
  };

  const start = async () => {
    const s = SCANS[kind];
    setRunning(kind);
    setStepStatus(kind, null);
    clear();
    setProgress(0);
    setMsg({ text: "Starting...", cls: "" });

    const r = await stationCall("POST", s.url);
    setRunning(null);
    const ok = r.ok && r.json?.ok;
    if (ok && r.json.result) {
      const got: Partial<VitalsData> = {};
      for (const [from, to] of Object.entries(s.fields)) got[to as keyof VitalsData] = r.json.result[from] ?? undefined;
      updateVitals(got);
      setStepStatus(kind, "done");
    }
    setProgress(ok ? 100 : 0);
    setMsg({ text: r.json?.message || r.json?.error || "Failed", cls: ok ? "ok" : "bad" });
    onFinished?.(ok);
  };

  const stop = () => stationCall("POST", "/api/vitals/stop");

  const skip = () => {
    clear();
    setProgress(0);
    setStepStatus(kind, "skipped");
    setMsg({ text: "បានរំលង (Skipped)", cls: "" });
    onFinished?.(true);
  };

  const done = status === "done";

  return (
    <div
      className={`bg-white rounded-3xl shadow-xl border-2 p-6 flex flex-col items-center text-center relative overflow-hidden w-full transition-colors ${
        isRunning ? "border-amber-300" : done ? "border-teal-300" : "border-teal-100"
      } ${locked ? "opacity-60" : ""}`}
    >
      {/* Icon */}
      <div className="relative my-1 flex items-center justify-center">
        {isRunning && (
          <motion.div
            className="absolute w-32 h-32 rounded-full border-4 border-teal-100"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center shadow-inner relative z-10 border-2 border-teal-200 text-teal-600">
          {icon}
        </div>
        {done && <CheckCircle2 size={22} className="absolute -right-1 -top-1 z-20 text-emerald-600 bg-white rounded-full" />}
        {status === "skipped" && <MinusCircle size={22} className="absolute -right-1 -top-1 z-20 text-amber-500 bg-white rounded-full" />}
      </div>

      <h2 className="font-['Moul'] text-lg text-teal-950 mt-2 leading-relaxed">{title}</h2>
      <p className="text-xs font-semibold text-teal-800 max-w-xs">{hint}</p>

      {/* Values */}
      <div className="flex justify-center gap-8 my-3">
        {values.map((v) => {
          const lv = live ? v.live(live) : undefined;
          return (
            <div key={v.field}>
              <span className="text-[11px] font-bold text-slate-500 uppercase block">{v.label}</span>
              <div className="text-4xl font-black text-teal-950 tabular-nums">
                {fmt(lv ?? (vitals[v.field] as number | undefined), v.dp)}
                <span className="text-base font-semibold text-slate-400 ml-1">{v.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress + message */}
      <div className="w-full max-w-sm h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-teal-500 transition-all duration-200" style={{ width: `${shownProgress}%` }} />
      </div>
      <p
        className={`text-xs min-h-[1.5em] mt-2 ${
          msg.cls === "bad" && !isRunning ? "text-rose-600 font-semibold" : msg.cls === "ok" && !isRunning ? "text-emerald-700 font-semibold" : "text-slate-500"
        }`}
      >
        {isRunning ? live?.message || msg.text : msg.text}
      </p>

      {/* Buttons */}
      <div className="flex flex-wrap justify-center gap-2 mt-2 w-full">
        <button
          onClick={start}
          disabled={running != null}
          className="flex-1 min-w-[150px] py-3 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-teal-700/20 flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:active:scale-100"
        >
          {done || msg.cls === "bad" ? <RefreshCw size={18} /> : <Play size={18} className="fill-white" />}
          <span>
            {done ? "វាស់ម្តងទៀត (Again)" : msg.cls === "bad" ? "ម្តងទៀត (Retry)" : "ចាប់ផ្តើម (Start)"}
            {seconds ? ` ${seconds}s` : ""}
          </span>
        </button>
        {kind === "vitals" && (
          <button
            onClick={stop}
            disabled={!isRunning}
            className="px-4 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-2xl flex items-center gap-1.5 active:scale-95 disabled:opacity-40"
          >
            <Square size={16} />
            <span>Stop</span>
          </button>
        )}
        <button
          onClick={skip}
          disabled={running != null}
          className="px-4 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-2xl flex items-center gap-1.5 active:scale-95 disabled:opacity-40"
        >
          <SkipForward size={16} />
          <span>រំលង (Skip)</span>
        </button>
      </div>

    </div>
  );
}
