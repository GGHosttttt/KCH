import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Activity, Brain, Cpu, Database, Volume2 } from "lucide-react";
import apiService from "../../../services/apiService";
import { useCheckupStore } from "../../stores/useCheckupStore";

export function ProcessingScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const store = useCheckupStore();

  const recordId =
    searchParams.get("record_id") ||
    sessionStorage.getItem("patient_record_id") ||
    sessionStorage.getItem("record_id");

  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState(
    "កំពុងរៀបចំ និងផ្ទៀងផ្ទាត់ទិន្នន័យ...",
  );
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    async function executePipeline() {
      try {
        // Step 1: Progress tick (Data Sync)
        setProgress(35);
        setStatusText("កំពុងទាញយកទិន្នន័យសុខភាព និងលទ្ធផលវាយតម្លៃ...");

        // Fetch or read assessment data
        let assessmentResult: any = null;
        const cached = sessionStorage.getItem("kch_screening_result");
        if (cached) {
          try {
            assessmentResult = JSON.parse(cached);
          } catch {
            // ignore
          }
        }

        if (!assessmentResult && recordId) {
          const res = await apiService(
            `/kch-api/api/v1/records/${recordId}`,
            "GET",
          );
          assessmentResult = res?.data || res;
        }

        // Step 2: Clinical AI Calculation
        setProgress(65);
        setStatusText("ម៉ាស៊ីន AI កំពុងវិភាគហានិភ័យ និងបង្កើតសំឡេងណែនាំ...");

        // Step 3: Trigger TTS Audio Generation for both Results and Receipt
        const v = store.vitals || assessmentResult?.vitals || {};
        const r = assessmentResult?.result || {};

        const ttsPayload = {
          record_id: recordId,
          patient_name:
            store.user?.fullname || assessmentResult?.patient_name || "លោកអ្នក",
          bmi: r.bmi != null ? Number(r.bmi) : null,
          bmi_category: r.bmi_category,
          systolic: v.systolic_mmhg,
          diastolic: v.diastolic_mmhg,
          pulse: v.pulse_bpm || v.heart_rate_bpm,
          bp_category: r.bp_category,
          glucose_mgdl: v.fpg_mgdl || v.rpg_mgdl,
          glucose_category: r.glucose_category,
          health_recommendation: r.health_recommendation,
          workout_recommendation: r.workout_recommendation,
          engine: "edge", // Sreymom model
        };

        try {
          const ttsRes = await apiService(
            "/kch-ai/api/v1/tts/checkup-narration",
            "POST",
            ttsPayload,
          );
          const ttsData = ttsRes?.data || ttsRes;

          if (ttsData?.results_audio_b64) {
            sessionStorage.setItem(
              "tts_results_audio",
              `data:audio/mp3;base64,${ttsData.results_audio_b64}`,
            );
          }
          if (ttsData?.receipt_audio_b64) {
            sessionStorage.setItem(
              "tts_receipt_audio",
              `data:audio/mp3;base64,${ttsData.receipt_audio_b64}`,
            );
          }
        } catch (audioErr) {
          console.warn("TTS generation deferred to results page:", audioErr);
        }

        // Step 4: Complete and navigate
        setProgress(100);
        setStatusText("ការវិភាគបានបញ្ចប់ជាស្ថាពរ!");

        setTimeout(() => {
          navigate(recordId ? `/results?record_id=${recordId}` : "/results");
        }, 600);
      } catch (err) {
        console.error("Processing pipeline error:", err);
        // Fallback navigation
        setProgress(100);
        setTimeout(() => {
          navigate(recordId ? `/results?record_id=${recordId}` : "/results");
        }, 500);
      }
    }

    executePipeline();
  }, [recordId, navigate, store]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#0B1120] relative overflow-hidden font-['Noto_Sans_Khmer',sans-serif] select-none">
      {/* Dynamic Background Glows */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <motion.div
          animate={{ x: [-40, 40, -40], y: [-40, 40, -40], scale: [1, 1.2, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-teal-600/30 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ x: [40, -40, 40], y: [40, -40, 40], scale: [1.2, 1, 1.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/20 rounded-full blur-[100px]"
        />
      </div>

      {/* Header Badge */}
      <div className="z-10 text-center mb-8">
        <div className="inline-flex items-center space-x-2.5 bg-teal-500/10 border border-teal-500/30 text-teal-300 px-5 py-2 rounded-full mb-4 backdrop-blur-md">
          <Brain size={18} className="animate-pulse" />
          <span className="font-mono text-xs tracking-widest uppercase">
            Khmer Health AI Engine
          </span>
        </div>
        <h1 className="font-['Moul'] text-2xl md:text-3xl text-white mb-2 drop-shadow-[0_0_15px_rgba(45,212,191,0.4)]">
          ប្រព័ន្ធ AI កំពុងវិភាគទិន្នន័យសុខភាព
        </h1>
        <p className="text-sm md:text-base text-slate-400 font-light max-w-md mx-auto">
          {statusText}
        </p>
      </div>

      {/* Radial Progress Orb */}
      <div className="relative flex items-center justify-center mb-10 z-10 w-64 h-64 md:w-72 md:h-72">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-2 border-dashed border-teal-500/30 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          className="absolute inset-3 border border-teal-400/20 rounded-full"
        />

        <div className="absolute inset-6 rounded-full bg-[#0B1120]/70 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(45,212,191,0.15)] flex flex-col items-center justify-center overflow-hidden">
          <div className="text-center z-10 flex items-baseline">
            <span className="text-6xl md:text-7xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-b from-white to-teal-200">
              {progress}
            </span>
            <span className="text-teal-400 text-xl font-bold ml-1">%</span>
          </div>

          <motion.div
            animate={{ top: ["-10%", "110%", "-10%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-full h-1 bg-teal-400/80 shadow-[0_0_20px_rgba(45,212,191,1)] z-20 left-0"
          />
        </div>
      </div>

      {/* Step Cards */}
      <div className="z-10 grid grid-cols-3 gap-3 md:gap-5 max-w-2xl w-full px-6">
        {[
          {
            icon: Database,
            label: "Data Pipeline",
            done: progress >= 35,
            desc: "Sync Records",
          },
          {
            icon: Cpu,
            label: "AI Prediction",
            done: progress >= 65,
            desc: "Calculate Risk",
          },
          {
            icon: Volume2,
            label: "Audio Synthesis",
            done: progress >= 95,
            desc: "Sreymom Voice",
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl flex flex-col items-center text-center shadow-xl relative overflow-hidden"
          >
            <div
              className={`absolute top-0 left-0 w-full h-1 transition-colors duration-500 ${
                item.done ? "bg-teal-500" : "bg-transparent"
              }`}
            />
            <item.icon
              size={24}
              className={`mb-2 transition-colors duration-500 ${
                item.done ? "text-teal-400" : "text-slate-500 animate-pulse"
              }`}
            />
            <h3 className="text-white font-bold text-xs mb-0.5">
              {item.label}
            </h3>
            <p className="text-slate-400 text-[10px]">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
