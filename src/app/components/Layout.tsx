import { Outlet, useLocation, useNavigate } from "react-router";
import { useEffect, useState, useRef } from "react";
import { Volume2, VolumeX, LifeBuoy, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isHome = location.pathname === "/" || location.pathname === "";

  // Auto-timeout feature for privacy (resets to home if user walks away)
  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Don't timeout on the home screen
    if (!isHome) {
      // 3 minutes of inactivity = reset to home
      timeoutRef.current = setTimeout(() => {
        navigate("/");
      }, 180000);
    }
  };

  useEffect(() => {
    // Attach event listeners for user activity
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("touchstart", resetTimer);
    window.addEventListener("click", resetTimer);
    window.addEventListener("keydown", resetTimer);

    resetTimer(); // Initialize timer

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [location.pathname, isHome]);

  return (
    <div className="min-h-[100dvh] w-full bg-slate-900 text-slate-800 font-['Battambang'] overflow-hidden flex items-center justify-center p-0 sm:p-4 md:p-8 relative">
      <div className="w-full max-w-6xl h-[100dvh] max-h-[800px] bg-slate-100 relative shadow-2xl overflow-hidden sm:rounded-3xl border-0 sm:border-8 border-slate-800 flex flex-col">
        
        {/* Main Route Content */}
        <Outlet />

        {/* Global Kiosk Floating Controls (Hidden on Welcome Screen) */}
        {!isHome && (
          <div className="absolute bottom-6 right-6 flex space-x-4 z-50">
            {/* Audio Toggle Feature */}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className={`w-16 h-16 rounded-full shadow-lg border-2 flex items-center justify-center active:scale-95 transition-all ${
                isAudioEnabled 
                  ? "bg-white border-teal-200 text-teal-700 hover:bg-teal-50" 
                  : "bg-slate-200 border-slate-300 text-slate-500 hover:bg-slate-300"
              }`}
            >
              {isAudioEnabled ? <Volume2 size={32} /> : <VolumeX size={32} />}
            </motion.button>
            
            {/* Call for Help / SOS Feature */}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              onClick={() => setShowHelpModal(true)}
              className="w-16 h-16 bg-rose-600/95 backdrop-blur rounded-full shadow-[0_0_15px_rgba(225,29,72,0.5)] border-2 border-rose-400 flex items-center justify-center text-white hover:bg-rose-700 active:scale-95 transition-all"
            >
              <LifeBuoy size={32} />
            </motion.button>
          </div>
        )}

        {/* Global Audio Indicator Status */}
        {!isHome && isAudioEnabled && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-6 left-6 z-50 bg-slate-800/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-600 flex items-center space-x-3 shadow-lg pointer-events-none"
          >
            <div className="flex space-x-1">
              <motion.div animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 bg-teal-400 rounded-full"></motion.div>
              <motion.div animate={{ height: [12, 24, 12] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.1 }} className="w-1 bg-teal-400 rounded-full"></motion.div>
              <motion.div animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 1.1, delay: 0.2 }} className="w-1 bg-teal-400 rounded-full"></motion.div>
            </div>
            <span className="text-teal-100 text-sm font-bold tracking-wide">ជំនួយសំឡេងកំពុងបើក (Voice Guide On)</span>
          </motion.div>
        )}
      </div>

      {/* Help Modal Overlay */}
      <AnimatePresence>
        {showHelpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border-4 border-rose-100"
            >
              <AlertCircle size={64} className="text-rose-500 mx-auto mb-4" />
              <h2 className="font-['Moul'] text-2xl text-slate-800 mb-2 leading-relaxed">ត្រូវការជំនួយមែនទេ?</h2>
              <p className="text-slate-600 mb-6 text-lg">
                បុគ្គលិកពេទ្យប្រចាំការនឹងមកជួយអ្នកក្នុងពេលបន្តិចទៀតនេះ។
                <br />
                <span className="text-sm block mt-2 text-slate-400">(A staff member will be with you shortly.)</span>
              </p>
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors text-xl"
              >
                បិទ (Close)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
