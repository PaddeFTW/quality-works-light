"use client";

import { CertWorkspace } from "@/components/certifiering/cert-workspace";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { navigation } from "@/components/layout/navigation";

export default function CertifieringPage() {
  return (
    <DashboardLayout
      description="En lista att gå igenom innan revisorn kommer. Ja, nej och ett datum."
      navigation={navigation}
      title="Inför certifiering"
    >
      <CertWorkspace />
    </DashboardLayout>
  );
}
