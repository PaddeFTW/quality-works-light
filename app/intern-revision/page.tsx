import { ModuleShell } from "@/components/common/module-shell";

export default function InternRevisionPage() {
  return (
    <ModuleShell
      title="Intern revision"
      description="Planera, genomför och dokumentera interna revisioner enligt ISO."
      comingSoonPoints={[
        "Revisionsplan",
        "Checklistor per process",
        "Avvikelser från revision",
      ]}
    />
  );
}
