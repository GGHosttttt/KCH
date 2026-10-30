import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  X,
  Printer,
  LogOut,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";
import QRCode from "qrcode";
import apiService from "../../../services/apiService";
import { useCheckupStore } from "../../stores/useCheckupStore";
import voiceGuide from "../../../services/voiceGuide";

interface ScreeningRecordDetail {
  id: string;
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
    fpg_mgdl: number | null;
    rpg_mgdl: number | null;
  };
  result?: {
    bp_category: string | null;
    glucose_category: string | null;
    bmi: number | null;
    bmi_category?: string | null;
    cvd_risk_band: string | null;
    health_recommendation: string | null;
    workout_recommendation: string | null;
    notes: string[];
  };
}

// ── Khmer Translation Helpers ──
// ── Khmer Translation Helpers ──
function getKhmerBpLabel(cat?: string | null) {
  const c = (cat || "").toLowerCase();

  // 1. Ideal (< 120/80) - Dark Green
  if (c.includes("ideal")) {
    return { kh: "ល្អឥតខ្ចោះ", en: "Ideal", color: "text-emerald-700" };
  }

  // 2. Normal (120-129 / 80-84) - Light Green
  if (c === "normal") {
    return { kh: "ធម្មតា", en: "Normal", color: "text-teal-700" };
  }

  // 3. Normal Systolic (130-139 / 85-89) - Yellow
  if (c.includes("normal_systolic") || c.includes("normal systolic")) {
    return {
      kh: "ធម្មតាកម្រិតខ្ពស់",
      en: "Normal Systolic",
      color: "text-yellow-700",
    };
  }

  // 4. Mild Hypertension (140-159 / 90-99) - Orange
  if (c.includes("mild") || c.includes("isolated")) {
    return {
      kh: "លើសសម្ពាធឈាមកម្រិតស្រាល",
      en: "Mild Hypertension",
      color: "text-orange-700",
    };
  }

  // 5. Moderate Hypertension (160-180 / 100-109) - Rose
  if (c.includes("moderate")) {
    return {
      kh: "លើសសម្ពាធឈាមកម្រិតមធ្យម",
      en: "Moderate Hypertension",
      color: "text-rose-700",
    };
  }

  // 6. Severe Hypertension (> 180 / 109) - Red
  if (c.includes("severe") || c.includes("crisis") || c.includes("emergency")) {
    return {
      kh: "លើសសម្ពាធឈាមកម្រិតធ្ងន់",
      en: "Severe Hypertension",
      color: "text-red-700",
    };
  }

  // Fallback
  return { kh: "បានវាស់រួច", en: "Recorded", color: "text-slate-700" };
}

function getKhmerGlucoseLabel(cat?: string | null) {
  const c = (cat || "").toLowerCase();
  if (c.includes("normal"))
    return {
      kh: "ជាតិស្ករធម្មតា",
      en: "Normal Range",
      color: "text-emerald-700",
    };
  if (c.includes("impaired") || c.includes("pre"))
    return {
      kh: "ប្រឈមទឹកនោមផ្អែម",
      en: "Pre-diabetic",
      color: "text-amber-700",
    };
  if (c.includes("diabet") || c.includes("elevated") || c.includes("suspect")) {
    return {
      kh: "ជាតិស្ករខ្ពស់",
      en: "Diabetic / High",
      color: "text-rose-700",
    };
  }
  return { kh: "បានវាស់រួច", en: "Recorded", color: "text-slate-700" };
}

function getKhmerBmiLabel(bmi: number | null, cat?: string | null) {
  const c = (cat || "").toLowerCase();
  const val = bmi ?? 0;
  if (c.includes("under") || (val > 0 && val < 18.5))
    return { kh: "ស្គម", en: "Underweight", color: "text-amber-700" };
  if (c.includes("over") || (val >= 23 && val < 25))
    return { kh: "លើសទម្ងន់ស្រាល", en: "Overweight", color: "text-amber-700" };
  if (c.includes("obese") || val >= 25)
    return { kh: "លើសទម្ងន់ខ្លាំង", en: "Obese", color: "text-rose-700" };
  return { kh: "ទម្ងន់សមស្រប", en: "Normal", color: "text-emerald-700" };
}

