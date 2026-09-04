"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import { isModuleVisible, type AppRole } from "@/lib/features";
import { useOrgSession } from "@/components/providers/org-provider";
import { navigation, primaryNavHrefs } from "@/components/layout/navigation";
import { Tip } from "@/components/ui/tooltip";
import type { NavItem } from "@/types";

interface SidebarProps {
  title?: string;
  subtitle?: string;
  items?: NavItem[];
  footer?: ReactNode;
  className?: string;
}

const ROLE: Record<AppRole, string> = {
  viewer: "L\u00e4sare",
  editor: "Redakt\u00f6r",
  admin: "Administrat\u00f6r",
};

export function Sidebar({ items, className }: SidebarProps) {
  const pathname = usePathname();
  const { session } = useOrgSession();
  const role = session?.role ?? "admin";
  const compact = pathname.startsWith("/manual");

  const source = items?.length ? items : navigation;
  const visibleItems = source.filter((item) => isModuleVisible(item.href, role));
  const primary = visibleItems.filter((item) =>
    (primaryNavHrefs as readonly string[]).includes(item.href),
  );
  const rest = visibleItems.filter(
    (item) =>
      !(primaryNavHrefs as readonly string[]).includes(item.href) && item.href !== "/installningar",
  );
  const settings = visibleItems.find((item) => item.href === "/installningar");

  const isActive = (item: NavItem) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

  const linkClass = (item: NavItem, labeled: boolean) =>
    cn(
      "flex items-center rounded-lg text-muted-foreground transition-token hover:bg-accent hover:text-accent-foreground",
      labeled ? "h-10 w-full gap-3 px-3 text-sm font-medium" : "size-10 justify-center",
      isActive(item) && "bg-accent text-accent-foreground",
    );

  function NavLink({ item, labeled }: { item: NavItem; labeled: boolean }) {
    const link = (
      <Link
        aria-current={isActive(item) ? "page" : undefined}
        aria-label={item.title}
        className={linkClass(item, labeled)}
        href={item.href}
      >
        {item.icon}
        {labeled ? <span className="truncate">{item.title}</span> : <span className="sr-only">{item.title}</span>}
      </Link>
    );
    return (
      <Tip label={item.title} side="right">
        {link}
      </Tip>
    );
  }

  return (
    <aside
      aria-label="Huvudnavigation"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex h-14 border-t bg-sidebar text-sidebar-foreground lg:static lg:h-screen lg:shrink-0 lg:flex-col lg:border-r lg:border-t-0",
        compact ? "lg:w-14" : "lg:w-60",
        className,
      )}
    >
      <div
        className={cn(
          "hidden border-b lg:flex",
          compact ? "h-14 items-center justify-center" : "h-16 items-center gap-3 px-4",
        )}
      >
        <BookOpen aria-hidden className="size-5 shrink-0 text-primary" />
        {compact ? (
          <span className="sr-only">Quality Works Light</span>
        ) : (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">Quality Works Light</p>
            <p className="truncate text-xs text-muted-foreground">{ROLE[role]}</p>
          </div>
        )}
      </div>

      <nav
        className={cn(
          "flex w-full items-center justify-around gap-1 px-2 lg:flex-1 lg:flex-col lg:justify-start lg:py-3",
          compact ? "lg:items-center lg:gap-1 lg:px-2" : "lg:items-stretch lg:gap-1 lg:px-3",
        )}
      >
        {primary.map((item) => (
          <NavLink item={item} key={item.href} labeled={!compact} />
        ))}
        {rest.map((item) => (
          <NavLink item={item} key={item.href} labeled={!compact} />
        ))}
        <div className="hidden flex-1 lg:block" />
        {settings ? <NavLink item={settings} labeled={!compact} /> : null}
      </nav>
    </aside>
  );
}

export default Sidebar;
