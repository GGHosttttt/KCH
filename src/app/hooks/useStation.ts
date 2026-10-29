import { useEffect, useRef, useState } from "react";
import { getStationBaseUrl, stationCall } from "../../../services/stationApi";

export type ScanKind = "height" | "weight" | "vitals";

export interface StationSnapshot {
  link: { connected: boolean; port: string | null };
  device: {
    online: boolean;
    floorCm: number | null;
    scaleCalibrated: boolean;
    vitalsOk: boolean;
    bp: { measuring: boolean; cooldownS: number; message: string | null };
  };
  results: {
    heightCm: number | null;
    weightKg: number | null;
    heartRate: number | null;
    spo2: number | null;
  };
}

// A "running" scan event from /api/station/events.
export interface ScanEvent {
  scan: string;
  state: string;
  progress?: number;
  message?: string;
  live?: number;
  heartRate?: number;
  spo2?: number;
}

// Live station state, like test.html: polls /api/station every 3 s and
// listens to /api/station/events for scan progress and BP messages.
// onEvent receives every SSE message (the control panel terminal logs them).
export function useStation(onEvent?: (u: any) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const [st, setSt] = useState<StationSnapshot | null>(null);
  const [reachable, setReachable] = useState(true);
  const [scan, setScan] = useState<ScanEvent | null>(null);
  const [bpMsg, setBpMsg] = useState<string | null>(null);

  const refresh = async () => {
    const r = await stationCall("GET", "/api/station", undefined, { quiet: true });
    if (!r.ok || !r.json?.device) return setReachable(false);
    setReachable(true);
    setSt(r.json);
  };

  useEffect(() => {
    refresh();
    const poll = setInterval(refresh, 3000);

    let es: EventSource | null = null;
    try {
      es = new EventSource(`${getStationBaseUrl()}/api/station/events`);
      es.onmessage = (e) => {
        let u: any;
        try {
          u = JSON.parse(e.data);
        } catch {
          return;
        }
        onEventRef.current?.(u);
        if (u.type === "event" && u.event === "scan") {
          setScan(u.state === "running" ? u : null);
          return;
        }
        if (u.type === "event" && u.event === "bp") setBpMsg(u.message ?? null);
        refresh();
      };
    } catch {
      // EventSource unavailable: polling still keeps the status current
    }

    return () => {
      clearInterval(poll);
      es?.close();
    };
  }, []);

  return { st, reachable, scan, bpMsg, refresh };
}
