import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Download, RefreshCw, Trash2 } from "lucide-react";
import { addLog, clearLog, getStationBaseUrl, onLog, stationCall, stationLog } from "../../../services/stationApi";
import { getApiBaseUrl, getKioskDeviceId } from "../../../services/config";
import { useCheckupStore } from "../../stores/useCheckupStore";
import { useStation, type StationSnapshot } from "../hooks/useStation";
import { MEASURE_STEPS } from "./measure/MeasureShell";

// Staff / developer control panel (#/control, or Ctrl+Shift+D, or tap the top-centre edge 5 times).
// Everything that is not for patients lives here: station status and controls, calibration,
// a terminal with the API + event log, the checkup session store, and collected test results.

interface TestResult {
  id: number;
  createdAt: string;
  heightCm: number | null;
  weightKg: number | null;
  bmi: number | null;
  category: string | null;
  heartRate: number | null;
  spo2: number | null;
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
}

const fmt = (v: number | null | undefined, dp = 1) => (v == null ? "--" : Number(v).toFixed(dp));

export default function ControlPanelPage() {
  const navigate = useNavigate();
  const station = useStation((u) => {
    if (u.type !== "snapshot") addLog({ kind: "event", json: u });
  });
  const { st } = station;

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-200 font-sans">
      <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-5 py-3 flex flex-wrap items-center gap-3">
        <button
          onClick={() => navigate("/instructions/1")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-bold"
        >
          <ArrowLeft size={16} /> Kiosk
        </button>
        <h1 className="text-lg font-bold text-teal-300">KCH Control Panel</h1>
        <StationPills st={st} reachable={station.reachable} />
      </header>

      <main className="p-5 grid grid-cols-1 xl:grid-cols-2 gap-5 max-w-[1600px] mx-auto">
        <div className="space-y-5 min-w-0">
          <ConfigCard />
          <StationControls st={st} refresh={station.refresh} />
          <SessionCard />
        </div>
        <div className="space-y-5 min-w-0">
          <Terminal />
          <ResultsCard />
        </div>
      </main>
    </div>
  );
}

// ---------- Building blocks ----------

