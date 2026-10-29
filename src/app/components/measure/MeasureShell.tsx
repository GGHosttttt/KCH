import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Loader2, MinusCircle } from "lucide-react";
import { useCheckupStore, type MeasureStep } from "../../../stores/useCheckupStore";
import type { StationSnapshot } from "../../hooks/useStation";

// The measurement flow, in the same order as BMI/backend/public/test.html.
// Every tab can be opened directly, so each measurement can be started and tested on its own.
export const MEASURE_STEPS: { path: string; km: string; en: string; keys: MeasureStep[] }[] = [
  { path: "/instructions/1", km: "កម្ពស់ & ទម្ងន់", en: "Height & Weight", keys: ["height", "weight"] },
  { path: "/instructions/2", km: "ចង្វាក់បេះដូង & SpO2", en: "Heart rate & SpO2", keys: ["vitals"] },
  { path: "/instructions/3", km: "សម្ពាធឈាម", en: "Blood pressure", keys: ["bp"] },
  { path: "/instructions/review", km: "ពិនិត្យ & រក្សាទុក", en: "Review & save", keys: [] },
];

const KM_DIGITS = ["១", "២", "៣", "៤"];

interface Props {
  step: number;
  title: string;
  subtitle: string;
  busy: boolean;
  station: { st: StationSnapshot | null; reachable: boolean };
  footer: string;
  footerDone?: boolean;
  progress?: number | null;
  next?: { label: string; onClick: () => void; enabled: boolean; pulse?: boolean };
  children: ReactNode;
}

export function MeasureShell({ step, title, subtitle, busy, station, footer, footerDone, progress, next, children }: Props) {
  const navigate = useNavigate();
  const stepStatus = useCheckupStore((s) => s.stepStatus);

  const tabState = (i: number) => {
    const keys = MEASURE_STEPS[i].keys;
    if (!keys.length) return null;
    if (keys.every((k) => stepStatus[k] === "done")) return "done";
    if (keys.every((k) => stepStatus[k])) return "skipped";
    return null;
  };

  const back = () => navigate(step === 0 ? "/handwash" : MEASURE_STEPS[step - 1].path);

  return (
    <div className="flex flex-col h-full bg-slate-50 relative select-none font-['Noto_Sans_Khmer',sans-serif]">
      {/* Top navigation: back · step tabs · next */}
      <div className="px-6 pt-5 pb-3 flex items-center justify-between gap-4 bg-white shadow-sm z-10">
        <button
          onClick={back}
          disabled={busy}
          className="flex items-center space-x-2 text-teal-800 bg-slate-100 px-4 py-2 rounded-xl font-bold active:scale-95 transition-transform disabled:opacity-50 shrink-0"
        >
          <ArrowLeft size={22} />
          <span>ត្រឡប់ក្រោយ</span>
        </button>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
          {MEASURE_STEPS.map((s, i) => {
            const state = tabState(i);
            return (
              <button
                key={s.path}
                onClick={() => navigate(s.path)}
                disabled={busy || i === step}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  i === step
                    ? "bg-teal-600 text-white shadow-sm"
                    : state === "done"
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      : state === "skipped"
                        ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "text-slate-500 hover:bg-white"
                } disabled:cursor-default`}
              >
                {state === "done" ? (
                  <CheckCircle2 size={14} />
                ) : state === "skipped" ? (
                  <MinusCircle size={14} />
                ) : (
                  <span>{KM_DIGITS[i]}.</span>
                )}
                <span className="text-left leading-tight">
                  {s.km}
                  <span className="block text-[10px] font-semibold opacity-75">{s.en}</span>
                </span>
              </button>
            );
          })}
        </div>

        {next ? (
          <button
            onClick={next.onClick}
            disabled={!next.enabled || busy}
            className={`flex items-center space-x-2 px-5 py-2 rounded-xl shadow-sm font-bold transition-all min-w-[160px] justify-center shrink-0 ${
              next.enabled && !busy
                ? `text-white bg-teal-600 hover:bg-teal-700 active:scale-95 ${next.pulse ? "animate-pulse" : ""}`
                : "text-slate-400 bg-slate-300 cursor-not-allowed opacity-80"
            }`}
          >
            <span>{next.label}</span>
            <ArrowRight size={22} />
          </button>
        ) : (
          <div className="min-w-[160px]" />
        )}
      </div>

      {/* Header */}
      <div className="pt-3 pb-2 px-8 text-center">
        <h1 className="font-['Moul'] text-xl md:text-2xl text-teal-900 leading-relaxed">{title}</h1>
        <p className="text-sm text-slate-500">{subtitle}</p>
        <DeviceNotice {...station} />
      </div>

      <div className="flex-1 min-h-0 px-6 pb-4 flex items-center justify-center overflow-y-auto">{children}</div>

      {/* Footer status */}
      <div
        className={`py-3.5 px-8 pr-48 flex items-center justify-center space-x-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] transition-colors duration-500 z-10 ${
          footerDone ? "bg-teal-700 text-white" : "bg-slate-800 text-teal-100"
        }`}
      >
        {busy ? (
          <Loader2 className="w-5 h-5 animate-spin text-teal-400 shrink-0" />
        ) : footerDone ? (
          <CheckCircle2 className="w-5 h-5 shrink-0" />
        ) : null}
        <span className="text-sm font-bold">
          {footer}
          {busy && progress != null ? ` · ${progress}%` : ""}
        </span>
      </div>
    </div>
  );
}

// Patients only see that the device is not ready; details are in the control panel (#/control).
function DeviceNotice({ st, reachable }: { st: StationSnapshot | null; reachable: boolean }) {
  if (reachable && (!st || st.device.online)) return null;
  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold">
      <AlertTriangle size={14} />
      <span>ឧបករណ៍វាស់មិនទាន់រួចរាល់ — សូមហៅបុគ្គលិក (Device not ready — please ask staff)</span>
    </div>
  );
}
