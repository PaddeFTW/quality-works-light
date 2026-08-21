import { ModuleShell } from "@/components/common/module-shell";

export default function KundPage() {
  return (
    <ModuleShell
      title="Kundtillfredsställelse"
      description="Samla in och följ upp kundsynpunkter som underlag till förbättring."
      comingSoonPoints={[
        "Enkäter och återkoppling",
        "Trend över tid",
        "Koppling till kvalitetsmål",
      ]}
    />
  );
}