function Card({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function Btn({ onClick, children, disabled, tone = "default" }: { onClick: () => void; children: ReactNode; disabled?: boolean; tone?: "default" | "primary" | "danger" }) {
  const cls =
    tone === "primary"
      ? "bg-teal-600 hover:bg-teal-500 text-white"
      : tone === "danger"
        ? "bg-rose-700 hover:bg-rose-600 text-white"
        : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700";
  return (
    <button onClick={onClick} disabled={disabled} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 ${cls}`}>
      {children}
    </button>
  );
}

function NumInput({ value, onChange, w = "w-16" }: { value: string; onChange: (v: string) => void; w?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      inputMode="decimal"
      className={`${w} px-2 py-1 rounded-md bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100`}
    />
  );
}

function Pill({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${on ? "text-emerald-300 border-emerald-700 bg-emerald-950" : "text-rose-300 border-rose-700 bg-rose-950"}`}>
      {children}
    </span>
  );
}

// Same status line as test.html: USB link, ESP32, calibration, MAX30102.
function StationPills({ st, reachable }: { st: StationSnapshot | null; reachable: boolean }) {
  if (!reachable) return <Pill on={false}>station backend not reachable</Pill>;
  if (!st) return <span className="text-xs text-slate-500">Connecting...</span>;
  const d = st.device;
  return (
    <div className="flex flex-wrap gap-1.5">
      <Pill on={st.link.connected}>
        USB{st.link.port ? ` (${st.link.port})` : ""} {st.link.connected ? "connected" : "not connected"}
      </Pill>
      <Pill on={d.online}>ESP32 {d.online ? "online" : "offline"}</Pill>
      {d.online && (
        <>
          <Pill on={d.floorCm != null}>floor {d.floorCm != null ? `${d.floorCm} cm` : "NOT calibrated"}</Pill>
          <Pill on={d.scaleCalibrated}>scale {d.scaleCalibrated ? "calibrated" : "NOT calibrated"}</Pill>
          <Pill on={d.vitalsOk}>MAX30102 {d.vitalsOk ? "found" : "not found"}</Pill>
        </>
      )}
    </div>
  );
}

// ---------- Config ----------

function ConfigCard() {
  const rows: [string, string][] = [
    ["Station backend", getStationBaseUrl()],
    ["Cloud API", getApiBaseUrl()],
    ["Kiosk ID", getKioskDeviceId()],
    ["Runtime", (window as any).kioskEnv ? "Electron (kiosk_config.json)" : "Browser (.env)"],
  ];
  return (
    <Card title="Configuration">
      <dl className="grid grid-cols-[140px_1fr] gap-y-1 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-slate-500">{k}</dt>
            <dd className="font-mono text-slate-200 break-all">{v || "--"}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

// ---------- Station controls (all ESP32 endpoints of server.js) ----------

function Row({ label, value, children }: { label: string; value?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-2 border-b border-slate-800 last:border-0">
      <span className="w-28 text-xs font-bold text-slate-300">{label}</span>
      <span className="w-24 font-mono text-sm text-teal-300">{value ?? ""}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function StationControls({ st, refresh }: { st: StationSnapshot | null; refresh: () => void }) {
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [heightS, setHeightS] = useState("5");
  const [vitalsS, setVitalsS] = useState("10");
  const [kg, setKg] = useState("");

  const run = async (key: string, method: string, path: string, body?: unknown) => {
    setBusy((b) => new Set(b).add(key));
    await stationCall(method, path, body);
    setBusy((b) => {
      const n = new Set(b);
      n.delete(key);
      return n;
    });
    refresh();
  };
  const b = (key: string) => busy.has(key);
  const r = st?.results;
  const bp = st?.device.bp;

  return (
    <Card title="Station controls" right={<Btn onClick={refresh}><RefreshCw size={12} className="inline" /> Status</Btn>}>
      <Row label="Height" value={`${fmt(r?.heightCm)} cm`}>
        <NumInput value={heightS} onChange={setHeightS} w="w-12" />
        <span className="text-[11px] text-slate-500">s</span>
        <Btn tone="primary" disabled={b("height")} onClick={() => run("height", "POST", `/api/height/start?wait=1&seconds=${heightS}`)}>
          {b("height") ? "Scanning..." : "Scan"}
        </Btn>
        <Btn disabled={b("floor")} onClick={() => run("floor", "POST", "/api/height/floor?wait=1")}>
          Calibrate floor (area empty)
        </Btn>
      </Row>
      <Row label="Weight" value={`${fmt(r?.weightKg)} kg`}>
        <Btn tone="primary" disabled={b("weight")} onClick={() => run("weight", "POST", "/api/hx/start?wait=1")}>
          {b("weight") ? "Scanning..." : "Scan"}
        </Btn>
        <Btn disabled={b("tare")} onClick={() => run("tare", "POST", "/api/hx/tare")}>Tare (empty)</Btn>
        <NumInput value={kg} onChange={setKg} />
        <span className="text-[11px] text-slate-500">kg</span>
        <Btn disabled={b("cal") || !(Number(kg) > 0)} onClick={() => run("cal", "POST", "/api/hx/calibrate", { kg: Number(kg) })}>
          Calibrate with known weight
        </Btn>
      </Row>
      <Row label="HR / SpO2" value={`${fmt(r?.heartRate, 0)} · ${fmt(r?.spo2, 0)}%`}>
        <NumInput value={vitalsS} onChange={setVitalsS} w="w-12" />
        <span className="text-[11px] text-slate-500">s</span>
        <Btn tone="primary" disabled={b("vitals")} onClick={() => run("vitals", "POST", `/api/vitals/start?wait=1&seconds=${vitalsS}`)}>
          {b("vitals") ? "Reading..." : "Start"}
        </Btn>
        <Btn onClick={() => run("vstop", "POST", "/api/vitals/stop")}>Stop</Btn>
      </Row>
      <Row label="Blood pressure" value={bp ? (bp.measuring ? "measuring" : "ready") : "--"}>
        <Btn tone="primary" onClick={() => run("bp", "POST", "/api/bp/start")}>Press start</Btn>
        <Btn tone="danger" onClick={() => run("bp", "POST", "/api/bp/stop")}>Press stop (deflate)</Btn>
      </Row>
      <Row label="Station">
        <Btn onClick={() => run("reset", "POST", "/api/station/reset")}>Reset results</Btn>
        <Btn onClick={() => run("save", "POST", "/api/station/save")}>Save measurement (SQLite)</Btn>
        <Btn onClick={() => run("status", "POST", "/api/station/command", { cmd: "status" })}>ESP32 status</Btn>
        <Btn tone="danger" disabled={b("hwreset")} onClick={() => run("hwreset", "POST", "/api/station/hwreset")}>Hardware reset (reboot ESP32)</Btn>
      </Row>
    </Card>
  );
}

// ---------- Checkup session (frontend store) ----------

function SessionCard() {
  const navigate = useNavigate();
  const vitals = useCheckupStore((s) => s.vitals);
  const stepStatus = useCheckupStore((s) => s.stepStatus);
  const sessionId = useCheckupStore((s) => s.sessionId);
  const updateVitals = useCheckupStore((s) => s.updateVitals);
  const setStepStatus = useCheckupStore((s) => s.setStepStatus);
  const resetMeasurements = useCheckupStore((s) => s.resetMeasurements);
  const resetCheckup = useCheckupStore((s) => s.resetCheckup);

  // Sample readings so the rest of the flow can be tested without hardware.
  const fillSample = () => {
    updateVitals({
      height_cm: 168.5,
      weight_kg: 63.5,
      heart_rate_bpm: 74,
      spo2_percent: 98,
      systolic_mmhg: 120,
      diastolic_mmhg: 80,
      pulse_bpm: 75,
    });
    for (const k of ["height", "weight", "vitals", "bp"] as const) setStepStatus(k, "done");
    addLog({ kind: "note", text: "session: filled sample readings" });
  };

  const routes = [...MEASURE_STEPS.map((s) => [s.en, s.path]), ["Payment", "/payment"], ["Results", "/results"], ["Auth", "/auth"]];

  return (
    <Card title="Checkup session (this kiosk)">
      <pre className="text-[11px] font-mono bg-slate-950 border border-slate-800 rounded-lg p-2 overflow-auto max-h-48 text-slate-300">
        {JSON.stringify({ sessionId, stepStatus, vitals }, null, 2)}
      </pre>
      <div className="flex flex-wrap gap-2 mt-3">
        <Btn tone="primary" onClick={fillSample}>Fill sample readings</Btn>
        <Btn onClick={() => { resetMeasurements(); addLog({ kind: "note", text: "session: measurements cleared" }); }}>Clear measurements</Btn>
        <Btn tone="danger" onClick={() => { resetCheckup(); addLog({ kind: "note", text: "session: checkup reset" }); }}>Reset whole checkup</Btn>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <span className="text-[11px] text-slate-500 self-center">Open:</span>
        {routes.map(([label, path]) => (
          <Btn key={path} onClick={() => navigate(path)}>{label}</Btn>
        ))}
      </div>
    </Card>
  );
}

// ---------- Terminal ----------

const HELP = [
  "status | hx.start | hx.tare | height.start 5 | vitals.start 10 | bp.start | ...  -> ESP32 command",
  "GET /api/station            raw request to the station backend",
  "POST /api/hx/calibrate {\"kg\":10}",
  "clear                       clear the log",
];

function Terminal() {
  const [, setTick] = useState(0);
  const [input, setInput] = useState("");
  const [showEvents, setShowEvents] = useState(true);
  const history = useRef<string[]>([]);
  const histPos = useRef(-1);

  useEffect(() => onLog(() => setTick((t) => t + 1)), []);

  const submit = async () => {
    const line = input.trim();
    if (!line) return;
    history.current.unshift(line);
    histPos.current = -1;
    setInput("");
    addLog({ kind: "cmd", text: line });

    if (line === "clear") return clearLog();
    if (line === "help") return HELP.forEach((h) => addLog({ kind: "note", text: h }));

    const raw = line.match(/^(GET|POST|DELETE)\s+(\/\S+)(?:\s+(.+))?$/i);
    if (raw) {
      let body;
      if (raw[3]) {
        try {
          body = JSON.parse(raw[3]);
        } catch {
          return addLog({ kind: "note", text: "body is not valid JSON" });
        }
      }
      return void stationCall(raw[1].toUpperCase(), raw[2], body);
    }

    const [cmd, arg] = line.split(/\s+/, 2);
    await stationCall("POST", "/api/station/command", arg ? { cmd, arg } : { cmd });
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const h = history.current;
      histPos.current = Math.max(-1, Math.min(h.length - 1, histPos.current + (e.key === "ArrowUp" ? 1 : -1)));
      setInput(histPos.current >= 0 ? h[histPos.current] : "");
    }
  };

  const entries = stationLog.filter((e: any) => showEvents || e.kind !== "event");

  return (
    <Card
      title="Terminal"
      right={
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-slate-400 flex items-center gap-1">
            <input type="checkbox" checked={showEvents} onChange={(e) => setShowEvents(e.target.checked)} /> events
          </label>
          <Btn onClick={clearLog}>Clear</Btn>
        </div>
      }
    >
      <div className="h-[420px] overflow-auto bg-black rounded-lg border border-slate-800 p-2 font-mono text-[11px] leading-relaxed flex flex-col-reverse">
        <div>
          {entries
            .slice()
            .reverse()
            .map((e: any, i: number) => (
              <LogLine key={entries.length - i} e={e} />
            ))}
          {!entries.length && <div className="text-slate-600">Type "help" for commands.</div>}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 font-mono text-xs">
        <span className="text-teal-400">kch&gt;</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="status   ·   GET /api/station   ·   help"
          className="flex-1 bg-black border border-slate-700 rounded-md px-2 py-1.5 text-slate-100 outline-none focus:border-teal-600"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </Card>
  );
}

function LogLine({ e }: { e: any }) {
  const time = new Date(e.t).toLocaleTimeString();
  if (e.kind === "cmd") return <div className="text-teal-300">{time} kch&gt; {e.text}</div>;
  if (e.kind === "note") return <div className="text-slate-400">{time} {e.text}</div>;
  if (e.kind === "event") {
    return (
      <div className="text-sky-300/80 break-all">
        {time} ◂ {e.json.type}
        {e.json.event ? `:${e.json.event}` : ""} {JSON.stringify(e.json)}
      </div>
    );
  }
  const ok = e.status >= 200 && e.status < 300;
  return (
    <div className="border-b border-slate-900 py-0.5 break-all">
      <span className={ok ? "text-emerald-400" : "text-rose-400"}>
        {time} {e.method} {e.path} → {e.status || "ERR"} ({e.ms} ms)
      </span>
      {e.body != null && <div className="text-slate-500 pl-4">body: {JSON.stringify(e.body)}</div>}
      {e.json != null && <div className="text-slate-300 pl-4">{JSON.stringify(e.json)}</div>}
    </div>
  );
}

// ---------- Collected test results (backend/test_results.json) ----------

function ResultsCard() {
  const [results, setResults] = useState<TestResult[]>([]);

  const load = async () => {
    const r = await stationCall("GET", "/api/test/results", undefined, { quiet: true });
    if (r.ok && Array.isArray(r.json)) setResults(r.json);
  };

  useEffect(() => {
    load();
    return onLog(() => {
      // Reload after a result is saved or deleted anywhere in the app.
      const e: any = stationLog[0];
      if (e?.kind === "api" && e.path.startsWith("/api/test/results") && e.method !== "GET") load();
    });
  }, []);

  const del = async (id: number) => {
    if (!confirm(`Delete test result #${id}?`)) return;
    await stationCall("DELETE", `/api/test/results/${id}`);
  };

  const csv = () => {
    const cols = ["id", "createdAt", "heightCm", "weightKg", "bmi", "category", "heartRate", "spo2", "systolic", "diastolic", "pulse"] as const;
    const lines = [cols.join(","), ...results.slice().reverse().map((x) => cols.map((c) => x[c] ?? "").join(","))];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    a.download = "kiosk_test_results.csv";
    a.click();
  };

  return (
    <Card
      title={`Collected test results (${results.length})`}
      right={
        <div className="flex gap-2">
          <Btn onClick={load}><RefreshCw size={12} className="inline" /></Btn>
          <Btn onClick={csv} disabled={!results.length}><Download size={12} className="inline" /> CSV</Btn>
        </div>
      }
    >
      <div className="max-h-72 overflow-auto">
        <table className="w-full text-xs tabular-nums">
          <thead className="text-slate-500 sticky top-0 bg-slate-900">
            <tr className="border-b border-slate-800">
              {["#", "Time", "Ht", "Wt", "BMI", "HR", "SpO2", "BP", "PUL", ""].map((h, i) => (
                <th key={i} className={`py-1.5 ${i < 2 ? "text-left" : "text-right"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.length ? (
              results.map((x) => (
                <tr key={x.id} className="border-b border-slate-800/60">
                  <td className="py-1.5">{x.id}</td>
                  <td className="py-1.5 whitespace-nowrap text-slate-400">{new Date(x.createdAt).toLocaleString()}</td>
                  <td className="py-1.5 text-right">{fmt(x.heightCm)}</td>
                  <td className="py-1.5 text-right">{fmt(x.weightKg)}</td>
                  <td className="py-1.5 text-right">{fmt(x.bmi)}</td>
                  <td className="py-1.5 text-right">{fmt(x.heartRate, 0)}</td>
                  <td className="py-1.5 text-right">{fmt(x.spo2, 0)}</td>
                  <td className="py-1.5 text-right">{x.systolic ? `${x.systolic}/${x.diastolic}` : "--"}</td>
                  <td className="py-1.5 text-right">{fmt(x.pulse, 0)}</td>
                  <td className="py-1.5 text-right">
                    <button onClick={() => del(x.id)} title="Delete" className="text-slate-500 hover:text-rose-400 p-1">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="py-4 text-center text-slate-500">Nothing saved yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
