import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, Activity, Scale, Droplet, Calendar, 
  Printer, LogOut, Heart, ChevronRight, Loader2, AlertCircle 
} from "lucide-react";
import apiService from "../../../../services/apiService";
import { LogoutModal } from "./LogoutModal";

interface ScreeningRecord {
  id: string;
  date: string;
  kiosk_id: string;
  height_cm: number;
  weight_kg: number;
  bmi: number;
  bmi_status: string;
  sys_bp: number;
  dia_bp: number;
  pulse_bpm: number;
  bp_status: string;
  glucose_mg_dl: number;
  glucose_status: string;
  recommendations: string[];
}

interface PatientUser {
  name: string;
  phone: string;
  gender: string;
  age: number | string;
}

export default function PatientProfilePage() {
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [records, setRecords] = useState<ScreeningRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ScreeningRecord | null>(null);
  
  const [user, setUser] = useState<PatientUser>({
    name: "",
    phone: "",
    gender: "",
    age: "-",
  });

  // 1. Helper to calculate age dynamically from date_of_birth
  const calculateAge = (dobString?: string): number | string => {
    if (!dobString) return "-";
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return "-";
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  // 2. Fetch & parse user info from localStorage
  const loadStoredUserInfo = useCallback((): PatientUser | null => {
    try {
      // Check potential keys used during login/registration
      const raw = localStorage.getItem("patient_user") || localStorage.getItem("user_info");
      if (!raw) return null;

      const parsed = JSON.parse(raw);

      // Normalize fields whether they came from raw backend schema or formatted storage
      const name = parsed.fullname || parsed.name || "មិនស្គាល់ (Unknown)";
      const phone = parsed.phone_number || parsed.phone || "-";
      
      const genderRaw = (parsed.gender || "").toLowerCase();
      const gender =
        genderRaw === "male" || genderRaw === "m" || genderRaw.includes("ប្រុស")
          ? "ប្រុស (Male)"
          : genderRaw === "female" || genderRaw === "f" || genderRaw.includes("ស្រី")
          ? "ស្រី (Female)"
          : parsed.gender || "-";

      const age = parsed.age ? parsed.age : calculateAge(parsed.date_of_birth);

      const resolvedUser: PatientUser = { name, phone, gender, age };
      setUser(resolvedUser);
      return resolvedUser;
    } catch (e) {
      console.error("Failed to parse user info from localStorage:", e);
      return null;
    }
  }, []);

  // 3. Fetch Screening Records via apiService
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const res = await apiService("/kch-api/api/v1/assessment/me", "GET");
      
      // Handle both { data: [...] } and raw array [...] responses
      const recordsList: ScreeningRecord[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];

      if (recordsList.length > 0) {
        setRecords(recordsList);
        setSelectedRecord(recordsList[0]);
      } else {
        setRecords([]);
        setSelectedRecord(null);
      }
    } catch (err: any) {
      console.error("Error fetching patient history:", err);
      setFetchError(
        err?.message || "មិនអាចទាញយកប្រវត្តិពិនិត្យសុខភាពបានទេ (Failed to load screening records)"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Data Load
  useEffect(() => {
    loadStoredUserInfo();
    fetchRecords();
  }, [loadStoredUserInfo, fetchRecords]);

  const handleLogout = () => {
    localStorage.removeItem("patient_token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("patient_user");
    localStorage.removeItem("user_info");
    navigate("/patient/login");
  };

  return (
    <div className="min-h-screen bg-[#073B35] flex flex-col font-['Noto_Sans_Khmer',sans-serif] text-slate-800">
      {/* Top Bar Header */}
      <header className="bg-[#0A4D44] border-b border-teal-700/50 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00A884] flex items-center justify-center text-white shadow-md">
            <Heart size={20} />
          </div>
          <div>
            <h1 className="font-['Moul'] text-sm text-teal-100">ទូរសុខភាពសហគមន៍ខ្មែរ · KCH</h1>
            <p className="text-[11px] text-teal-300">ប្រព័ន្ធតាមដានសុខភាពបឋម (Patient Health Portal)</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-teal-900/60 px-3 py-1.5 rounded-xl border border-teal-700">
            <User size={15} className="text-teal-300" />
            <span className="text-xs font-semibold">{user.name || "..."}</span>
            <span className="text-xs text-teal-400 font-mono">({user.phone || "..."})</span>
          </div>
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex items-center gap-1.5 bg-red-500/20 text-red-300 hover:bg-red-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
          >
            <LogOut size={14} />
            <span>ចាកចេញ</span>
          </button>

          <LogoutModal 
            isOpen={isLogoutModalOpen} 
            onClose={() => setIsLogoutModalOpen(false)}
            // onConfirm={handleLogout}
          />
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        {/* Left Column: History List & User Card (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto">
          {/* User Quick Info */}
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
            <div className="flex items-center gap-3.5 mb-3">
              <div className="w-12 h-12 rounded-full bg-teal-100 text-[#0A4D44] font-bold text-lg flex items-center justify-center">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-base">{user.name || "មិនស្គាល់"}</h2>
                <p className="text-xs text-slate-500">{user.gender} · {user.age} ឆ្នាំ (yrs)</p>
              </div>
            </div>
            <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">ទូរស័ព្ទ:</span>
                <span className="font-mono font-bold text-slate-700">{user.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ចំនួនពិនិត្យសរុប:</span>
                <span className="font-bold text-teal-800">{records.length} លើក</span>
              </div>
            </div>
          </div>

          {/* Past Screenings List */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100 flex-1 flex flex-col min-h-[300px]">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">
              ប្រវត្តិពិនិត្យកន្លងមក (History)
            </p>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-teal-700 gap-2">
                <Loader2 className="animate-spin" size={24} />
                <span className="text-xs">កំពុងទាញយកទិន្នន័យ...</span>
              </div>
            ) : fetchError ? (
              <div className="flex-1 flex flex-col items-center justify-center text-red-500 p-4 text-center gap-2">
                <AlertCircle size={24} />
                <span className="text-xs">{fetchError}</span>
                <button
                  onClick={fetchRecords}
                  className="mt-2 text-xs bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg border border-teal-200 hover:bg-teal-100"
                >
                  ព្យាយាមម្តងទៀត
                </button>
              </div>
            ) : records.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <p className="text-xs">ពុំទាន់មានប្រវត្តិពិនិត្យសុខភាពនៅឡើយទេ</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto pr-1">
                {records.map((r) => {
                  const active = selectedRecord?.id === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRecord(r)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                        active
                          ? "bg-teal-50/70 border-[#00A884] ring-2 ring-teal-100"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar size={13} className="text-teal-700" />
                          <span className="font-bold text-xs text-slate-800 font-mono">{r.date}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({r.id})</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          BP: <strong className="text-slate-700 font-mono">{r.sys_bp}/{r.dia_bp}</strong> · Glucose: <strong className="text-slate-700 font-mono">{r.glucose_mg_dl} mg/dL</strong>
                        </p>
                      </div>
                      <ChevronRight size={16} className={active ? "text-[#00A884]" : "text-slate-300"} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Record Details (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4 overflow-y-auto">
          {selectedRecord ? (
            <>
              {/* Main 4 Evaluation Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Card 1: Patient Info */}
                <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">ព័ត៌មាន</p>
                      <p className="text-[9px] text-slate-400">Patient Info</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="text-slate-400 text-[10px]">ឈ្មោះ / Name</p>
                    <p className="font-bold text-slate-800 truncate">{user.name}</p>
                    <p className="text-slate-400 text-[10px] pt-1">អាយុ / Age</p>
                    <p className="font-semibold text-slate-700">{user.age} ឆ្នាំ ({user.gender})</p>
                  </div>
                </div>

                {/* Card 2: Body Composition */}
                <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Scale size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">សមាសភាពរាងកាយ</p>
                      <p className="text-[9px] text-slate-400">Body Metrics</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between"><span className="text-slate-400 font-sans">កម្ពស់:</span> <strong>{selectedRecord.height_cm} cm</strong></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-sans">ទម្ងន់:</span> <strong>{selectedRecord.weight_kg} kg</strong></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-sans">BMI:</span> <strong>{selectedRecord.bmi}</strong></div>
                  </div>
                  <span className="mt-2 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-center truncate">
                    {selectedRecord.bmi_status}
                  </span>
                </div>

                {/* Card 3: Blood Pressure */}
                <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                      <Activity size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">សម្ពាធឈាម</p>
                      <p className="text-[9px] text-slate-400">Blood Pressure</p>
                    </div>
                  </div>
                  <div className="text-center my-1">
                    <p className="text-xl font-bold text-slate-800 font-mono">
                      {selectedRecord.sys_bp}/{selectedRecord.dia_bp}
                    </p>
                    <p className="text-[10px] text-slate-400">Pulse: {selectedRecord.pulse_bpm} bpm</p>
                  </div>
                  <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full text-center truncate">
                    {selectedRecord.bp_status}
                  </span>
                </div>

                {/* Card 4: Glucose */}
                <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#00A884] flex items-center justify-center">
                      <Droplet size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">ជាតិស្ករ AI</p>
                      <p className="text-[9px] text-slate-400">Glucose Group</p>
                    </div>
                  </div>
                  <div className="text-center my-1">
                    <p className="text-xl font-bold text-[#00A884] font-mono">
                      {selectedRecord.glucose_mg_dl} <span className="text-xs font-normal text-slate-400">mg/dL</span>
                    </p>
                    <p className="text-[10px] text-slate-400">Non-invasive PPG</p>
                  </div>
                  <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full text-center truncate">
                    {selectedRecord.glucose_status}
                  </span>
                </div>
              </div>

              {/* Recommendations Panel */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 flex-1">
                <h3 className="text-base font-bold text-[#0A4D44] font-['Moul'] mb-3">
                  ការណែនាំ (AI Recommendations)
                </h3>
                <ul className="space-y-3">
                  {selectedRecord.recommendations?.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                      <span className="w-2 h-2 rounded-full bg-[#00A884] mt-1.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Location: {selectedRecord.kiosk_id} · Ref: {selectedRecord.id}
                  </span>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 bg-[#00A884] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#008f70] transition-colors"
                  >
                    <Printer size={14} />
                    <span>បោះពុម្ពលទ្ធផល (Print)</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl p-12 shadow-lg border border-slate-100 flex flex-col items-center justify-center text-slate-400">
              <Activity size={40} className="stroke-1 text-slate-300 mb-2" />
              <p className="text-sm">សូមជ្រើសរើសការពិនិត្យមួយ ដើម្បីមើលព័ត៌មានលម្អិត</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}