import { ModuleShell } from "@/components/common/module-shell";

export default function LeverantorPage() {
  return (
    <ModuleShell
      title="Leverantörsbedömning"
      description="Bedöm och följ upp leverantörer utifrån kvalitet, miljö och leveranssäkerhet."
      comingSoonPoints={[
        "Leverantörsregister",
        "Bedömningsmall",
        "Återkommande utvärdering",
      ]}
    />
  );
}
