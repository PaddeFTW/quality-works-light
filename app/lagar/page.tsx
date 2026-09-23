"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { navigation } from "@/components/layout/navigation";
import { LagarWorkspace } from "@/components/lagar/lagar-workspace";

export default function LagarPage() {
  return (
    <DashboardLayout
      description="Vilka lagar som gäller er, och hur ni följer dem."
      navigation={navigation}
      title="Lagar"
    >
      <LagarWorkspace />
    </DashboardLayout>
  );
}
