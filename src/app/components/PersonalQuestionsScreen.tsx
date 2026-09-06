import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Phone,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { motion } from "motion/react";
import { useCheckupStore } from "../../stores/useCheckupStore";
import apiService from "../../../services/apiService";

type Gender = "male" | "female" | null;

export function PersonalQuestionsScreen() {
  const navigate = useNavigate();

  // Global checkup store
  const { user, setUser, questionnaire, updateQuestionnaire } =
    useCheckupStore();

  const [authType, setAuthType] = useState<string>("guest");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>(null);
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Initialize and pre-fill if authenticated from phone/QR
  useEffect(() => {
    const type =
      sessionStorage.getItem("authType") ||
      (user?.is_guest ? "guest" : "phone");
    setAuthType(type);

    // 1. Pre-fill from store if available
    if (user) {
      if (user.fullname) setName(user.fullname);
      if (user.gender) setGender(user.gender as Gender);
      if (user.phone_number) setPhone(user.phone_number);

      if (user.date_of_birth) {
        const parts = user.date_of_birth.split("-");
        if (parts.length === 3) {
          setDobYear(parts[0]);
          setDobMonth(parts[1]);
          setDobDay(parts[2]);
        }
      }
    } else {
      // 2. Fallback check for session storage items
      const savedPhone = sessionStorage.getItem("userPhone");
      const savedName = sessionStorage.getItem("userName");
      const savedGender = sessionStorage.getItem("userGender") as Gender;
      const savedDOB = sessionStorage.getItem("userDOB");

      if (savedPhone) setPhone(savedPhone);
      if (savedName) setName(savedName);
      if (savedGender) setGender(savedGender);
      if (savedDOB) {
        const parts = savedDOB.split("-");
        if (parts.length === 3) {
          setDobYear(parts[0]);
          setDobMonth(parts[1]);
          setDobDay(parts[2]);
        }
      }
    }

    // 3. Fallback check from questionnaire slice
    if (questionnaire.gender && !gender) {
      setGender(questionnaire.gender as Gender);
    }
  }, []);

  // Validation: Guest requires valid phone (>=8 digits), paired user phone is verified
  const isPhoneValid =
    authType === "phone" || phone.replace(/\D/g, "").length >= 8;

  const canProceed =
    name.trim().length >= 2 &&
    gender !== null &&
    Boolean(dobDay) &&
    Boolean(dobMonth) &&
    Boolean(dobYear) &&
    isPhoneValid;

  // Calculate age for the assessment engine
  const calculateAge = (year: number, month: number, day: number): number => {
    const today = new Date();
    let age = today.getFullYear() - year;
    const m = today.getMonth() + 1 - month;
    if (m < 0 || (m === 0 && today.getDate() < day)) {
      age--;
    }
    return Math.max(age, 1);
  };

  const handleNext = async () => {
    if (!canProceed || !gender) {
      return;
    }

    const formattedDOB = `${dobYear}-${dobMonth.padStart(2, "0")}-${dobDay.padStart(2, "0")}`;
    const calculatedAge = calculateAge(
      parseInt(dobYear, 10),
      parseInt(dobMonth, 10),
      parseInt(dobDay, 10),
    );

    let assignedUserId = user?.id;

    // Guest Flow: Provision or retrieve a guest token
    if (authType === "guest") {
      try {
        setLoading(true);
        const dataPayload = {
          fullname: name.trim(),
          phone_number: phone.trim(),
          gender,
          date_of_birth: formattedDOB,
        };

        const res = await apiService(
          "/kch-api/api/v1/auth/guest",
          "POST",
          dataPayload,
        );

        const token = res?.data?.token || res?.data?.access_token || res?.token;
        if (token) {
          sessionStorage.setItem("access_token", token);
          localStorage.setItem("access_token", token);
        }

        if (res?.data?.user?.id) {
          assignedUserId = res.data.user.id;
        }
      } catch (err) {
        console.error("Guest provisioning failed:", err);
      } finally {
        setLoading(false);
      }
    }

    // 1. Update Global User
    const userData = {
      id: assignedUserId,
      fullname: name.trim(),
      gender: gender,
      phone_number: phone,
      date_of_birth: formattedDOB,
      is_guest: authType === "guest",
    };
    setUser(userData);

    // 2. Update Questionnaire (maps directly to q.age & q.gender on the backend)
    updateQuestionnaire({
      age: calculatedAge,
      gender: gender,
    });

    // 3. Keep sessionStorage in sync for page refreshes
    sessionStorage.setItem("userName", name.trim());
    sessionStorage.setItem("userGender", gender);
    sessionStorage.setItem("userDOB", formattedDOB);
    sessionStorage.setItem("userAge", calculatedAge.toString());
    sessionStorage.setItem("userPhone", phone);

    navigate("/questions/hypertension");
  };

  const months = [
    { num: "01", name: "មករា (Jan)" },
    { num: "02", name: "កុម្ភៈ (Feb)" },
    { num: "03", name: "មីនា (Mar)" },
    { num: "04", name: "មេសា (Apr)" },
    { num: "05", name: "ឧសភា (May)" },
    { num: "06", name: "មិថុនា (Jun)" },
    { num: "07", name: "កក្កដា (Jul)" },
    { num: "08", name: "សីហា (Aug)" },
    { num: "09", name: "កញ្ញា (Sep)" },
    { num: "10", name: "តុលា (Oct)" },
    { num: "11", name: "វិច្ឆិកា (Nov)" },
    { num: "12", name: "ធ្នូ (Dec)" },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 relative font-['Noto_Sans_Khmer',sans-serif]">
      {/* Top Floating Navigation Header */}
      <div className="absolute top-4 left-6 z-10 flex justify-between items-center w-[calc(100%-3rem)] bg-white/95 backdrop-blur py-2.5 px-4 rounded-2xl shadow-sm border border-slate-100">
        <button
          type="button"
          onClick={() => navigate("/auth")}
          className="flex items-center space-x-2 text-teal-800 font-bold active:scale-95 transition-transform"
        >
          <ArrowLeft size={22} />
          <span>ត្រឡប់ក្រោយ (Back)</span>
        </button>

        {/* Step Indicator */}
        <div className="flex items-center space-x-3 text-slate-500 text-sm font-medium">
          <span className="bg-teal-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs shadow-sm">
            ១
          </span>
          <span className="text-slate-300">—</span>
          <span className="bg-slate-100 text-slate-400 rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs">
            ២
          </span>
          <span className="text-slate-300">—</span>
          <span className="bg-slate-100 text-slate-400 rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs">
            ៣
          </span>
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed || loading}
          className={`flex items-center space-x-2 px-6 py-2 rounded-xl shadow-md font-bold active:scale-95 transition-all text-sm ${
            canProceed && !loading
              ? "text-white bg-[#00A884] hover:bg-[#008f70]"
              : "text-slate-400 bg-slate-200 cursor-not-allowed shadow-none"
          }`}
        >
          <span>{loading ? "កំពុងដំណើរការ..." : "បន្ត (Next)"}</span>
          <ArrowRight size={20} />
        </button>
      </div>

      {/* Screen Title */}
      <div className="pt-20 pb-4 px-6 text-center bg-white border-b border-slate-100 shadow-sm">
        <h1 className="font-['Moul'] text-2xl text-[#0A4D44] mb-1">
          ព័ត៌មានផ្ទាល់ខ្លួន
        </h1>
        <p className="text-sm text-slate-500">
          {authType === "guest"
            ? "សូមបំពេញព័ត៌មានបឋមរបស់អ្នក (Please enter your details)"
            : "ផ្ទៀងផ្ទាត់ព័ត៌មានគណនីរបស់អ្នក (Verify your account details)"}
        </p>
      </div>

      {/* Form Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Paired Status Banner */}
          {authType === "phone" && (
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3.5 flex items-center gap-3 text-teal-800 text-xs font-medium">
              <CheckCircle2
                size={18}
                className="text-[#00A884] flex-shrink-0"
              />
              <span>
                បានភ្ជាប់ជាមួយទូរស័ព្ទជោគជ័យ!
                ព័ត៌មានត្រូវបានបញ្ចូលដោយស្វ័យប្រវត្តិ (Synced via mobile
                account).
              </span>
            </div>
          )}

          {/* Full Name */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5"
          >
            <label className="flex items-center space-x-2 text-slate-700 font-bold mb-2 text-base">
              <User size={20} className="text-teal-600" />
              <span>គោត្តនាម និងនាម (Full Name)</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ឧទាហរណ៍៖ ច័ន្ទ ណារិទ្ធ (e.g. Chan Narith)"
              className="w-full bg-slate-50 border-2 border-teal-100 rounded-xl p-3 text-lg text-slate-800 placeholder-slate-300 focus:outline-none focus:border-teal-500 focus:bg-white transition-all font-medium"
            />
          </motion.div>

          {/* Gender */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5"
          >
            <label className="text-slate-700 font-bold mb-2.5 text-base block">
              ភេទ (Gender) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setGender("male")}
                className={`py-3.5 rounded-2xl border-2 font-bold text-base transition-all flex items-center justify-center gap-2 ${
                  gender === "male"
                    ? "bg-teal-50 border-[#00A884] text-[#0A4D44] ring-2 ring-teal-100 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="text-2xl">👨</span>
                <span>ប្រុស (Male)</span>
              </button>
              <button
                type="button"
                onClick={() => setGender("female")}
                className={`py-3.5 rounded-2xl border-2 font-bold text-base transition-all flex items-center justify-center gap-2 ${
                  gender === "female"
                    ? "bg-teal-50 border-[#00A884] text-[#0A4D44] ring-2 ring-teal-100 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="text-2xl">👩</span>
                <span>ស្រី (Female)</span>
              </button>
            </div>
          </motion.div>

          {/* Date of Birth */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5"
          >
            <label className="flex items-center space-x-2 text-slate-700 font-bold mb-2 text-base">
              <Calendar size={20} className="text-teal-600" />
              <span>ថ្ងៃខែឆ្នាំកំណើត (Date of Birth)</span>
              <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-slate-400 mb-1 text-xs font-semibold">
                  ថ្ងៃ (Day)
                </p>
                <select
                  value={dobDay}
                  onChange={(e) => setDobDay(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-teal-100 rounded-xl p-3 text-base font-semibold text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white font-mono"
                >
                  <option value="">--</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d.toString().padStart(2, "0")}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-slate-400 mb-1 text-xs font-semibold">
                  ខែ (Month)
                </p>
                <select
                  value={dobMonth}
                  onChange={(e) => setDobMonth(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-teal-100 rounded-xl p-3 text-base font-semibold text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
                >
                  <option value="">--</option>
                  {months.map((m) => (
                    <option key={m.num} value={m.num}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-slate-400 mb-1 text-xs font-semibold">
                  ឆ្នាំ (Year)
                </p>
                <select
                  value={dobYear}
                  onChange={(e) => setDobYear(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-teal-100 rounded-xl p-3 text-base font-semibold text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white font-mono"
                >
                  <option value="">----</option>
                  {Array.from(
                    { length: 100 },
                    (_, i) => new Date().getFullYear() - i,
                  ).map((y) => (
                    <option key={y} value={y.toString()}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Phone Number */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`bg-white rounded-2xl shadow-sm border p-5 ${
              authType === "guest"
                ? "border-slate-200"
                : "border-teal-200 bg-teal-50/20"
            }`}
          >
            <label className="flex items-center justify-between text-slate-700 font-bold mb-2 text-base">
              <span className="flex items-center space-x-2">
                <Phone size={20} className="text-teal-600" />
                <span>លេខទូរស័ព្ទដៃ (Phone Number)</span>
                {authType === "guest" && (
                  <span className="text-red-500">*</span>
                )}
              </span>
              {authType === "phone" && (
                <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-normal">
                  ផ្ទៀងផ្ទាត់រួច (Verified)
                </span>
              )}
            </label>
            <input
              type="tel"
              value={phone}
              disabled={authType === "phone"}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="ឧទាហរណ៍៖ 012345678"
              className={`w-full border-2 rounded-xl p-3 text-lg font-mono transition-all ${
                authType === "phone"
                  ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-slate-50 border-teal-100 text-slate-800 placeholder-slate-300 focus:outline-none focus:border-teal-500 focus:bg-white"
              }`}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
