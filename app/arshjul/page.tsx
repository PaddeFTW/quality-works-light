import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Home,
  Settings2,
  TriangleAlert,
} from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { ArshjulOverview } from "@/components/arshjul/arshjul-overview";
import { AppLayout } from "@/components/layout/app-layout";

const navigation = [
  { title: "Dashboard", href: "/", icon: <Home /> },
  { title: "Avvikelser", href: "/", icon: <TriangleAlert />, badge: "12" },
  { title: "Dokument", href: "/", icon: <FileText /> },
  { title: "Aktiviteter", href: "/", icon: <ClipboardCheck /> },
  { title: "Årshjul", href: "/arshjul", icon: <CalendarDays />, badge: "Aktiv" },
  { title: "Manual", href: "/manual", icon: <BookOpen />, badge: "Ny" },
  { title: "Inställningar", href: "/", icon: <Settings2 /> },
];

export default function ArshjulPage() {
  return (
    <AppLayout navigation={navigation}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <PageHeader
          description="Planera, följ upp och få koll på årets återkommande aktiviteter."
          eyebrow="Planering"
          title="Årshjul"
        />
        <ArshjulOverview />
      </div>
    </AppLayout>
  );
}
