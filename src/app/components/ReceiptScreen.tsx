import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Printer, LogOut, ArrowLeft, QrCode } from "lucide-react";
import { motion } from "motion/react";

function calcAge(dob: string): number {
  if (!dob) return 0;
  const [year, month, day] = dob.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age--;
  return age;
}

export function ReceiptScreen() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(45);

  const userName = sessionStorage.getItem("userName") || "---";
  const userDOB = sessionStorage.getItem("userDOB") || "";
  const userGender = sessionStorage.getItem("userGender") || "";
  const age = userDOB ? calcAge(userDOB) : "--";
  const genderLabel = userGender === "male" ? "Male" : userGender === "female" ? "Female" : "--";
  const receiptId = `RCPT-${Math.floor(100000 + Math.random() * 900000)}`;

  useEffect(() => {
    if (timeLeft <= 0) {
      navigate("/");
      return;
    }
    const timerId = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, navigate]);

  const handlePrint = () => {
    alert("Printing receipt... Please collect your paper.");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const timerUrgent = timeLeft <= 15;

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Nav bar */}
      <div className="absolute top-4 left-6 z-10 flex justify-between w-[calc(100%-3rem)] bg-white/90 backdrop-blur py-2 px-4 rounded-xl shadow-sm border border-slate-100">
        <button
          onClick={() => navigate("/results")}
          className="flex items-center space-x-2 text-teal-800 font-bold active:scale-95 transition-transform"
        >
          <ArrowLeft size={24} />
          <span>ត្រឡប់ក្រោយ</span>
        </button>
        <div className={`flex items-center space-x-2 font-bold ${timerUrgent ? "text-rose-600 animate-pulse" : "text-slate-500"}`}>
          <span>អេក្រង់នឹងបិទក្នុង (Auto-exit in):</span>
          <span className="font-mono text-xl">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Header */}
      <div className="pt-20 pb-4 px-8 text-center bg-white shadow-sm z-0">
        <h1 className="font-['Moul'] text-3xl text-teal-900 mb-2">វិក្កយបត្រលទ្ធផល</h1>
        <p className="text-xl text-slate-500">Receipt Preview</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex gap-6">
        {/* Left: Receipt */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-lg flex flex-col justify-center items-center py-4">
          <div className="w-[260px] bg-slate-50 p-4 border border-slate-300 shadow-md flex flex-col font-mono text-xs">
            {/* Header */}
            <div className="text-center mb-3 border-b border-dashed border-slate-400 pb-3">
              <h2 className="font-bold text-base mb-1">Khmer Community Health Kiosk</h2>
              <p className="text-[10px] text-slate-500">ទូរសុខភាពសហគមន៍ខ្មែរ</p>
              <p className="text-[10px] text-slate-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
            </div>

            {/* Patient Info */}
            <div className="space-y-1.5 mb-3 border-b border-dashed border-slate-400 pb-3">
              <p className="font-bold text-[10px] text-slate-600 uppercase">Patient Info</p>
              <div className="flex justify-between">
                <span>Receipt ID:</span>
                <span className="font-bold">{receiptId}</span>
              </div>
              <div className="flex justify-between">
                <span>Name:</span>
                <span className="font-bold">{userName}</span>
              </div>
              <div className="flex justify-between">
                <span>Age:</span>
                <span className="font-bold">{age} yrs</span>
              </div>
              <div className="flex justify-between">
                <span>Gender:</span>
                <span className="font-bold">{genderLabel}</span>
              </div>
            </div>

            {/* Body Metrics */}
            <div className="space-y-1.5 mb-3 border-b border-dashed border-slate-400 pb-3">
              <p className="font-bold text-[10px] text-slate-600 uppercase">Body Metrics</p>
              <div className="flex justify-between">
                <span>Height:</span>
                <span className="font-bold">165 cm</span>
              </div>
              <div className="flex justify-between">
                <span>Weight:</span>
                <span className="font-bold">62 kg</span>
              </div>
              <div className="flex justify-between">
                <span>BMI:</span>
                <span className="font-bold">22.8 (Normal)</span>
              </div>
            </div>

            {/* BP */}
            <div className="space-y-1.5 mb-3 border-b border-dashed border-slate-400 pb-3">
              <p className="font-bold text-[10px] text-slate-600 uppercase">Blood Pressure</p>
              <div className="flex justify-between">
                <span>BP:</span>
                <span className="font-bold text-rose-600">125/80 mmHg</span>
              </div>
              <div className="flex justify-between">
                <span>Pulse:</span>
                <span className="font-bold">76 bpm</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Status:</span>
                <span className="font-bold text-amber-600">Pre-hypertensive</span>
              </div>
            </div>

            {/* Glucose */}
            <div className="space-y-1.5 mb-4 border-b border-dashed border-slate-400 pb-3">
              <p className="font-bold text-[10px] text-slate-600 uppercase">AI Glucose</p>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-bold text-teal-600">Normal Range</span>
              </div>
            </div>

            {/* QR */}
            <div className="flex flex-col items-center justify-center">
              <QrCode size={70} className="text-slate-800 mb-1.5" />
              <p className="text-[9px] text-center text-slate-500">Scan to save digital copy</p>
            </div>
          </div>
        </div>

        {/* Right: Recommendations & Actions */}
        <div className="flex-1 flex flex-col gap-5">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 rounded-3xl shadow-md border border-slate-200 flex-1"
          >
            <h3 className="font-['Moul'] text-xl text-teal-900 mb-4">ការណែនាំ (AI Recommendations)</h3>
            <ul className="space-y-4 text-slate-700">
              <li className="flex gap-3 items-start">
                <span className="text-amber-500 text-xl mt-0.5">•</span>
                <span className="leading-relaxed">
                  ដោយសារសម្ពាធឈាមរបស់អ្នកស្ថិតក្នុងកម្រិតប្រឈមហានិភ័យដំបូង សូមកាត់បន្ថយការទទួលទានអាហារប្រៃ។
                  <span className="block text-slate-400 text-sm mt-1">(Due to pre-hypertensive BP, reduce sodium intake.)</span>
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-teal-500 text-xl mt-0.5">•</span>
                <span className="leading-relaxed">
                  រក្សាការហាត់ប្រាណឲ្យបានទៀងទាត់យ៉ាងហោចណាស់ ៣០ នាទីក្នុងមួយថ្ងៃ។
                  <span className="block text-slate-400 text-sm mt-1">(Exercise regularly for at least 30 min/day.)</span>
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-blue-500 text-xl mt-0.5">•</span>
                <span className="leading-relaxed">
                  ពិសាទឹកឲ្យបានច្រើន និងសម្រាកឲ្យបានគ្រប់គ្រាន់។
                  <span className="block text-slate-400 text-sm mt-1">(Drink plenty of water and get enough rest.)</span>
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-green-500 text-xl mt-0.5">•</span>
                <span className="leading-relaxed">
                  កម្រិតជាតិស្ករស្ថិតក្នុងដែនធម្មតា។ បន្តរក្សាទម្លាប់ញ៉ាំអាហារដែលមានសុខភាព។
                  <span className="block text-slate-400 text-sm mt-1">(Glucose is normal. Maintain healthy eating habits.)</span>
                </span>
              </li>
            </ul>
          </motion.div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handlePrint}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center space-x-4 shadow-md transition-all active:scale-[0.98]"
            >
              <Printer size={28} />
              <span>បោះពុម្ពឥឡូវនេះ (Print Now)</span>
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-4 shadow-md transition-all active:scale-[0.98]"
            >
              <LogOut size={24} />
              <span>រំលង និងត្រឡប់ទៅដើម (Skip to Start)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
