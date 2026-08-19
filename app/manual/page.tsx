import { BookOpen, ClipboardCheck, FileText, Home, Settings2, TriangleAlert } from "lucide-react";

import { AppLayout } from "@/components/layout/app-layout";
import { ManualWorkspace } from "@/components/manual/manual-workspace";

const navigation = [
  { title: "Dashboard", href: "/", icon: <Home className="size-4" /> },
  { title: "Avvikelser", href: "/", icon: <TriangleAlert className="size-4" />, badge: "12" },
  { title: "Dokument", href: "/", icon: <FileText className="size-4" /> },
  { title: "Aktiviteter", href: "/", icon: <ClipboardCheck className="size-4" /> },
  { title: "Manual", href: "/manual", icon: <BookOpen className="size-4" />, badge: "Ny" },
  { title: "Inställningar", href: "/", icon: <Settings2 className="size-4" /> },
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
