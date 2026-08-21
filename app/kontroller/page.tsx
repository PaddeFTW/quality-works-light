import { ModuleShell } from "@/components/common/module-shell";

export default function KontrollerPage() {
  return (
    <ModuleShell
      title="Kontroller"
      description="Egenkontroll, kontrollplan, riskbedömning, skydds- och miljörond samt säkerhetsdatablad."
      comingSoonPoints={[
        "Egenkontroll & kontrollplan",
        "Riskbedömning",
        "Skyddsrond / miljörond",
        "Säkerhetsdatablad",
      ]}
    />
  );
}
