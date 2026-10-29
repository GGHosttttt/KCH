// Client for the local BMI station backend (BMI/backend/server.js).
// Same call pattern as BMI/backend/public/test.html: plain fetch, no auth header
// (the station backend's CORS only allows Content-Type), never throws.

export function getStationBaseUrl() {
  const url =
    window.kioskEnv?.getLocalApiUrl?.() ||
    import.meta.env.VITE_LOCAL_API_BASE_URL ||
    "http://localhost:3000";
  return url.replace(/\/+$/, "");
}

// ---------- Log (shown in the control panel terminal) ----------
// Kept for the whole app session, so calls made on the kiosk screens show up there too.
const MAX_LOG = 300;
const logListeners = new Set();
export const stationLog = [];

export function addLog(entry) {
  stationLog.unshift({ t: Date.now(), ...entry });
  if (stationLog.length > MAX_LOG) stationLog.pop();
  logListeners.forEach((f) => f());
}

export function clearLog() {
  stationLog.length = 0;
  logListeners.forEach((f) => f());
}

export function onLog(f) {
  logListeners.add(f);
  return () => logListeners.delete(f);
}

// Returns { status, ok, json }. status 0 = backend not reachable.
// opts.quiet skips the log (status polling).
export async function stationCall(method, path, body, opts = {}) {
  const t0 = performance.now();
  let status = 0;
  let json = null;
  try {
    const r = await fetch(getStationBaseUrl() + path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    status = r.status;
    json = status === 204 ? null : await r.json().catch(() => null);
  } catch {
    json = { ok: false, message: "Station backend not reachable" };
  }
  if (!opts.quiet) {
    addLog({ kind: "api", method, path, status, ms: Math.round(performance.now() - t0), body, json });
  }
  return { status, ok: status >= 200 && status < 300, json };
}

// Scan steps: API call and the result fields it fills (station field -> checkup store field).
export const SCANS = {
  height: {
    url: "/api/height/start?wait=1&seconds=5",
    fields: { heightCm: "height_cm" },
  },
  weight: {
    url: "/api/hx/start?wait=1",
    fields: { weightKg: "weight_kg" },
  },
  vitals: {
    url: "/api/vitals/start?wait=1&seconds=10",
    fields: { heartRate: "heart_rate_bpm", spo2: "spo2_percent" },
  },
};

// Typed in from the BP monitor's screen: [min, max], whole numbers.
export const BP_LIMITS = {
  systolic: [60, 260],
  diastolic: [30, 160],
  pulse: [30, 250],
};
