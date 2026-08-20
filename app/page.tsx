import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { navigation } from "@/components/layout/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function HomePage() {
  return (
    <DashboardLayout
      description="Överblick över kvalitet, aktiviteter och kundupplevelse."
      navigation={navigation}
      title="Dashboard"
    >
      <DashboardOverview />
    </DashboardLayout>
  );
}
