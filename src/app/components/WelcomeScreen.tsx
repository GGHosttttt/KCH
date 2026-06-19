import { useNavigate } from "react-router";
import { Play, Activity, Heart, ShieldPlus } from "lucide-react";
import { motion } from "motion/react";

export function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-teal-800 to-teal-900 text-white p-8 overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none flex flex-wrap gap-12 items-center justify-center">
         {[...Array(20)].map((_, i) => (
           <Activity key={i} size={48} className="text-teal-200" />
         ))}
      </div>

      <div className="absolute top-8 left-8 flex items-center space-x-4">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-teal-800 shadow-lg">
          <ShieldPlus size={36} />
        </div>
        <div>
          <h2 className="font-['Moul'] text-xl tracking-wider text-teal-50">ក្រសួងសុខាភិបាល</h2>
          <p className="text-teal-200 text-sm">Khmer Community Health</p>
        </div>
      </div>

      <div className="z-10 text-center max-w-4xl mt-12">
        <div className="flex justify-center mb-6">
          <Heart size={80} className="text-teal-300 drop-shadow-xl" strokeWidth={1.5} />
        </div>
        
        <h1 className="font-['Moul'] text-5xl md:text-6xl text-white mb-6 drop-shadow-lg leading-tight">
          សូមស្វាគមន៍មកកាន់<br/>ទូរសុខភាពសហគមន៍ខ្មែរ
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-teal-100 mb-4 drop-shadow-md">
          Welcome to Khmer Community Health Kiosk
        </h2>
        
        <p className="text-lg md:text-2xl text-teal-50 bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/10 mt-6 inline-block max-w-3xl leading-relaxed">
          ប្រព័ន្ធស្វ័យសេវាពិនិត្យសុខភាពបឋម<br/>
          <span className="text-base md:text-xl font-normal opacity-90">(វាស់កម្ពស់ ទម្ងន់ សម្ពាធឈាម និងកម្រិតជាតិស្ករមិនចាក់ម្ជុល)</span>
        </p>
      </div>

      <div className="z-10 mt-16">
        <motion.button
          onClick={() => navigate("/auth")}
          className="relative group bg-white text-teal-800 font-bold text-2xl md:text-3xl py-6 px-12 rounded-full shadow-2xl flex items-center space-x-6 hover:bg-teal-50 transition-colors"
          animate={{
            scale: [1, 1.05, 1],
            boxShadow: [
              "0px 0px 0px rgba(255, 255, 255, 0)",
              "0px 0px 40px rgba(255, 255, 255, 0.4)",
              "0px 0px 0px rgba(255, 255, 255, 0)"
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <span className="font-['Moul']">ចាប់ផ្តើមពិនិត្យសុខភាព</span>
          <div className="bg-teal-600 rounded-full p-2 text-white group-hover:bg-teal-500 transition-colors">
            <Play fill="currentColor" size={32} />
          </div>
        </motion.button>
      </div>
    </div>
  );
}
