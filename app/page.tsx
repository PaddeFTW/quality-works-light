import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { navigation } from "@/components/layout/navigation";
import { AppLayout } from "@/components/layout/app-layout";

export default function HomePage() {
  return (
    <AppLayout navigation={navigation}>
      <DashboardOverview />
    </AppLayout>
  );
}
