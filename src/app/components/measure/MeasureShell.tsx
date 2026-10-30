import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MinusCircle,
} from "lucide-react";
import {
  useCheckupStore,
  type MeasureStep,
} from "../../../stores/useCheckupStore";
import type { StationSnapshot } from "../../hooks/useStation";

export const MEASURE_STEPS: {
  path: string;
  km: string;
  en: string;
  keys: MeasureStep[];
}[] = [
  {
    path: "/instructions/1",
    km: "កម្ពស់ & ទម្ងន់",
    en: "Height & Weight",
    keys: ["height", "weight"],
  },
  {
    path: "/instructions/2",
    km: "ចង្វាក់បេះដូង & SpO2",
    en: "Heart rate & SpO2",
    keys: ["vitals"],
  },
  {
    path: "/instructions/3",
    km: "សម្ពាធឈាម",
    en: "Blood pressure",
    keys: ["bp"],
  },
  // {
  //   path: "/instructions/review",
  //   km: "ពិនិត្យ & រក្សាទុក",
  //   en: "Review & save",
  //   keys: [],
  // },
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
  next?: {
    label: string;
    onClick: () => void;
    enabled: boolean;
    pulse?: boolean;
  };
  children: ReactNode;
}

export function MeasureShell({
  step,
  title,
  subtitle,
  busy,
  station,
  footer,
  footerDone,
  progress,
  next,
  children,
}: Props) {
  const navigate = useNavigate();
  const stepStatus = useCheckupStore((s) => s.stepStatus);

  const tabState = (i: number) => {
    const keys = MEASURE_STEPS[i].keys;
    if (!keys.length) return null;
    if (keys.every((k) => stepStatus[k] === "done")) return "done";
    if (keys.every((k) => stepStatus[k])) return "skipped";
    return null;
  };

  const back = () =>
    navigate(step === 0 ? "/handwash" : MEASURE_STEPS[step - 1].path);

  return (
    <div className="flex flex-col h-full w-full min-h-[100dvh] bg-slate-50 relative select-none font-['Noto_Sans_Khmer',sans-serif]">
      {/* Top navigation bar */}
      <div className="px-6 sm:px-10 pt-5 pb-3 flex items-center justify-between gap-4 bg-white border-b border-slate-200 shadow-sm z-10 shrink-0">
        <button
          onClick={back}
          disabled={busy}
          className="flex items-center space-x-2 text-teal-800 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl font-bold active:scale-95 transition-all disabled:opacity-50 shrink-0 text-sm sm:text-base"
        >
          <ArrowLeft size={22} />
          <span>ត្រឡប់ក្រោយ (Back)</span>
        </button>

        {/* Step indicator pills */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          {MEASURE_STEPS.map((s, i) => {
            const state = tabState(i);
            const isCurrent = i === step;
            return (
              <button
                key={s.path}
                onClick={() => navigate(s.path)}
                disabled={busy || isCurrent}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                  isCurrent
                    ? "bg-teal-600 text-white shadow-md"
                    : state === "done"
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      : state === "skipped"
                        ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "text-slate-500 hover:bg-white"
                } disabled:cursor-default`}
              >
                {state === "done" ? (
                  <CheckCircle2 size={16} />
                ) : state === "skipped" ? (
                  <MinusCircle size={16} />
                ) : (
                  <span>{KM_DIGITS[i]}.</span>
                )}
                <span className="text-left leading-tight">
                  {s.km}
                  <span className="block text-[10px] sm:text-xs font-semibold opacity-75">
                    {s.en}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {next ? (
          <button
            onClick={next.onClick}
            disabled={!next.enabled || busy}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl shadow-sm font-bold transition-all min-w-[170px] justify-center shrink-0 text-sm sm:text-base ${
              next.enabled && !busy
                ? `text-white bg-teal-600 hover:bg-teal-700 active:scale-95 ${next.pulse ? "animate-pulse" : ""}`
                : "text-slate-400 bg-slate-300 cursor-not-allowed opacity-80"
            }`}
          >
            <span>{next.label}</span>
            <ArrowRight size={22} />
          </button>
        ) : (
          <div className="min-w-[170px]" />
        )}
      </div>

      {/* Screen title & hardware status notice */}
      <div className="pt-4 pb-2 px-6 text-center shrink-0">
        <h1 className="font-['Moul'] text-2xl sm:text-3xl text-teal-950 leading-relaxed mb-1">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">{subtitle}</p>
        <DeviceNotice {...station} />
      </div>

      {/* Full-width content wrapper */}
      <div className="flex-1 w-full min-h-0 px-4 sm:px-10 py-2 sm:py-4 flex items-center justify-center overflow-y-auto">
        {children}
      </div>

      {/* Footer status bar */}
      <div
        className={`py-4 px-8 flex items-center justify-center space-x-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] transition-colors duration-500 z-10 shrink-0 ${
          footerDone ? "bg-teal-700 text-white" : "bg-slate-800 text-teal-100"
        }`}
      >
        {busy ? (
          <Loader2 className="w-5 h-5 animate-spin text-teal-400 shrink-0" />
        ) : footerDone ? (
          <CheckCircle2 className="w-5 h-5 shrink-0 text-teal-200" />
        ) : null}
        <span className="text-sm sm:text-base font-bold">
          {footer}
          {busy && progress != null ? ` · ${progress}%` : ""}
        </span>
      </div>
    </div>
  );
}

function DeviceNotice({
  st,
  reachable,
}: {
  st: StationSnapshot | null;
  reachable: boolean;
}) {
  if (reachable && (!st || st.device.online)) return null;
  return (
    <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-xs sm:text-sm font-bold shadow-sm">
      <AlertTriangle size={16} className="text-amber-600" />
      <span>
        ឧបករណ៍វាស់មិនទាន់រួចរាល់ — សូមហៅបុគ្គលិក (Device not ready — please ask
        staff)
      </span>
    </div>
  );
}