function getKhmerCvdLabel(band?: string | null) {
  const b = (band || "<5%").toLowerCase();
  if (b.includes("5_to_10"))
    return {
      kh: "ហានិភ័យស្រាល",
      en: "Mild Risk (5-10%)",
      color: "text-teal-700",
    };
  if (b.includes("10_to_20"))
    return {
      kh: "ហានិភ័យមធ្យម",
      en: "Moderate Risk (10-20%)",
      color: "text-amber-700",
    };
  if (b.includes("20_to_30"))
    return {
      kh: "ហានិភ័យខ្ពស់",
      en: "High Risk (20-30%)",
      color: "text-orange-700",
    };
  if (b.includes(">=30") || b.includes("very_high"))
    return {
      kh: "ហានិភ័យខ្ពស់ខ្លាំង",
      en: "Very High Risk (≥30%)",
      color: "text-rose-700",
    };
  return { kh: "ហានិភ័យទាប", en: "Low Risk (<5%)", color: "text-emerald-700" };
}

// Configurable screen exit timeout
const AUTO_EXIT_DEFAULT_SECONDS = 600;

export function ReceiptScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const resetCheckup = useCheckupStore((s) => s.resetCheckup);

  const recordId =
    searchParams.get("record_id") ||
    searchParams.get("id") ||
    sessionStorage.getItem("patient_record_id") ||
    sessionStorage.getItem("record_id");

  // Instantly use record passed from ResultScreen
  const initialRecord: ScreeningRecordDetail | null =
    (location.state as any)?.record ||
    (() => {
      const cached = sessionStorage.getItem("last_screening_result");
      try {
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    })();

  const [record, setRecord] = useState<ScreeningRecordDetail | null>(
    initialRecord,
  );
  const [loading, setLoading] = useState<boolean>(!initialRecord);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const [autoExitSeconds, setAutoExitSeconds] = useState(
    AUTO_EXIT_DEFAULT_SECONDS,
  );
  const isPrintingRef = useRef<boolean>(false);

  const frontend_origin =
    (window as any).kioskEnv?.getFrontOrigin?.() ||
    import.meta.env.VITE_FRONT_ORIGIN ||
    (typeof window !== "undefined" && window.location.origin.startsWith("http")
      ? window.location.origin
      : "http://localhost:5173");

  const fallbackName = sessionStorage.getItem("userName") || "Walk-in Patient";

  const handleExit = () => {
    voiceGuide.stop();
    resetCheckup();
    sessionStorage.clear();
    navigate("/");
  };

  useEffect(() => {
    if (record) return;

    async function loadRecordFallback() {
      if (!recordId) {
        setError("រកមិនឃើញលេខសម្គាល់លទ្ធផល (Record ID not found)");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let res: any;
        try {
          res = await apiService(`/kch-api/api/v1/records/${recordId}`, "GET");
        } catch {
          res = await apiService(
            `/kch-api/api/v1/assessment/records/${recordId}`,
            "GET",
          );
        }
        const data: ScreeningRecordDetail = res?.data || res;
        setRecord(data);
      } catch (err: any) {
        console.error("Fetch record error:", err);
        setError("មិនអាចទាញយកព័ត៌មានបង្កាន់ដៃបានទេ");
      } finally {
        setLoading(false);
      }
    }

    loadRecordFallback();
  }, [recordId, record]);

  useEffect(() => {
    const activeId = record?.id || recordId;
    if (!activeId) return;

    const targetUrl = `${frontend_origin}/#/results?record_id=${activeId}`;

    QRCode.toDataURL(targetUrl, {
      width: 130,
      margin: 1,
      color: {
        dark: "#073B35",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Generation error:", err));
  }, [record?.id, recordId, frontend_origin]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPrintingRef.current) return;
      setAutoExitSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleExit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handlePrint = () => {
    isPrintingRef.current = true;
    window.print();
    setTimeout(() => {
      isPrintingRef.current = false;
      setAutoExitSeconds(AUTO_EXIT_DEFAULT_SECONDS);
    }, 500);
  };

  const formatDisplayTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] w-full bg-slate-100 flex flex-col items-center justify-center gap-3 font-['Noto_Sans_Khmer',sans-serif]">
        <Loader2 size={40} className="animate-spin text-teal-600" />
        <p className="text-slate-600 font-semibold text-sm">
          កំពុងរៀបចំវិក្កយបត្រលទ្ធផល...
        </p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-[100dvh] w-full bg-slate-100 flex flex-col items-center justify-center p-4 font-['Noto_Sans_Khmer',sans-serif]">
        <div className="bg-white p-6 rounded-3xl shadow-lg max-w-sm w-full text-center">
          <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
          <p className="text-slate-700 font-bold mb-4">{error}</p>
          <button
            onClick={handleExit}
            className="w-full py-2.5 bg-teal-700 text-white rounded-xl font-bold text-sm"
          >
            ត្រឡប់ទៅទំព័រដើម (Close)
          </button>
        </div>
      </div>
    );
  }

  const v = record.vitals || {};
  const r = record.result || {};

  const patientName = record.patient_name || fallbackName;
  const genderStr =
    record.gender === "male"
      ? "ប្រុស (Male)"
      : record.gender === "female"
        ? "ស្រី (Female)"
        : "--";
  const dateStr = record.created_at
    ? new Date(record.created_at).toLocaleDateString()
    : new Date().toLocaleDateString();

  const bpStatus = getKhmerBpLabel(r.bp_category);
  const glucoseStatus = getKhmerGlucoseLabel(r.glucose_category);
  const bmiStatus = getKhmerBmiLabel(r.bmi, r.bmi_category);
  const cvdStatus = getKhmerCvdLabel(r.cvd_risk_band);

  return (
    <div className="w-full min-h-[100dvh] overflow-y-auto bg-slate-100 flex flex-col p-4 sm:p-6 pb-24 font-['Noto_Sans_Khmer',sans-serif] select-none print:p-0 print:bg-white print:block">
      {/* Top Header Bar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between bg-white/95 backdrop-blur px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl shadow-sm border border-slate-200 shrink-0 print:hidden mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 sm:gap-2 text-teal-900 font-bold text-xs sm:text-sm hover:text-teal-700 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>ត្រឡប់ក្រោយ</span>
        </button>

        <div className="text-[11px] sm:text-xs font-semibold text-slate-500 flex items-center gap-1.5 sm:gap-2">
          <span className="hidden sm:inline">
            អេក្រង់នឹងបិទក្នុង (Auto-exit in):
          </span>
          <span className="font-mono bg-teal-50 text-teal-800 px-2 py-0.5 rounded-lg border border-teal-200 text-xs font-bold">
            {formatDisplayTime(autoExitSeconds)}
          </span>
        </div>

        <button
          onClick={handleExit}
          className="flex items-center gap-1 text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition-all border border-rose-200"
        >
          <X size={16} />
          <span>បិទ (Close)</span>
        </button>
      </header>

      {/* Screen Title */}
      <div className="text-center mb-6 shrink-0 print:hidden">
        <h1 className="font-['Moul'] text-xl sm:text-2xl text-[#0A4D44] drop-shadow-sm">
          វិក្កយបត្រលទ្ធផល
        </h1>
        <p className="text-xs text-slate-500">Receipt Preview</p>
      </div>

      {/* Main Grid: Fully Responsive Stacking */}
      <main className="w-full max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-12 gap-5 flex-1 items-start print:block print:w-full print:max-w-none">
        {/* Receipt Slip Column */}
        <div className="w-full lg:col-span-5 bg-white rounded-2xl shadow-lg border border-slate-300 p-4 sm:p-5 font-mono text-xs leading-relaxed print:m-0 print:shadow-none print:border-none print:w-[320px] print:mx-auto">
          <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
            <h2 className="font-bold text-sm text-slate-900 font-sans uppercase tracking-wide">
              Khmer Community Health
            </h2>
            <p className="text-xs text-slate-500 font-sans">
              ទូរសុខភាពសហគមន៍ខ្មែរ (Kiosk)
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              កាលបរិច្ឆេទ (Date): {dateStr}
            </p>
          </div>

          {/* Patient Info */}
          <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 mb-3">
            <p className="font-bold text-slate-400 uppercase text-[10px] font-sans">
              ព័ត៌មានអ្នកជំងឺ (PATIENT INFO)
            </p>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">លេខវិក្កយបត្រ:</span>
              <span className="font-bold text-slate-800">
                RCPT-{record.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">ឈ្មោះ (Name):</span>
              <span className="font-bold text-slate-800 font-sans text-sm">
                {patientName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">អាយុ / ភេទ:</span>
              <span className="font-bold text-slate-800 font-sans">
                {record.age} ឆ្នាំ · {genderStr}
              </span>
            </div>
          </div>

          {/* Body Metrics */}
          <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 mb-3">
            <p className="font-bold text-slate-400 uppercase text-[10px] font-sans">
              សមាសភាពរាងកាយ (BODY METRICS)
            </p>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">កម្ពស់ (Height):</span>
              <span className="font-bold text-slate-800">
                {v.height_cm ?? "--"} cm
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">ទម្ងន់ (Weight):</span>
              <span className="font-bold text-slate-800">
                {v.weight_kg ?? "--"} kg
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-sans">សន្ទស្សន៍ BMI:</span>
              <div className="text-right font-sans">
                <span className="font-bold font-mono text-slate-800 mr-1.5">
                  {r.bmi ? Number(r.bmi).toFixed(1) : "--"}
                </span>
                <span className={`text-[11px] font-bold ${bmiStatus.color}`}>
                  ({bmiStatus.kh})
                </span>
              </div>
            </div>
          </div>

          {/* Blood Pressure */}
          <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 mb-3">
            <p className="font-bold text-slate-400 uppercase text-[10px] font-sans">
              សម្ពាធឈាម (BLOOD PRESSURE)
            </p>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">សម្ពាធឈាម (BP):</span>
              <span className="font-bold text-rose-700 text-sm">
                {v.systolic_mmhg ?? "--"}/{v.diastolic_mmhg ?? "--"} mmHg
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">
                ចង្វាក់បេះដូង (Pulse):
              </span>
              <span className="font-bold text-slate-800">
                {v.pulse_bpm ?? v.heart_rate_bpm ?? "--"} bpm
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-sans">
                ស្ថានភាព (Status):
              </span>
              <span className={`font-bold font-sans ${bpStatus.color}`}>
                {bpStatus.kh} ({bpStatus.en})
              </span>
            </div>
          </div>

          {/* Blood Glucose */}
          <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 mb-3">
            <p className="font-bold text-slate-400 uppercase text-[10px] font-sans">
              ជាតិស្ករក្នុងឈាម (BLOOD GLUCOSE)
            </p>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">កម្រិតជាតិស្ករ:</span>
              <span className="font-bold text-teal-800 text-sm">
                {v.fpg_mgdl ?? v.rpg_mgdl ?? "--"} mg/dL
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-sans">ចំណាត់ថ្នាក់:</span>
              <span className={`font-bold font-sans ${glucoseStatus.color}`}>
                {glucoseStatus.kh} ({glucoseStatus.en})
              </span>
            </div>
          </div>

          {/* CVD Risk Band */}
          <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 mb-3">
            <p className="font-bold text-slate-400 uppercase text-[10px] font-sans">
              ហានិភ័យបេះដូង (CVD RISK)
            </p>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-sans">
                កម្រិតហានិភ័យ ១០ឆ្នាំ:
              </span>
              <span className={`font-bold font-sans ${cvdStatus.color}`}>
                {cvdStatus.kh} ({cvdStatus.en})
              </span>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center pt-2 text-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Verification QR"
                className="w-24 h-24 rounded-lg shadow-sm border border-slate-200"
              />
            ) : (
              <div className="w-24 h-24 bg-slate-100 flex items-center justify-center rounded-lg">
                <Loader2 size={16} className="animate-spin text-slate-400" />
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-1.5 font-sans">
              ស្កេនដើម្បីរក្សាទុកលទ្ធផលលើទូរស័ព្ទ (Scan to save)
            </p>
          </div>
        </div>

        {/* Recommendations & Action Column */}
        <div className="w-full lg:col-span-7 flex flex-col gap-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 sm:p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={22} className="text-[#00A884]" />
              <h2 className="font-bold text-base sm:text-lg text-teal-900 font-['Moul']">
                ការណែនាំពីប្រព័ន្ធសុខាភិបាល (Recommendations)
              </h2>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm text-slate-700">
              {r.health_recommendation ? (
                <div className="p-3.5 sm:p-4 bg-teal-50/70 border border-teal-100 rounded-xl">
                  <p className="font-bold text-teal-900 mb-1">
                    របបអាហារ និងសុខភាពទូទៅ (Health & Diet):
                  </p>
                  <p className="leading-relaxed whitespace-pre-line text-slate-800">
                    {r.health_recommendation}
                  </p>
                </div>
              ) : null}

              {r.workout_recommendation ? (
                <div className="p-3.5 sm:p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                  <p className="font-bold text-emerald-900 mb-1">
                    សកម្មភាពរាងកាយ និងលំហាត់ប្រាណ (Exercise):
                  </p>
                  <p className="leading-relaxed whitespace-pre-line text-slate-800">
                    {r.workout_recommendation}
                  </p>
                </div>
              ) : null}

              {r.notes && r.notes.length > 0 ? (
                <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <p className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                    កំណត់សម្គាល់បន្ថែមពីប្រព័ន្ធសុខាភិបាល (Clinical Notes):
                  </p>
                  <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                    {r.notes.map((note, idx) => (
                      <li key={idx}>{note}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handlePrint}
              className="w-full py-4 bg-[#00A884] hover:bg-[#008f70] active:scale-[0.98] text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
            >
              <Printer size={20} />
              <span>បោះពុម្ពវិក្កយបត្រ (Print Now)</span>
            </button>

            <button
              onClick={handleExit}
              className="w-full py-3 bg-[#073B35] hover:bg-slate-900 active:scale-[0.98] text-white font-bold rounded-xl shadow-sm transition-all text-xs flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              <span>បញ្ចប់ការប្រើប្រាស់ (Exit)</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
