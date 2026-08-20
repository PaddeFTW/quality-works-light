import {
  Accessibility,
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Gauge,
  Gavel,
  Leaf,
  Lightbulb,
  Settings2,
  Target,
  Users,
  UserRoundCheck,
  Wrench,
} from "lucide-react";

export const navigation = [
  { title: "Dashboard", href: "/", icon: <Gauge className="size-4" /> },
  { title: "Manual", href: "/manual", icon: <BookOpen className="size-4" /> },
  { title: "SWOT", href: "/swot", icon: <FileText className="size-4" /> },
  { title: "Mål", href: "/mal", icon: <Target className="size-4" /> },
  { title: "Årshjul", href: "/arshjul", icon: <CalendarDays className="size-4" /> },
  { title: "Personal & kompetens", href: "/kompetens", icon: <Users className="size-4" /> },
  { title: "Kundtillfredsställelse", href: "/kund", icon: <UserRoundCheck className="size-4" /> },
  { title: "Leverantörsbedömning", href: "/leverantor", icon: <CheckCircle2 className="size-4" /> },
  { title: "Lagar & bindande krav", href: "/lagar", icon: <Gavel className="size-4" /> },
  { title: "Miljöaspekter", href: "/miljoaspekter", icon: <Leaf className="size-4" /> },
  { title: "Kontroller", href: "/kontroller", icon: <ClipboardCheck className="size-4" /> },
  { title: "Avvikelsehantering", href: "/avvikelse", icon: <AlertTriangle className="size-4" /> },
  { title: "Förbättringsförslag", href: "/forslag", icon: <Lightbulb className="size-4" /> },
  { title: "Intern revision", href: "/intern-revision", icon: <Wrench className="size-4" /> },
  { title: "Ledningsgenomgång", href: "/ledningsgenomgang", icon: <Accessibility className="size-4" /> },
  { title: "Inställningar", href: "/installningar", icon: <Settings2 className="size-4" /> },
];

export default navigation;
