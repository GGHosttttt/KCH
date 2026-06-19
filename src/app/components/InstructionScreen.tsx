import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, PersonStanding, Loader2 } from "lucide-react";
import { motion } from "motion/react";

export function InstructionScreen() {
  const navigate = useNavigate();
  const [sensorProgress, setSensorProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSensorProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 1;
      });
    }, 25);
    return () => clearInterval(interval);
  }, []);

  const handleNext = () => {
    if (sensorProgress >= 100) {
      navigate("/instructions/2");
    }
  };

  const isComplete = sensorProgress >= 100;

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Nav */}
      <div className="absolute top-6 left-6 z-10 flex justify-between w-[calc(100%-3rem)]">
        <button
          onClick={() => navigate("/handwash")}
          className="flex items-center space-x-2 text-teal-800 bg-white/80 backdrop-blur px-4 py-2 rounded-lg shadow-sm font-bold active:scale-95 transition-transform"
        >
          <ArrowLeft size={24} />
          <span>ត្រឡប់ក្រោយ</span>
        </button>
        {/* Step indicator */}
        <div className="flex items-center space-x-2 bg-white/80 backdrop-blur px-4 py-2 rounded-lg shadow-sm">
          <span className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-sm">១</span>
          <div className="w-8 h-1 bg-slate-200 rounded" />
          <span className="w-8 h-8 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center font-bold text-sm">២</span>
          <div className="w-8 h-1 bg-slate-200 rounded" />
          <span className="w-8 h-8 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center font-bold text-sm">៣</span>
        </div>
        <button
          onClick={handleNext}
          disabled={!isComplete}
          className={`flex items-center space-x-2 px-6 py-2 rounded-lg shadow-sm font-bold transition-all min-w-[180px] justify-center ${isComplete ? "text-white bg-teal-600 hover:bg-teal-700 active:scale-95 animate-pulse" : "text-slate-400 bg-slate-300 cursor-not-allowed opacity-80"}`}
        >
          <span>បន្តទៅមុខ (Next)</span>
          <ArrowRight size={24} />
        </button>
      </div>

      {/* Header */}
      <div className="pt-24 pb-4 px-8 text-center bg-white shadow-sm z-0">
        <h1 className="font-['Moul'] text-3xl text-teal-900 mb-2">ការណែនាំអំពីរបៀបវាស់វែងសុខភាព</h1>
        <p className="text-xl text-slate-500">Instructions for Health Measurements — Step 1 of 3</p>
      </div>

      {/* Single Card */}
      <div className="flex-1 p-8 flex items-center justify-center">
        <motion.div
          className="bg-white rounded-3xl shadow-xl border-2 border-teal-100 p-12 flex flex-col items-center text-center max-w-lg w-full relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Outer pulse ring */}
          <motion.div
            className="absolute w-56 h-56 rounded-full border-4 border-teal-200"
            animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-44 h-44 rounded-full border-4 border-teal-300"
            animate={{ scale: [1.12, 1, 1.12], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="w-36 h-36 bg-teal-50 rounded-full flex items-center justify-center mb-8 shadow-inner relative z-10">
            <PersonStanding size={72} className="text-teal-600" />
            {/* Ultrasonic sensor simulation */}
            <motion.div
              className="absolute -top-2 w-14 h-3 bg-teal-400 rounded-full opacity-60"
              animate={{ y: [0, 12, 0], opacity: [0.6, 0.2, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
            <div className="absolute -bottom-3 w-24 h-5 bg-slate-300 rounded-md opacity-60" />
          </div>

          <h3 className="font-['Moul'] text-3xl text-teal-900 mb-4 z-10 leading-relaxed">
            ១. ឈរត្រង់លើជើងទម្រ
          </h3>
          <p className="text-xl text-teal-700 font-bold mb-2 z-10">
            ដើម្បីវាស់កម្ពស់ និងទម្ងន់
          </p>
          <p className="text-lg text-slate-500 z-10">
            Stand straight on the platform to measure Height &amp; Weight
          </p>
        </motion.div>
      </div>

      {/* Footer sensor status */}
      <div className={`py-4 px-8 flex items-center justify-center space-x-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] transition-colors duration-500 z-10 ${isComplete ? "bg-teal-700 text-white" : "bg-slate-800 text-teal-100"}`}>
        <div className="relative flex items-center justify-center w-8 h-8">
          <svg className="w-8 h-8 transform -rotate-90">
            <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="transparent" className="opacity-20" />
            <circle 
              cx="16" cy="16" r="14" 
              stroke="currentColor" 
              strokeWidth="3" 
              fill="transparent" 
              strokeDasharray={2 * Math.PI * 14} 
              strokeDashoffset={2 * Math.PI * 14 * (1 - sensorProgress / 100)} 
              className="transition-all duration-75" 
            />
          </svg>
          {isComplete && <span className="absolute inset-0 flex items-center justify-center font-bold text-[10px]">✓</span>}
        </div>
        <span className="text-lg font-bold">
          {isComplete
            ? "ការអានទិន្នន័យបានបញ្ចប់ (Complete) — សូមចុចបន្ត (Please click next)"
            : `កំពុងដំណើរការអានទិន្នន័យពីសេនស័រ... ${sensorProgress}% (Reading sensor telemetry...)`}
        </span>
      </div>
    </div>
  );
}
