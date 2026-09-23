"use client";

import { ModuleShell } from "@/components/common/module-shell";
import { KompetensWorkspace } from "@/components/kompetens/kompetens-workspace";

export default function KompetensPage() {
  return (
    <ModuleShell
      description="Vem som jobbar här, och vem som kan vad."
      title="Personal"
    >
      <KompetensWorkspace />
    </ModuleShell>
  );
}
