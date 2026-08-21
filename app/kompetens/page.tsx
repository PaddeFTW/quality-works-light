import { ModuleShell } from "@/components/common/module-shell";

export default function KompetensPage() {
  return (
    <ModuleShell
      title="Personal- och kompetensutveckling"
      description="Kompetensmatris, introduktion och uppföljning av utbildningsbehov."
      comingSoonPoints={[
        "Kompetensmatris per roll",
        "Utbildningsplan",
        "Koppling till Manualens kompetensavsnitt",
      ]}
    />
  );
}
