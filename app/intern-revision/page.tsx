"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { navigation } from "@/components/layout/navigation";
import { RevisionWorkspace } from "@/components/revision/revision-workspace";

export default function InternRevisionPage() {
  return (
    <DashboardLayout
      description="Gå igenom kraven. 1 uppfyller. 2 och 3 blir en rapport med vad som ska göras."
      navigation={navigation}
      title="Intern revision"
    >
      <RevisionWorkspace />
    </DashboardLayout>
  );
}
