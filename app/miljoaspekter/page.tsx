import { ModuleShell } from "@/components/common/module-shell";

export default function MiljoaspekterPage() {
  return (
    <ModuleShell
      title="Miljöaspekter"
      description="Identifiera och värdera miljöaspekter samt miljöutredning för ISO 14001."
      comingSoonPoints={[
        "Miljöutredning",
        "Aspektregister med betydelse",
        "Koppling till miljömål",
      ]}
    />
  );
}
