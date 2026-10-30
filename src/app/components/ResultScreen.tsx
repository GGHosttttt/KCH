import { useEffect, useState } from "react";
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
} from "lucide-react";
import { motion } from "motion/react";
import apiService from "../../../services/apiService";
import { useCheckupStore } from "../../stores/useCheckupStore";
import voiceGuide from "../../../services/voiceGuide";

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
    bmi_category?: string | null;
    cvd_risk_band: string | null;
    referral_urgency: string | null;
    referral_reasons: string[];
    diagnosis_confirmed: boolean;
    health_recommendation: string | null;
    workout_recommendation: string | null;
    notes: string[];
  };
}

// ── Color & Theme Helpers ──
type LevelTheme = {
  cardBorder: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  boxBg: string;
  boxBorder: string;
  khLabel: string;
  enLabel: string;
};

type CvdTheme = {
  bgClass: string;
  textClass: string;
  borderClass: string;
  khLabel: string;
  enLabel: string;
};

function getCvdTheme(band?: string | null): CvdTheme {
  const b = (band || "<5%").toLowerCase();

  if (b.includes("5_to_10")) {
    return {
      khLabel: "ហានិភ័យស្រាល",
      enLabel: "Mild Risk (5-10%)",
      bgClass: "bg-teal-50",
      textClass: "text-teal-700",
      borderClass: "border-teal-200",
    };
  }
  if (b.includes("10_to_20")) {
    return {
      khLabel: "ហានិភ័យមធ្យម",
      enLabel: "Moderate Risk (10-20%)",
      bgClass: "bg-amber-50",
      textClass: "text-amber-700",
      borderClass: "border-amber-200",
    };
  }
  if (b.includes("20_to_30")) {
    return {
      khLabel: "ហានិភ័យខ្ពស់",
      enLabel: "High Risk (20-30%)",
      bgClass: "bg-orange-50",
      textClass: "text-orange-700",
      borderClass: "border-orange-200",
    };
  }
  if (b.includes(">=30") || b.includes("very_high")) {
    return {
      khLabel: "ហានិភ័យខ្ពស់ខ្លាំង",
      enLabel: "Very High Risk (≥30%)",
      bgClass: "bg-rose-50",
      textClass: "text-rose-700",
      borderClass: "border-rose-200",
    };
  }

  // Default fallback is <5%
  return {
    khLabel: "ហានិភ័យទាប",
    enLabel: "Low Risk (<5%)",
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-200",
  };
}

function getBmiTheme(bmi: number | null, cat?: string | null): LevelTheme {
  const c = (cat || "").toLowerCase();
  const val = bmi ?? 0;

  if (c.includes("under") || (val > 0 && val < 18.5)) {
    return {
      cardBorder: "border-amber-400",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-700",
      badgeBg: "bg-amber-100",
      badgeBorder: "border-amber-400",
      badgeText: "text-amber-900",
      boxBg: "bg-amber-50/70",
      boxBorder: "border-amber-200",
      khLabel: "ស្គម",
      enLabel: "Underweight",
    };
  }
  if (c.includes("over") || (val >= 23 && val < 25)) {
    return {
      cardBorder: "border-amber-400",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-700",
      badgeBg: "bg-amber-100",
      badgeBorder: "border-amber-400",
      badgeText: "text-amber-900",
      boxBg: "bg-amber-50/70",
      boxBorder: "border-amber-200",
      khLabel: "លើសទម្ងន់ស្រាល",
      enLabel: "Overweight",
    };
  }
  if (c.includes("obese") || val >= 25) {
    return {
      cardBorder: "border-rose-400",
      iconBg: "bg-rose-100",
      iconColor: "text-rose-700",
      badgeBg: "bg-rose-100",
      badgeBorder: "border-rose-400",
      badgeText: "text-rose-900",
      boxBg: "bg-rose-50/70",
      boxBorder: "border-rose-200",
      khLabel: "លើសទម្ងន់ខ្លាំង",
      enLabel: "Obese",
    };
  }
  return {
    cardBorder: "border-emerald-400",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
    badgeBg: "bg-emerald-100",
    badgeBorder: "border-emerald-400",
    badgeText: "text-emerald-900",
    boxBg: "bg-emerald-50/70",
    boxBorder: "border-emerald-200",
    khLabel: "ទម្ងន់សមស្រប",
    enLabel: "Normal",
  };
}

