import React, { useState } from "react";
import {
  User,
  Phone,
  Lock,
  Calendar,
  Eye,
  EyeOff,
  Heart,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import apiService from "../../../../services/apiService";
import { useNavigate } from "react-router-dom";

interface RegisterFormData {
  fullname: string;
  password: string;
  gender: "male" | "female";
  date_of_birth: string;
  phone_number: string;
}

export default function RegisterProfilePage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RegisterFormData>({
    fullname: "",
    password: "",
    gender: "male",
    date_of_birth: "",
    phone_number: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenderSelect = (gender: "male" | "female") => {
    setFormData((prev) => ({ ...prev, gender }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Pack data into FormData format
      const dataPayload = new FormData();
      dataPayload.append("fullname", formData.fullname);
      dataPayload.append("phone_number", formData.phone_number);
      dataPayload.append("gender", formData.gender);
      dataPayload.append("date_of_birth", formData.date_of_birth);
      dataPayload.append("password", formData.password);

      // 2. Submit FormData to backend
      const res = await apiService(
        "/kch-api/api/v1/auth/register",
        "POST",
        dataPayload,
      );

      if (
        res?.code === 200 ||
        res?.msg === "success" ||
        res?.status === 200 ||
        res?.data
      ) {
        navigate("/patient/login");
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "ការចុះឈ្មោះមិនបានសម្រេច សូមព្យាយាមម្តងទៀត។ (Registration failed)",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#073B35] flex flex-col justify-between p-4 md:p-6 font-['Noto_Sans_Khmer',sans-serif] relative overflow-hidden text-slate-800">
      {/* Background Pulse Accent */}
      <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
        <Heart size={480} className="text-teal-300 stroke-[1]" />
      </div>

      {/* Top Header */}
      <header className="w-full max-w-lg mx-auto z-10 flex items-center justify-between">
        <a
          href="/patient/login"
          className="flex items-center gap-1.5 text-teal-100 bg-white/10 backdrop-blur px-3.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>ត្រឡប់ក្រោយ (Back)</span>
        </a>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#00A884] flex items-center justify-center text-white shadow-md">
            <Heart size={16} />
          </div>
          <span className="text-white text-xs font-bold font-mono tracking-wider">
            KCH Portal
          </span>
        </div>
      </header>

      {/* Main Registration Card */}
      <main className="w-full max-w-lg mx-auto my-6 z-10">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-teal-800/20">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-teal-50 text-[#00A884] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <User size={24} />
            </div>
            <h1 className="font-['Moul'] text-xl sm:text-2xl text-[#0A4D44] mb-1 leading-relaxed">
              បង្កើតគណនីថ្មី
            </h1>
            <p className="text-xs text-slate-500">
              Create your Primary Health Screening account
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-red-700 text-xs">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                គោត្តនាម និងនាម (Full Name){" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus-within:bg-white focus-within:border-[#00A884] focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                <User size={18} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  name="fullname"
                  required
                  value={formData.fullname}
                  onChange={handleChange}
                  placeholder="ឧ. សុខ ណារិទ្ធ (e.g. Sok Narith)"
                  className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                លេខទូរស័ព្ទ (Phone Number){" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus-within:bg-white focus-within:border-[#00A884] focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                <Phone size={18} className="text-slate-400 flex-shrink-0" />
                <input
                  type="tel"
                  name="phone_number"
                  required
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="012 345 678"
                  className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none font-mono placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Gender Selection Chips & Date of Birth */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ភេទ (Gender) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenderSelect("male")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      formData.gender === "male"
                        ? "bg-teal-50 border-[#00A884] text-[#0A4D44] ring-2 ring-teal-100 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span>ប្រុស (Male)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenderSelect("female")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      formData.gender === "female"
                        ? "bg-teal-50 border-[#00A884] text-[#0A4D44] ring-2 ring-teal-100 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span>ស្រី (Female)</span>
                  </button>
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ថ្ងៃខែឆ្នាំកំណើត (DOB) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-[#00A884] focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                  <Calendar
                    size={16}
                    className="text-slate-400 flex-shrink-0"
                  />
                  <input
                    type="date"
                    name="date_of_birth"
                    required
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ពាក្យសម្ងាត់ (Password) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus-within:bg-white focus-within:border-[#00A884] focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                <Lock size={18} className="text-slate-400 flex-shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-[#00A884] hover:bg-[#008f70] active:scale-[0.98] text-white font-bold rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>កំពុងចុះឈ្មោះ... (Creating Account...)</span>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>ចុះឈ្មោះ (Register Account)</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              មានគណនីរួចហើយមែនទេ?{" "}
              <a
                href="/patient/login"
                className="text-[#00A884] hover:text-[#0A4D44] font-bold hover:underline ml-1"
              >
                ចូលប្រើប្រាស់ (Sign In)
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="text-center py-2 text-[11px] text-teal-200/60 z-10">
        ក្រសួងសុខាភិបាល · Khmer Community Health (Primary Health Screening)
      </footer>
    </div>
  );
}
