import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  UserCheck,
  QrCode,
  RefreshCw,
  CheckCircle2,
  Smartphone,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import apiService from "../../../services/apiService";

interface SessionResponse {
  session_id: string;
  qr_url: string;
  expires_in?: number;
}

interface WebSocketAuthPayload {
  event: "AUTHENTICATED" | "EPIRED" | "ERROR";
  user?: {
    id: string;
    phone: string;
    name?: string;
  };
  access_token?: string;
}

export function AuthScreen() {
  const navigate = useNavigate();

  // State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrValue, setQrValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pairedSuccess, setPairedSuccess] = useState<boolean>(false);
  const [pairedUser, setPairedUser] = useState<{
    phone?: string;
    name?: string;
  } | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const expiryTimerRef = useRef<NodeJS.Timeout | null>(null);

  const kiosk_id =
    import.meta.env.KIOSK_DEVICE_ID || "a0d07c37-999c-460e-953e-4b21e1328c18";
  // Initialize or Refresh QR Session
  const initKioskSession = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Close existing socket if reconnecting
      if (socketRef.current) {
        socketRef.current.close();
      }

      // 2. Request new session from Backend API
      const res = await apiService(
        "/kch-api/api/v1/kiosk/session/init",
        "POST",
        {
          kiosk_id: kiosk_id,
        },
      );

      // Assuming handleResponse returns { data, status } or direct payload
      const sessionData: SessionResponse = res.data || res;

      if (!sessionData?.session_id) {
        throw new Error("Invalid session response from server");
      }

      setSessionId(sessionData.session_id);
      setQrValue(
        sessionData.qr_url ||
          `${window.location.origin}/pairing?session=${sessionData.session_id}`,
      );

      // 3. Connect to WebSocket for instant pairing notifications
      connectWebSocket(sessionData.session_id);
    } catch (err: any) {
      console.error("Failed to create kiosk pairing session:", err);
      setError(
        "មិនអាចបង្កើត QR Session បានទេ សូមព្យាយាមម្តងទៀត (Failed to initialize QR session)",
      );
    } finally {
      setLoading(false);
    }
  };

  // WebSocket Listener
  const connectWebSocket = (sid: string) => {
    const wsBaseUrl = (
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
    ).replace(/^http/, "ws");
    const wsUrl = `${wsBaseUrl}/kch-api/ws/kiosk/${sid}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log(`[WS Connected] Listening for session: ${sid}`);
    };

    ws.onmessage = (event) => {
      try {
        const payload: WebSocketAuthPayload = JSON.parse(event.data);

        console.log(payload);
        if (payload.event === "AUTHENTICATED") {
          // Store Auth Session Data
          sessionStorage.setItem("authType", "phone");

          console.log(payload.user);

          if (payload.user) {
            sessionStorage.setItem("userInfo", JSON.stringify(payload.user));
          }

          setPairedUser({
            phone: payload.user?.phone,
            name: payload.user?.name,
          });

          setPairedSuccess(true);

          // Give user visual feedback for 1.8s then proceed to next step
          setTimeout(() => {
            // navigate("/questions/personal");
            navigate("/questions/hypertension");
          }, 1800);
        } else if (payload.event === "expired") {
          setError(
            "QR Code បានផុតកំណត់ សូមបង្កើតថ្មី (QR Code expired, please refresh)",
          );
        }
      } catch (e) {
        console.error("Error parsing WS message:", e);
      }
    };

    ws.onerror = (err) => {
      console.error("[WS Error]:", err);
    };

    ws.onclose = () => {
      console.log("[WS Closed]");
    };
  };

  useEffect(() => {
    initKioskSession();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
      }
    };
  }, []);

  const handleGuestLogin = () => {
    sessionStorage.setItem("authType", "guest");
    sessionStorage.removeItem("userPhone");
    sessionStorage.removeItem("userInfo");
    navigate("/questions/personal");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative font-['Noto_Sans_Khmer',sans-serif]">
      {/* Top Back Navigation Button */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 text-teal-800 bg-white/90 backdrop-blur px-4 py-2.5 rounded-xl shadow-sm font-bold active:scale-95 transition-all border border-slate-200"
        >
          <ArrowLeft size={22} />
          <span>ត្រឡប់ក្រោយ (Back)</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="pt-16 pb-4 px-6 text-center bg-white shadow-sm z-0 relative border-b border-slate-100">
        <h1 className="font-['Moul'] text-2xl text-teal-900 mb-1">
          សូមជ្រើសរើសជម្រើសចូលប្រើប្រាស់
        </h1>
        <p className="text-base text-slate-500">
          Please choose an option to start your health screening
        </p>
      </div>

      {/* Split Cards: Left = QR Pairing / Right = Guest Access */}
      <div className="flex-1 p-6 grid grid-cols-2 gap-6 h-full max-h-[calc(100%-96px)] overflow-hidden">
        {/* LEFT SIDE: QR Code WebSocket Authentication */}
        <div className="bg-white rounded-3xl shadow-lg p-6 flex flex-col items-center justify-between border border-slate-100 h-full relative overflow-hidden">
          <AnimatePresence mode="wait">
            {pairedSuccess ? (
              /* Success State Screen */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center w-full px-6"
              >
                <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5 shadow-inner">
                  <CheckCircle2 size={56} className="animate-bounce" />
                </div>
                <h3 className="font-['Moul'] text-2xl text-emerald-800 mb-2">
                  ភ្ជាប់បានជោគជ័យ!
                </h3>
                <p className="text-lg font-bold text-slate-700">
                  {pairedUser?.name || "អ្នកប្រើប្រាស់ (User)"}{" "}
                  {pairedUser?.phone ? `• ${pairedUser.phone}` : ""}
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  កំពុងបញ្ជូនទៅកាន់ទំព័របន្ទាប់... (Redirecting...)
                </p>
              </motion.div>
            ) : (
              /* QR Code Display Screen */
              <motion.div
                key="qr"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-between w-full"
              >
                {/* Title & Instructions */}
                <div className="text-center w-full">
                  <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-800 px-3.5 py-1.5 rounded-full text-sm font-bold mb-2">
                    <Smartphone size={18} />
                    <span>ស្កេនជាមួយទូរស័ព្ទដៃ (Scan with Phone)</span>
                  </div>
                  <h2 className="font-bold text-xl text-slate-800">
                    ស្កេន QR Code ដើម្បីចូលប្រើគណនី
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    បើកកាមេរ៉ា ឬ App សុខភាពលើទូរស័ព្ទរបស់អ្នកដើម្បីភ្ជាប់
                  </p>
                </div>

                {/* QR Box Frame */}
                <div className="relative my-auto flex flex-col items-center justify-center">
                  <div className="p-4 bg-white rounded-2xl shadow-md border-2 border-teal-500/30 flex items-center justify-center min-w-[210px] min-h-[210px]">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center gap-3 text-teal-700">
                        <RefreshCw className="animate-spin" size={32} />
                        <span className="text-xs font-semibold">
                          កំពុងបង្កើត QR...
                        </span>
                      </div>
                    ) : error ? (
                      <div className="flex flex-col items-center justify-center gap-2 text-red-500 max-w-[180px] text-center">
                        <AlertCircle size={32} />
                        <span className="text-xs">{error}</span>
                      </div>
                    ) : (
                      <QRCodeSVG
                        value={qrValue}
                        size={180}
                        level="H"
                        includeMargin={false}
                      />
                    )}
                  </div>

                  {/* Realtime Live Pulse Badge */}
                  {!loading && !error && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>រង់ចាំការស្កេន (Live WebSocket Ready)</span>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="w-full flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                  <span className="font-mono">
                    Session: {sessionId ? `${sessionId.slice(0, 8)}...` : "—"}
                  </span>
                  <button
                    onClick={initKioskSession}
                    disabled={loading}
                    className="flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold active:scale-95 transition-transform"
                  >
                    <RefreshCw
                      size={14}
                      className={loading ? "animate-spin" : ""}
                    />
                    <span>ផ្ទុកឡើងវិញ (Refresh QR)</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT SIDE: Guest Mode (First-Time User) */}
        <div className="bg-gradient-to-br from-slate-800 to-teal-900 rounded-3xl shadow-xl p-6 flex flex-col items-center justify-between relative overflow-hidden border-4 border-slate-700">
          <div className="absolute inset-0 opacity-5 pointer-events-none flex flex-wrap gap-10 items-center justify-center">
            {[...Array(12)].map((_, i) => (
              <UserCheck key={i} size={32} className="text-white" />
            ))}
          </div>

          {/* Icon & Description */}
          <div className="z-10 text-center mt-6">
            <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/20 shadow-lg">
              <UserCheck size={40} className="text-teal-300" />
            </div>
            <h2 className="font-['Moul'] text-xl text-white mb-2 leading-relaxed">
              ចូលប្រើប្រាស់លើកដំបូង
            </h2>
            <p className="text-slate-300 text-sm">
              First-time use / Guest Access
            </p>
          </div>

          {/* Action Button */}
          <div className="w-full z-10 space-y-4 mb-4">
            <motion.button
              onClick={handleGuestLogin}
              whileTap={{ scale: 0.97 }}
              className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold text-lg py-4 rounded-2xl shadow-lg border-2 border-teal-400/50 transition-all flex flex-col items-center justify-center"
            >
              <span className="font-['Moul'] block">ចូលជាភ្ញៀវ</span>
              <span className="text-xs font-normal opacity-90">
                Continue as Guest
              </span>
            </motion.button>

            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs">
              <ShieldCheck size={14} className="text-teal-400" />
              <span>មិនទាមទារគណនី ឬលេខទូរស័ព្ទជាមុនទេ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
