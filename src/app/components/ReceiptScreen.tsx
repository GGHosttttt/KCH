import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  X,
  Printer,
  LogOut,
  Volume2,
  VolumeX,
  Sparkles,
  Loader2,
  AlertCircle,
  Activity,
} from "lucide-react";
import QRCode from "qrcode";
import apiService from "../../../services/apiService";
import { useCheckupStore } from "../../stores/useCheckupStore";


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
    cvd_risk_band: string | null;
    health_recommendation: string | null;
    workout_recommendation: string | null;
    notes: string[];
  };
}

export function ReceiptScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetCheckup = useCheckupStore((s) => s.resetCheckup);

  const recordId =
    searchParams.get("record_id") ||
    searchParams.get("id") ||
    sessionStorage.getItem("record_id") ||
    sessionStorage.getItem("patient_record_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<ScreeningRecordDetail | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [autoExitSeconds, setAutoExitSeconds] = useState(60);
  const [voiceGuide, setVoiceGuide] = useState(true);

  const fallbackName = sessionStorage.getItem("userName") || "Walk-in Patient";

  // 1. Fetch Record Details from API
  useEffect(() => {
    async function loadRecord() {
      if (!recordId) {
        const cached = sessionStorage.getItem("last_screening_result");
        if (cached) {
          try {
            setRecord(JSON.parse(cached));
            setLoading(false);
            return;
          } catch (e) {
            console.error(e);
          }
        }
        setError("រកមិនឃើញលេខសម្គាល់លទ្ធផល (Record ID not found)");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await apiService(
          `/kch-api/api/v1/assessment/records/${recordId}`,
          "GET"
        );
        const data: ScreeningRecordDetail = res?.data || res;
        setRecord(data);
      } catch (err: any) {
        console.error("Fetch record error:", err);
        setError("មិនអាចទាញយកព័ត៌មានបង្កាន់ដៃបានទេ");
      } finally {
        setLoading(false);
      }
    }

    loadRecord();
  }, [recordId]);

  // 2. Generate QR Code using Current Website URL
  useEffect(() => {
    if (!recordId) return;

    const targetUrl = `${window.location.origin}/results?record_id=${recordId}`;

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
  }, [recordId]);

  // 3. Auto Exit Timer
  useEffect(() => {
    const interval = setInterval(() => {
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

  const handleExit = () => {
    resetCheckup();
    sessionStorage.clear();
    navigate("/");
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="h-full w-full bg-slate-100 flex flex-col items-center justify-center gap-3 font-['Noto_Sans_Khmer',sans-serif]">
        <Loader2 size={40} className="animate-spin text-teal-600" />
        <p className="text-slate-600 font-semibold text-sm">
          កំពុងរៀបចំវិក្កយបត្រលទ្ធផល...
        </p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="h-full w-full bg-slate-100 flex flex-col items-center justify-center p-4 font-['Noto_Sans_Khmer',sans-serif]">
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
      ? "Male"
      : record.gender === "female"
      ? "Female"
      : "--";
  const dateStr = record.created_at
    ? new Date(record.created_at).toLocaleDateString()
    : new Date().toLocaleDateString();

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-100 flex flex-col p-4 md:p-6 font-['Noto_Sans_Khmer',sans-serif] select-none">
      {/* Top Header Bar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between bg-white/95 backdrop-blur px-5 py-3 rounded-2xl shadow-sm border border-slate-200 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-teal-900 font-bold text-sm hover:text-teal-700 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>ត្រឡប់ក្រោយ</span>
        </button>

        <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
          <span>អេក្រង់នឹងបិទក្នុង (Auto-exit in):</span>
          <span className="font-mono bg-teal-50 text-teal-800 px-2 py-0.5 rounded-lg border border-teal-200">
            00:{autoExitSeconds.toString().padStart(2, "0")}
          </span>
        </div>

        <button
          onClick={handleExit}
          className="flex items-center gap-1.5 text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-rose-200"
        >
          <X size={18} />
          <span>បិទ (Close)</span>
        </button>
      </header>

      {/* Screen Title */}
      <div className="text-center my-3 shrink-0">
        <h1 className="font-['Moul'] text-2xl text-[#0A4D44] drop-shadow-sm">
          វិក្កយបត្រលទ្ធផល
        </h1>
        <p className="text-xs text-slate-500">Receipt Preview</p>
      </div>

      {/* Main Grid: Narrower Receipt & Larger Recommendations */}
      <main className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-5 my-2 items-start">
        {/* Left Column: Narrower Width (col-span-4), Larger Typography */}
        <div className="md:col-span-4 bg-white rounded-2xl shadow-lg border border-slate-300 p-5 font-mono text-xs leading-relaxed print:m-0 print:shadow-none">
          {/* Header */}
          <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
            <h2 className="font-bold text-sm text-slate-900 font-sans uppercase tracking-wide">
              Khmer Community Health
            </h2>
            <p className="text-xs text-slate-500 font-sans">
              ទូរសុខភាពសហគមន៍ខ្មែរ (Kiosk)
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Date: {dateStr}</p>
          </div>

          {/* Patient Info */}
          <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 mb-3">
            <p className="font-bold text-slate-400 uppercase text-[10px]">
              PATIENT INFO
            </p>
            <div className="flex justify-between">
              <span className="text-slate-500">Receipt ID:</span>
              <span className="font-bold text-slate-800">
                RCPT-{record.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Name:</span>
              <span className="font-bold text-slate-800 font-sans text-sm">
                {patientName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Age / Gender:</span>
              <span className="font-bold text-slate-800">
                {record.age} yrs / {genderStr}
              </span>
            </div>
          </div>

          {/* Body Metrics */}
          <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 mb-3">
            <p className="font-bold text-slate-400 uppercase text-[10px]">
              BODY METRICS
            </p>
            <div className="flex justify-between">
              <span className="text-slate-500">Height:</span>
              <span className="font-bold text-slate-800">
                {v.height_cm ?? "--"} cm
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Weight:</span>
              <span className="font-bold text-slate-800">
                {v.weight_kg ?? "--"} kg
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">BMI:</span>
              <span className="font-bold text-slate-800">
                {r.bmi ?? "--"}
              </span>
            </div>
          </div>

          {/* Blood Pressure */}
          <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 mb-3">
            <p className="font-bold text-slate-400 uppercase text-[10px]">
              BLOOD PRESSURE
            </p>
            <div className="flex justify-between">
              <span className="text-slate-500">BP:</span>
              <span className="font-bold text-rose-700 text-sm">
                {v.systolic_mmhg ?? "--"}/{v.diastolic_mmhg ?? "--"} mmHg
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pulse:</span>
              <span className="font-bold text-slate-800">
                {v.pulse_bpm ?? v.heart_rate_bpm ?? "--"} bpm
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="font-bold text-amber-700 font-sans">
                {r.bp_category || "Normal"}
              </span>
            </div>
          </div>

          {/* Blood Glucose */}
          <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 mb-3">
            <p className="font-bold text-slate-400 uppercase text-[10px]">
              BLOOD GLUCOSE
            </p>
            <div className="flex justify-between">
              <span className="text-slate-500">Glucose:</span>
              <span className="font-bold text-teal-800 text-sm">
                {v.fpg_mgdl ?? v.rpg_mgdl ?? "--"} mg/dL
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Category:</span>
              <span className="font-bold text-teal-700 font-sans">
                {r.glucose_category || "Normal Range"}
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
              Scan to save digital copy
            </p>
          </div>
        </div>

        {/* Right Column: AI Recommendations & Actions (col-span-8) */}
        <div className="md:col-span-8 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={22} className="text-[#00A884]" />
              <h2 className="font-bold text-lg text-teal-900 font-['Moul']">
                ការណែនាំ (AI Recommendations)
              </h2>
            </div>

            <div className="space-y-3.5 text-sm text-slate-700">
              {r.health_recommendation ? (
                <div className="p-4 bg-teal-50/70 border border-teal-100 rounded-xl">
                  <p className="font-bold text-teal-900 mb-1">
                    របបអាហារ និងសុខភាពទូទៅ (Health & Diet):
                  </p>
                  <p className="leading-relaxed whitespace-pre-line text-slate-800 text-sm">
                    {r.health_recommendation}
                  </p>
                </div>
              ) : null}

              {r.workout_recommendation ? (
                <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                  <p className="font-bold text-emerald-900 mb-1">
                    សកម្មភាពរាងកាយ និងលំហាត់ប្រាណ (Exercise):
                  </p>
                  <p className="leading-relaxed whitespace-pre-line text-slate-800 text-sm">
                    {r.workout_recommendation}
                  </p>
                </div>
              ) : null}

              {r.notes && r.notes.length > 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <p className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                    កំណត់សម្គាល់បន្ថែម (Clinical Notes):
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
          <div className="space-y-2.5">
            <button
              onClick={handlePrint}
              className="w-full py-3.5 bg-[#00A884] hover:bg-[#008f70] active:scale-[0.98] text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
            >
              <Printer size={18} />
              <span>បោះពុម្ពឥឡូវនេះ (Print Now)</span>
            </button>

            <button
              onClick={handleExit}
              className="w-full py-3 bg-[#073B35] hover:bg-slate-900 active:scale-[0.98] text-white font-bold rounded-xl shadow-sm transition-all text-xs flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              <span>រំលង និងត្រឡប់ទៅដើម (Skip to Start)</span>
            </button>
          </div>
        </div>
      </main>

      {/* Floating Audio & Assistance Indicators */}
      <footer className="w-full max-w-5xl mx-auto flex items-center justify-between py-2 shrink-0">
        <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur text-white px-3.5 py-1.5 rounded-full text-xs font-semibold">
          <Activity size={14} className="text-teal-400" />
          <span>ជំនួយសំឡេងកំពុងបើក (Voice Guide On)</span>
        </div>

        <button
          onClick={() => setVoiceGuide(!voiceGuide)}
          className="w-9 h-9 rounded-full bg-white text-slate-700 flex items-center justify-center shadow-md border border-slate-200 hover:bg-slate-50"
          title="Toggle Voice"
        >
          {voiceGuide ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </footer>
    </div>
  );
}