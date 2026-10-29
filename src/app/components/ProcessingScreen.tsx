import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Brain, Database, Cpu, Volume2 } from "lucide-react";
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

  // Visual smooth display values
  const [displayProgress, setDisplayProgress] = useState(0);
  const [statusText, setStatusText] = useState(
    "កំពុងប្រមូលទិន្នន័យពីឧបករណ៍វាស់វែង...",
  );

  // Progress interpolation refs
  const targetProgressRef = useRef(10);
  const currentProgressRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const pipelineDoneRef = useRef(false);

  // 1. Smooth RAF Interpolation Loop (Eliminates Jitter)
  useEffect(() => {
    const updateProgress = () => {
      if (currentProgressRef.current < targetProgressRef.current) {
        // Smooth linear increment
        currentProgressRef.current += Math.max(
          0.4,
          (targetProgressRef.current - currentProgressRef.current) * 0.08,
        );
        const rounded = Math.min(100, Math.floor(currentProgressRef.current));
        setDisplayProgress(rounded);
      }

      // Check if ready to navigate to results
      if (currentProgressRef.current >= 99 && pipelineDoneRef.current) {
        setDisplayProgress(100);
        setTimeout(() => {
          navigate(recordId ? `/results?record_id=${recordId}` : "/results");
        }, 500);
        return;
      }

      animationFrameRef.current = requestAnimationFrame(updateProgress);
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, [navigate, recordId]);

  // 2. Real Background Processing Pipeline
  useEffect(() => {
    let isMounted = true;

    async function executeProcessing() {
      try {
        // Stage 1: Data preparation
        targetProgressRef.current = 30;
        setStatusText("កំពុងទាញយកទិន្នន័យសុខភាព និងលទ្ធផលវាយតម្លៃ...");

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

        // Stage 2: AI Clinical analysis
        targetProgressRef.current = 65;
        setStatusText("ម៉ាស៊ីន AI កំពុងវិភាគហានិភ័យ និងបង្កើតសំឡេងណែនាំ...");

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
          engine: "edge",
        };

        // Stage 3: Audio Synthesis
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
          console.warn("TTS deferred to results page:", audioErr);
        }

        // Stage 4: Finish
        if (!isMounted) return;
        targetProgressRef.current = 100;
        setStatusText("ការវិភាគបានបញ្ចប់ជាស្ថាពរ!");
        pipelineDoneRef.current = true;
      } catch (err) {
        console.error("Pipeline error:", err);
        if (!isMounted) return;
        targetProgressRef.current = 100;
        pipelineDoneRef.current = true;
      }
    }

    executeProcessing();

    return () => {
      isMounted = false;
    };
  }, [recordId, store]);

  // Dynamic Dash Array calculation for circle
  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (displayProgress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#0B1120] relative overflow-hidden font-['Noto_Sans_Khmer',sans-serif] select-none text-white pb-24">
      {/* Optimized Background Glows (Using GPU layer to prevent stuttering) */}
      <div className="absolute inset-0 opacity-30 pointer-events-none transform-gpu">
        <div className="absolute -top-1/4 -left-1/4 w-[60vw] h-[60vw] bg-teal-600/25 rounded-full blur-[100px]" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[50vw] h-[50vw] bg-emerald-600/20 rounded-full blur-[100px]" />
      </div>

      {/* Header Badge */}
      <div className="z-10 text-center mb-6 px-4">
        <div className="inline-flex items-center space-x-2 bg-teal-500/10 border border-teal-500/30 text-teal-300 px-4 py-1.5 rounded-full mb-3 backdrop-blur-md">
          <Brain size={16} className="text-teal-400" />
          <span className="font-mono text-xs tracking-wider uppercase">
            Khmer Health AI Engine
          </span>
        </div>
        <h1 className="font-['Moul'] text-2xl md:text-3xl text-white mb-2 drop-shadow-md">
          ប្រព័ន្ធ AI កំពុងវិភាគទិន្នន័យសុខភាព
        </h1>
        <p className="text-xs md:text-sm text-slate-400 font-light max-w-md mx-auto min-h-[20px]">
          {statusText}
        </p>
      </div>

      {/* Smooth Circular Progress Gauge */}
      <div className="relative flex items-center justify-center mb-8 z-10 w-64 h-64">
        <svg className="w-full h-full transform -rotate-90">
          {/* Track Circle */}
          <circle
            cx="128"
            cy="128"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-800"
          />
          {/* Animated Progress Circle */}
          <circle
            cx="128"
            cy="128"
            r={radius}
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-75 ease-out"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>

        {/* Central Counter */}
        <div className="absolute inset-4 rounded-full bg-[#0B1120]/80 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="flex items-baseline">
            <span className="text-6xl font-black font-mono text-white tracking-tighter">
              {displayProgress}
            </span>
            <span className="text-teal-400 text-xl font-bold ml-1 font-mono">
              %
            </span>
          </div>
        </div>
      </div>

      {/* Stage Cards */}
      <div className="z-10 grid grid-cols-3 gap-3 max-w-xl w-full px-6">
        {[
          {
            icon: Database,
            label: "Data Pipeline",
            desc: "Sync Records",
            done: displayProgress >= 30,
          },
          {
            icon: Cpu,
            label: "AI Prediction",
            desc: "Calculate Risk",
            done: displayProgress >= 65,
          },
          {
            icon: Volume2,
            label: "Audio Synthesis",
            desc: "Sreymom Voice",
            done: displayProgress >= 95,
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className={`bg-white/5 backdrop-blur-md border rounded-2xl p-3 flex flex-col items-center text-center transition-all duration-300 ${
              item.done ? "border-teal-500/50 bg-teal-500/5" : "border-white/10"
            }`}
          >
            <item.icon
              size={22}
              className={`mb-1.5 transition-colors ${
                item.done ? "text-teal-400" : "text-slate-500"
              }`}
            />
            <h3 className="text-white font-bold text-xs">{item.label}</h3>
            <p className="text-slate-400 text-[10px]">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
