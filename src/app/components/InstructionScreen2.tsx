import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  HeartPulse,
  Activity,
  CheckCircle2,
  Delete,
  FlaskConical,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCheckupStore } from "../../stores/useCheckupStore";

type ActiveField = "systolic" | "diastolic" | "pulse";

export function InstructionScreen2() {
  const navigate = useNavigate();
  const updateVitals = useCheckupStore((s) => s.updateVitals);
  const vitals = useCheckupStore((s) => s.vitals);

  // Stage 1: "guide" (Put arm in cuff & start machine)
  // Stage 2: "input" (Type values from the machine's LCD screen)
  const [stage, setStage] = useState<"guide" | "input">("guide");

  // Input states
  const [systolic, setSystolic] = useState<string>(
    vitals.systolic_mmhg ? String(vitals.systolic_mmhg) : "",
  );
  const [diastolic, setDiastolic] = useState<string>(
    vitals.diastolic_mmhg ? String(vitals.diastolic_mmhg) : "",
  );
  const [pulse, setPulse] = useState<string>(
    vitals.pulse_bpm ? String(vitals.pulse_bpm) : "",
  );

  const [activeField, setActiveField] = useState<ActiveField>("systolic");

  // Keypad Handlers
  const handleNumClick = (digit: string) => {
    if (activeField === "systolic") {
      if (systolic.length < 3) setSystolic((prev) => prev + digit);
    } else if (activeField === "diastolic") {
      if (diastolic.length < 3) setDiastolic((prev) => prev + digit);
    } else if (activeField === "pulse") {
      if (pulse.length < 3) setPulse((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    if (activeField === "systolic") setSystolic((prev) => prev.slice(0, -1));
    else if (activeField === "diastolic")
      setDiastolic((prev) => prev.slice(0, -1));
    else if (activeField === "pulse") setPulse((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (activeField === "systolic") setSystolic("");
    else if (activeField === "diastolic") setDiastolic("");
    else if (activeField === "pulse") setPulse("");
  };

  // Validation
  const sysNum = Number(systolic);
  const diaNum = Number(diastolic);
  const pulNum = Number(pulse);

  const isSysValid = sysNum >= 60 && sysNum <= 260;
  const isDiaValid = diaNum >= 35 && diaNum <= 160;
  const isPulValid = pulNum >= 35 && pulNum <= 200;

  const isFormComplete =
    systolic.length >= 2 &&
    diastolic.length >= 2 &&
    pulse.length >= 2 &&
    isSysValid &&
    isDiaValid &&
    isPulValid;

  const handleSaveAndNext = () => {
    if (!isFormComplete) return;

    updateVitals({
      systolic_mmhg: sysNum,
      diastolic_mmhg: diaNum,
      pulse_bpm: pulNum,
      // If heart rate wasn't captured yet, use pulse as fallback
      heart_rate_bpm: vitals.heart_rate_bpm ?? pulNum,
    });

    navigate("/instructions/3");
  };

  // Developer Bypass
  const handleDevBypass = () => {
    setSystolic("120");
    setDiastolic("80");
    setPulse("75");
    updateVitals({
      systolic_mmhg: 120,
      diastolic_mmhg: 80,
      pulse_bpm: 75,
      heart_rate_bpm: 75,
    });
    setStage("input");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative select-none font-['Noto_Sans_Khmer',sans-serif]">
      {/* Top Floating Navigation */}
      <div className="absolute top-6 left-6 z-10 flex justify-between w-[calc(100%-3rem)]">
        <button
          onClick={() => {
            if (stage === "input") {
              setStage("guide");
            } else {
              navigate("/instructions/1");
            }
          }}
          className="flex items-center space-x-2 text-teal-800 bg-white/80 backdrop-blur px-4 py-2 rounded-xl shadow-sm font-bold active:scale-95 transition-transform"
        >
          <ArrowLeft size={24} />
          <span>ត្រឡប់ក្រោយ (Back)</span>
        </button>

        {/* Step Indicator */}
        <div className="flex items-center space-x-2 bg-white/80 backdrop-blur px-4 py-2 rounded-xl shadow-sm">
          <span className="w-8 h-8 bg-teal-200 text-teal-800 rounded-full flex items-center justify-center font-bold text-sm">
            ✓
          </span>
          <div className="w-8 h-1 bg-teal-200 rounded" />
          <span className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
            ២
          </span>
          <div className="w-8 h-1 bg-slate-200 rounded" />
          <span className="w-8 h-8 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center font-bold text-sm">
            ៣
          </span>
        </div>

        <button
          onClick={() => {
            if (stage === "guide") {
              setStage("input");
            } else {
              handleSaveAndNext();
            }
          }}
          disabled={stage === "input" && !isFormComplete}
          className={`flex items-center space-x-2 px-6 py-2 rounded-xl shadow-sm font-bold transition-all min-w-[180px] justify-center ${
            stage === "guide" || isFormComplete
              ? "text-white bg-teal-600 hover:bg-teal-700 active:scale-95"
              : "text-slate-400 bg-slate-300 cursor-not-allowed opacity-80"
          }`}
        >
          <span>
            {stage === "guide"
              ? "បញ្ចូលតម្លៃ (Enter Readings)"
              : "បន្តទៅមុខ (Next)"}
          </span>
          <ArrowRight size={24} />
        </button>
      </div>

      {/* Header */}
      <div className="pt-24 pb-3 px-8 text-center bg-white shadow-sm z-0">
        <h1 className="font-['Moul'] text-2xl md:text-3xl text-teal-900 mb-1">
          ការវាស់សម្ពាធឈាម និងចង្វាក់បេះដូង
        </h1>
        <p className="text-sm md:text-base text-slate-500">
          Instructions for Blood Pressure Measurement — Step 2 of 3
        </p>
      </div>

      {/* Main Body */}
      <div className="flex-1 p-4 md:p-6 flex items-center justify-center overflow-y-auto">
        <AnimatePresence mode="wait">
          {stage === "guide" ? (
            /* ────────────────────────────────────────────────────────
               STAGE 1: PHYSICAL GUIDANCE & MONITOR START
               ──────────────────────────────────────────────────────── */
            <motion.div
              key="guide"
              className="bg-white rounded-3xl shadow-xl border-2 border-rose-100 p-8 flex flex-col items-center text-center max-w-lg w-full relative overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {/* Outer Pulse Rings */}
              <motion.div
                className="absolute w-56 h-56 rounded-full border-4 border-rose-200"
                animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.2, 0.6] }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute w-44 h-44 rounded-full border-4 border-rose-300"
                animate={{ scale: [1.12, 1, 1.12], opacity: [0.2, 0.6, 0.2] }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Arm + Cuff Illustration */}
              <div className="w-36 h-36 bg-rose-50 rounded-full flex items-center justify-center mb-6 shadow-inner relative z-10">
                <svg
                  viewBox="0 0 80 80"
                  width="72"
                  height="72"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="28"
                    y="8"
                    width="24"
                    height="56"
                    rx="12"
                    fill="#FBBF99"
                  />
                  <rect
                    x="20"
                    y="28"
                    width="40"
                    height="16"
                    rx="6"
                    fill="#F87171"
                    opacity="0.9"
                  />
                  <rect
                    x="24"
                    y="32"
                    width="32"
                    height="8"
                    rx="4"
                    fill="#EF4444"
                    opacity="0.7"
                  />
                  <path
                    d="M60 36 Q72 36 72 24"
                    stroke="#9CA3AF"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="72" cy="22" r="5" fill="#6B7280" />
                </svg>
                <motion.div
                  className="absolute inset-3 border-4 border-dashed border-rose-300 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
              </div>

              <h2 className="font-['Moul'] text-2xl text-teal-900 mb-2 leading-relaxed z-10">
                ២. លូកដៃចូលឧបករណ៍វាស់
              </h2>
              <p className="text-lg text-rose-700 font-bold mb-1 z-10">
                ហើយចុចប៊ូតុង START លើម៉ាស៊ីន
              </p>
              <p className="text-xs md:text-sm text-slate-500 max-w-sm mb-6 z-10">
                Insert your arm into the blood pressure monitor, sit relaxed,
                press the START button on the physical device, and remain still
                until the beep.
              </p>

              <button
                onClick={() => setStage("input")}
                className="w-full max-w-sm py-3.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all text-base z-10"
              >
                <HeartPulse size={20} />
                <span>ម៉ាស៊ីនវាស់រួចហើយ (Ready to Enter)</span>
              </button>

              <div className="mt-4 flex items-center gap-2 z-10">
                <button
                  onClick={handleDevBypass}
                  type="button"
                  className="text-xs text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
                >
                  <FlaskConical size={14} />
                  <span>Simulate / Normal 120/80 (Dev)</span>
                </button>
              </div>
            </motion.div>
          ) : (
            /* ────────────────────────────────────────────────────────
               STAGE 2: SCREEN-KEYPAD INPUT (Systolic, Diastolic, Pulse)
               ──────────────────────────────────────────────────────── */
            <motion.div
              key="input"
              className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row gap-8 max-w-4xl w-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {/* Left Column: 3 Metric Display Fields */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-rose-600 mb-1">
                    <HeartPulse size={20} />
                    <h3 className="font-['Moul'] text-lg text-teal-950">
                      បញ្ចូលតម្លៃពីអេក្រង់ម៉ាស៊ីន
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-6">
                    Type the 3 readings shown on the blood pressure monitor's
                    LCD screen.
                  </p>

                  <div className="space-y-3">
                    {/* Systolic */}
                    <button
                      type="button"
                      onClick={() => setActiveField("systolic")}
                      className={`w-full p-3.5 rounded-2xl border-2 flex items-center justify-between text-left transition-all ${
                        activeField === "systolic"
                          ? "border-teal-600 bg-teal-50/50 shadow-sm ring-2 ring-teal-600/20"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase block">
                          សម្ពាធលើ (SYS / Systolic)
                        </span>
                        <span className="text-xs text-slate-400">
                          ធម្មតា: 90 - 120
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-900 font-mono">
                          {systolic || "--"}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          mmHg
                        </span>
                      </div>
                    </button>

                    {/* Diastolic */}
                    <button
                      type="button"
                      onClick={() => setActiveField("diastolic")}
                      className={`w-full p-3.5 rounded-2xl border-2 flex items-center justify-between text-left transition-all ${
                        activeField === "diastolic"
                          ? "border-teal-600 bg-teal-50/50 shadow-sm ring-2 ring-teal-600/20"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase block">
                          សម្ពាធក្រោម (DIA / Diastolic)
                        </span>
                        <span className="text-xs text-slate-400">
                          ធម្មតា: 60 - 80
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-900 font-mono">
                          {diastolic || "--"}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          mmHg
                        </span>
                      </div>
                    </button>

                    {/* Pulse */}
                    <button
                      type="button"
                      onClick={() => setActiveField("pulse")}
                      className={`w-full p-3.5 rounded-2xl border-2 flex items-center justify-between text-left transition-all ${
                        activeField === "pulse"
                          ? "border-teal-600 bg-teal-50/50 shadow-sm ring-2 ring-teal-600/20"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase block">
                          ចង្វាក់បេះដូង (PUL / Pulse)
                        </span>
                        <span className="text-xs text-slate-400">
                          ធម្មតា: 60 - 100
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-rose-600 font-mono">
                          {pulse || "--"}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          bpm
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={handleDevBypass}
                    type="button"
                    className="text-xs text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
                  >
                    <FlaskConical size={14} />
                    <span>Auto-Fill 120/80</span>
                  </button>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <HelpCircle size={14} />
                    <span>ចុចលើប្រអប់ដើម្បីវាយបញ្ចូល</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Touchscreen Number Pad */}
              <div className="w-full md:w-72 bg-slate-50 border border-slate-200 rounded-3xl p-4 flex flex-col justify-between">
                <div className="text-center pb-2 mb-2 border-b border-slate-200/60">
                  <span className="text-xs font-bold text-teal-800">
                    កំពុងបញ្ចូល:{" "}
                    {activeField === "systolic"
                      ? "សម្ពាធលើ (SYS)"
                      : activeField === "diastolic"
                        ? "សម្ពាធក្រោម (DIA)"
                        : "ចង្វាក់បេះដូង (PUL)"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 flex-1">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleNumClick(num)}
                      className="bg-white hover:bg-teal-50 active:bg-teal-100 border border-slate-200 rounded-2xl py-3.5 text-2xl font-black text-slate-800 shadow-sm transition-all active:scale-95"
                    >
                      {num}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={handleClear}
                    className="bg-slate-200 hover:bg-slate-300 active:bg-slate-400 border border-slate-300 rounded-2xl py-3 text-xs font-bold text-slate-700 transition-all active:scale-95 flex items-center justify-center"
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNumClick("0")}
                    className="bg-white hover:bg-teal-50 active:bg-teal-100 border border-slate-200 rounded-2xl py-3.5 text-2xl font-black text-slate-800 shadow-sm transition-all active:scale-95"
                  >
                    0
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    className="bg-slate-200 hover:bg-slate-300 active:bg-slate-400 border border-slate-300 rounded-2xl py-3 text-slate-700 transition-all active:scale-95 flex items-center justify-center"
                  >
                    <Delete size={20} />
                  </button>
                </div>

                {/* Next Field Switcher Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (activeField === "systolic") setActiveField("diastolic");
                    else if (activeField === "diastolic")
                      setActiveField("pulse");
                    else if (activeField === "pulse") handleSaveAndNext();
                  }}
                  className="mt-3 w-full py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  {activeField === "pulse" ? (
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Status Banner */}
      <div
        className={`py-3.5 px-8 flex items-center justify-center space-x-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] transition-colors duration-500 z-10 ${
          isFormComplete
            ? "bg-teal-700 text-white"
            : "bg-slate-800 text-teal-100"
        }`}
      >
        <Activity size={18} className="text-teal-400" />
        <span className="text-sm font-bold">
          {isFormComplete
            ? "ទិន្នន័យសម្ពាធឈាមបានបញ្ចូលត្រឹមត្រូវ — សូមចុច 'បន្តទៅមុខ (Next)'"
            : stage === "guide"
              ? "សូមអនុវត្តតាមការណែនាំនៅលើឧបករណ៍វាស់សម្ពាធឈាម"
              : "សូមបញ្ចូលតម្លៃទាំង ៣ (SYS, DIA, PUL) ពីអេក្រង់ម៉ាស៊ីន"}
        </span>
      </div>
    </div>
  );
}
