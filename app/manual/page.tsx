import {
  BookOpen,
  Building2,
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
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

import { AppLayout } from "@/components/layout/app-layout";
import { ManualWorkspace } from "@/components/manual/manual-workspace";

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

export default function ManualPage() {
  return (
    <AppLayout
      contentClassName="p-0 sm:p-0 lg:p-0"
      navigation={navigation}
    >
      <ManualWorkspace />
    </AppLayout>
  );
}
