import { useEffect, useState } from "react";
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
  LifeBuoy,
  Loader2,
  AlertCircle,
} from "lucide-react";
import apiService from "../../../../services/apiService";

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

export default function PatientProfilePage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyRecords, setHistoryRecords] = useState<ScreeningItem[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ScreeningItem | null>(
    null,
  );
  const [voiceGuide, setVoiceGuide] = useState(true);

  useEffect(() => {
    async function fetchPortalData() {
      try {
        setLoading(true);
        setError(null);

        const res = await apiService(
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
            "មិនមានទិន្នន័យពិនិត្យសុខភាពទេ (No checkup records found)",
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

  if (loading) {
    return (
      <div className="h-screen bg-[#06332d] flex flex-col items-center justify-center text-teal-100 font-['Noto_Sans_Khmer',sans-serif]">
        <Loader2 size={44} className="animate-spin text-[#00A884] mb-3" />
        <p className="text-sm font-semibold">
          កំពុងទាញយកទិន្នន័យសុខភាពរបស់អ្នក...
        </p>
      </div>
    );
  }

  if (error || !selectedRecord) {
    return (
      <div className="h-screen bg-[#06332d] flex flex-col items-center justify-center p-4 font-['Noto_Sans_Khmer',sans-serif]">
        <div className="bg-white p-7 rounded-3xl shadow-xl max-w-md w-full text-center border border-rose-100">
          <AlertCircle size={40} className="text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800 mb-2">
            មិនមានទិន្នន័យកំណត់ត្រា
          </h2>
          <p className="text-xs text-slate-500 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 bg-[#00A884] hover:bg-[#008f70] text-white font-bold rounded-xl text-sm transition-all"
          >
            ត្រឡប់ទៅទំព័រដើម (Go Home)
          </button>
        </div>
      </div>
    );
  }

  const v = selectedRecord.vitals || ({} as VitalMetrics);
  const r = selectedRecord.result || ({} as ClinicalResult);

  const genderKhmer =
    selectedRecord.gender === "male" ? "ប្រុស (Male)" : "ស្រី (Female)";
  const patientPhone = sessionStorage.getItem("userPhone") || "011 111 111";

  const getBmiBadge = (bmi: number | null) => {
    if (!bmi)
      return {
        label: "ធម្មតា (Normal)",
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      };
    if (bmi < 18.5)
      return {
        label: "ស្គម (Underweight)",
        color: "text-amber-700 bg-amber-50 border-amber-200",
      };
    if (bmi <= 22.9)
      return {
        label: "ធម្មតា (Normal)",
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      };
    if (bmi <= 24.9)
      return {
        label: "លើសទម្ងន់ (Overweight)",
        color: "text-amber-700 bg-amber-50 border-amber-200",
      };
    return {
      label: "ធាត់ (Obese)",
      color: "text-rose-700 bg-rose-50 border-rose-200",
    };
  };

  const getBpBadge = () => {
    const cat = (r.bp_category || "").toLowerCase();
    if (cat.includes("optimal") || cat.includes("normal")) {
      return {
        text: "ធម្មតា (Normal)",
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      };
    }
    if (cat.includes("pre") || cat.includes("elevated")) {
      return {
        text: "ប្រឈមហានិភ័យដំបូង (Pre-hypertensive)",
        color: "text-amber-700 bg-amber-50 border-amber-200",
      };
    }
    return {
      text: r.bp_category || "ពិនិត្យតាមដាន",
      color: "text-rose-700 bg-rose-50 border-rose-200",
    };
  };

  const getGlucoseBadge = () => {
    const cat = (r.glucose_category || "").toLowerCase();
    if (cat.includes("normal")) {
      return {
        text: "ធម្មតា (Normal)",
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      };
    }
    if (cat.includes("impaired") || cat.includes("pre")) {
      return {
        text: "ប្រឈមទឹកនោមផ្អែម (Pre-diabetic)",
        color: "text-amber-700 bg-amber-50 border-amber-200",
      };
    }
    return {
      text: r.glucose_category || "ធម្មតា (Normal)",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    };
  };

  const bmiBadge = getBmiBadge(r.bmi);
  const bpBadge = getBpBadge();
  const glucoseBadge = getGlucoseBadge();

  return (
    <div className="h-screen w-full overflow-y-auto bg-[#06332d] text-slate-800 p-4 md:p-6 font-['Noto_Sans_Khmer',sans-serif] select-none scroll-smooth">
      <div className="w-full max-w-7xl mx-auto flex flex-col min-h-full pb-20">
        {/* 1. Header Bar */}
        <header className="w-full flex items-center justify-between py-2 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00A884] flex items-center justify-center text-white shadow-md">
              <HeartPulse size={22} />
            </div>
            <div>
              <h1 className="font-['Moul'] text-lg text-white tracking-wide">
                ទូរសុខភាពសហគមន៍ខ្មែរ · KCH
              </h1>
              <p className="text-[10px] text-teal-200/80 uppercase tracking-wider font-semibold">
                ប្រព័ន្ធតាមដានសុខភាពបឋម (Patient Health Portal)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur border border-teal-500/20 px-3.5 py-1.5 rounded-full text-xs text-teal-100 font-medium">
              <User size={14} className="text-teal-300" />
              <span>{selectedRecord.patient_name}</span>
              <span className="text-teal-300/60 font-mono">
                ({patientPhone})
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/10"
            >
              <LogOut size={14} />
              <span>ចាកចេញ</span>
            </button>
          </div>
        </header>

        {/* 2. Top Metric Cards Row (4-Card Result Screen Style) */}
        <section className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5 shrink-0">
          {/* Card 1: Patient Info */}
          <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-100 flex flex-col justify-between min-h-[280px]">
            <div>
              <div className="flex items-center gap-3 mb-4">
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

              <div className="space-y-2.5 text-xs">
                <div>
                  <p className="text-slate-400 text-[10px]">ឈ្មោះ / Name</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                      {selectedRecord.patient_name.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-bold text-slate-900 text-sm">
                      {selectedRecord.patient_name}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-slate-400 text-[10px]">ភេទ / Gender</p>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">
                    {genderKhmer}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 text-[10px]">អាយុ / Age</p>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">
                    {selectedRecord.age}{" "}
                    <span className="font-normal text-slate-400">
                      ឆ្នាំ (yrs)
                    </span>
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 text-[10px]">
                    លេខទូរស័ព្ទ / Phone
                  </p>
                  <p className="font-bold text-slate-700 font-mono text-xs mt-0.5">
                    {patientPhone}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
              <span className="py-1 px-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full font-bold text-[10px] font-mono">
                CVD Risk: {r.cvd_risk_band || "<5%"}
              </span>
              <span className="text-[10px] font-medium text-slate-400 font-mono">
                {historyRecords.length} លើក
              </span>
            </div>
          </div>

          {/* Card 2: Body Composition */}
          <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-100 flex flex-col justify-between min-h-[280px]">
            <div>
              <div className="flex items-center gap-3 mb-4">
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

              <div className="space-y-3 text-xs text-slate-600 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">
                    កម្ពស់ (Height)
                  </span>
                  <span className="font-bold text-slate-900 text-xs">
                    {v.height_cm ?? "--"} cm
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">
                    ទម្ងន់ (Weight)
                  </span>
                  <span className="font-bold text-slate-900 text-xs">
                    {v.weight_kg ?? "--"} kg
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500 font-sans">BMI</span>
                  <span className="font-bold text-slate-900 text-base">
                    {r.bmi ? r.bmi.toFixed(1) : "--"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100">
              <div
                className={`w-full py-1.5 px-2 border rounded-full text-center font-bold text-[11px] ${bmiBadge.color}`}
              >
                {bmiBadge.label}
              </div>
            </div>
          </div>

          {/* Card 3: Blood Pressure */}
          <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-100 flex flex-col justify-between min-h-[280px]">
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

              <div className="bg-slate-50/70 rounded-2xl border border-slate-100 py-3.5 px-3 flex flex-col items-center justify-center">
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
                <div className="w-full flex justify-between items-center text-[10px] font-mono text-slate-500 border-t border-slate-200/60 mt-2.5 pt-1.5 px-1">
                  <span className="font-sans text-slate-400">
                    ចង្វាក់បេះដូង
                  </span>
                  <span className="font-bold text-rose-600">
                    {v.pulse_bpm ?? v.heart_rate_bpm ?? "--"} bpm
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <div
                className={`w-full py-1.5 px-2 border rounded-full text-center font-bold text-[11px] ${bpBadge.color}`}
              >
                {bpBadge.text}
              </div>
            </div>
          </div>

          {/* Card 4: Blood Glucose */}
          <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-100 flex flex-col justify-between min-h-[280px]">
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

              <div className="bg-slate-50/70 rounded-2xl border border-slate-100 py-3.5 px-3 flex flex-col items-center justify-center text-center">
                <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-[#00A884] mb-1">
                  <Droplet size={15} className="fill-teal-100" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
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

            <div className="mt-3">
              <div
                className={`w-full py-1.5 px-2 border rounded-full text-center font-bold text-[11px] ${glucoseBadge.color}`}
              >
                {glucoseBadge.text}
              </div>
            </div>
          </div>
        </section>

        {/* 3. Main Body: History List & Clinical Recommendations */}
        <main className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Screening History List */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-5 shadow-lg border border-teal-900/10 flex flex-col">
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <span>ប្រវត្តិពិនិត្យកន្លងមក (HISTORY)</span>
            </h2>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
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
                        ? "border-[#00A884] bg-teal-50/50 shadow-sm ring-1 ring-[#00A884]/40"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <Calendar size={13} className="text-[#00A884]" />
                        <span>{dateFormatted}</span>
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

          {/* Right Column: AI & Clinical Recommendations */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 shadow-lg border border-teal-900/10 flex flex-col justify-between">
            <div>
              <h2 className="font-['Moul'] text-lg text-teal-900 mb-4 flex items-center gap-2">
                <span>ការណែនាំ (AI Recommendations)</span>
              </h2>

              <div className="space-y-3.5 text-sm text-slate-700">
                {r.health_recommendation ? (
                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-[#00A884] mt-2 shrink-0" />
                    <p className="leading-relaxed">{r.health_recommendation}</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-[#00A884] mt-2 shrink-0" />
                    <p className="leading-relaxed">
                      តាមដានសម្ពាធឈាមជារៀងរាល់ខែ និងកាត់បន្ថយអាហារប្រៃ (Monitor
                      BP monthly, reduce sodium intake).
                    </p>
                  </div>
                )}

                {r.workout_recommendation && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-[#00A884] mt-2 shrink-0" />
                    <p className="leading-relaxed">
                      {r.workout_recommendation}
                    </p>
                  </div>
                )}

                {r.notes && r.notes.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      កំណត់សម្គាល់បន្ថែមពីប្រព័ន្ធសុខាភិបាល (PROTOCOL NOTES):
                    </p>
                    {r.notes.map((note, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-xs text-slate-600"
                      >
                        <span className="text-teal-600 font-bold">•</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Print & Record Meta Footer */}
            <div className="pt-6 mt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <div>
                <span>Location: KCH-001 (Phnom Penh)</span>
                <span className="mx-2">·</span>
                <span className="font-mono">
                  Ref: RCPT-{selectedRecord.id.slice(0, 6).toUpperCase()}
                </span>
              </div>

              <button
                onClick={() =>
                  navigate(`/receipt?record_id=${selectedRecord.id}`)
                }
                className="flex items-center gap-2 bg-[#00A884] hover:bg-[#008f70] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <Printer size={16} />
                <span>បោះពុម្ពលទ្ធផល (Print)</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* 4. Bottom Fixed Voice Assistance & Help Trigger */}
      <div className="fixed bottom-4 left-6 right-6 max-w-7xl mx-auto flex items-center justify-between pointer-events-none z-30">
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-800/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg border border-slate-700">
          <Activity size={14} className="text-[#00A884]" />
          <span>ជំនួយសំឡេងកំពុងបើក (Voice Guide On)</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2.5">
          <button
            onClick={() => setVoiceGuide(!voiceGuide)}
            className="w-11 h-11 rounded-full bg-white text-slate-700 flex items-center justify-center shadow-xl border border-slate-200 hover:bg-slate-50 transition-transform active:scale-95"
            title="Toggle Voice"
          >
            {voiceGuide ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          <button
            onClick={() =>
              alert(
                "ជំនួយការផ្នែកបច្ចេកទេស ឬសង្គ្រោះបន្ទាន់ (Emergency Help / Support)",
              )
            }
            className="w-11 h-11 rounded-full bg-[#e6194b] text-white flex items-center justify-center shadow-xl hover:bg-rose-700 transition-transform active:scale-95 ring-4 ring-rose-500/20"
            title="Emergency Support"
          >
            <LifeBuoy size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
