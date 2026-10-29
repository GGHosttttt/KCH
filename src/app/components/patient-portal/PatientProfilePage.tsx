import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  HeartPulse,
  Scale,
  Droplet,
  User,
  LogOut,
  Calendar,
  ChevronRight,
  Printer,
  Volume2,
  VolumeX,
  Activity,
  AlertCircle,
  Brain,
  Sparkles,
  TrendingUp,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";
import apiService from "../../../../services/apiService";
import logo from "../../../../src/assets/KCH-white-logo.png";

interface VitalMetrics {
  height_cm: number | null;
  weight_kg: number | null;
  systolic_mmhg: number | null;
  diastolic_mmhg: number | null;
  pulse_bpm: number | null;
  heart_rate_bpm: number | null;
  spo2_percent: number | null;
  fpg_mgdl: number | null;
  rpg_mgdl: number | null;
}

interface ClinicalResult {
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
}

interface ScreeningItem {
  id: string;
  user_id: string;
  kiosk_id: string;
  session_id: string | null;
  status: string;
  patient_name: string;
  age: number;
  gender: string;
  created_at: string;
  updated_at: string;
  vitals: VitalMetrics | null;
  result: ClinicalResult | null;
}

function getKhmerBpLabel(cat?: string | null) {
  const c = (cat || "").toLowerCase();
  if (c.includes("optimal"))
    return {
      kh: "ល្អឥតខ្ចោះ",
      en: "Optimal",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    };
  if (c.includes("normal"))
    return {
      kh: "ធម្មតា",
      en: "Normal",
      color: "text-teal-700 bg-teal-50 border-teal-200",
    };
  if (c.includes("pre") || c.includes("elevated") || c.includes("grade 1")) {
    return {
      kh: "ប្រឈមឡើងសម្ពាធ",
      en: "Pre-hypertensive",
      color: "text-amber-800 bg-amber-50 border-amber-300",
    };
  }
  if (
    c.includes("grade 2") ||
    c.includes("grade 3") ||
    c.includes("hypertens") ||
    c.includes("crisis")
  ) {
    return {
      kh: "លើសសម្ពាធឈាម",
      en: "High BP",
      color: "text-rose-800 bg-rose-50 border-rose-300",
    };
  }
  return {
    kh: "បានវាស់រួច",
    en: "Recorded",
    color: "text-slate-700 bg-slate-50 border-slate-200",
  };
}

function getKhmerGlucoseLabel(cat?: string | null) {
  const c = (cat || "").toLowerCase();
  if (c.includes("normal"))
    return {
      kh: "ជាតិស្ករធម្មតា",
      en: "Normal",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    };
  if (c.includes("impaired") || c.includes("pre"))
    return {
      kh: "ប្រឈមទឹកនោមផ្អែម",
      en: "Pre-diabetic",
      color: "text-amber-800 bg-amber-50 border-amber-300",
    };
  if (c.includes("diabet") || c.includes("elevated") || c.includes("suspect")) {
    return {
      kh: "ជាតិស្ករខ្ពស់",
      en: "Diabetic / High",
      color: "text-rose-800 bg-rose-50 border-rose-300",
    };
  }
  return {
    kh: "បានវាស់រួច",
    en: "Recorded",
    color: "text-slate-700 bg-slate-50 border-slate-200",
  };
}

function getKhmerBmiLabel(bmi: number | null, cat?: string | null) {
  const c = (cat || "").toLowerCase();
  const val = bmi ?? 0;
  if (c.includes("under") || (val > 0 && val < 18.5))
    return {
      kh: "ស្គម",
      en: "Underweight",
      color: "text-amber-800 bg-amber-50 border-amber-300",
    };
  if (c.includes("over") || (val >= 23 && val < 25))
    return {
      kh: "លើសទម្ងន់ស្រាល",
      en: "Overweight",
      color: "text-amber-800 bg-amber-50 border-amber-300",
    };
  if (c.includes("obese") || val >= 25)
    return {
      kh: "លើសទម្ងន់ខ្លាំង",
      en: "Obese",
      color: "text-rose-800 bg-rose-50 border-rose-300",
    };
  return {
    kh: "ទម្ងន់សមស្រប",
    en: "Normal",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
  };
}

