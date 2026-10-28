import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Eye,
  LogOut,
  HeartPulse,
  Scale,
  Droplet,
  UserCircle2,
  Loader2,
  AlertCircle,
  Activity,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion } from "motion/react";
import apiService from "../../../services/apiService";
import { useCheckupStore } from "../../stores/useCheckupStore";

interface ScreeningRecordDetail {
  id: string;
  user_id: string;
  kiosk_id: string;
  session_id: string | null;
  age: number;
  gender: string;
  patient_name?: string;
  created_at?: string;
  vitals?: {
    height_cm: number | null;
    weight_kg: number | null;
    systolic_mmhg: number | null;
    diastolic_mmhg: number | null;
    pulse_bpm: number | null;
    heart_rate_bpm: number | null;
    spo2_percent: number | null;
    fpg_mgdl: number | null;
    rpg_mgdl: number | null;
  };
  result?: {
    bp_category: string | null;
    glucose_category: string | null;
    bmi: number | null;
    cvd_risk_band: string | null;
    referral_urgency: string | null;
    referral_reasons: string[];
    diagnosis_confirmed: boolean;
    health_recommendation: string | null;
    workout_recommendation: string | null;
    notes: string[];
  };
}

export function ResultScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const recordId =
    searchParams.get("record_id") ||
    searchParams.get("id") ||
    sessionStorage.getItem("patient_record_id") ||
    sessionStorage.getItem("record_id");

  const resetCheckup = useCheckupStore((s) => s.resetCheckup);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<ScreeningRecordDetail | null>(null);
  const [voiceGuide, setVoiceGuide] = useState(true);

  const fallbackName =
    sessionStorage.getItem("userName") || "អ្នកជំងឺ (Patient)";
  const fallbackPhone = sessionStorage.getItem("userPhone") || "---";

  useEffect(() => {
    async function fetchRecord() {
      if (!recordId) {
        const cached = sessionStorage.getItem("last_screening_result");
        if (cached) {
          try {
            setRecord(JSON.parse(cached));
            setLoading(false);
            return;
          } catch (e) {
            console.error("Failed to parse cached screening result", e);
          }
        }
        setError(
          "មិនមានលេខសម្គាល់កំណត់ត្រាត្រឹមត្រូវទេ (Missing Screening Record ID)",
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await apiService(
          `/kch-api/api/v1/records/${recordId}`,
          "GET",
        );

        const data: ScreeningRecordDetail = res?.data || res;
        if (!data || (!data.vitals && !data.result)) {
          throw new Error("មិនមានទិន្នន័យពិនិត្យសុខភាព (Record data is empty)");
        }

        setRecord(data);
      } catch (err: any) {
        console.error("Error fetching record:", err);
        setError(
          err?.message ||
            "បរាជ័យក្នុងការទាញយកលទ្ធផល (Failed to load assessment record)",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchRecord();
  }, [recordId]);

  const handleExit = () => {
    resetCheckup();
    sessionStorage.clear();
    navigate("/");
  };

  // Inside ResultScreen.tsx
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!record || !voiceGuide) return;

    async function playOrGenerateAudio() {
      let audioUrl = sessionStorage.getItem("tts_results_audio");

      // 1. If not in session storage (e.g. mobile QR scan redirected straight here)
      if (!audioUrl) {
        try {
          const v = record.vitals || {};
          const r = record.result || {};
          const ttsRes = await apiService(
            "/kch-ai/api/v1/tts/checkup-narration",
            "POST",
            {
              record_id: record.id,
              patient_name: record.patient_name || fallbackName,
              bmi: r.bmi,
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
            },
          );

          const data = ttsRes?.data || ttsRes;
          if (data?.results_audio_b64) {
            audioUrl = `data:audio/mp3;base64,${data.results_audio_b64}`;
            sessionStorage.setItem("tts_results_audio", audioUrl);
          }
          if (data?.receipt_audio_b64) {
            sessionStorage.setItem(
              "tts_receipt_audio",
              `data:audio/mp3;base64,${data.receipt_audio_b64}`,
            );
          }
        } catch (err) {
          console.warn("On-demand audio generation skipped:", err);
        }
      }

      // 2. Play Audio
      if (audioUrl) {
        if (audioPlayerRef.current) audioPlayerRef.current.pause();
        const player = new Audio(audioUrl);
        audioPlayerRef.current = player;
        setAudioPlaying(true);
        player.play().catch(console.warn);
        player.onended = () => setAudioPlaying(false);
      }
    }

    playOrGenerateAudio();

    return () => {
      audioPlayerRef.current?.pause();
    };
  }, [record, voiceGuide]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-100 flex flex-col items-center justify-center gap-4 text-teal-900 font-['Noto_Sans_Khmer',sans-serif]">
        <Loader2 size={48} className="animate-spin text-teal-600" />
        <h2 className="text-xl font-bold">កំពុងទាញយកលទ្ធផលពិនិត្យសុខភាព...</h2>
        <p className="text-sm text-slate-500">Loading screening report</p>
      </div>
    );
  }

  // Error State
  if (error || !record) {
    return (
      <div className="min-h-screen w-full bg-slate-100 flex flex-col items-center justify-center p-6 text-center font-['Noto_Sans_Khmer',sans-serif]">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-red-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={36} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            មានបញ្ហាក្នុងការទាញយកទិន្នន័យ
          </h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl text-sm hover:bg-teal-700"
            >
              ព្យាយាមម្តងទៀត (Retry)
            </button>
            <button
              onClick={handleExit}
              className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200"
            >
              ត្រឡប់ទៅទំព័រដើម (Exit to Home)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Parsed direct fields without manual math recalculation
  const v = record.vitals || {};
  const r = record.result || {};

  const patientName = record.patient_name || fallbackName;
  const genderLabel =
    record.gender === "male"
      ? "ប្រុស (Male)"
      : record.gender === "female"
        ? "ស្រី (Female)"
        : "---";

  const height = v.height_cm ? `${v.height_cm} cm` : "--";
  const weight = v.weight_kg ? `${v.weight_kg} kg` : "--";
  const bmiVal = r.bmi != null ? Number(r.bmi).toFixed(1) : "--";

  const sbp = v.systolic_mmhg ?? "--";
  const dbp = v.diastolic_mmhg ?? "--";
  const pulse = v.pulse_bpm ?? v.heart_rate_bpm ?? "--";

  const glucoseVal = v.fpg_mgdl ?? v.rpg_mgdl;
  const glucoseType = v.fpg_mgdl
    ? "Fasting (FPG)"
    : v.rpg_mgdl
      ? "Random (RPG)"
      : "Finger-stick / Sensor";

  // Category labels passed directly from backend result
  const bpCategory = r.bp_category || "បានវាស់ (Recorded)";
  const glucoseCategory = r.glucose_category || "បានវាស់ (Recorded)";

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-slate-100 font-['Noto_Sans_Khmer',sans-serif] flex flex-col justify-between select-none">
      <div className="w-full flex flex-col pb-28">
        {/* Header Banner */}
        <header className="bg-[#073B35] text-white pt-6 pb-12 px-6 sm:px-10 shadow-md relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
            <HeartPulse size={220} />
          </div>
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 relative z-10">
            <div>
              <h1 className="font-['Moul'] text-2xl sm:text-3xl mb-1 text-teal-50 drop-shadow-md">
                លទ្ធផលការពិនិត្យសុខភាពរបស់អ្នក
              </h1>
              <p className="text-xs sm:text-sm text-teal-200 font-medium">
                Your Health Evaluation Summary
              </p>
            </div>
            <div className="flex items-center space-x-3 bg-teal-900/60 backdrop-blur px-4 py-2 rounded-2xl border border-teal-700/50">
              <UserCircle2 size={30} className="text-teal-300 shrink-0" />
              <div>
                <p className="text-[9px] text-teal-300 font-bold uppercase tracking-wider font-mono">
                  លេខសម្គាល់ / RECORD
                </p>
                <p className="font-mono text-xs font-bold tracking-wider text-white">
                  {record.id ? record.id.slice(0, 13) + "..." : fallbackPhone}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* 4 Cards Grid - Responsive & Full Height */}
        <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 -mt-6 z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
            {/* Card 1: User Info */}
            <motion.div
              className="bg-white rounded-3xl shadow-md border border-slate-200 p-5 flex flex-col justify-between"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-teal-50 p-2.5 rounded-2xl text-teal-600 shrink-0">
                    <UserCircle2 size={24} />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-slate-800">
                      ព័ត៌មានអ្នកជំងឺ
                    </h2>
                    <p className="text-[10px] text-slate-400">Patient Info</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-slate-400 text-[10px]">
                      ឈ្មោះ / Name
                    </span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">
                      {patientName}
                    </p>
                  </div>
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-slate-400 text-[10px]">
                      ភេទ / Gender
                    </span>
                    <p className="font-bold text-slate-800 text-xs mt-0.5">
                      {genderLabel}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">
                      អាយុ / Age
                    </span>
                    <p className="font-bold text-slate-800 text-xs mt-0.5">
                      {record.age || "--"}{" "}
                      <span className="text-slate-400 text-[10px] font-normal">
                        ឆ្នាំ (yrs)
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="w-full bg-teal-50 border border-teal-200 text-teal-800 py-1.5 px-2 rounded-xl text-center font-bold text-xs font-mono">
                  CVD Risk: {r.cvd_risk_band || "<5%"}
                </div>
              </div>
            </motion.div>

            {/* Card 2: Body Composition */}
            <motion.div
              className="bg-white rounded-3xl shadow-md border border-slate-200 p-5 flex flex-col justify-between"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-blue-50 p-2.5 rounded-2xl text-blue-600 shrink-0">
                    <Scale size={24} />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-slate-800">
                      សមាសភាពរាងកាយ
                    </h2>
                    <p className="text-[10px] text-slate-400">
                      Body Composition
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500">កម្ពស់ (Height)</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {height}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500">ទម្ងន់ (Weight)</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {weight}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-500 font-bold">BMI</span>
                    <span className="text-lg font-bold text-slate-800 font-mono">
                      {bmiVal}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="w-full border border-teal-200 bg-teal-50 text-teal-800 py-1.5 rounded-xl text-center font-bold text-xs">
                  <span>
                    {r.bmi ? `BMI: ${Number(r.bmi).toFixed(1)}` : "បានវាស់រួច"}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Blood Pressure */}
            <motion.div
              className="bg-white rounded-3xl shadow-md border border-slate-200 p-5 flex flex-col justify-between"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-rose-50 p-2.5 rounded-2xl text-rose-600 shrink-0">
                    <HeartPulse size={24} />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-slate-800">
                      សម្ពាធឈាម
                    </h2>
                    <p className="text-[10px] text-slate-400">Blood Pressure</p>
                  </div>
                </div>

                <div className="flex flex-col justify-center items-center bg-slate-50 rounded-2xl border border-slate-100 py-3 px-3">
                  <span className="text-slate-400 text-[10px] mb-0.5">
                    BP Measurement
                  </span>
                  <div className="text-2xl font-bold text-slate-800 tracking-tight font-mono">
                    {sbp}
                    <span className="text-lg text-slate-400 font-normal">
                      /{dbp}
                    </span>{" "}
                    <span className="text-xs text-slate-400 font-normal">
                      mmHg
                    </span>
                  </div>
                  <div className="w-full mt-2 pt-2 border-t border-slate-200/60 flex justify-between items-center px-1 text-xs">
                    <span className="text-slate-400 text-[11px]">
                      ចង្វាក់បេះដូង
                    </span>
                    <span className="font-bold text-rose-600 font-mono">
                      {pulse} bpm
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="w-full border border-rose-200 bg-rose-50 text-rose-700 py-1.5 rounded-xl text-center font-bold text-xs">
                  <span>{bpCategory}</span>
                </div>
              </div>
            </motion.div>

            {/* Card 4: Glucose */}
            <motion.div
              className="bg-white rounded-3xl shadow-md border border-slate-200 p-5 flex flex-col justify-between"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-teal-50 p-2.5 rounded-2xl text-[#00A884] shrink-0">
                    <Droplet size={24} />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-slate-800">
                      ជាតិស្ករក្នុងឈាម
                    </h2>
                    <p className="text-[10px] text-slate-400">Blood Glucose</p>
                  </div>
                </div>

                <div className="flex flex-col justify-center items-center bg-slate-50 rounded-2xl border border-slate-100 py-3 px-2 text-center">
                  <div className="w-8 h-8 mb-1 bg-white shadow-sm rounded-full border border-teal-200 flex items-center justify-center text-teal-600">
                    <Droplet size={16} className="fill-teal-50" />
                  </div>
                  <span className="text-xl font-bold text-slate-800 font-mono">
                    {glucoseVal ? `${glucoseVal} mg/dL` : "មិនបានវាស់"}
                  </span>
                  <p className="text-slate-400 text-[10px] mt-0.5">
                    {glucoseType}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="w-full border border-teal-200 bg-teal-50 text-teal-700 py-1.5 rounded-xl text-center font-bold text-xs">
                  <span>{glucoseCategory}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div
            className="bg-white rounded-3xl shadow-md border border-slate-200 p-3.5 sm:p-4 mt-4"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate(`/receipt?record_id=${record.id}`)}
                className="flex-1 bg-[#00A884] hover:bg-[#008f70] text-white py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center space-x-3 shadow-md transition-all active:scale-[0.98]"
              >
                <Eye size={20} />
                <span>មើលក្រដាសលទ្ធផល (Preview Receipt)</span>
              </button>
              <button
                onClick={handleExit}
                className="sm:w-1/3 bg-slate-800 hover:bg-slate-900 text-white py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center space-x-2 shadow-md transition-all active:scale-[0.98]"
              >
                <LogOut size={20} />
                <span>បញ្ចប់ (Exit)</span>
              </button>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Floating Bottom Bar (Voice Assistant) */}
      <footer className="fixed bottom-3 left-4 right-4 max-w-6xl mx-auto flex items-center justify-between pointer-events-none z-30">
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-800/90 backdrop-blur text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg border border-slate-700">
          <Activity size={14} className="text-[#00A884]" />
          <span>ជំនួយសំឡេងកំពុងបើក (Voice Guide On)</span>
        </div>

        <button
          onClick={() => setVoiceGuide(!voiceGuide)}
          className="pointer-events-auto w-10 h-10 rounded-full bg-white text-slate-700 flex items-center justify-center shadow-lg border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
          title="Toggle Voice"
        >
          {voiceGuide ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </footer>
    </div>
  );
}
