import { BookOpen, CalendarDays, FileText, Home, Settings2, TriangleAlert } from "lucide-react";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

const navigation = [
  {
    title: "Dashboard",
    href: "/",
    icon: <Home className="size-4" />,
  },
  {
    title: "Avvikelsehantering",
    href: "/avvikelse",
    icon: <TriangleAlert className="size-4" />,
    badge: "12",
  },
  {
    title: "Manual",
    href: "/manual",
    icon: <BookOpen className="size-4" />,
  },
  {
    title: "Dokument",
    href: "/",
    icon: <FileText className="size-4" />,
  },
  {
    title: "Årshjul",
    href: "/arshjul",
    icon: <CalendarDays className="size-4" />,
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
