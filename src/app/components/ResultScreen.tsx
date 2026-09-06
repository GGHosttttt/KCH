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
  Activity,
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

  const recordId = searchParams.get("record_id");
  const resetCheckup = useCheckupStore((s) => s.resetCheckup);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<ScreeningRecordDetail | null>(null);

  // Fallback demographic metadata from session/store if not returned in joined record
  const fallbackName =
    sessionStorage.getItem("userName") || "អ្នកជំងឺ (Patient)";
  const fallbackPhone = sessionStorage.getItem("userPhone") || "---";

  useEffect(() => {
    async function fetchRecord() {
      if (!recordId) {
        // Check if there is cached data in sessionStorage as a secondary fallback
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

        // Call the API endpoint
        const res = await apiService(
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

  const handleExit = () => {
    resetCheckup();
    sessionStorage.clear();
    navigate("/");
  };

  // Loading State
  if (loading) {
    return (
      <div className="h-full w-full bg-slate-100 flex flex-col items-center justify-center gap-4 text-teal-900 font-['Noto_Sans_Khmer',sans-serif]">
        <Loader2 size={48} className="animate-spin text-teal-600" />
        <h2 className="text-xl font-bold">កំពុងទាញយកលទ្ធផលពិនិត្យសុខភាព...</h2>
        <p className="text-sm text-slate-500">Loading screening report</p>
      </div>
    );
  }

  // Error State
  if (error || !record) {
    return (
      <div className="h-full w-full bg-slate-100 flex flex-col items-center justify-center p-6 text-center font-['Noto_Sans_Khmer',sans-serif]">
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

  // Extract Parsed Fields
  const v = record.vitals || {};
  const r = record.result || {};

  const genderLabel =
    record.gender === "male"
      ? "ប្រុស (Male)"
      : record.gender === "female"
        ? "ស្រី (Female)"
        : "---";

  const height = v.height_cm ? `${v.height_cm} cm` : "--";
  const weight = v.weight_kg ? `${v.weight_kg} kg` : "--";
  const bmiVal =
    r.bmi ??
    (v.height_cm && v.weight_kg
      ? +(v.weight_kg / (v.height_cm / 100) ** 2).toFixed(1)
      : "--");

  const sbp = v.systolic_mmhg ?? "--";
  const dbp = v.diastolic_mmhg ?? "--";
  const pulse = v.pulse_bpm ?? v.heart_rate_bpm ?? "--";

  const glucoseVal = v.fpg_mgdl ?? v.rpg_mgdl;
  const glucoseType = v.fpg_mgdl
    ? "Fasting (FPG)"
    : v.rpg_mgdl
      ? "Random (RPG)"
      : "";

  // Dynamic Helper Badges
  const getBmiBadge = () => {
    const num = Number(bmiVal);
    if (isNaN(num))
      return {
        text: "មិនបានវាស់",
        color: "bg-slate-100 text-slate-600 border-slate-200",
      };
    if (num < 18.5)
      return {
        text: "ស្គម (Underweight)",
        color: "bg-amber-50 text-amber-700 border-amber-200",
      };
    if (num <= 22.9)
      return {
        text: "ធម្មតា (Normal)",
        color: "bg-green-50 text-green-700 border-green-200",
      };
    if (num <= 24.9)
      return {
        text: "លើសទម្ងន់ (Overweight)",
        color: "bg-amber-50 text-amber-700 border-amber-200",
      };
    return {
      text: "ធាត់ (Obese)",
      color: "bg-red-50 text-red-700 border-red-200",
    };
  };

  const getBpBadge = () => {
    const cat = r.bp_category || "";
    if (
      cat.toLowerCase().includes("normal") ||
      cat.toLowerCase().includes("optimal")
    ) {
      return {
        text: "ធម្មតា (Normal)",
        color: "bg-green-50 text-green-700 border-green-200",
      };
    }
    if (
      cat.toLowerCase().includes("pre") ||
      cat.toLowerCase().includes("elevated") ||
      cat.toLowerCase().includes("grade 1")
    ) {
      return {
        text: "ប្រឈម / កម្រិត១ (Elevated / Gr 1)",
        color: "bg-amber-50 text-amber-700 border-amber-200",
      };
    }
    if (cat) {
      return {
        text: "លើសសម្ពាធឈាម (Hypertension)",
        color: "bg-rose-50 text-rose-700 border-rose-200",
      };
    }
    return {
      text: "បានវាស់",
      color: "bg-teal-50 text-teal-700 border-teal-200",
    };
  };

  const getGlucoseBadge = () => {
    const cat = r.glucose_category || "";
    if (cat.toLowerCase().includes("normal")) {
      return {
        text: "ធម្មតា (Normal)",
        color: "bg-green-50 text-green-700 border-green-200",
      };
    }
    if (
      cat.toLowerCase().includes("impaired") ||
      cat.toLowerCase().includes("pre")
    ) {
      return {
        text: "ប្រឈមទឹកនោមផ្អែម (Pre-diabetic)",
        color: "bg-amber-50 text-amber-700 border-amber-200",
      };
    }
    if (
      cat.toLowerCase().includes("diabetes") ||
      cat.toLowerCase().includes("suspected")
    ) {
      return {
        text: "កម្រិតខ្ពស់ (Elevated / Diabetic)",
        color: "bg-rose-50 text-rose-700 border-rose-200",
      };
    }
    return {
      text: "បានវាស់",
      color: "bg-teal-50 text-teal-700 border-teal-200",
    };
  };

  const bmiBadge = getBmiBadge();
  const bpBadge = getBpBadge();
  const glucoseBadge = getGlucoseBadge();

  return (
    <div className="flex flex-col h-full bg-slate-100 relative font-['Noto_Sans_Khmer',sans-serif]">
      {/* Header Banner */}
      <div className="bg-[#073B35] text-white pt-6 pb-10 px-8 shadow-md relative z-0 overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <HeartPulse size={220} />
        </div>
        <div className="flex justify-between items-end relative z-10">
          <div>
            <h1 className="font-['Moul'] text-2xl mb-1 text-teal-50 drop-shadow-md">
              លទ្ធផលការពិនិត្យសុខភាពរបស់អ្នក
            </h1>
            <p className="text-sm text-teal-200 font-medium">
              Your Health Evaluation Summary
            </p>
          </div>
          <div className="flex items-center space-x-3 bg-teal-900/60 backdrop-blur px-5 py-2.5 rounded-2xl border border-teal-700/50">
            <UserCircle2 size={32} className="text-teal-300" />
            <div>
              <p className="text-[10px] text-teal-300 font-bold uppercase tracking-wider">
                លេខសម្គាល់ / Record
              </p>
              <p className="font-mono text-xs font-bold tracking-wider text-white">
                {record.id ? record.id.slice(0, 13) + "..." : userPhone}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 px-6 -mt-5 z-10 pb-6 flex flex-col gap-4 overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1 min-h-0">
          {/* Card 1: User Info */}
          <motion.div
            className="bg-white rounded-3xl shadow-md border border-slate-200 p-5 flex flex-col relative overflow-hidden"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-teal-50 p-3 rounded-2xl text-teal-600">
                <UserCircle2 size={26} />
              </div>
              <h2 className="font-bold text-base text-slate-800">
                ព័ត៌មានអ្នកជំងឺ
                <br />
                <span className="text-xs text-slate-400 font-normal">
                  Patient Info
                </span>
              </h2>
            </div>
            <div className="space-y-3 flex-1 text-xs">
              <div className="flex flex-col border-b border-slate-100 pb-2">
                <span className="text-slate-400">ឈ្មោះ / Name</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5">
                  {fallbackName}
                </span>
              </div>
              <div className="flex flex-col border-b border-slate-100 pb-2">
                <span className="text-slate-400">ភេទ / Gender</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5">
                  {genderLabel}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400">អាយុ / Age</span>
                <span className="font-bold text-slate-800 text-base mt-0.5">
                  {record.age || "--"}{" "}
                  <span className="text-slate-400 text-xs font-normal">
                    ឆ្នាំ (yrs)
                  </span>
                </span>
              </div>
            </div>
            {r.cvd_risk_band && (
              <div className="mt-3 bg-teal-50 border border-teal-200 text-teal-800 py-1.5 px-2 rounded-xl text-center font-bold text-xs">
                CVD Risk: {r.cvd_risk_band}
              </div>
            )}
          </motion.div>

          {/* Card 2: Body Composition */}
          <motion.div
            className="bg-white rounded-3xl shadow-md border border-slate-200 p-5 flex flex-col relative overflow-hidden"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                <Scale size={26} />
              </div>
              <h2 className="font-bold text-base text-slate-800">
                សមាសភាពរាងកាយ
                <br />
                <span className="text-xs text-slate-400 font-normal">
                  Body Composition
                </span>
              </h2>
            </div>
            <div className="space-y-3 flex-1 text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500">កម្ពស់ (Height)</span>
                <span className="text-sm font-bold text-slate-800 font-mono">
                  {height}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500">ទម្ងន់ (Weight)</span>
                <span className="text-sm font-bold text-slate-800 font-mono">
                  {weight}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500">BMI</span>
                <span className="text-lg font-bold text-slate-800 font-mono">
                  {bmiVal}
                </span>
              </div>
            </div>
            <div
              className={`mt-3 border py-2 rounded-xl text-center font-bold text-xs flex items-center justify-center space-x-2 ${bmiBadge.color}`}
            >
              <span>{bmiBadge.text}</span>
            </div>
          </motion.div>

          {/* Card 3: Blood Pressure */}
          <motion.div
            className="bg-white rounded-3xl shadow-md border border-slate-200 p-5 flex flex-col relative overflow-hidden"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-rose-50 p-3 rounded-2xl text-rose-600">
                <HeartPulse size={26} />
              </div>
              <h2 className="font-bold text-base text-slate-800">
                សម្ពាធឈាម
                <br />
                <span className="text-xs text-slate-400 font-normal">
                  Blood Pressure
                </span>
              </h2>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center bg-slate-50 rounded-2xl border border-slate-100 py-3 px-3">
              <span className="text-slate-400 text-[11px] mb-0.5">
                BP Measurement
              </span>
              <span className="text-2xl font-bold text-slate-800 tracking-tight font-mono">
                {sbp}
                <span className="text-lg text-slate-400 font-normal">
                  /{dbp}
                </span>{" "}
                <span className="text-xs text-slate-500 font-normal">mmHg</span>
              </span>
              <div className="w-full mt-2 pt-2 border-t border-slate-200/60 flex justify-between items-center px-1 text-xs">
                <span className="text-slate-400">ចង្វាក់បេះដូង</span>
                <span className="font-bold text-rose-600 font-mono">
                  {pulse} bpm
                </span>
              </div>
            </div>
            <div
              className={`mt-3 border py-2 rounded-xl text-center font-bold text-xs flex items-center justify-center space-x-2 ${bpBadge.color}`}
            >
              <span>{bpBadge.text}</span>
            </div>
          </motion.div>

          {/* Card 4: Glucose */}
          <motion.div
            className="bg-white rounded-3xl shadow-md border border-slate-200 p-5 flex flex-col relative overflow-hidden"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-teal-50 p-3 rounded-2xl text-[#00A884]">
                <Droplet size={26} />
              </div>
              <h2 className="font-bold text-base text-slate-800">
                ជាតិស្ករក្នុងឈាម
                <br />
                <span className="text-xs text-slate-400 font-normal">
                  Blood Glucose
                </span>
              </h2>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center bg-slate-50 rounded-2xl border border-slate-100 py-3 px-2">
              <div className="w-10 h-10 mb-1.5 bg-white shadow-sm rounded-full border-2 border-teal-400 flex items-center justify-center text-teal-600">
                <Droplet size={20} className="fill-teal-50" />
              </div>
              <span className="text-xl font-bold text-slate-800 font-mono">
                {glucoseVal ? `${glucoseVal} mg/dL` : "មិនបានវាស់"}
              </span>
              <p className="text-slate-400 text-[10px] mt-0.5 text-center">
                {glucoseType || "Finger-stick / Optical Sensor"}
              </p>
            </div>
            <div
              className={`mt-3 border py-2 rounded-xl text-center font-bold text-xs flex items-center justify-center space-x-2 ${glucoseBadge.color}`}
            >
              <span>{glucoseBadge.text}</span>
            </div>
          </motion.div>
        </div>

        {/* Action Controls */}
        <motion.div
          className="bg-white rounded-3xl shadow-md border border-slate-200 p-4 shrink-0"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex space-x-4">
            <button
              onClick={() => navigate(`/receipt?record_id=${record.id}`)}
              className="flex-1 bg-[#00A884] hover:bg-[#008f70] text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center space-x-3 shadow-md transition-all active:scale-[0.98]"
            >
              <Eye size={22} />
              <span>មើលក្រដាសលទ្ធផល (Preview Receipt)</span>
            </button>
            <button
              onClick={handleExit}
              className="w-1/3 bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center space-x-2 shadow-md transition-all active:scale-[0.98]"
            >
              <LogOut size={22} />
              <span>បញ្ចប់ (Exit)</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
