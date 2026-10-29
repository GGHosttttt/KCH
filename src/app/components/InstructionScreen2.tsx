import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { HeartPulse } from "lucide-react";
import { useCheckupStore } from "../../stores/useCheckupStore";
import { useStation, type ScanKind } from "../hooks/useStation";
import { MeasureShell } from "./measure/MeasureShell";
import { ScanCard } from "./measure/ScanCard";

// Step 2 · Heart rate & SpO2 on the MAX30102 fingertip sensor (test.html step 3).
export function InstructionScreen2() {
  const navigate = useNavigate();
  const station = useStation();
  const status = useCheckupStore((s) => s.stepStatus.vitals);
  const [running, setRunning] = useState<ScanKind | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const progress = station.scan && running ? Math.round((station.scan.progress || 0) * 100) : null;

  const onFinished = (ok: boolean) => {
    if (!ok) return;
    setTimeout(() => {
      if (alive.current) navigate("/instructions/3");
    }, 1200);
  };

  return (
    <MeasureShell
      step={1}
      title="២. ដាក់ចុងម្រាមដៃលើឧបករណ៍"
      subtitle="Step 2 — Heart rate & SpO2 · rest a fingertip lightly on the sensor"
      busy={running != null}
      station={station}
      progress={progress}
      footerDone={Boolean(status)}
      footer={
        status
          ? "ចង្វាក់បេះដូង និង SpO2 រួចរាល់ — សូមចុចបន្ត (Complete — please click Next)"
          : running
            ? "កំពុងអាន... សូមកុំកម្រើកម្រាមដៃ (Reading — keep your finger still)"
            : "សូមដាក់ម្រាមដៃ ហើយចុច 'ចាប់ផ្តើម' (Place your finger and press Start)"
      }
      next={{ label: "បន្តទៅមុខ (Next)", onClick: () => navigate("/instructions/3"), enabled: Boolean(status), pulse: Boolean(status) }}
    >
      <div className="w-full max-w-lg">
        <ScanCard
          kind="vitals"
          title="ចង្វាក់បេះដូង & SpO2"
          hint="Rest a fingertip lightly on the MAX30102 sensor — no pressing. 10-second scan."
          seconds={10}
          icon={<HeartPulse size={42} />}
          values={[
            { label: "Heart rate", field: "heart_rate_bpm", unit: "bpm", dp: 0, live: (e) => e.heartRate },
            { label: "SpO2", field: "spo2_percent", unit: "%", dp: 0, live: (e) => e.spo2 },
          ]}
          running={running}
          setRunning={setRunning}
          scan={station.scan}
          onFinished={onFinished}
        />
      </div>
    </MeasureShell>
  );
}
