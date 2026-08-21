import { ModuleShell } from "@/components/common/module-shell";

export default function InstallningarPage() {
  return (
    <ModuleShell
      title="Inställningar"
      description="Företagsuppgifter, användare, behörigheter och systempreferenser."
      comingSoonPoints={[
        "Företagsprofil",
        "Användare och roller",
        "Aviseringar",
      ]}
    />
  );
}
