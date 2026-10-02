"use client";

import { LeverantorWorkspace } from "@/components/leverantor/leverantor-workspace";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { navigation } from "@/components/layout/navigation";

export default function LeverantorPage() {
  return (
    <DashboardLayout
      description="Vilka ni köper av, och hur bra de är. Det är ni som bedömer."
      navigation={navigation}
      title="Leverantörer"
    >
      <LeverantorWorkspace />
    </DashboardLayout>
  );
}
