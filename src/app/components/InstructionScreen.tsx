import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { PersonStanding, Scale } from "lucide-react";
import { useCheckupStore } from "../../stores/useCheckupStore";
import { useStation, type ScanKind } from "../hooks/useStation";
import { MeasureShell } from "./measure/MeasureShell";
import { ScanCard } from "./measure/ScanCard";

// Step 1 · Height and weight — two scans, each started on its own (test.html steps 1 and 2).
export function InstructionScreen() {
  const navigate = useNavigate();
  const station = useStation();
  const stepStatus = useCheckupStore((s) => s.stepStatus);
  const [running, setRunning] = useState<ScanKind | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const complete = Boolean(stepStatus.height && stepStatus.weight);
  const progress = station.scan && running ? Math.round((station.scan.progress || 0) * 100) : null;

  // Like test.html: once both are finished, move on automatically.
  const onFinished = (ok: boolean) => {
    if (!ok) return;
    setTimeout(() => {
      const s = useCheckupStore.getState().stepStatus;
      if (s.height && s.weight && alive.current) navigate("/instructions/2");
    }, 1200);
  };

  return (
    <MeasureShell
      step={0}
      title="១. វាស់កម្ពស់ និងទម្ងន់"
      subtitle="Step 1 — Height & Weight · start each measurement on its own"
      busy={running != null}
      station={station}
      progress={progress}
      footerDone={complete}
      footer={
        complete
          ? "កម្ពស់ និងទម្ងន់រួចរាល់ — សូមចុចបន្ត (Complete — please click Next)"
          : running === "height"
            ? "កំពុងវាស់កម្ពស់... សូមឈរឱ្យត្រង់ (Measuring height)"
            : running === "weight"
              ? "កំពុងថ្លឹងទម្ងន់... សូមឈរឱ្យនឹង (Measuring weight)"
              : "សូមចុច 'ចាប់ផ្តើម' លើការវាស់នីមួយៗ (Press Start on each measurement)"
      }
      next={{ label: "បន្តទៅមុខ (Next)", onClick: () => navigate("/instructions/2"), enabled: complete, pulse: complete }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <ScanCard
          kind="height"
          title="កម្ពស់ (Height)"
          hint="Stand straight under the sensor and look ahead. 5-second scan."
          seconds={5}
          icon={<PersonStanding size={44} />}
          values={[{ label: "Height", field: "height_cm", unit: "cm", dp: 1, live: (e) => e.live }]}
          running={running}
          setRunning={setRunning}
          scan={station.scan}
          onFinished={onFinished}
        />
        <ScanCard
          kind="weight"
          title="ទម្ងន់ (Weight)"
          hint="Step onto the scale and stand still until the reading is stable."
          icon={<Scale size={40} />}
          values={[{ label: "Weight", field: "weight_kg", unit: "kg", dp: 1, live: (e) => e.live }]}
          running={running}
          setRunning={setRunning}
          scan={station.scan}
          onFinished={onFinished}
        />
      </div>
    </MeasureShell>
  );
}
