import { Outlet, useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef } from "react";
import { useCheckupStore } from "../../stores/useCheckupStore";

export function CheckupLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const resetCheckup = useCheckupStore((s) => s.resetCheckup);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);

  // Kiosk Inactivity Reset (90 seconds idle returns to welcome screen)
  const resetTimer = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      resetCheckup();
      navigate("/");
    }, 90000);
  };

  useEffect(() => {
    window.addEventListener("pointerdown", resetTimer);
    window.addEventListener("keydown", resetTimer);
    resetTimer();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      window.removeEventListener("pointerdown", resetTimer);
      window.removeEventListener("keydown", resetTimer);
    };
  }, []);

  return (
    <div className=" overflow-hidden bg-slate-50 flex flex-col font-['Noto_Sans_Khmer',sans-serif]">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="flex-1 h-full w-full"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}