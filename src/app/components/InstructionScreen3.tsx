import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "motion/react";

export function InstructionScreen3() {
  const navigate = useNavigate();
  const [sensorProgress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
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
      navigate("/processing");
    }
  };

  const isComplete = sensorProgress >= 100;

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Nav */}
      <div className="absolute top-6 left-6 z-10 flex justify-between w-[calc(100%-3rem)]">
        <button
          onClick={() => navigate("/instructions/2")}
          className="flex items-center space-x-2 text-teal-800 bg-white/80 backdrop-blur px-4 py-2 rounded-lg shadow-sm font-bold active:scale-95 transition-transform"
        >
          <ArrowLeft size={24} />
          <span>ត្រឡប់ក្រោយ</span>
        </button>
        <div className="flex items-center space-x-2 bg-white/80 backdrop-blur px-4 py-2 rounded-lg shadow-sm">
          <span className="w-8 h-8 bg-teal-200 text-teal-700 rounded-full flex items-center justify-center font-bold text-sm">✓</span>
          <div className="w-8 h-1 bg-teal-200 rounded" />
          <span className="w-8 h-8 bg-teal-200 text-teal-700 rounded-full flex items-center justify-center font-bold text-sm">✓</span>
          <div className="w-8 h-1 bg-teal-200 rounded" />
          <span className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-sm">៣</span>
        </div>
        <button
          onClick={handleNext}
          disabled={!isComplete}
          className={`flex items-center space-x-2 px-6 py-2 rounded-lg shadow-sm font-bold transition-all min-w-[180px] justify-center ${isComplete ? "text-white bg-teal-600 hover:bg-teal-700 active:scale-95 animate-pulse" : "text-slate-400 bg-slate-300 cursor-not-allowed opacity-80"}`}
        >
          <span>វិភាគ (Analyze)</span>
          <ArrowRight size={24} />
        </button>
      </div>

      {/* Header */}
      <div className="pt-24 pb-4 px-8 text-center bg-white shadow-sm z-0">
        <h1 className="font-['Moul'] text-3xl text-teal-900 mb-2">ការណែនាំអំពីរបៀបវាស់វែងសុខភាព</h1>
        <p className="text-xl text-slate-500">Instructions for Health Measurements — Step 3 of 3</p>
      </div>

      {/* Single Card */}
      <div className="flex-1 p-8 flex items-center justify-center">
        <motion.div
          className="bg-white rounded-3xl shadow-xl border-2 border-blue-100 p-12 flex flex-col items-center text-center max-w-lg w-full relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Outer glow pulse rings */}
          <motion.div
            className="absolute w-56 h-56 rounded-full border-4 border-blue-200"
            animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-44 h-44 rounded-full border-4 border-blue-300"
            animate={{ scale: [1.12, 1, 1.12], opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Finger + Sensor illustration */}
          <div className="w-36 h-36 bg-blue-50 rounded-full flex items-center justify-center mb-8 shadow-inner relative z-10">
            <svg viewBox="0 0 80 80" width="72" height="72" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Sensor base */}
              <ellipse cx="40" cy="62" rx="24" ry="10" fill="#93C5FD" opacity="0.8" />
              {/* Sensor lens glow */}
              <motion.ellipse cx="40" cy="62" rx="14" ry="6" fill="#3B82F6" opacity="0.6" />
              <ellipse cx="40" cy="62" rx="8" ry="4" fill="#60A5FA" opacity="0.9" />
              {/* Finger */}
              <rect x="30" y="20" width="20" height="42" rx="10" fill="#FBBF99" />
              <ellipse cx="40" cy="20" rx="10" ry="10" fill="#FBBF99" />
              {/* Fingernail */}
              <rect x="33" y="22" width="14" height="10" rx="6" fill="#FDE68A" opacity="0.7" />
            </svg>
            {/* PPG glow animation */}
            <motion.div
              className="absolute w-16 h-16 bg-blue-400 rounded-full blur-2xl opacity-30"
              animate={{ scale: [1, 1.6, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
          </div>

          <h3 className="font-['Moul'] text-3xl text-teal-900 mb-4 z-10 leading-relaxed">
            ៣. ដាក់ចុងម្រាមដៃ
          </h3>
          <p className="text-xl text-blue-700 font-bold mb-2 z-10">
            លើឧបករណ៍វាស់ជាតិស្ករ (មិនចាក់ម្ជុល)
          </p>
          <p className="text-lg text-slate-500 z-10">
            Place fingertip gently on the optical glucose sensor — No needles
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