function getBpTheme(cat?: string | null): LevelTheme {
  const c = (cat || "").toLowerCase();

  if (c.includes("optimal")) {
    return {
      cardBorder: "border-emerald-400",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700",
      badgeBg: "bg-emerald-100",
      badgeBorder: "border-emerald-400",
      badgeText: "text-emerald-900",
      boxBg: "bg-emerald-50/70",
      boxBorder: "border-emerald-200",
      khLabel: "ល្អឥតខ្ចោះ",
      enLabel: "Optimal",
    };
  }
  if (c.includes("normal")) {
    return {
      cardBorder: "border-teal-400",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-700",
      badgeBg: "bg-teal-100",
      badgeBorder: "border-teal-400",
      badgeText: "text-teal-900",
      boxBg: "bg-teal-50/70",
      boxBorder: "border-teal-200",
      khLabel: "ធម្មតា",
      enLabel: "Normal",
    };
  }
  if (c.includes("pre") || c.includes("elevated") || c.includes("grade 1")) {
    return {
      cardBorder: "border-amber-400",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-700",
      badgeBg: "bg-amber-100",
      badgeBorder: "border-amber-400",
      badgeText: "text-amber-900",
      boxBg: "bg-amber-50/70",
      boxBorder: "border-amber-200",
      khLabel: "ប្រឈមឡើងសម្ពាធ",
      enLabel: "Pre-hypertensive",
    };
  }
  if (
    c.includes("grade 2") ||
    c.includes("grade 3") ||
    c.includes("hypertens") ||
    c.includes("crisis")
  ) {
    return {
      cardBorder: "border-rose-500",
      iconBg: "bg-rose-100",
      iconColor: "text-rose-700",
      badgeBg: "bg-rose-100",
      badgeBorder: "border-rose-400",
      badgeText: "text-rose-900",
      boxBg: "bg-rose-50/70",
      boxBorder: "border-rose-200",
      khLabel: "លើសសម្ពាធឈាម",
      enLabel: "High BP",
    };
  }
  return {
    cardBorder: "border-slate-300",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    badgeBg: "bg-slate-100",
    badgeBorder: "border-slate-300",
    badgeText: "text-slate-800",
    boxBg: "bg-slate-50",
    boxBorder: "border-slate-200",
    khLabel: "បានវាស់រួច",
    enLabel: "Recorded",
  };
}

