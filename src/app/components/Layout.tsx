// src/components/Layout.tsx
import { Outlet, useLocation, useNavigate } from "react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Volume2,
  VolumeX,
  LifeBuoy,
  AlertCircle,
  Bug,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import voiceGuide from "../../../services/voiceGuide";

// Toggle to false when deploying to production
const DEBUG_MODE = true;

// Available limits for live testing (Default is 10 min)
const TEST_LIMITS_MS: Record<string, number> = {
  "10m": 10 * 60 * 1000,
  "1m": 60 * 1000,
  "30s": 30 * 1000,
};

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Active limit selection (can be toggled in debug HUD)
  const [activeLimitKey, setActiveLimitKey] = useState<string>("10m");
  const INACTIVITY_LIMIT_MS = TEST_LIMITS_MS[activeLimitKey];

  // Debug metric states
  const [idleDurationSec, setIdleDurationSec] = useState<number>(0);
  const [lastActivityEvent, setLastActivityEvent] = useState<string>("init");

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActiveTimestamp = useRef<number>(Date.now());
  const staffTaps = useRef<number[]>([]);

  // Hidden staff access: 5 taps on the top-centre edge within 3 s opens the control panel.
  const handleStaffTap = () => {
    const now = Date.now();
    staffTaps.current = [
      ...staffTaps.current.filter((t) => now - t < 3000),
      now,
    ];
    if (staffTaps.current.length >= 5) {
      staffTaps.current = [];
      voiceGuide.stop();
      navigate("/control");
    }
  };

  const isHome = location.pathname === "/" || location.pathname === "";

  const getAuthToken = () => {
    return localStorage.getItem("access_token");
  };

  // 1. Core Inactivity Handler using useCallback
  const resetTimer = useCallback(
    (triggerReason = "activity") => {
      lastActiveTimestamp.current = Date.now();
      if (DEBUG_MODE) {
        setLastActivityEvent(triggerReason);
        setIdleDurationSec(0);
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const token = getAuthToken();
      if (token || isHome) {
        return;
      }

      timeoutRef.current = setTimeout(() => {
        console.warn(
          `[Inactivity] Limit (${INACTIVITY_LIMIT_MS}ms) reached. Returning to Home.`,
        );
        voiceGuide.stop();
        navigate("/");
      }, INACTIVITY_LIMIT_MS);
    },
    [isHome, INACTIVITY_LIMIT_MS, navigate],
  );

  // 2. Filtered event listeners: ignores stationary hover & passive DOM scrolls
  useEffect(() => {
    let lastThrottledTime = 0;
    const THROTTLE_MS = 1000; // Reset at most once every second
    const lastMousePos = { x: 0, y: 0 };

    const handleUserInteraction = (event: Event) => {
      // 1. Filter out micro-jitter or static hover from mousemove
      if (event instanceof MouseEvent && event.type === "mousemove") {
        const dx = Math.abs(event.clientX - lastMousePos.x);
        const dy = Math.abs(event.clientY - lastMousePos.y);

        // Ignore tiny movements under 10px (e.g. vibrations or cursor on top of animated items)
        if (dx < 10 && dy < 10) return;

        lastMousePos.x = event.clientX;
        lastMousePos.y = event.clientY;
      }

      const now = Date.now();
      if (now - lastThrottledTime > THROTTLE_MS) {
        lastThrottledTime = now;
        resetTimer(event.type);
      }
    };

    // Use explicit intentional user actions (wheel instead of window scroll)
    const events = [
      "pointerdown",
      "mousemove",
      "touchstart",
      "touchmove",
      "keydown",
      "wheel",
    ];

    events.forEach((evt) =>
      window.addEventListener(evt, handleUserInteraction, { passive: true }),
    );

    // Initial activation
    resetTimer("mount");

    return () => {
      events.forEach((evt) =>
        window.removeEventListener(evt, handleUserInteraction),
      );
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [resetTimer]);

  // 3. Live 1-second interval tracking both idle duration and time remaining
  useEffect(() => {
    if (!DEBUG_MODE) return;

    const interval = setInterval(() => {
      const token = getAuthToken();
      if (isHome || token) {
        setIdleDurationSec(0);
        return;
      }
      const elapsedMs = Date.now() - lastActiveTimestamp.current;
      setIdleDurationSec(Math.floor(elapsedMs / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isHome]);

  // 3. Reset timer specifically when the route changes
  useEffect(() => {
    resetTimer("route-change");
  }, [location.pathname, resetTimer]);

  // 4. Play audio step whenever the screen/route changes
  useEffect(() => {
    voiceGuide.playForRoute(location.pathname);

    return () => {
      voiceGuide.stop();
    };
  }, [location.pathname]);

  // 5. Handle Mute / Unmute Toggle
  const handleToggleAudio = () => {
    const nextState = !isAudioEnabled;
    setIsAudioEnabled(nextState);
    voiceGuide.setEnabled(nextState);

    if (nextState) {
      voiceGuide.playForRoute(location.pathname);
    }
  };

  // Helper formatting mm:ss
  const formatTime = (totalSeconds: number) => {
    const safeSecs = Math.max(0, totalSeconds);
    const mins = Math.floor(safeSecs / 60);
    const secs = safeSecs % 60;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  const limitSeconds = Math.floor(INACTIVITY_LIMIT_MS / 1000);
  const remainingSeconds = Math.max(0, limitSeconds - idleDurationSec);
  const idlePercentage = Math.min(100, (idleDurationSec / limitSeconds) * 100);

  return (
    <div className="min-h-[100dvh] w-full bg-slate-900 text-slate-800 font-['Battambang'] flex items-center justify-center p-0 sm:p-4 md:p-8 relative overflow-hidden">
      {/* Visual Inactivity Comparison Debug HUD */}
      {DEBUG_MODE && (
        <aside className="fixed top-3 right-3 z-[200] bg-slate-950/90 text-slate-200 border border-slate-700/80 rounded-xl p-3 shadow-2xl font-mono text-xs w-72 backdrop-blur-md">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-teal-400">
              <Bug className="w-4 h-4 text-amber-400" />
              <span>INACTIVITY MONITOR</span>
            </div>
            {/* Quick limit switcher for testing */}
            <div className="flex gap-1">
              {Object.keys(TEST_LIMITS_MS).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setActiveLimitKey(key);
                    resetTimer(`switched-limit-${key}`);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                    activeLimitKey === key
                      ? "bg-teal-500 text-slate-950"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Status:</span>
              <span
                className={`font-semibold ${isHome || getAuthToken() ? "text-amber-400" : "text-emerald-400"}`}
              >
                {isHome
                  ? "Disabled (Home)"
                  : getAuthToken()
                    ? "Bypassed (Token)"
                    : "Monitoring"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Idle Elapsed:</span>
              <span className="text-rose-400 font-bold">
                {formatTime(idleDurationSec)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Target Threshold:</span>
              <span className="text-slate-200 font-bold">
                {formatTime(limitSeconds)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Time Remaining:</span>
              <span className="text-teal-300 font-bold">
                {formatTime(remainingSeconds)}
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden border border-slate-700">
              <div
                className={`h-full transition-all duration-1000 ${
                  idlePercentage > 80
                    ? "bg-rose-500"
                    : idlePercentage > 50
                      ? "bg-amber-400"
                      : "bg-teal-400"
                }`}
                style={{ width: `${idlePercentage}%` }}
              />
            </div>

            <div className="pt-2 mt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
              <span className="truncate max-w-[140px]">
                Event:{" "}
                <span className="text-teal-400">{lastActivityEvent}</span>
              </span>
              <button
                onClick={() => resetTimer("manual-debug-reset")}
                className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 px-1.5 py-0.5 rounded transition-colors"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Reset
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 
        Responsive Kiosk Wrapper:
        - Mobile: Full height, flex-1, inner-scrolling enabled
        - Desktop (sm+): Fixed 800px kiosk frame with rounded border
      */}
      <div className="w-full max-w-6xl h-[150dvh] sm:h-[800px] sm:max-h-[800px] bg-slate-100 relative shadow-2xl sm:rounded-3xl border-0 sm:border-8 border-slate-800 flex flex-col overflow-hidden">
        {/* Invisible staff hotspot (5 taps in 3s) */}
        <div
          onPointerDown={handleStaffTap}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 z-[60]"
          aria-hidden
        />

        {/* 
          Main Scroll Container for Outlet:
          min-h-0 + flex-1 + overflow-y-auto ensures children scroll properly
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
