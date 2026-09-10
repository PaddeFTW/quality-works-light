import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { navigation } from "@/components/layout/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function HomePage() {
  return (
    <DashboardLayout
      description="Det som behöver göras i ledningssystemet, idag."
      navigation={navigation}
      title="Start"
    >
      <DashboardOverview />
    </DashboardLayout>
  );
}