export default function PatientProfilePage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyRecords, setHistoryRecords] = useState<ScreeningItem[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ScreeningItem | null>(
    null,
  );
  const [voiceGuide, setVoiceGuide] = useState(true);
  const [activeMetricTab, setActiveMetricTab] = useState<
    "bp" | "bmi" | "glucose"
  >("bp");

  useEffect(() => {
    async function fetchPortalData() {
      try {
        setLoading(true);
        setError(null);

        let res: any;

        res = await apiService(
          "/kch-api/api/v1/assessment/me?page=1&page_size=10",
          "GET",
        );

        const body = res?.data || res;
        let items: ScreeningItem[] = [];
        if (body && Array.isArray(body.items)) {
          items = body.items;
        } else if (Array.isArray(body)) {
          items = body;
        } else if (body && body.id) {
          items = [body];
        }

        if (items.length === 0) {
          throw new Error(
            "មិនទាន់មានកំណត់ត្រាពិនិត្យសុខភាពនៅឡើយទេ (No records found)",
          );
        }

        setHistoryRecords(items);
        setSelectedRecord(items[0]);
      } catch (err: any) {
        console.error("Portal fetch error:", err);
        setError(err?.message || "បរាជ័យក្នុងការទាញយកកំណត់ត្រាសុខភាព");
      } finally {
        setLoading(false);
      }
    }

    fetchPortalData();
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem("access_token");
    navigate("/auth");
  };

  // Trend analysis calculation (chronological order for the chart)
  const chronologicalHistory = useMemo(() => {
    return [...historyRecords].reverse();
  }, [historyRecords]);

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#073B35] flex flex-col items-center justify-center p-6 text-white font-['Noto_Sans_Khmer',sans-serif] relative overflow-hidden select-none">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00A884] rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[140px]" />
        </div>

        <div className="relative flex items-center justify-center mb-8 z-10 w-44 h-44">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-2 border-dashed border-[#00A884]/40 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            className="absolute inset-3 border border-teal-300/30 rounded-full"
          />
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#00A884] to-emerald-400 flex items-center justify-center shadow-[0_0_40px_rgba(0,168,132,0.5)] z-20">
            <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg overflow-hidden bg-white/10 backdrop-blur-sm">
              <img
                src={logo}
                alt="Logo"
                className="w-full h-full object-contain p-2"
              />
            </div>
          </div>
        </div>

        <div className="z-10 text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full border border-white/15 text-xs text-teal-200 font-mono tracking-wider uppercase mb-2">
            <Brain size={15} className="animate-spin text-[#00A884]" />
            <span>KCH Health Cloud Sync</span>
          </div>
          <h2 className="font-['Moul'] text-xl sm:text-2xl text-teal-50 drop-shadow-md">
            កំពុងទាញយកទិន្នន័យសុខភាព...
          </h2>
          <p className="text-xs sm:text-sm text-teal-200/80 font-light">
            Loading longitudinal history and health trends
          </p>
        </div>
      </div>
    );
  }

  if (error || !selectedRecord) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#073B35] flex flex-col items-center justify-center p-6 text-center font-['Noto_Sans_Khmer',sans-serif]">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border border-red-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200">
            <AlertCircle size={36} />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">
            មិនមានទិន្នន័យកំណត់ត្រា
          </h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">{error}</p>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-[#00A884] hover:bg-[#008f70] text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-95"
            >
              ព្យាយាមម្តងទៀត (Retry)
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all"
            >
              ត្រឡប់ទៅទំព័រដើម (Go Home)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const v = selectedRecord.vitals || ({} as VitalMetrics);
  const r = selectedRecord.result || ({} as ClinicalResult);

  const patientName =
    selectedRecord.patient_name ||
    sessionStorage.getItem("userName") ||
    "អ្នកជំងឺ";
  const patientPhone = sessionStorage.getItem("userPhone") || "011 111 111";
  const genderKhmer =
    selectedRecord.gender === "male" ? "ប្រុស (Male)" : "ស្រី (Female)";

  const lastVisitDate = new Date(selectedRecord.created_at).toLocaleDateString(
    "km-KH",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );

  const bpStatus = getKhmerBpLabel(r.bp_category);
  const glucoseStatus = getKhmerGlucoseLabel(r.glucose_category);
  const bmiStatus = getKhmerBmiLabel(r.bmi, r.bmi_category);

  // SVG Chart helpers
  const svgWidth = 560;
  const svgHeight = 170;
  const chartPad = 30;

  const chartData = chronologicalHistory.map((item, idx) => {
    const x =
      chartPad +
      (idx * (svgWidth - chartPad * 2)) /
        Math.max(1, chronologicalHistory.length - 1);
    const sbp = item.vitals?.systolic_mmhg ?? 120;
    const dbp = item.vitals?.diastolic_mmhg ?? 80;
    const bmiVal =
      item.result?.bmi ??
      (item.vitals?.weight_kg && item.vitals?.height_cm
        ? item.vitals.weight_kg / (item.vitals.height_cm / 100) ** 2
        : 22);
    const gluVal = item.vitals?.fpg_mgdl ?? item.vitals?.rpg_mgdl ?? 90;

    return {
      x,
      date: new Date(item.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      }),
      sbp,
      dbp,
      bmi: Number(bmiVal.toFixed(1)),
      glu: gluVal,
    };
  });

  // Calculate coordinates for SVG paths
  const getPoints = (
    key: "sbp" | "dbp" | "bmi" | "glu",
    min: number,
    max: number,
  ) => {
    return chartData
      .map((d) => {
        const val = d[key];
        const y =
          svgHeight -
          chartPad -
          ((val - min) / Math.max(1, max - min)) * (svgHeight - chartPad * 2);
        return `${d.x},${y}`;
      })
      .join(" ");
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#073B35] text-slate-800 font-['Noto_Sans_Khmer',sans-serif] select-none flex flex-col justify-between p-3 sm:p-6 pb-28">
      <div className="w-full max-w-7xl mx-auto flex flex-col flex-1">
        {/* 1. Header with Kiosk Logo & Patient Capsule */}
        <header className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-2 mb-4 shrink-0 border-b border-teal-700/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#00A884] flex items-center justify-center shadow-lg border border-teal-300/30 shrink-0 overflow-hidden">
              <img
                src={logo}
                alt="KCH"
                className="w-full h-full object-contain p-1.5"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-['Moul'] text-lg sm:text-xl text-white tracking-wide drop-shadow-sm">
                  ទូរសុខភាពសហគមន៍ខ្មែរ
                </h1>
                <span className="bg-[#00A884] text-white text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  PORTAL
                </span>
              </div>
              <p className="text-[11px] text-teal-200 font-medium">
                ប្រវត្តិ និងនិន្នាការសុខភាពផ្ទាល់ខ្លួន (Patient Health
                Dashboard)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 bg-teal-900/80 backdrop-blur border border-teal-600/40 px-3.5 py-1.5 rounded-2xl text-xs text-white shadow-sm">
              <User size={15} className="text-[#00A884]" />
              <span className="font-bold">{patientName}</span>
              <span className="text-teal-300/80 font-mono text-[11px]">
                ({patientPhone})
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-rose-600/80 hover:bg-rose-700 active:scale-95 transition-all text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm border border-rose-400/40"
            >
              <LogOut size={14} />
              <span>ចាកចេញ</span>
            </button>
          </div>
        </header>

        {/* 2. KPI Summary Strip (Visits & Risk Overview) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-white/10 backdrop-blur border border-white/15 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00A884]/20 border border-[#00A884]/30 flex items-center justify-center text-[#00A884] shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[10px] text-teal-200 uppercase font-sans">
                ការពិនិត្យសរុប (Visits)
              </p>
              <p className="text-lg font-bold text-white font-mono">
                {historyRecords.length} លើក
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur border border-white/15 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-400/20 border border-teal-300/30 flex items-center justify-center text-teal-300 shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] text-teal-200 uppercase font-sans">
                ពិនិត្យចុងក្រោយ (Last Visit)
              </p>
              <p className="text-xs font-bold text-white font-mono mt-0.5">
                {lastVisitDate}
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur border border-white/15 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-400/20 border border-emerald-300/30 flex items-center justify-center text-emerald-300 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-[10px] text-teal-200 uppercase font-sans">
                ហានិភ័យបេះដូង (10Y CVD)
              </p>
              <p className="text-sm font-bold text-emerald-300 font-mono">
                {r.cvd_risk_band || "<5%"}
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur border border-white/15 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-400/20 border border-rose-300/30 flex items-center justify-center text-rose-300 shrink-0">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-[10px] text-teal-200 uppercase font-sans">
                ស្ថានភាពបច្ចុប្បន្ន (BP Status)
              </p>
              <p className="text-xs font-bold text-teal-100 truncate">
                {bpStatus.kh}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Longitudinal Vital Trends Graph Strip */}
        <section className="bg-white rounded-3xl p-5 shadow-lg border border-slate-200 mb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-[#00A884]" />
              <div>
                <h3 className="font-bold text-sm text-slate-800 font-sans">
                  និន្នាការតាមដានសុខភាព (Health Metric Trends)
                </h3>
                <p className="text-[10px] text-slate-400 font-sans">
                  ប្រៀបធៀបទិន្នន័យនៃការវាស់វែងពីមុន និងបច្ចុប្បន្ន
                </p>
              </div>
            </div>

            {/* Metric Switcher Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveMetricTab("bp")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeMetricTab === "bp"
                    ? "bg-white text-rose-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                BP (សម្ពាធឈាម)
              </button>
              <button
                onClick={() => setActiveMetricTab("bmi")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeMetricTab === "bmi"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                BMI (ទម្ងន់/កម្ពស់)
              </button>
              <button
                onClick={() => setActiveMetricTab("glucose")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeMetricTab === "glucose"
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Glucose (ជាតិស្ករ)
              </button>
            </div>
          </div>

          {/* SVG Trend Graph */}
          <div className="w-full overflow-x-auto">
            <div className="min-w-[560px] h-[190px] relative">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full overflow-visible"
              >
                {/* Grid guidelines */}
                <line
                  x1={chartPad}
                  y1={chartPad}
                  x2={svgWidth - chartPad}
                  y2={chartPad}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <line
                  x1={chartPad}
                  y1={svgHeight / 2}
                  x2={svgWidth - chartPad}
                  y2={svgHeight / 2}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <line
                  x1={chartPad}
                  y1={svgHeight - chartPad}
                  x2={svgWidth - chartPad}
                  y2={svgHeight - chartPad}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />

                {/* Graph Lines & Dots based on Active Tab */}
                {activeMetricTab === "bp" && (
                  <>
                    <polyline
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={getPoints("sbp", 60, 180)}
                    />
                    <polyline
                      fill="none"
                      stroke="#F97316"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={getPoints("dbp", 40, 120)}
                    />
                    {chartData.map((d, i) => {
                      const ySbp =
                        svgHeight -
                        chartPad -
                        ((d.sbp - 60) / 120) * (svgHeight - chartPad * 2);
                      const yDbp =
                        svgHeight -
                        chartPad -
                        ((d.dbp - 40) / 80) * (svgHeight - chartPad * 2);
                      return (
                        <g key={i}>
                          <circle cx={d.x} cy={ySbp} r="4" fill="#EF4444" />
                          <circle cx={d.x} cy={yDbp} r="3.5" fill="#F97316" />
                          <text
                            x={d.x}
                            y={ySbp - 8}
                            fontSize="9"
                            fontWeight="bold"
                            fill="#B91C1C"
                            textAnchor="middle"
                            fontFamily="monospace"
                          >
                            {d.sbp}
                          </text>
                          <text
                            x={d.x}
                            y={svgHeight - 12}
                            fontSize="9"
                            fill="#94A3B8"
                            textAnchor="middle"
                          >
                            {d.date}
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}

                {activeMetricTab === "bmi" && (
                  <>
                    <polyline
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={getPoints("bmi", 14, 32)}
                    />
                    {chartData.map((d, i) => {
                      const y =
                        svgHeight -
                        chartPad -
                        ((d.bmi - 14) / 18) * (svgHeight - chartPad * 2);
                      return (
                        <g key={i}>
                          <circle cx={d.x} cy={y} r="4.5" fill="#2563EB" />
                          <text
                            x={d.x}
                            y={y - 8}
                            fontSize="9"
                            fontWeight="bold"
                            fill="#1D4ED8"
                            textAnchor="middle"
                            fontFamily="monospace"
                          >
                            {d.bmi}
                          </text>
                          <text
                            x={d.x}
                            y={svgHeight - 12}
                            fontSize="9"
                            fill="#94A3B8"
                            textAnchor="middle"
                          >
                            {d.date}
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}

                {activeMetricTab === "glucose" && (
                  <>
                    <polyline
                      fill="none"
                      stroke="#00A884"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={getPoints("glu", 60, 220)}
                    />
                    {chartData.map((d, i) => {
                      const y =
                        svgHeight -
                        chartPad -
                        ((d.glu - 60) / 160) * (svgHeight - chartPad * 2);
                      return (
                        <g key={i}>
                          <circle cx={d.x} cy={y} r="4.5" fill="#00A884" />
                          <text
                            x={d.x}
                            y={y - 8}
                            fontSize="9"
                            fontWeight="bold"
                            fill="#047857"
                            textAnchor="middle"
                            fontFamily="monospace"
                          >
                            {d.glu}
                          </text>
                          <text
                            x={d.x}
                            y={svgHeight - 12}
                            fontSize="9"
                            fill="#94A3B8"
                            textAnchor="middle"
                          >
                            {d.date}
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}
              </svg>
            </div>
          </div>
        </section>

        {/* 4. Top Metric Cards Row (4-Card Structure) */}
        <section className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {/* Card 1: Patient Info */}
          <div className="bg-white rounded-3xl p-5 shadow-lg border-2 border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shrink-0">
                  <User size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    ព័ត៌មានអ្នកជំងឺ
                  </h3>
                  <p className="text-[10px] text-slate-400 font-sans">
                    Patient Info
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="border-b border-slate-100 pb-1.5">
                  <p className="text-slate-400 text-[10px]">ឈ្មោះ / Name</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    {patientName}
                  </p>
                </div>
                <div className="border-b border-slate-100 pb-1.5">
                  <p className="text-slate-400 text-[10px]">ភេទ / Gender</p>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">
                    {genderKhmer}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <div>
                    <p className="text-slate-400 text-[10px]">អាយុ / Age</p>
                    <p className="font-bold text-slate-800 text-xs mt-0.5">
                      {selectedRecord.age} ឆ្នាំ
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] text-right">
                      លេខកូដ
                    </p>
                    <p className="font-bold text-teal-700 font-mono text-xs text-right">
                      {selectedRecord.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-slate-100">
              <div className="w-full bg-teal-50 border border-teal-200 text-teal-900 py-1.5 px-2 rounded-xl text-center font-bold text-xs font-mono">
                CVD Risk: {r.cvd_risk_band || "<5%"}
              </div>
            </div>
          </div>

          {/* Card 2: Body Composition */}
          <div className="bg-white rounded-3xl p-5 shadow-lg border-2 border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                  <Scale size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    សមាសភាពរាងកាយ
                  </h3>
                  <p className="text-[10px] text-slate-400 font-sans">
                    Body Composition
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 font-mono">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-sans">
                    កម្ពស់ (Height)
                  </span>
                  <span className="font-bold text-slate-900 text-xs">
                    {v.height_cm ?? "--"} cm
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-sans">
                    ទម្ងន់ (Weight)
                  </span>
                  <span className="font-bold text-slate-900 text-xs">
                    {v.weight_kg ?? "--"} kg
                  </span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-slate-500 font-sans font-bold">
                    BMI
                  </span>
                  <span className="font-bold text-slate-900 text-base">
                    {r.bmi ? r.bmi.toFixed(1) : "--"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-slate-100">
              <div
                className={`w-full py-1.5 px-2 border rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1 ${bmiStatus.color}`}
              >
                <span>{bmiStatus.kh}</span>
                <span className="text-[10px] font-normal opacity-80 font-sans">
                  ({bmiStatus.en})
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Blood Pressure */}
          <div className="bg-white rounded-3xl p-5 shadow-lg border-2 border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
                  <HeartPulse size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    សម្ពាធឈាម
                  </h3>
                  <p className="text-[10px] text-slate-400 font-sans">
                    Blood Pressure
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-100 py-3 px-3 flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-400 font-sans mb-0.5">
                  BP Measurement
                </span>
                <div className="text-xl font-bold font-mono text-slate-900 tracking-tight">
                  {v.systolic_mmhg ?? "--"}
                  <span className="text-slate-400 font-normal">
                    /{v.diastolic_mmhg ?? "--"}
                  </span>{" "}
                  <span className="text-[11px] font-normal text-slate-400">
                    mmHg
                  </span>
                </div>
                <div className="w-full flex justify-between items-center text-[10px] font-mono text-slate-500 border-t border-slate-200/60 mt-2 pt-1.5 px-1">
                  <span className="font-sans text-slate-400">
                    ចង្វាក់បេះដូង
                  </span>
                  <span className="font-bold text-rose-600">
                    {v.pulse_bpm ?? v.heart_rate_bpm ?? "--"} bpm
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div
                className={`w-full py-1.5 px-2 border rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1 ${bpStatus.color}`}
              >
                <span>{bpStatus.kh}</span>
                <span className="text-[10px] font-normal opacity-80 font-sans">
                  ({bpStatus.en})
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Blood Glucose */}
          <div className="bg-white rounded-3xl p-5 shadow-lg border-2 border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#00A884] flex items-center justify-center border border-teal-100 shrink-0">
                  <Droplet size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    ជាតិស្ករក្នុងឈាម
                  </h3>
                  <p className="text-[10px] text-slate-400 font-sans">
                    Blood Glucose
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-100 py-3 px-3 flex flex-col items-center justify-center text-center">
                <div className="w-7 h-7 rounded-full bg-white border border-teal-200 flex items-center justify-center text-[#00A884] mb-1 shadow-sm">
                  <Droplet size={14} className="fill-teal-50" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900">
                  {v.fpg_mgdl ?? v.rpg_mgdl ?? "--"}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    mg/dL
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 mt-0.5">
                  {v.fpg_mgdl
                    ? "Fasting (FPG)"
                    : v.rpg_mgdl
                      ? "Random (RPG)"
                      : "Sensor Reading"}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div
                className={`w-full py-1.5 px-2 border rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1 ${glucoseStatus.color}`}
              >
                <span>{glucoseStatus.kh}</span>
                <span className="text-[10px] font-normal opacity-80 font-sans">
                  ({glucoseStatus.en})
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Main Body: History Log & Clinical Protocol Recommendations */}
        <main className="w-full flex flex-col lg:grid lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: History Records List */}
          <div className="w-full lg:col-span-4 bg-white rounded-3xl p-5 shadow-lg border border-slate-200 flex flex-col">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h2 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Calendar size={14} className="text-[#00A884]" />
                <span>ប្រវត្តិពិនិត្យកន្លងមក (HISTORY)</span>
              </h2>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                {historyRecords.length} records
              </span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {historyRecords.map((item) => {
                const isSelected = selectedRecord.id === item.id;
                const dateFormatted = new Date(
                  item.created_at,
                ).toLocaleDateString("en-GB");
                const receiptTag = `RCPT-${item.id.slice(0, 6).toUpperCase()}`;

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedRecord(item)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-[#00A884] bg-teal-50/70 shadow-sm ring-1 ring-[#00A884]/40"
                        : "border-slate-200 bg-slate-50/60 hover:bg-slate-100"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <span className="text-[#00A884] font-mono">
                          {dateFormatted}
                        </span>
                        <span className="text-[10px] font-mono font-normal text-slate-400">
                          ({receiptTag})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        BP: {item.vitals?.systolic_mmhg ?? "--"}/
                        {item.vitals?.diastolic_mmhg ?? "--"} · Glucose:{" "}
                        {item.vitals?.fpg_mgdl ?? item.vitals?.rpg_mgdl ?? "--"}{" "}
                        mg/dL
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className={
                        isSelected ? "text-[#00A884]" : "text-slate-300"
                      }
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: AI Recommendations & Clinical Protocol */}
          <div className="w-full lg:col-span-8 bg-white rounded-3xl p-6 shadow-lg border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={20} className="text-[#00A884]" />
                <h2 className="font-['Moul'] text-base sm:text-lg text-teal-900">
                  ការណែនាំពីប្រព័ន្ធសុខាភិបាល (Recommendations)
                </h2>
              </div>

              <div className="space-y-3.5 text-xs sm:text-sm text-slate-700">
                {r.health_recommendation ? (
                  <div className="p-3.5 bg-teal-50/60 border border-teal-100 rounded-2xl">
                    <p className="font-bold text-teal-900 mb-1 text-xs">
                      របបអាហារ និងសុខភាពទូទៅ (Diet & Lifestyle):
                    </p>
                    <p className="leading-relaxed whitespace-pre-line text-slate-800">
                      {r.health_recommendation}
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 bg-teal-50/60 border border-teal-100 rounded-2xl">
                    <p className="font-bold text-teal-900 mb-1 text-xs">
                      របបអាហារ និងសុខភាពទូទៅ:
                    </p>
                    <p className="leading-relaxed text-slate-800">
                      សូមកាត់បន្ថយអាហារប្រៃ និងផ្អែម
                      ព្រមទាំងពិសាទឹកឱ្យបានគ្រប់គ្រាន់ជារៀងរាល់ថ្ងៃ។
                    </p>
                  </div>
                )}

                {r.workout_recommendation ? (
                  <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
                    <p className="font-bold text-emerald-900 mb-1 text-xs">
                      សកម្មភាពរាងកាយ និងលំហាត់ប្រាណ (Physical Activity):
                    </p>
                    <p className="leading-relaxed whitespace-pre-line text-slate-800">
                      {r.workout_recommendation}
                    </p>
                  </div>
                ) : null}

                {r.notes && r.notes.length > 0 && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      កំណត់សម្គាល់បន្ថែម (Clinical Protocol Notes):
                    </p>
                    <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                      {r.notes.map((note, index) => (
                        <li key={index}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Print Trigger & Metadata */}
            <div className="pt-4 mt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span>Location: KCH-001 (Phnom Penh)</span>
                <span>·</span>
                <span className="font-mono">
                  Ref: RCPT-{selectedRecord.id.slice(0, 8).toUpperCase()}
                </span>
              </div>

              <button
                onClick={() =>
                  navigate(`/receipt?record_id=${selectedRecord.id}`)
                }
                className="flex items-center gap-2 bg-[#00A884] hover:bg-[#008f70] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <Printer size={16} />
                <span>មើលវិក្កយបត្រ (View Receipt)</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* 5. Bottom Voice Bar */}
      <footer className="w-full max-w-7xl mx-auto flex items-center justify-between pt-4 shrink-0">
        <div className="flex items-center gap-2 bg-slate-800/90 backdrop-blur text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-md border border-slate-700">
          <Activity size={14} className="text-[#00A884]" />
          <span>ជំនួយសំឡេងកំពុងបើក (Voice Guide On)</span>
        </div>

        <button
          onClick={() => setVoiceGuide(!voiceGuide)}
          className="w-10 h-10 rounded-full bg-white text-slate-700 flex items-center justify-center shadow-md border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
          title="Toggle Voice"
        >
          {voiceGuide ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </footer>
    </div>
  );
}
