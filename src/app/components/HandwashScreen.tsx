import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export function HandwashScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-teal-50 to-slate-100 relative overflow-hidden">
      {/* Decorative rings */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full border-4 border-teal-200/40"
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.3, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[380px] h-[380px] rounded-full border-4 border-teal-300/40"
        animate={{ scale: [1.08, 1, 1.08], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-48 h-48 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-teal-100 mb-10"
      >
        <span className="text-8xl select-none">🧼</span>
      </motion.div>

      {/* Message */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="z-10 text-center max-w-2xl px-8 mb-12"
      >
        <h1 className="font-['Moul'] text-4xl text-teal-900 mb-4 leading-relaxed">
          សូមលាងសម្អាតដៃ
        </h1>
        <h2 className="text-2xl font-bold text-teal-700 mb-6">
          មុនពេលពិនិត្យ
        </h2>
        <div className="bg-white rounded-3xl shadow-lg border border-teal-100 p-6">
          <p className="text-2xl text-slate-600 leading-relaxed">
            Please clean your hands before using the sensors
          </p>
          <p className="text-lg text-slate-400 mt-3">
            ការលាងសម្អាតដៃជួយឱ្យការវាស់វែងមានភាពត្រឹមត្រូវ
          </p>
          <p className="text-base text-slate-400">
            (Clean hands ensure accurate sensor readings)
          </p>
        </div>
      </motion.div>

      {/* Continue Button */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        onClick={() => navigate("/instructions/1")}
        className="z-10 bg-teal-600 hover:bg-teal-700 text-white font-bold text-2xl py-6 px-12 rounded-full shadow-xl flex items-center space-x-4 transition-all active:scale-95"
        whileTap={{ scale: 0.97 }}
      >
        <span className="font-['Moul']">ចាប់ផ្តើមវាស់</span>
        <ArrowRight size={32} />
      </motion.button>
      <p className="z-10 mt-3 text-slate-400 text-lg">Begin Measurement</p>
    </div>
  );
}
