import { BookOpen, ClipboardCheck, FileText, Home, Settings2, TriangleAlert } from "lucide-react";

import { ManualWorkspace } from "@/components/manual/manual-workspace";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

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
    <DashboardLayout
      description="Arbetssätt, roller och kvalitetsmål samlade på ett ställe."
      navigation={navigation}
      title="Manual"
    >
      <ManualWorkspace />
    </DashboardLayout>
  );
}
