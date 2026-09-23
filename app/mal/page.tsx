"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { navigation } from "@/components/layout/navigation";
import { MalWorkspace } from "@/components/mal/mal-workspace";

export default function MalPage() {
  return (
    <DashboardLayout description="Vad ni vill bli bättre på i år, och hur ni ser att det går." navigation={navigation} title="Mål">
      <MalWorkspace />
    </DashboardLayout>
  );
}
