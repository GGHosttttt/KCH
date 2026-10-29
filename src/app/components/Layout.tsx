// src/components/Layout.tsx
import { Outlet, useLocation, useNavigate } from "react-router";
import { useEffect, useState, useRef } from "react";
import { Volume2, VolumeX, LifeBuoy, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import voiceGuide from "../../../services/voiceGuide";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isHome = location.pathname === "/" || location.pathname === "";
  const INACTIVITY_LIMIT_MS = 10 * 60 * 1000; // 10 minutes

  const getAuthToken = () => {
    return localStorage.getItem("access_token");
  };

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const token = getAuthToken();
    if (token || isHome) return;

    timeoutRef.current = setTimeout(() => {
      voiceGuide.stop();
      navigate("/");
    }, INACTIVITY_LIMIT_MS);
  };

  // 1. Listen for user activity
  useEffect(() => {
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("touchstart", resetTimer);
    window.addEventListener("click", resetTimer);
    window.addEventListener("keydown", resetTimer);

    resetTimer();

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [location.pathname, isHome]);

  // 2. Play audio step whenever the screen/route changes
  useEffect(() => {
    voiceGuide.playForRoute(location.pathname);

    return () => {
      voiceGuide.stop(); // Stop audio if component unmounts
    };
  }, [location.pathname]);

  // 3. Handle Mute / Unmute Toggle
  const handleToggleAudio = () => {
    const nextState = !isAudioEnabled;
    setIsAudioEnabled(nextState);
    voiceGuide.setEnabled(nextState);

    // If turned back on, replay current step's voice prompt
    if (nextState) {
      voiceGuide.playForRoute(location.pathname);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-slate-900 text-slate-800 font-['Battambang'] flex items-center justify-center p-0 sm:p-4 md:p-8 relative">
      {/* 
        Responsive Kiosk Wrapper:
        - Mobile: Full height, flex-1, inner-scrolling enabled
        - Desktop (sm+): Fixed 800px kiosk frame with rounded border
      */}
      <div className="w-full max-w-6xl h-[100dvh] sm:h-[800px] sm:max-h-[800px] bg-slate-100 relative shadow-2xl sm:rounded-3xl border-0 sm:border-8 border-slate-800 flex flex-col overflow-hidden">
        {/* 
          Main Scroll Container for Outlet:
          min-h-0 + flex-1 + overflow-y-auto ensures children (ResultScreen, ReceiptScreen) 
          scroll smoothly on touch screens without getting trapped by parent bounds.
        */}
        <div className="flex-1 w-full min-h-0 overflow-y-auto overflow-x-hidden relative">
          <Outlet />
        </div>

        {/* Global Floating Action Buttons */}
        {!isHome && (
          <div className="fixed sm:absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex space-x-3 sm:space-x-4 z-50 pointer-events-auto">
            {/* Audio Toggle Feature */}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={handleToggleAudio}
              className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full shadow-lg border-2 flex items-center justify-center active:scale-95 transition-all ${
                isAudioEnabled
                  ? "bg-white border-teal-200 text-teal-700 hover:bg-teal-50"
                  : "bg-slate-200 border-slate-300 text-slate-500 hover:bg-slate-300"
              }`}
            >
              {isAudioEnabled ? (
                <Volume2 className="w-6 h-6 sm:w-8 sm:h-8" />
              ) : (
                <VolumeX className="w-6 h-6 sm:w-8 sm:h-8" />
              )}
            </motion.button>

            {/* Call for Help / SOS Feature */}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              onClick={() => {
                voiceGuide.stop(); // Silence guidance during emergency call
                setShowHelpModal(true);
              }}
              className="w-12 h-12 sm:w-16 sm:h-16 bg-rose-600/95 backdrop-blur rounded-full shadow-[0_0_15px_rgba(225,29,72,0.5)] border-2 border-rose-400 flex items-center justify-center text-white hover:bg-rose-700 active:scale-95 transition-all"
            >
              <LifeBuoy className="w-6 h-6 sm:w-8 sm:h-8" />
            </motion.button>
          </div>
        )}

        {/* Global Audio Indicator Status */}
        {!isHome && isAudioEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed sm:absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 bg-slate-800/85 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-slate-600 flex items-center space-x-2 sm:space-x-3 shadow-lg pointer-events-none max-w-[calc(100vw-140px)] sm:max-w-none"
          >
            <div className="flex space-x-1 shrink-0">
              <motion.div
                animate={{ height: [6, 14, 6] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-1 bg-teal-400 rounded-full"
              />
              <motion.div
                animate={{ height: [10, 20, 10] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: 0.1 }}
                className="w-1 bg-teal-400 rounded-full"
              />
              <motion.div
                animate={{ height: [6, 14, 6] }}
                transition={{ repeat: Infinity, duration: 1.1, delay: 0.2 }}
                className="w-1 bg-teal-400 rounded-full"
              />
            </div>
            <span className="text-teal-100 text-xs sm:text-sm font-bold tracking-wide truncate">
              ជំនួយសំឡេងកំពុងបើក (Voice Guide On)
            </span>
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center border-4 border-rose-100"
            >
              <AlertCircle size={56} className="text-rose-500 mx-auto mb-4" />
              <h2 className="font-['Moul'] text-xl sm:text-2xl text-slate-800 mb-2 leading-relaxed">
                ត្រូវការជំនួយមែនទេ?
              </h2>
              <p className="text-slate-600 mb-6 text-sm sm:text-lg">
                បុគ្គលិកពេទ្យប្រចាំការនឹងមកជួយអ្នកក្នុងពេលបន្តិចទៀតនេះ។
                <br />
                <span className="text-xs sm:text-sm block mt-2 text-slate-400">
                  (A staff member will be with you shortly.)
                </span>
              </p>
              <button
                onClick={() => {
                  setShowHelpModal(false);
                  if (isAudioEnabled)
                    voiceGuide.playForRoute(location.pathname);
                }}
                className="w-full py-3 sm:py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors text-base sm:text-xl"
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
