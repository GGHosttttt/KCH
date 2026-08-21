// src/features/auth/MobilePairingPage.tsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Smartphone,
  ShieldCheck,
  User,
} from "lucide-react";
import apiService from "../../../services/apiService";

export default function MobilePairingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sessionId = searchParams.get("session");

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  // const [userPhone, setUserPhone] = useState<string>("");

  // Auto-detect logged-in user or check token
  //   const token =
  //     localStorage.getItem("token") || sessionStorage.getItem("accessToken");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setErrorMessage(
        "មិនមាន Session ID ត្រឹមត្រូវទេ (Missing or invalid session ID)",
      );
    }
  }, [sessionId]);

  const handleConfirmPairing = async () => {
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

      // Matches { code: 200, msg: "success", data: ... }
      if (res?.code === 200 || res?.msg === "success") {
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
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-700 w-full flex items-center justify-center gap-1.5">
                <ShieldCheck size={16} />
                <span>Connected to Session: {sessionId?.slice(0, 8)}...</span>
              </div>
            </div>
          )}

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
              <button
                onClick={() => handleConfirmPairing()}
                className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200"
              >
                ព្យាយាមម្តងទៀត (Try Again)
              </button>
            </div>
          )}

          {status === "idle" && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="font-bold text-slate-800 text-base">
                  បញ្ជាក់ការចូលប្រើប្រាស់
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirm account sync with the kiosk station
                </p>
              </div>

              {/* If user doesn't have a token saved, allow entering phone or auto-fill */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  លេខទូរស័ព្ទ (Phone Number)
                </label>
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus-within:bg-white focus-within:border-teal-500">
                  <User size={18} className="text-slate-400" />
                  <input
                    type="tel"
                    // onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="012 345 678"
                    className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <button
                onClick={() => handleConfirmPairing()}
                // disabled={!userPhone}
                className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 active:scale-[0.98] disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
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
