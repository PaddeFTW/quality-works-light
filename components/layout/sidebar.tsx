"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import { ROLE_LABEL, isModuleVisible } from "@/lib/features";
import { BrandMark } from "@/components/brand/brand-mark";
import { useOrgSession } from "@/components/providers/org-provider";
import { navigation, primaryNavHrefs } from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { Tip } from "@/components/ui/tooltip";
import type { NavItem } from "@/types";

interface SidebarProps {
  title?: string;
  subtitle?: string;
  items?: NavItem[];
  footer?: ReactNode;
  className?: string;
}

const SIDEBAR_KEY = "qw.sidebar.collapsed";

export function Sidebar({ items, className }: SidebarProps) {
  const pathname = usePathname();
  const { session } = useOrgSession();
  const role = session?.role ?? "admin";
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(SIDEBAR_KEY) === "1");
  }, []);

  function toggle() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      return next;
    });
  }

  const source = items?.length ? items : navigation;
  const visibleItems = source.filter((item) => isModuleVisible(item.href, role));
  const primary = visibleItems.filter((item) =>
    (primaryNavHrefs as readonly string[]).includes(item.href),
  );
  const settings = visibleItems.find((item) => item.href === "/installningar");

  const isActive = (item: NavItem) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

const NAV_TINT: Record<string, string> = {
  "/": "text-primary",
  "/manual": "text-info",
  "/arshjul": "text-warning",
  "/mal": "text-primary",
  "/kompetens": "text-success",
  "/lagar": "text-info",
  "/miljoaspekter": "text-success",
  "/avvikelse": "text-destructive",
  "/forslag": "text-warning",
  "/kund": "text-info",
  "/leverantor": "text-warning",
  "/installningar": "text-muted-foreground",
};

  const linkClass = (item: NavItem, labeled: boolean) =>
    cn(
      "flex items-center rounded-xl text-muted-foreground shadow-none transition-token hover:bg-accent hover:text-accent-foreground",
      labeled ? "h-10 w-full gap-3 px-3 text-sm font-semibold" : "size-10 justify-center",
      isActive(item) && "bg-primary text-primary-foreground! shadow-token-sm hover:bg-primary hover:text-primary-foreground",
    );

  function NavLink({ item, labeled }: { item: NavItem; labeled: boolean }) {
    const newTab = item.href === "/manual";
    return (
      <Tip className={labeled ? "w-full" : undefined} label={newTab ? `${item.title} (ny flik)` : item.title} side="right">
        <Link
          aria-current={isActive(item) ? "page" : undefined}
          aria-label={item.title}
          className={linkClass(item, labeled)}
          href={item.href}
          rel={newTab ? "noopener noreferrer" : undefined}
          target={newTab ? "_blank" : undefined}
        >
          <span className={cn("inline-flex shrink-0", isActive(item) ? "text-primary-foreground!" : NAV_TINT[item.href] || "text-primary")}>
            {item.icon}
          </span>
          {labeled ? <span className="truncate">{item.title}</span> : <span className="sr-only">{item.title}</span>}
        </Link>
      </Tip>
    );
  }

  return (
    <aside
      aria-label="Huvudnavigation"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex h-14 overflow-hidden border-t bg-sidebar text-sidebar-foreground lg:static lg:h-full lg:flex-col lg:rounded-2xl lg:border lg:border-t lg:bg-card lg:shadow-token-sm",
        collapsed ? "lg:w-16" : "lg:w-60",
        className,
      )}
    >
      <div
        className={cn(
          "hidden lg:flex",
          collapsed ? "h-14 items-center justify-center" : "items-center gap-3 px-4 py-4",
        )}
      >
        <BrandMark markClassName="size-8" />
        {collapsed ? (
          <span className="sr-only">Quality Works Light</span>
        ) : (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-bold">Quality Works Light</p>
            <p className="truncate text-xs text-muted-foreground">{ROLE_LABEL[role]}</p>
          </div>
        )}
      </div>

      <nav
        className={cn(
          "flex w-full min-w-0 items-center justify-around gap-1 overflow-x-hidden px-2 lg:min-h-0 lg:flex-1 lg:flex-col lg:justify-start lg:overflow-y-auto lg:py-3",
          collapsed ? "lg:items-center lg:gap-1 lg:px-2" : "lg:items-stretch lg:gap-1 lg:px-3",
        )}
      >
        {primary.map((item) => (
          <NavLink item={item} key={item.href} labeled={!collapsed} />
        ))}
        {settings ? (
          <span className="lg:hidden">
            <NavLink item={settings} labeled={false} />
          </span>
        ) : null}
      </nav>
      <div
        className={cn(
          "hidden shrink-0 lg:flex lg:flex-col lg:gap-1 lg:py-2",
          collapsed ? "lg:items-center lg:px-2" : "lg:px-3",
        )}
      >
        {settings ? <NavLink item={settings} labeled={!collapsed} /> : null}
        <Tip label={collapsed ? "Visa menyn" : "Dölj menyn"} side="right">
          <Button
            aria-label={collapsed ? "Visa menyn" : "Dölj menyn"}
            className="hidden lg:inline-flex"
            onClick={toggle}
            size="icon"
            type="button"
            variant="ghost"
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        </Tip>
      </div>
    </aside>
  );
}

export default Sidebar;
