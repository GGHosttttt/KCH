import { useNavigate } from "react-router";
import { Eye, LogOut, HeartPulse, Scale, Droplet, UserCircle2 } from "lucide-react";
import { motion } from "motion/react";

function calcAge(dob: string): number {
  if (!dob) return 0;
  const [year, month, day] = dob.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age--;
  return age;
}

export function ResultScreen() {
  const navigate = useNavigate();
  const userName = sessionStorage.getItem("userName") || "គ្មានឈ្មោះ";
  const userDOB = sessionStorage.getItem("userDOB") || "";
  const userGender = sessionStorage.getItem("userGender") || "";
  const userPhone = sessionStorage.getItem("userPhone") || "---";
  const age = userDOB ? calcAge(userDOB) : "--";
  const genderLabel = userGender === "male" ? "ប្រុស (Male)" : userGender === "female" ? "ស្រី (Female)" : "--";

  return (
    <div className="flex flex-col h-full bg-slate-100 relative">
      {/* Header */}
      <div className="bg-teal-800 text-white pt-6 pb-10 px-8 shadow-md relative z-0 overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10">
          <HeartPulse size={200} />
        </div>
        <div className="flex justify-between items-end relative z-10">
          <div>
            <h1 className="font-['Moul'] text-2xl mb-1 text-teal-50 drop-shadow-md">
              លទ្ធផលការពិនិត្យសុខភាពរបស់អ្នក
            </h1>
            <p className="text-lg text-teal-200 font-medium">Your Health Evaluation</p>
          </div>
          <div className="flex items-center space-x-3 bg-teal-900/50 backdrop-blur px-5 py-3 rounded-xl border border-teal-700/50">
            <UserCircle2 size={32} className="text-teal-300" />
            <div>
              <p className="text-xs text-teal-400 font-bold uppercase tracking-wider">អ្នកប្រើប្រាស់ / User</p>
              <p className="font-mono text-lg font-bold tracking-widest text-white">{userPhone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 px-6 -mt-5 z-10 pb-6 flex flex-col gap-4 overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1 min-h-0">

          {/* Card 1: User Info */}
          <motion.div
            className="bg-white rounded-3xl shadow-lg border border-slate-200 p-5 flex flex-col relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-teal-50 p-3 rounded-full text-teal-600">
                <UserCircle2 size={28} />
              </div>
              <h2 className="font-bold text-lg text-slate-800">ព័ត៌មាន<br /><span className="text-sm text-slate-500 font-normal">Patient Info</span></h2>
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex flex-col border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-sm">ឈ្មោះ / Name</span>
                <span className="font-bold text-slate-800 text-lg">{userName}</span>
              </div>
              <div className="flex flex-col border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-sm">ភេទ / Gender</span>
                <span className="font-bold text-slate-800">{genderLabel}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 text-sm">អាយុ / Age</span>
                <span className="font-bold text-slate-800 text-xl">{age} <span className="text-slate-400 text-sm font-normal">ឆ្នាំ (yrs)</span></span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Body Composition */}
          <motion.div
            className="bg-white rounded-3xl shadow-lg border border-slate-200 p-5 flex flex-col relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                <Scale size={28} />
              </div>
              <h2 className="font-bold text-lg text-slate-800">សសមាសភាពរាងកាយ<br /><span className="text-sm text-slate-500 font-normal">Body Composition</span></h2>
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-600 text-base">កម្ពស់ (Height)</span>
                <span className="text-xl font-bold text-slate-800">165 cm</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-600 text-base">ទម្ងន់ (Weight)</span>
                <span className="text-xl font-bold text-slate-800">62 kg</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-600 text-base">BMI</span>
                <span className="text-xl font-bold text-slate-800">22.8</span>
              </div>
            </div>
            <div className="mt-4 bg-green-100 border border-green-200 text-green-700 py-2 rounded-xl text-center font-bold text-base flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>ធម្មតា (Normal)</span>
            </div>
          </motion.div>

          {/* Card 3: Blood Pressure */}
          <motion.div
            className="bg-white rounded-3xl shadow-lg border border-slate-200 p-5 flex flex-col relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-rose-50 p-3 rounded-full text-rose-600">
                <HeartPulse size={28} />
              </div>
              <h2 className="font-bold text-lg text-slate-800">សម្ពាធឈាម<br /><span className="text-sm text-slate-500 font-normal">Blood Pressure</span></h2>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center bg-slate-50 rounded-2xl border border-slate-100 py-4 px-3">
              <span className="text-slate-500 text-sm mb-1">BP Reading</span>
              <span className="text-3xl font-bold text-slate-800 tracking-tight">
                125<span className="text-xl text-slate-400 font-normal">/80</span>{" "}
                <span className="text-base text-slate-500 font-normal">mmHg</span>
              </span>
              <div className="w-full mt-3 flex justify-between items-center px-2">
                <span className="text-slate-500 text-sm">ចង្វាក់បេះដូង / Pulse</span>
                <span className="font-bold text-rose-600">76 bpm</span>
              </div>
            </div>
            <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-700 py-2 rounded-xl text-center font-bold text-sm flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span>ប្រឈមហានិភ័យដំបូង (Pre-hypertensive)</span>
            </div>
          </motion.div>

          {/* Card 4: Glucose */}
          <motion.div
            className="bg-white rounded-3xl shadow-lg border border-slate-200 p-5 flex flex-col relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-teal-50 p-3 rounded-full text-teal-600">
                <Droplet size={28} />
              </div>
              <h2 className="font-bold text-lg text-slate-800">ជាតិស្ករបឋម<br /><span className="text-sm text-slate-500 font-normal">AI Glucose Group</span></h2>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center bg-slate-50 rounded-2xl border border-slate-100 py-4">
              <div className="w-16 h-16 mb-3 bg-white shadow-sm rounded-full border-4 border-green-400 flex items-center justify-center text-green-500">
                <Droplet size={32} className="fill-green-100" />
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-1">កម្រិតសុវត្ថិភាព</h3>
              <p className="text-slate-500 text-sm text-center px-2">AI analysis shows no abnormal patterns</p>
            </div>
            <div className="mt-4 bg-green-600 text-white py-2 rounded-xl text-center font-bold text-sm flex items-center justify-center space-x-2 shadow-md">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>សុខភាពធម្មតា (Non-diabetic)</span>
            </div>
          </motion.div>
        </div>

        {/* Action Controls */}
        <motion.div
          className="bg-white rounded-3xl shadow-lg border border-slate-200 p-4 shrink-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex space-x-4">
            <button
              onClick={() => navigate("/receipt")}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center space-x-4 shadow-md transition-all active:scale-[0.98]"
            >
              <Eye size={28} />
              <span>មើលក្រដាសលទ្ធផល (Preview Receipt)</span>
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-1/3 bg-slate-800 hover:bg-slate-900 text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center space-x-3 shadow-md transition-all active:scale-[0.98]"
            >
              <LogOut size={28} />
              <span>បញ្ចប់ (Exit)</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
