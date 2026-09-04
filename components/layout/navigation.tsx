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
      { title: "M\u00e5l", href: "/mal", icon: <Target className="size-4" /> },
      { title: "\u00c5rshjul", href: "/arshjul", icon: <CalendarRange className="size-4" /> },
    ],
  },
  {
    label: "Resurser & intressenter",
    items: [
      {
        title: "Personal- och kompetensutveckling",
        href: "/kompetens",
        icon: <Users className="size-4" />,
      },
      {
        title: "Kundtillfredsst\u00e4llelse",
        href: "/kund",
        icon: <Smile className="size-4" />,
      },
      {
        title: "Leverant\u00f6rsbed\u00f6mning",
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
        title: "Milj\u00f6aspekter",
        href: "/miljoaspekter",
        icon: <Leaf className="size-4" />,
      },
      {
        title: "Kontroller",
        href: "/kontroller",
        icon: <ClipboardCheck className="size-4" />,
      },
    ],
  },
  {
    label: "F\u00f6rb\u00e4ttring",
    items: [
      {
        title: "Avvikelsehantering",
        href: "/avvikelse",
        icon: <AlertTriangle className="size-4" />,
      },
      {
        title: "F\u00f6rb\u00e4ttringsf\u00f6rslag",
        href: "/forslag",
        icon: <Lightbulb className="size-4" />,
      },
      {
        title: "Intern revision",
        href: "/intern-revision",
        icon: <SearchCheck className="size-4" />,
      },
      {
        title: "Ledningsgenomg\u00e5ng",
        href: "/ledningsgenomgang",
        icon: <Presentation className="size-4" />,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        title: "Inst\u00e4llningar",
        href: "/installningar",
        icon: <Settings className="size-4" />,
      },
    ],
  },
];

export const primaryNavHrefs = ["/", "/manual", "/arshjul", "/avvikelse", "/forslag"] as const;

export const navigation: NavItem[] = navigationGroups.flatMap((group) => group.items);

export default navigation;
