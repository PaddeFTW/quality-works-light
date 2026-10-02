"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { navigation } from "@/components/layout/navigation";
import { MiljoWorkspace } from "@/components/miljo/miljo-workspace";

export default function MiljoaspekterPage() {
  return (
    <DashboardLayout description="Vad i verksamheten som påverkar miljön, och hur stort det är." navigation={navigation} title="Miljöaspekter">
      <MiljoWorkspace />
    </DashboardLayout>
  );
}
