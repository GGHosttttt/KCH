import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, User, Phone, Calendar } from "lucide-react";
import { motion } from "motion/react";

type Gender = "male" | "female" | null;

export function PersonalQuestionsScreen() {
  const navigate = useNavigate();
  const [authType, setAuthType] = useState<string>("guest");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>(null);
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const type = sessionStorage.getItem("authType") || "guest";
    setAuthType(type);
  }, []);

  const isPhoneValid = authType === "phone" || phone.length >= 8;
  const canProceed = name.trim().length >= 2 && gender !== null && dobDay && dobMonth && dobYear && isPhoneValid;

  const handleNext = () => {
    if (!canProceed) return;
    sessionStorage.setItem("userName", name.trim());
    sessionStorage.setItem("userGender", gender!);
    sessionStorage.setItem("userDOB", `${dobYear}-${dobMonth}-${dobDay}`);
    if (authType === "guest") sessionStorage.setItem("userPhone", phone);
    navigate("/questions/hypertension");
  };

  const months = [
    "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
    "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 pt-8">
      {/* Nav */}
      <div className="absolute top-4 left-6 z-10 flex justify-between w-[calc(100%-3rem)] bg-white/90 backdrop-blur py-2 px-4 rounded-xl shadow-sm border border-slate-100">
        <button
          onClick={() => navigate("/auth")}
          className="flex items-center space-x-2 text-teal-800 font-bold active:scale-95 transition-transform"
        >
          <ArrowLeft size={24} />
          <span>ត្រឡប់ក្រោយ</span>
        </button>
        <div className="flex items-center space-x-3 text-slate-500 text-sm font-medium">
          <span className="bg-teal-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold">១</span>
          <span className="text-slate-300">—</span>
          <span className="bg-slate-200 text-slate-400 rounded-full w-7 h-7 flex items-center justify-center font-bold">២</span>
          <span className="text-slate-300">—</span>
          <span className="bg-slate-200 text-slate-400 rounded-full w-7 h-7 flex items-center justify-center font-bold">៣</span>
        </div>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`flex items-center space-x-2 px-6 py-2 rounded-lg shadow-sm font-bold active:scale-95 transition-all ${canProceed ? "text-white bg-teal-600 hover:bg-teal-700" : "text-slate-400 bg-slate-200 cursor-not-allowed"}`}
        >
          <span>បន្ត (Next)</span>
          <ArrowRight size={24} />
        </button>
      </div>

      {/* Header */}
      <div className="pt-16 pb-3 px-6 text-center bg-white shadow-sm">
        <h1 className="font-['Moul'] text-2xl text-teal-900 mb-1">ព័ត៌មានផ្ទាល់ខ្លួន</h1>
        <p className="text-lg text-slate-500">Personal Information</p>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">

          {/* Name */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl shadow-md border border-slate-200 p-5"
          >
            <label className="flex items-center space-x-2 text-slate-700 font-bold mb-3 text-lg">
              <User size={24} className="text-teal-600" />
              <span>ឈ្មោះពេញ (Full Name)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="សូមបញ្ចូលឈ្មោះរបស់អ្នក..."
              className="w-full bg-slate-50 border-2 border-teal-200 rounded-xl p-3 text-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:border-teal-400 transition-colors"
            />
          </motion.div>

          {/* Gender */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-md border border-slate-200 p-5"
          >
            <label className="text-slate-700 font-bold mb-3 text-lg block">
              ភេទ (Gender)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setGender("male")}
                className={`py-4 rounded-xl border-2 font-bold text-xl transition-all ${gender === "male" ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-200"}`}
              >
                <span className="text-3xl block mb-1">👨</span>
                ប្រុស (Male)
              </button>
              <button
                onClick={() => setGender("female")}
                className={`py-4 rounded-xl border-2 font-bold text-xl transition-all ${gender === "female" ? "bg-pink-50 border-pink-400 text-pink-700" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-pink-200"}`}
              >
                <span className="text-3xl block mb-1">👩</span>
                ស្រី (Female)
              </button>
            </div>
          </motion.div>

          {/* Date of Birth */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl shadow-md border border-slate-200 p-5"
          >
            <label className="flex items-center space-x-2 text-slate-700 font-bold mb-3 text-lg">
              <Calendar size={24} className="text-teal-600" />
              <span>ថ្ងៃខែឆ្នាំកំណើត (Date of Birth)</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-slate-500 mb-1 text-sm">ថ្ងៃ (Day)</p>
                <select
                  value={dobDay}
                  onChange={(e) => setDobDay(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-teal-200 rounded-xl p-3 text-lg text-slate-800 focus:outline-none focus:border-teal-400"
                >
                  <option value="">--</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d.toString().padStart(2, "0")}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-slate-500 mb-1 text-sm">ខែ (Month)</p>
                <select
                  value={dobMonth}
                  onChange={(e) => setDobMonth(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-teal-200 rounded-xl p-3 text-lg text-slate-800 focus:outline-none focus:border-teal-400"
                >
                  <option value="">--</option>
                  {months.map((m, i) => (
                    <option key={i} value={(i + 1).toString().padStart(2, "0")}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-slate-500 mb-1 text-sm">ឆ្នាំ (Year)</p>
                <select
                  value={dobYear}
                  onChange={(e) => setDobYear(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-teal-200 rounded-xl p-3 text-lg text-slate-800 focus:outline-none focus:border-teal-400"
                >
                  <option value="">----</option>
                  {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                    <option key={y} value={y.toString()}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Phone — only shown for guests */}
          {authType === "guest" && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-md border border-teal-100 p-5"
            >
              <label className="flex items-center space-x-2 text-slate-700 font-bold mb-3 text-lg">
                <Phone size={24} className="text-teal-600" />
                <span>លេខទូរស័ព្ទ (Phone Number)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="ឧទាហរណ៍៖ 012345678"
                className="w-full bg-slate-50 border-2 border-teal-200 rounded-xl p-3 text-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:border-teal-400 font-mono"
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