function getGlucoseTheme(cat?: string | null): LevelTheme {
  const c = (cat || "").toLowerCase();

  if (c.includes("normal")) {
    return {
      cardBorder: "border-emerald-400",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700",
      badgeBg: "bg-emerald-100",
      badgeBorder: "border-emerald-400",
      badgeText: "text-emerald-900",
      boxBg: "bg-emerald-50/70",
      boxBorder: "border-emerald-200",
      khLabel: "ជាតិស្ករធម្មតា",
      enLabel: "Normal Range",
    };
  }
  if (c.includes("impaired") || c.includes("pre")) {
    return {
      cardBorder: "border-amber-400",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-700",
      badgeBg: "bg-amber-100",
      badgeBorder: "border-amber-400",
      badgeText: "text-amber-900",
      boxBg: "bg-amber-50/70",
      boxBorder: "border-amber-200",
      khLabel: "ប្រឈមទឹកនោមផ្អែម",
      enLabel: "Pre-diabetic",
    };
  }
  if (c.includes("diabet") || c.includes("elevated") || c.includes("suspect")) {
    return {
      cardBorder: "border-rose-500",
      iconBg: "bg-rose-100",
      iconColor: "text-rose-700",
      badgeBg: "bg-rose-100",
      badgeBorder: "border-rose-400",
      badgeText: "text-rose-900",
      boxBg: "bg-rose-50/70",
      boxBorder: "border-rose-200",
      khLabel: "ជាតិស្ករខ្ពស់",
      enLabel: "Diabetic / High",
    };
  }
  return {
    cardBorder: "border-slate-300",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    badgeBg: "bg-slate-100",
    badgeBorder: "border-slate-300",
    badgeText: "text-slate-800",
    boxBg: "bg-slate-50",
    boxBorder: "border-slate-200",
    khLabel: "បានវាស់រួច",
    enLabel: "Recorded",
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

        let res: any;

        res = await apiService(
          `/kch-api/api/v1/assessment/records/${recordId}`,
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

  useEffect(() => {
    if (!record) return;

    async function ensureAudioReady() {
      let audioUrl = sessionStorage.getItem("tts_results_audio");

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

          if (audioUrl) {
            voiceGuide.playCustom(audioUrl);
          }
        } catch (err) {
          console.warn("TTS generation error:", err);
        }
      }
    }

    ensureAudioReady();
  }, [record]);

  const handleExit = () => {
    voiceGuide.stop();
    resetCheckup();
    sessionStorage.clear();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-100 flex flex-col items-center justify-center gap-4 text-teal-900 font-['Noto_Sans_Khmer',sans-serif]">
        <Loader2 size={48} className="animate-spin text-teal-600" />
        <h2 className="text-xl font-bold">កំពុងទាញយកលទ្ធផលពិនិត្យសុខភាព...</h2>
        <p className="text-sm text-slate-500">Loading screening report</p>
      </div>
    );
  }

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
      : "Non-invasive PPG";

  const cvdTheme = getCvdTheme(r.cvd_risk_band);
  const bmiTheme = getBmiTheme(r.bmi, r.bmi_category);
  const bpTheme = getBpTheme(r.bp_category);
  const glucoseTheme = getGlucoseTheme(r.glucose_category);

  return (
    <div className="w-full min-h-screen bg-slate-100 font-['Noto_Sans_Khmer',sans-serif] select-none flex flex-col pb-36">
      {/* Header Banner - Responsive padding */}
      <header className="bg-[#073B35] text-white pt-5 pb-6 sm:pb-10 px-4 sm:px-10 shadow-md relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <HeartPulse size={220} />
        </div>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4 relative z-10">
          <div>
            <h1 className="font-['Moul'] text-lg sm:text-2xl md:text-3xl mb-1 text-teal-50 drop-shadow-md">
              លទ្ធផលការពិនិត្យសុខភាពរបស់អ្នក
            </h1>
            <p className="text-xs sm:text-sm text-teal-200 font-medium">
              Your Health Evaluation Summary
            </p>
          </div>
          <div className="flex items-center space-x-2.5 bg-teal-900/80 backdrop-blur px-3.5 py-1.5 rounded-2xl border border-teal-700/50 shadow-inner">
            <UserCircle2 size={24} className="text-teal-300 shrink-0" />
            <div>
              <p className="text-[8px] text-teal-300 font-bold uppercase tracking-wider font-mono">
                លេខសម្គាល់ / RECORD
              </p>
              <p className="font-mono text-xs font-bold tracking-wider text-white">
                {record.id ? record.id.slice(0, 13) + "..." : fallbackPhone}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container - Controlled margins without clipping */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-4 sm:-mt-6 z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {/* Card 1: User Info */}
          <motion.div
            className="bg-white rounded-3xl shadow-lg border-2 border-slate-200 p-5 flex flex-col justify-between"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-teal-50 p-2.5 rounded-2xl text-teal-600 shrink-0 border border-teal-100">
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
                  <span className="text-slate-400 text-[10px]">អាយុ / Age</span>
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
              <div
                className={`w-full border py-2 px-2 rounded-xl text-center font-bold text-xs flex flex-col gap-0.5 ${cvdTheme.bgClass} ${cvdTheme.borderClass} ${cvdTheme.textClass}`}
              >
                <span className="text-[11px] opacity-80">
                  ហានិភ័យបេះដូង និងសរសៃឈាម (CVD):{" "}
                </span>
                <span className="text-sm">{cvdTheme.khLabel}</span>
                <span className="text-[10px] font-normal opacity-85">
                  ({cvdTheme.enLabel})
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Body Composition */}
          <motion.div
            className={`bg-white rounded-3xl shadow-lg border-2 p-5 flex flex-col justify-between transition-all ${bmiTheme.cardBorder}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div
                  className={`p-2.5 rounded-2xl shrink-0 ${bmiTheme.iconBg} ${bmiTheme.iconColor}`}
                >
                  <Scale size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-slate-800">
                    សមាសភាពរាងកាយ
                  </h2>
                  <p className="text-[10px] text-slate-400">Body Composition</p>
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
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {bmiVal}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <div
                className={`w-full border-2 py-2 px-2 rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1.5 ${bmiTheme.badgeBg} ${bmiTheme.badgeBorder} ${bmiTheme.badgeText}`}
              >
                <span>{bmiTheme.khLabel}</span>
                <span className="text-[10px] font-normal opacity-85 font-sans">
                  ({bmiTheme.enLabel})
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Blood Pressure */}
          <motion.div
            className={`bg-white rounded-3xl shadow-lg border-2 p-5 flex flex-col justify-between transition-all ${bpTheme.cardBorder}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div
                  className={`p-2.5 rounded-2xl shrink-0 ${bpTheme.iconBg} ${bpTheme.iconColor}`}
                >
                  <HeartPulse size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-slate-800">
                    សម្ពាធឈាម
                  </h2>
                  <p className="text-[10px] text-slate-400">Blood Pressure</p>
                </div>
              </div>

              <div
                className={`flex flex-col justify-center items-center rounded-2xl border py-3 px-3 ${bpTheme.boxBg} ${bpTheme.boxBorder}`}
              >
                <span className="text-slate-400 text-[10px] mb-0.5">
                  BP Measurement
                </span>
                <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                  {sbp}
                  <span className="text-lg text-slate-400 font-normal">
                    /{dbp}
                  </span>{" "}
                  <span className="text-xs text-slate-500 font-normal">
                    mmHg
                  </span>
                </div>
                <div className="w-full mt-2 pt-2 border-t border-slate-200/80 flex justify-between items-center px-1 text-xs">
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
              <div
                className={`w-full border-2 py-2 px-2 rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1.5 ${bpTheme.badgeBg} ${bpTheme.badgeBorder} ${bpTheme.badgeText}`}
              >
                <span>{bpTheme.khLabel}</span>
                <span className="text-[10px] font-normal opacity-85 font-sans">
                  ({bpTheme.enLabel})
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card 4: Glucose */}
          <motion.div
            className={`bg-white rounded-3xl shadow-lg border-2 p-5 flex flex-col justify-between transition-all ${glucoseTheme.cardBorder}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div
                  className={`p-2.5 rounded-2xl shrink-0 ${glucoseTheme.iconBg} ${glucoseTheme.iconColor}`}
                >
                  <Droplet size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-slate-800">
                    ជាតិស្ករក្នុងឈាម
                  </h2>
                  <p className="text-[10px] text-slate-400">Blood Glucose</p>
                </div>
              </div>

              <div
                className={`flex flex-col justify-center items-center rounded-2xl border py-3 px-2 text-center ${glucoseTheme.boxBg} ${glucoseTheme.boxBorder}`}
              >
                <div className="w-8 h-8 mb-1 bg-white shadow-sm rounded-full border border-teal-200 flex items-center justify-center text-teal-600">
                  <Droplet size={16} className="fill-teal-50" />
                </div>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {glucoseVal ? `${glucoseVal} mg/dL` : "មិនបានវាស់"}
                </span>
                <p className="text-slate-400 text-[10px] mt-0.5">
                  {glucoseType}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div
                className={`w-full border-2 py-2 px-2 rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1.5 ${glucoseTheme.badgeBg} ${glucoseTheme.badgeBorder} ${glucoseTheme.badgeText}`}
              >
                <span>{glucoseTheme.khLabel}</span>
                <span className="text-[10px] font-normal opacity-85 font-sans">
                  ({glucoseTheme.enLabel})
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          className="bg-white rounded-3xl shadow-md border border-slate-200 p-3.5 sm:p-4 mt-5"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() =>
                navigate(`/receipt?record_id=${record.id}`, {
                  state: { record },
                })
              }
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
  );
}
