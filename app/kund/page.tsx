"use client";

import { KundWorkspace } from "@/components/kund/kund-workspace";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { navigation } from "@/components/layout/navigation";

export default function KundPage() {
  return (
    <DashboardLayout
      description="Vilka kunder ni har, och vad de tycker. Ni kan svara åt kunden om svaret dröjer."
      navigation={navigation}
      title="Kunder"
    >
      <KundWorkspace />
    </DashboardLayout>
  );
}
