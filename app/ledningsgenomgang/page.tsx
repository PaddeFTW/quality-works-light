"use client";

import { LedningWorkspace } from "@/components/ledning/ledning-workspace";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { navigation } from "@/components/layout/navigation";

export default function LedningsgenomgangPage() {
  return (
    <DashboardLayout
      description="Ett möte om året. Siffrorna kommer från de andra sidorna. Här skriver ni vad ni bestämde."
      navigation={navigation}
      title="Ledningens genomgång"
    >
      <LedningWorkspace />
    </DashboardLayout>
  );
}
