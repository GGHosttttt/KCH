import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  PersonStanding,
  Loader2,
  RefreshCw,
  Scale,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Play,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import apiService from "../../../services/apiService";
import { useCheckupStore } from "../../stores/useCheckupStore";

type Stage = "idle" | "init" | "height" | "weight" | "done";

export function InstructionScreen() {
  const navigate = useNavigate();
  const updateVitals = useCheckupStore((s) => s.updateVitals);
  const vitals = useCheckupStore((s) => s.vitals);

  const [currentStage, setCurrentStage] = useState<Stage>("idle");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live status & telemetry feedback
  const [liveMsg, setLiveMsg] = useState<string>(
    "សូមចុចប៊ូតុង 'ចាប់ផ្តើម' ដើម្បីរៀបចំឧបករណ៍វាស់វែង",
  );
  const [progress, setProgress] = useState<number>(0);
  const [liveValue, setLiveValue] = useState<number | null>(null);

  // Stored measurements
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(
    vitals.height_cm ?? null,
  );
  const [measuredWeight, setMeasuredWeight] = useState<number | null>(
    vitals.weight_kg ?? null,
  );

  const eventSourceRef = useRef<EventSource | null>(null);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Subscribe to Live SSE Telemetry (/api/station/events)
  useEffect(() => {
    const localBase =
      window.kioskEnv?.getLocalApiUrl?.() ||
      import.meta.env.VITE_LOCAL_API_BASE_URL ||
      "http://localhost:3000";

    try {
      const es = new EventSource(`${localBase}/api/station/events`);
      eventSourceRef.current = es;

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.event === "scan") {
            if (typeof data.progress === "number") {
              setProgress(Math.round(data.progress * 100));
            }
            if (data.live !== undefined) {
              setLiveValue(data.live);
            }
            if (data.message) {
              setLiveMsg(data.message);
            }
          }
        } catch (err) {
          console.error("SSE parse error", err);
        }
      };

      es.onerror = () => {
        // SSE disconnected (device offline or simulation mode)
      };
    } catch (e) {
      console.warn("EventSource unavailable:", e);
    }

    return () => {
      eventSourceRef.current?.close();
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, []);

  // 2. Mock Fallback Simulator
  const runSimulatedScan = (
    type: "height" | "weight",
    targetValue: number,
    onSuccess: (val: number) => void,
  ) => {
    setIsRunning(true);
    setProgress(0);
    setErrorMsg(null);

    let currentTick = 0;
    const totalTicks = 20; // 2 seconds

    if (simTimerRef.current) clearInterval(simTimerRef.current);

    simTimerRef.current = setInterval(() => {
      currentTick += 1;
      const pct = Math.round((currentTick / totalTicks) * 100);
      setProgress(pct);

      const jitter = (Math.random() - 0.5) * 1.5;
      setLiveValue(Number((targetValue + jitter).toFixed(1)));

      if (type === "height") {
        setLiveMsg(
          `កំពុងស្កេនកម្ពស់... ${(2 - currentTick * 0.1).toFixed(1)}s (Simulated)`,
        );
      } else {
        setLiveMsg(`កំពុងថ្លឹងទម្ងន់... រក្សាលំនឹង (Simulated)`);
      }

      if (currentTick >= totalTicks) {
        if (simTimerRef.current) clearInterval(simTimerRef.current);
        setIsRunning(false);
        setProgress(100);
        setLiveValue(targetValue);
        onSuccess(targetValue);
      }
    }, 100);
  };

  // 3. Stage 1: Height Measurement
  const startHeightMeasurement = async () => {
    setCurrentStage("height");
    setIsRunning(true);
    setErrorMsg(null);
    setProgress(0);
    setLiveMsg("កំពុងវាស់កម្ពស់... សូមឈរឱ្យត្រង់ (Measuring height...)");

    try {
      const res = await apiService(
        "/api/height/start?wait=1&seconds=5",
        "POST",
        null,
        {},
        "local",
      );

      const height = res?.result?.heightCm || res?.heightCm;
      if (height) {
        setMeasuredHeight(height);
        updateVitals({ height_cm: height });
        setProgress(100);
        setIsRunning(false);
        // Transition straight to Stage 2: Weight
        startWeightMeasurement();
      } else {
        throw new Error(res?.message || "No height recorded");
      }
    } catch {
      console.warn("Hardware height sensor offline. Using simulation...");
      runSimulatedScan("height", 168.5, (val) => {
        setMeasuredHeight(val);
        updateVitals({ height_cm: val });
        // Transition to simulated weight scan
        setTimeout(() => {
          startWeightMeasurement();
        }, 600);
      });
    }
  };

  // 4. Stage 2: Weight Measurement
  const startWeightMeasurement = async () => {
    setCurrentStage("weight");
    setIsRunning(true);
    setErrorMsg(null);
    setProgress(0);
    setLiveMsg("កំពុងវាស់ទម្ងន់... សូមឈរឱ្យនឹង (Measuring weight...)");

    try {
      const res = await apiService(
        "/api/hx/start?wait=1",
        "POST",
        null,
        {},
        "local",
      );

      const weight = res?.result?.weightKg || res?.weightKg;
      if (weight) {
        setMeasuredWeight(weight);
        updateVitals({ weight_kg: weight });
        setProgress(100);
        setIsRunning(false);
        setCurrentStage("done");
        setLiveMsg("ការវាស់វែងកម្ពស់ និងទម្ងន់បានបញ្ចប់ជាស្ថាពរ!");
      } else {
        throw new Error(res?.message || "No weight recorded");
      }
    } catch {
      console.warn("Hardware scale offline. Using simulation...");
      runSimulatedScan("weight", 63.5, (val) => {
        setMeasuredWeight(val);
        updateVitals({ weight_kg: val });
        setCurrentStage("done");
        setLiveMsg("ការវាស់វែងបានជោគជ័យ! (Simulated)");
      });
    }
  };

  // 5. Initialize Device Handshake & Reset Previous Results
  const handleStartDevice = async () => {
    setCurrentStage("init");
    setIsRunning(true);
    setErrorMsg(null);
    setLiveMsg(
      "កំពុងត្រួតពិនិត្យ និងរៀបចំឧបករណ៍ (Initializing hardware station...)",
    );

    try {
      // 1. Reset station state on the backend
      await apiService("/api/station/reset", "POST", null, {}, "local");

      // 2. Query station readiness
      const statusRes = await apiService(
        "/api/station",
        "GET",
        null,
        {},
        "local",
      );
      const isOnline = statusRes?.device?.online ?? true;

      setLiveMsg(
        isOnline
          ? "ឧបករណ៍បានត្រៀមរួចរាល់! ចាប់ផ្តើមវាស់កម្ពស់..."
          : "ឧបករណ៍ស្ថិតក្នុងរបៀបសាកល្បង (Simulated)...",
      );

      setTimeout(() => {
        startHeightMeasurement();
      }, 700);
    } catch {
      console.warn("Station backend unreachable. Starting mock flow...");
      setLiveMsg("ឧបករណ៍ស្ថិតក្នុងរបៀបសាកល្បង (Simulated Mode)...");
      setTimeout(() => {
        startHeightMeasurement();
      }, 700);
    }
  };

  // 6. Developer Instant Bypass
  const handleDevBypass = () => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    const mockH = 170.0;
    const mockW = 65.0;
    setMeasuredHeight(mockH);
    setMeasuredWeight(mockW);
    updateVitals({ height_cm: mockH, weight_kg: mockW });
    setCurrentStage("done");
    setProgress(100);
    setIsRunning(false);
    setLiveMsg("បានរំលងការវាស់វែង (Developer Bypass Active)");
  };

  const handleNext = () => {
    if (measuredHeight && measuredWeight) {
      navigate("/instructions/2");
    }
  };

  const isComplete = Boolean(measuredHeight && measuredWeight);

  return (
    <div className="flex flex-col h-full bg-slate-50 relative select-none font-['Noto_Sans_Khmer',sans-serif]">
      {/* Top Navigation */}
      <div className="absolute top-6 left-6 z-10 flex justify-between w-[calc(100%-3rem)]">
        <button
          onClick={() => navigate("/handwash")}
          disabled={isRunning}
          className="flex items-center space-x-2 text-teal-800 bg-white/80 backdrop-blur px-4 py-2 rounded-xl shadow-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
        >
          <ArrowLeft size={24} />
          <span>ត្រឡប់ក្រោយ</span>
        </button>

        {/* Step indicator */}
        <div className="flex items-center space-x-2 bg-white/80 backdrop-blur px-4 py-2 rounded-xl shadow-sm">
          <span className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
            ១
          </span>
          <div className="w-8 h-1 bg-slate-200 rounded" />
          <span className="w-8 h-8 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center font-bold text-sm">
            ២
          </span>
          <div className="w-8 h-1 bg-slate-200 rounded" />
          <span className="w-8 h-8 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center font-bold text-sm">
            ៣
          </span>
        </div>

        <button
          onClick={handleNext}
          disabled={!isComplete || isRunning}
          className={`flex items-center space-x-2 px-6 py-2 rounded-xl shadow-sm font-bold transition-all min-w-[180px] justify-center ${
            isComplete && !isRunning
              ? "text-white bg-teal-600 hover:bg-teal-700 active:scale-95 animate-pulse"
              : "text-slate-400 bg-slate-300 cursor-not-allowed opacity-80"
          }`}
        >
          <span>បន្តទៅមុខ (Next)</span>
          <ArrowRight size={24} />
        </button>
      </div>

      {/* Header */}
      <div className="pt-24 pb-4 px-8 text-center bg-white shadow-sm z-0">
        <h1 className="font-['Moul'] text-2xl md:text-3xl text-teal-900 mb-1">
          ការណែនាំអំពីរបៀបវាស់វែងសុខភាព
        </h1>
        <p className="text-sm md:text-base text-slate-500">
          Instructions for Health Measurements — Step 1: Height &amp; Weight
        </p>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-teal-100 p-8 flex flex-col items-center text-center relative overflow-hidden">
          {/* Sub-Stage Indicator Pill */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl mb-4">
            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                currentStage === "init"
                  ? "bg-teal-600 text-white"
                  : "text-slate-500"
              }`}
            >
              {currentStage === "init" && (
                <Loader2 size={12} className="animate-spin" />
              )}
              <span>រៀបចំ (Init)</span>
            </span>

            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                currentStage === "height"
                  ? "bg-teal-600 text-white shadow-sm"
                  : measuredHeight
                    ? "bg-emerald-100 text-emerald-800"
                    : "text-slate-500"
              }`}
            >
              {measuredHeight ? <CheckCircle2 size={12} /> : null}
              <span>១. កម្ពស់ (Height)</span>
            </span>

            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                currentStage === "weight"
                  ? "bg-teal-600 text-white shadow-sm"
                  : measuredWeight
                    ? "bg-emerald-100 text-emerald-800"
                    : "text-slate-500"
              }`}
            >
              {measuredWeight ? <CheckCircle2 size={12} /> : null}
              <span>២. ទម្ងន់ (Weight)</span>
            </span>
          </div>

          {/* Interactive Graphic */}
          <div className="relative my-3 flex items-center justify-center">
            {isRunning && (
              <motion.div
                className="absolute w-52 h-52 rounded-full border-4 border-teal-100"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}

            <div className="w-32 h-32 bg-teal-50 rounded-full flex items-center justify-center shadow-inner relative z-10 border-2 border-teal-200">
              {currentStage === "idle" ? (
                <Activity size={56} className="text-teal-600" />
              ) : currentStage === "init" ? (
                <RefreshCw size={52} className="text-teal-600 animate-spin" />
              ) : currentStage === "height" ? (
                <>
                  <PersonStanding size={62} className="text-teal-600" />
                  <motion.div
                    className="absolute top-2 w-10 h-2 bg-teal-400 rounded-full opacity-70"
                    animate={{ y: [0, 18, 0], opacity: [0.7, 0.2, 0.7] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                </>
              ) : (
                <Scale size={52} className="text-teal-600 animate-pulse" />
              )}
            </div>
          </div>

          {/* Title and Instruction Details */}
          <h2 className="font-['Moul'] text-xl md:text-2xl text-teal-950 mb-1 leading-relaxed">
            {currentStage === "idle"
              ? "ត្រៀមខ្លួនវាស់កម្ពស់ និងទម្ងន់"
              : currentStage === "init"
                ? "កំពុងរៀបចំ និងត្រួតពិនិត្យឧបករណ៍..."
                : currentStage === "height"
                  ? "១. ឈរឱ្យត្រង់ដើម្បីវាស់កម្ពស់"
                  : currentStage === "weight"
                    ? "២. ឈរឱ្យនឹងដើម្បីវាស់ទម្ងន់"
                    : "ការវាស់វែងត្រូវបានបញ្ចប់!"}
          </h2>

          <p className="text-xs md:text-sm font-semibold text-teal-800 mb-1">
            {currentStage === "idle"
              ? "Please step onto the platform and press Start Checkup"
              : currentStage === "height"
                ? "Look straight ahead under the ultrasonic sensor"
                : currentStage === "weight"
                  ? "Remain still on the scale platform while reading load cells"
                  : "Readings captured successfully"}
          </p>

          <p className="text-xs text-slate-500 max-w-sm mb-4">{liveMsg}</p>

          {/* START BUTTON (When Idle or Retry) */}
          {currentStage === "idle" && (
            <button
              onClick={handleStartDevice}
              className="mb-4 px-8 py-3 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-teal-700/20 flex items-center gap-2 transition-all text-base"
            >
              <Play size={20} className="fill-white" />
              <span>ចាប់ផ្តើមវាស់វែង (Start Checkup)</span>
            </button>
          )}

          {/* Real-time Result Values */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                measuredHeight
                  ? "bg-teal-50/70 border-teal-300"
                  : currentStage === "height"
                    ? "bg-amber-50/60 border-amber-300 animate-pulse"
                    : "bg-slate-50 border-slate-200"
              }`}
            >
              <span className="text-[11px] font-bold text-slate-500 uppercase block">
                កម្ពស់ (Height)
              </span>
              <div className="text-2xl font-black text-teal-950 mt-0.5">
                {measuredHeight
                  ? `${measuredHeight} cm`
                  : currentStage === "height" && liveValue
                    ? `${liveValue.toFixed(1)} cm`
                    : "--"}
              </div>
            </div>

            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                measuredWeight
                  ? "bg-teal-50/70 border-teal-300"
                  : currentStage === "weight"
                    ? "bg-amber-50/60 border-amber-300 animate-pulse"
                    : "bg-slate-50 border-slate-200"
              }`}
            >
              <span className="text-[11px] font-bold text-slate-500 uppercase block">
                ទម្ងន់ (Weight)
              </span>
              <div className="text-2xl font-black text-teal-950 mt-0.5">
                {measuredWeight
                  ? `${measuredWeight} kg`
                  : currentStage === "weight" && liveValue
                    ? `${liveValue.toFixed(1)} kg`
                    : "--"}
              </div>
            </div>
          </div>

          {/* Developer Bypass Button */}
          <div className="mt-5 flex items-center gap-2">
            <button
              onClick={handleDevBypass}
              type="button"
              className="text-xs text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              <FlaskConical size={14} />
              <span>Simulate / Skip Step (Dev Mode)</span>
            </button>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between w-full max-w-sm"
              >
                <div className="flex items-center gap-2 text-rose-700 text-xs font-semibold text-left">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                <button
                  onClick={handleStartDevice}
                  className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95"
                >
                  <RefreshCw size={12} />
                  <span>ម្តងទៀត</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Sensor Status & Progress */}
      <div
        className={`py-4 px-8 flex items-center justify-center space-x-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] transition-colors duration-500 z-10 ${
          isComplete ? "bg-teal-700 text-white" : "bg-slate-800 text-teal-100"
        }`}
      >
        <div className="relative flex items-center justify-center w-8 h-8">
          {isRunning ? (
            <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
          ) : (
            <svg className="w-8 h-8 transform -rotate-90">
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                className="opacity-20"
              />
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 14}
                strokeDashoffset={2 * Math.PI * 14 * (1 - progress / 100)}
                className="transition-all duration-100"
              />
            </svg>
          )}
          {isComplete && !isRunning && (
            <span className="absolute inset-0 flex items-center justify-center font-bold text-[10px]">
              ✓
            </span>
          )}
        </div>

        <span className="text-sm md:text-base font-bold">
          {isComplete
            ? "ការអានទិន្នន័យបានបញ្ចប់ (Complete) — សូមចុចបន្ត (Please click next)"
            : isRunning
              ? `កំពុងដំណើរការ... ${progress}% (${liveMsg})`
              : "សូមចុច 'ចាប់ផ្តើមវាស់វែង' ដើម្បីចាប់ផ្តើម"}
        </span>
      </div>
    </div>
  );
}
