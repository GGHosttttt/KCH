// import { RouterProvider } from "react-router";
// import { router } from "./routes";

// export default function App() {
//   return <RouterProvider router={router} />;
// }

// src/App.tsx
import { useState, useEffect } from "react";
import { RouterProvider } from "react-router"; // or "react-router-dom"
import { router } from "./routes";
import { AlertTriangle, RefreshCw, MonitorDot } from "lucide-react";

export default function App() {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [configDetails, setConfigDetails] = useState<{
    kioskId?: string;
    apiUrl?: string;
  }>({});

  // Staff shortcut to the control panel (debug tools, terminal)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        window.location.hash = "#/control";
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    // 1. Check if native Electron preload bridge is present
    const nativeEnv = (window as any).kioskEnv;

    if (nativeEnv) {
      const kioskId = nativeEnv.getKioskId?.();
      const apiUrl = nativeEnv.getApiUrl?.();

      if (kioskId && apiUrl) {
        setIsConfigured(true);
        setConfigDetails({ kioskId, apiUrl });
      } else {
        setIsConfigured(false);
      }
    } else {
      // 2. Browser dev mode fallback (reads Vite .env)
      const devKioskId = import.meta.env.VITE_KIOSK_DEVICE_ID;
      const devApiUrl = import.meta.env.VITE_API_BASE_URL;

      if (devKioskId && devApiUrl) {
        setIsConfigured(true);
        setConfigDetails({ kioskId: devKioskId, apiUrl: devApiUrl });
      } else {
        setIsConfigured(false);
      }
    }
  }, []);

  // While checking config
  if (isConfigured === null) {
    return (
      <div className="h-screen w-screen bg-[#073B35] flex items-center justify-center text-white">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-400" />
      </div>
    );
  }

  // Configuration is missing on the Mini PC
  if (!isConfigured) {
    return (
      <div className="h-screen w-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center font-['Noto_Sans_Khmer',sans-serif]">
        <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mb-5 border border-red-500/30">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-red-400 mb-2 font-mono">
          KIOSK_CONFIG_MISSING
        </h1>
        <p className="text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
          មិនទាន់រកឃើញឯកសារកំណត់រចនាសម្ព័ន្ធ Kiosk ទេ។
          សូមបង្កើតឯកសារកំណត់អត្តសញ្ញាណមុនពេលដំណើរការ។
        </p>
        <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 text-left font-mono text-xs text-slate-300 max-w-lg w-full space-y-2">
          <p className="text-teal-400 font-semibold flex items-center gap-1.5">
            <MonitorDot className="w-4 h-4" /> Location:
          </p>
          <code className="text-amber-300 block bg-slate-950 p-2 rounded border border-slate-800">
            C:\ProgramData\KCH\kiosk_config.json
          </code>
          <p className="text-slate-400 pt-2">Expected structure:</p>
          <pre className="text-teal-300 bg-slate-950 p-2 rounded border border-slate-800 overflow-x-auto">
            {`{
  "kiosk_id": "KCH-001",
  "api_url": "https://api.yourdomain.com"
}`}
          </pre>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-xl text-xs font-bold transition-all active:scale-95"
        >
          ពិនិត្យម្តងទៀត (Retry Detection)
        </button>
      </div>
    );
  }

  // Config valid -> Mount Router
  return <RouterProvider router={router} />;
}
