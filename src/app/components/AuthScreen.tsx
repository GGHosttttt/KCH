import { useState } from "react";
import { useNavigate } from "react-router";
import { Phone, ArrowLeft, Delete, UserCheck } from "lucide-react";
import { motion } from "motion/react";

export function AuthScreen() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");

  const handleKeyClick = (num: string) => {
    if (phone.length < 10) setPhone((prev) => prev + num);
  };

  const handleClear = () => setPhone("");
  const handleDelete = () => setPhone((prev) => prev.slice(0, -1));

  const handlePhoneLogin = () => {
    if (phone.length >= 8) {
      sessionStorage.setItem("authType", "phone");
      sessionStorage.setItem("userPhone", phone);
      navigate("/questions/personal");
    }
  };

  const handleGuestLogin = () => {
    sessionStorage.setItem("authType", "guest");
    sessionStorage.removeItem("userPhone");
    navigate("/questions/personal");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 text-teal-800 bg-white/80 backdrop-blur px-4 py-2 rounded-lg shadow-sm font-bold active:scale-95 transition-transform"
        >
          <ArrowLeft size={24} />
          <span>ត្រឡប់ក្រោយ (Back)</span>
        </button>
      </div>

      <div className="pt-16 pb-4 px-6 text-center bg-white shadow-sm z-0 relative">
        <h1 className="font-['Moul'] text-2xl text-teal-900 mb-2">
          សូមបញ្ចូលព័ត៌មានរបស់អ្នកដើម្បីបន្ត
        </h1>
        <p className="text-lg text-slate-500">Please enter your details to proceed</p>
      </div>

      <div className="flex-1 p-6 grid grid-cols-2 gap-6 h-full max-h-[calc(100%-100px)] overflow-hidden">
        {/* Left Side: Keypad */}
        <div className="bg-white rounded-3xl shadow-lg p-6 flex flex-col justify-between border border-slate-100 h-full">
          <div>
            <label className="flex items-center space-x-2 text-slate-700 text-lg font-bold mb-3">
              <Phone size={24} className="text-teal-600" />
              <span>លេខទូរស័ព្ទដៃ (Phone Number)</span>
            </label>
            <div className="bg-slate-50 border-2 border-teal-200 rounded-2xl p-3 flex items-center justify-between shadow-inner h-16">
              <span className={`text-3xl tracking-widest font-mono ${phone ? "text-teal-900" : "text-slate-300"}`}>
                {phone || "012345678"}
              </span>
              {phone && (
                <button
                  onClick={handleDelete}
                  className="text-slate-400 hover:text-red-500 p-2 active:scale-90 transition-transform"
                >
                  <Delete size={28} />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 flex-1 content-end">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyClick(num.toString())}
                className="bg-slate-50 hover:bg-teal-50 active:bg-teal-100 border border-slate-200 rounded-xl py-4 text-2xl font-bold text-slate-700 shadow-sm transition-colors"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="bg-slate-200 hover:bg-slate-300 active:bg-slate-400 border border-slate-300 rounded-xl py-3 text-lg font-bold text-slate-700 shadow-sm transition-colors"
            >
              លុប<br />
              <span className="text-xs font-normal">Clear</span>
            </button>
            <button
              onClick={() => handleKeyClick("0")}
              className="bg-slate-50 hover:bg-teal-50 active:bg-teal-100 border border-slate-200 rounded-xl py-4 text-2xl font-bold text-slate-700 shadow-sm transition-colors"
            >
              0
            </button>
            <button
              onClick={handlePhoneLogin}
              className={`${phone.length >= 8 ? "bg-teal-600 hover:bg-teal-700" : "bg-teal-300 cursor-not-allowed"} border border-teal-700 rounded-xl py-3 text-lg font-bold text-white shadow-md transition-colors`}
            >
              បញ្ជាក់<br />
              <span className="text-xs font-normal">Confirm</span>
            </button>
          </div>
        </div>

        {/* Right Side: Guest Login */}
        <div className="bg-gradient-to-br from-slate-800 to-teal-900 rounded-3xl shadow-xl p-6 flex flex-col items-center justify-center relative overflow-hidden border-4 border-slate-700">
          <div className="absolute inset-0 opacity-5 pointer-events-none flex flex-wrap gap-10 items-center justify-center">
            {[...Array(12)].map((_, i) => (
              <UserCheck key={i} size={32} className="text-white" />
            ))}
          </div>

          <div className="z-10 text-center mb-8">
            <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/20 shadow-lg">
              <UserCheck size={40} className="text-teal-300" />
            </div>
            <h2 className="font-['Moul'] text-xl text-white mb-2 leading-relaxed">
              ចូលប្រើប្រាស់លើកដំបូង
            </h2>
            <p className="text-slate-300 text-base">First-time use / Guest Access</p>
          </div>

          <motion.button
            onClick={handleGuestLogin}
            whileTap={{ scale: 0.97 }}
            className="z-10 w-full bg-teal-500 hover:bg-teal-400 text-white font-bold text-xl py-4 rounded-xl shadow-lg border-2 border-teal-400/50 transition-all active:scale-95"
          >
            <span className="font-['Moul'] block mb-1">ចូលជាភ្ញៀវ</span>
            <span className="text-sm font-normal opacity-80">Continue as Guest</span>
          </motion.button>

          <p className="mt-6 text-slate-400 text-sm text-center z-10">
            គ្មានគណនីដែរ? ចូលប្រើដោយគ្មានលេខទូរស័ព្ទ
            <br />
            <span className="text-slate-500">(No account? Access without a phone number)</span>
          </p>
        </div>
      </div>
    </div>
  );
}
