import { ModuleShell } from "@/components/common/module-shell";

export default function LedningsgenomgangPage() {
  return (
    <ModuleShell
      title="Ledningsgenomgång"
      description="Ledningens genomgång med underlag, beslut och åtgärder (ISO 9.3)."
      comingSoonPoints={[
        "Mötesunderlag",
        "Beslut och protokoll",
        "Uppföljning av åtgärder",
      ]}
    />
  );
}
