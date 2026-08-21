import { ModuleShell } from "@/components/common/module-shell";

export default function LagarPage() {
  return (
    <ModuleShell
      title="Lagar & bindande krav"
      description="Laglista och lagefterlevnadskontroll för kvalitet, miljö och arbetsmiljö."
      comingSoonPoints={[
        "Laglista med ansvarig",
        "Lagefterlevnadskontroll",
        "Påminnelser i Årshjulet",
      ]}
    />
  );
}
