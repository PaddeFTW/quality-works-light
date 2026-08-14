import {
  BookOpen,
  Building2,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Gauge,
  Gavel,
  Home,
  ListChecks,
  MessageSquareText,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  UsersRound,
  UserRoundCheck,
} from "lucide-react";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

const navigation = [
  { title: "Dashboard", href: "/", icon: <Home /> },
  { title: "Manual", href: "/manual", icon: <BookOpen /> },
  { title: "Årshjul", href: "/", icon: <Gauge /> },
  { title: "Avvikelsehantering", href: "/", icon: <ShieldAlert /> },
  { title: "Förbättringsförslag", href: "/", icon: <ListChecks /> },
  { title: "Riskbedömning", href: "/", icon: <ShieldCheck /> },
  { title: "Intern Revision", href: "/", icon: <FileCheck2 /> },
  { title: "Protokoll", href: "/", icon: <FileText /> },
  { title: "Kundtillfredsställelse", href: "/", icon: <MessageSquareText /> },
  { title: "Leverantörsbedömning", href: "/", icon: <Building2 /> },
  { title: "Lagar & Bindande krav", href: "/", icon: <Gavel /> },
  { title: "Personalenkät", href: "/", icon: <UsersRound /> },
  { title: "Personal & Kompetens", href: "/", icon: <UserRoundCheck /> },
  { title: "Inställningar", href: "/", icon: <Settings2 /> },
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
