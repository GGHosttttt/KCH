import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  Heart,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Activity,
} from "lucide-react";
import apiService from "../../../../services/apiService";
import logo from "../../../../src/assets/KCH-white-logo.png";

export default function PatientLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId =
    searchParams.get("session_id") || searchParams.get("session");

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. If user is already authenticated:
  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (token) {
      if (sessionId) {
        // Forward to the pairing confirmation screen with search params
        navigate(`/pairing?session=${sessionId}`, { replace: true });
      } else {
        navigate("/patient/profile", { replace: true });
      }
    }
  }, [sessionId, navigate]);

  // 2. Handle Login Submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      setError(
        "សូមបញ្ចូលលេខទូរស័ព្ទ និងពាក្យសម្ងាត់ (Please fill in all fields)",
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("phone_number", phone);
      formData.append("password", password);

      const res = await apiService(
        "/kch-api/api/v1/auth/login",
        "POST",
        formData,
      );

      const token =
        res?.data?.access_token ||
        res?.data?.token ||
        res?.access_token ||
        res?.token;

      const user = res?.data?.user || res?.data?.user_info || res?.data;

      if (token) {
        localStorage.setItem("access_token", token);
        if (user) {
          localStorage.setItem("user_info", JSON.stringify(user));
        }

        // Forward to /pairing screen so the user can verify & claim
        if (sessionId) {
          navigate(`/pairing?session=${sessionId}`, { replace: true });
        } else {
          navigate("/patient/profile");
        }
      } else {
        setError(
          "លេខទូរស័ព្ទ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ (Invalid credentials)",
        );
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "លេខទូរស័ព្ទ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ (Invalid credentials)",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-800 to-teal-900 flex flex-col justify-between p-4 font-['Noto_Sans_Khmer',sans-serif] relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none flex flex-wrap gap-12 items-center justify-center">
        {[...Array(20)].map((_, i) => (
          <Activity key={i} size={48} className="text-teal-200" />
        ))}
      </div>

      <div className="absolute top-8 left-8 flex items-center space-x-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
          <img
            src={logo}
            alt="Logo"
            className="w-full h-full object-contain p-2"
          />
        </div>

        <div>
          <h2 className="font-['Moul'] text-xl tracking-wider text-teal-50">
            ទូរសុខភាពសហគមន៍ខ្មែរ
          </h2>
          <p className="text-teal-200 text-sm">Khmer Community Health</p>
        </div>
      </div>

      {/* <div className="z-10 text-center max-w-4xl ">
        <div className="flex justify-center">
          <Heart
            size={80}
            className="text-teal-300 drop-shadow-xl"
            strokeWidth={1.5}
          />
        </div>
      </div> */}

      {/* Form Card */}
      <div className="w-full max-w-md mx-auto my-auto z-10">
        <div className="bg-white rounded-3xl p-7 shadow-2xl border border-teal-800/30">
          <div className="text-center mb-6">
            <h1 className="font-['Moul'] text-xl text-[#0A4D44] mb-1 leading-relaxed">
              ចូលពិនិត្យសុខភាព
            </h1>
            <p className="text-xs text-slate-500">
              {sessionId
                ? "ចូលគណនីដើម្បីភ្ជាប់ទៅកាន់ទូរសុខភាព (Sign in to pair with Kiosk)"
                : "Sign in to view your screening records"}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                លេខទូរស័ព្ទ (Phone Number)
              </label>
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3.5 py-3 bg-slate-50 focus-within:bg-white focus-within:border-teal-600 transition-colors">
                <Smartphone size={18} className="text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="012 345 678"
                  className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ពាក្យសម្ងាត់ (Password)
              </label>
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3.5 py-3 bg-slate-50 focus-within:bg-white focus-within:border-teal-600 transition-colors">
                <Lock size={18} className="text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-[#00A884] hover:bg-[#008f70] active:scale-[0.98] text-white font-bold rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>កំពុងផ្ទៀងផ្ទាត់...</span>
                </>
              ) : (
                <span>ចូលប្រើប្រាស់ (Sign In)</span>
              )}
            </button>
          </form>

          <div className="mt-5 text-center flex flex-col gap-2">
            <button
              type="button"
              onClick={() =>
                navigate(
                  sessionId
                    ? `/patient/register?session_id=${sessionId}`
                    : "/patient/register",
                )
              }
              className="text-xs text-teal-800 font-semibold hover:underline"
            >
              បង្កើតគណនីថ្មី (Register Account)
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-3 text-[11px] text-teal-200/60 z-10">
        ទូរសុខភាពសហគមន៍ខ្មែរ · Khmer Community Health Kiosk
      </div>
    </div>
  );
}
