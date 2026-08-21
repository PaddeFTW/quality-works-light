import { ModuleShell } from "@/components/common/module-shell";

export default function KompetensPage() {
  return (
    <ModuleShell
      title="Personal & kompetens"
      description="Kompetensmatris, introduktion och uppföljning av utbildningsbehov."
      comingSoonPoints={[
        "Kompetensmatris per roll",
        "Utbildningsplan",
        "Koppling till Manualens kompetensavsnitt",
      ]}
    />
  );
}
