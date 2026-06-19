import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Activity, Brain, Cpu, Database } from "lucide-react";

export function ProcessingScreen() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 5000; // 5 seconds processing
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setProgress(Math.min(100, Math.round((currentStep / steps) * 100)));
      if (currentStep >= steps) {
        clearInterval(timer);
        navigate("/results");
      }
    }, interval);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#0B1120] relative overflow-hidden">
      {/* Dynamic Mesh Background */}
      <div className="absolute inset-0 opacity-50 pointer-events-none">
        <motion.div
          animate={{ x: [-50, 50, -50], y: [-50, 50, -50], scale: [1, 1.2, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-teal-600/30 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ x: [50, -50, 50], y: [50, -50, 50], scale: [1.2, 1, 1.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/20 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-blue-600/20 rounded-full blur-[80px]"
        />
      </div>

      <div className="z-10 text-center mb-12">
        <div className="inline-flex items-center space-x-3 bg-teal-500/10 border border-teal-500/30 text-teal-300 px-6 py-2 rounded-full mb-8 backdrop-blur-md">
          <Brain size={20} className="animate-pulse" />
          <span className="font-mono text-sm tracking-widest uppercase">Khmer Health AI Engine</span>
        </div>
        <h1 className="font-['Moul'] text-4xl text-white mb-4 drop-shadow-[0_0_15px_rgba(45,212,191,0.4)]">
          ប្រព័ន្ធ AI កំពុងវិភាគទិន្នន័យសុខភាព
        </h1>
        <p className="text-xl text-slate-400 font-light">Synthesizing multidimensional health metrics...</p>
      </div>

      <div className="relative flex items-center justify-center mb-16 z-10 w-80 h-80">
        {/* Futuristic Hexagon/Radar Rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-2 border-dashed border-teal-500/30 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 border border-teal-400/20 rounded-full"
        />
        
        {/* Core AI Orb */}
        <div className="absolute inset-8 rounded-full bg-[#0B1120]/60 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(45,212,191,0.15)] flex items-center justify-center overflow-hidden">
          <motion.div 
            animate={{ scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-tr from-teal-500/10 to-emerald-500/10"
          />
          
          <div className="text-center z-10 flex items-baseline">
            <span className="text-7xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-b from-white to-teal-200 drop-shadow-lg">
              {progress}
            </span>
            <span className="text-teal-400 text-2xl font-bold ml-1">%</span>
          </div>

          {/* Scanning Line */}
          <motion.div
            animate={{ top: ['-10%', '110%', '-10%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-full h-1 bg-teal-400/80 shadow-[0_0_20px_rgba(45,212,191,1)] z-20 left-0"
          />
        </div>
      </div>

      <div className="z-10 grid grid-cols-3 gap-6 max-w-3xl w-full px-8">
        {[
          { icon: Database, label: "Data Pipeline", stat: "100%", desc: "Syncing records" },
          { icon: Activity, label: "Vitals Check", stat: progress > 30 ? "Complete" : "Analyzing", desc: "BP & Pulse" },
          { icon: Cpu, label: "AI Prediction", stat: progress > 70 ? "Complete" : "Calculating", desc: "Glucose & Risk" }
        ].map((item, idx) => (
          <div key={idx} className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex flex-col items-center text-center shadow-2xl transition-all duration-500 relative overflow-hidden group">
            {/* Status Glow */}
            <div className={`absolute top-0 left-0 w-full h-1 transition-colors duration-500 ${item.stat === "Complete" || item.stat === "100%" ? "bg-teal-500" : "bg-transparent"}`} />
            
            <item.icon size={32} className={`mb-3 transition-colors duration-500 ${item.stat === "Complete" || item.stat === "100%" ? "text-teal-400" : "text-slate-500 animate-pulse"}`} />
            <h3 className="text-white font-bold text-lg mb-1">{item.label}</h3>
            <p className="text-slate-400 text-sm mb-3">{item.desc}</p>
            <div className="mt-auto px-4 py-1.5 bg-black/40 rounded-lg text-sm font-mono text-teal-300 border border-teal-500/20 w-full">
              {item.stat}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

