import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Smartphone,
  ShieldCheck,
  User,
  LogIn,
} from "lucide-react";
import apiService from "../../../services/apiService";

interface PatientUser {
  id?: string;
  name?: string;
  fullname?: string;
  phone?: string;
  phone_number?: string;
  gender?: string;
}

export default function MobilePairingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Supports either ?session=xxx or ?session_id=xxx from QR code
  const sessionId =
    searchParams.get("session") || searchParams.get("session_id");

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<PatientUser | null>(null);

  // 1. Check Authentication on Mount
  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setErrorMessage(
        "មិនមាន Session ID ត្រឹមត្រូវទេ (Missing or invalid session ID)",
      );
      return;
    }

    const token = localStorage.getItem("access_token");

    const savedUser = localStorage.getItem("user_info");

    // If no token exists, redirect user to login with the session preserved
    if (!token) {
      navigate(`/patient/login?session_id=${sessionId}`, { replace: true });
      return;
    }

    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse local user profile:", e);
      }
    }
  }, [sessionId, navigate]);

  // 2. Claim Kiosk Session (Transmits token automatically via apiService)
  const handleConfirmPairing = async () => {
    console.log('Proccessing')
    if (!sessionId) return;

    try {
      setStatus("loading");

      const payload = {
        session_id: sessionId,
      };

      const res = await apiService(
        "/kch-api/api/v1/kiosk/session/claim",
        "POST",
        payload,
      );

      // Matches { code: 200, msg: "success" } or { status: "SUCCESS" }
      if (
        res?.code === 200 ||
        res?.msg === "success" ||
        res?.status === "SUCCESS" ||
        res?.status === 200
      ) {
        setStatus("success");
      } else {
        throw new Error(
          res?.data?.message ||
            res?.msg ||
            "បរាជ័យក្នុងការភ្ជាប់ (Failed to confirm pairing)",
        );
      }
    } catch (err: any) {
      console.error("Pairing Error:", err);
      setStatus("error");
      setErrorMessage(
        err.message || "មិនអាចភ្ជាប់ទៅកាន់ Kiosk បានទេ សូមព្យាយាមម្តងទៀត",
      );
    }
  };

  const displayName =
    currentUser?.fullname ||
    currentUser?.name ||
    "អ្នកប្រើប្រាស់ (Authenticated Patient)";
  const displayPhone = currentUser?.phone_number || currentUser?.phone || "";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-['Noto_Sans_Khmer',sans-serif]">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-teal-800 to-teal-600 p-6 text-white text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur border border-white/30">
            <Smartphone size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold font-['Moul']">KCH Tele-Health</h1>
          <p className="text-xs text-teal-100 mt-1">
            ការភ្ជាប់ទូរស័ព្ទជាមួយទូរសុខភាព (Kiosk Pairing)
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* Loading State */}
          {status === "loading" && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-teal-600 animate-spin" />
              <div>
                <p className="font-bold text-slate-800 text-base">
                  កំពុងផ្ទៀងផ្ទាត់...
                </p>
                <p className="text-xs text-slate-400">
                  Verifying session with Kiosk
                </p>
              </div>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-emerald-800">
                  ភ្ជាប់បានជោគជ័យ!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  ទូរសុខភាព (Kiosk) បានទទួលព័ត៌មានរបស់អ្នករួចរាល់ហើយ។
                  សូមក្រឡេកមើលអេក្រង់ Kiosk ដើម្បីបន្ត។
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-700 w-full flex items-center justify-center gap-1.5 font-mono">
                <ShieldCheck size={16} />
                <span>Session: {sessionId?.slice(0, 8)}...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                <AlertCircle size={36} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-red-800">
                  មានបញ្ហាក្នុងការភ្ជាប់
                </h3>
                <p className="text-xs text-slate-500 mt-1">{errorMessage}</p>
              </div>
              <div className="flex flex-col gap-2 w-full pt-2">
                <button
                  onClick={handleConfirmPairing}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-colors"
                >
                  ព្យាយាមម្តងទៀត (Try Again)
                </button>
                <button
                  onClick={() =>
                    navigate(`/patient/login?session_id=${sessionId}`)
                  }
                  className="w-full py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <LogIn size={14} />
                  <span>ចូលគណនីផ្សេងទៀត (Switch Account)</span>
                </button>
              </div>
            </div>
          )}

          {/* Idle / Confirmation State */}
          {status === "idle" && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="font-bold text-slate-800 text-base">
                  បញ្ជាក់ការភ្ជាប់គណនី
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirm account sync with the kiosk station
                </p>
              </div>

              {/* User Account Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0">
                  <User size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {displayName}
                  </p>
                  {displayPhone && (
                    <p className="text-xs text-slate-500 font-mono">
                      {displayPhone}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 text-[11px] text-teal-800 flex items-center gap-2">
                <ShieldCheck
                  size={16}
                  className="text-teal-600 flex-shrink-0"
                />
                <span>
                  ព័ត៌មានសុខភាពរបស់អ្នកនឹងត្រូវបានធ្វើសមកាលកម្មជាមួយទូរសុខភាពដោយសុវត្ថិភាព។
                </span>
              </div>

              <button
                onClick={handleConfirmPairing}
                className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-lg transition-all"
              >
                យល់ព្រមភ្ជាប់ (Confirm & Pair)
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            © 2026 Khmer Community Health Tele-Kiosk
          </p>
        </div>
      </div>
    </div>
  );
}
