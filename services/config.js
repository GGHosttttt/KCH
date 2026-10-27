// Centralized runtime config resolver
export function getApiBaseUrl() {
  // 1. Electron Production / Packaged desktop runtime
  if (typeof window !== "undefined" && window.kioskEnv?.getApiUrl) {
    const desktopUrl = window.kioskEnv.getApiUrl();

    if (desktopUrl) {
      return desktopUrl.replace(/\/+$/, "");
    }
  }

  // 2. Vite Local Browser Dev fallback (npm run dev)
  const devUrl = import.meta.env.VITE_API_BASE_URL;

  if (devUrl) {
    return devUrl.replace(/\/+$/, "");
  }

  // 3. Fallback
  return "http://localhost:8000";
}

export function getKioskDeviceId() {
  if (typeof window !== "undefined" && window.kioskEnv?.getKioskId) {
    const desktopId = window.kioskEnv.getKioskId();

    if (desktopId) {
      return desktopId;
    }
  }

  return import.meta.env.VITE_KIOSK_DEVICE_ID || "KCH-001";
}
