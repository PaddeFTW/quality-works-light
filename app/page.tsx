import { ClipboardCheck, FileText, Home, Settings2, TriangleAlert } from "lucide-react";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

const navigation = [
  {
    title: "Dashboard",
    href: "/",
    icon: <Home className="size-4" />,
  },
  {
    title: "Avvikelser",
    href: "/",
    icon: <TriangleAlert className="size-4" />,
    badge: "12",
  },
  {
    title: "Dokument",
    href: "/",
    icon: <FileText className="size-4" />,
  },
  {
    title: "Aktiviteter",
    href: "/",
    icon: <ClipboardCheck className="size-4" />,
  },
  {
    title: "Inställningar",
    href: "/",
    icon: <Settings2 className="size-4" />,
  },
];

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
