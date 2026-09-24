import {
  AlertTriangle,
  BookOpen,
  CalendarRange,
  ClipboardCheck,
  Grid2x2,
  LayoutDashboard,
  Leaf,
  Lightbulb,
  Presentation,
  Scale,
  SearchCheck,
  Settings,
  Smile,
  Target,
  Truck,
  Users,
} from "lucide-react";

import type { NavGroup, NavItem } from "@/types";

export const navigationGroups: NavGroup[] = [
  {
    label: "Styrning",
    items: [
      { title: "Dashboard", href: "/", icon: <LayoutDashboard className="size-4" /> },
      { title: "Manual", href: "/manual", icon: <BookOpen className="size-4" /> },
      { title: "SWOT", href: "/swot", icon: <Grid2x2 className="size-4" /> },
      { title: "Mål", href: "/mal", icon: <Target className="size-4" /> },
      { title: "Årshjul", href: "/arshjul", icon: <CalendarRange className="size-4" /> },
    ],
  },
  {
    label: "Resurser & intressenter",
    items: [
      {
        title: "Personal",
        href: "/kompetens",
        icon: <Users className="size-4" />,
      },
      {
        title: "Kunder",
        href: "/kund",
        icon: <Smile className="size-4" />,
      },
      {
        title: "Leverantörer",
        href: "/leverantor",
        icon: <Truck className="size-4" />,
      },
    ],
  },
  {
    label: "Efterlevnad",
    items: [
      {
        title: "Lagar och bindande krav",
        href: "/lagar",
        icon: <Scale className="size-4" />,
      },
      {
        title: "Miljöaspekter",
        href: "/miljoaspekter",
        icon: <Leaf className="size-4" />,
      },
      {
        title: "Inför certifiering",
        href: "/certifiering",
        icon: <ClipboardCheck className="size-4" />,
      },
      {
        title: "Kontroller",
        href: "/kontroller",
        icon: <ClipboardCheck className="size-4" />,
      },
    ],
  },
  {
    label: "Förbättring",
    items: [
      {
        title: "Avvikelsehantering",
        href: "/avvikelse",
        icon: <AlertTriangle className="size-4" />,
      },
      {
        title: "Förbättringsförslag",
        href: "/forslag",
        icon: <Lightbulb className="size-4" />,
      },
      {
        title: "Intern revision",
        href: "/intern-revision",
        icon: <SearchCheck className="size-4" />,
      },
      {
        title: "Ledningens genomgång",
        href: "/ledningsgenomgang",
        icon: <Presentation className="size-4" />,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        title: "Inställningar",
        href: "/installningar",
        icon: <Settings className="size-4" />,
      },
    ],
  },
];

export const primaryNavHrefs = ["/", "/manual", "/arshjul", "/mal", "/avvikelse", "/forslag", "/kund", "/leverantor", "/kompetens", "/lagar", "/miljoaspekter", "/certifiering", "/intern-revision", "/ledningsgenomgang"] as const;

export const navigation: NavItem[] = navigationGroups.flatMap((group) => group.items);

export default navigation;
