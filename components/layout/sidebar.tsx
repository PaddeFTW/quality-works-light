"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { isModuleVisible } from "@/lib/features";
import { useOrgSession } from "@/components/providers/org-provider";
import { navigation } from "@/components/layout/navigation";
import { AccountMenu } from "@/components/layout/account-menu";
import type { NavItem } from "@/types";

interface SidebarProps {
  title?: string;
  items?: NavItem[];
  footer?: ReactNode;
  className?: string;
}

export function Sidebar({ title = "Quality Works Light", items, footer, className }: SidebarProps) {
  const pathname = usePathname();
  const { session } = useOrgSession();
  const role = session?.role ?? "admin";
  const heading = session?.organizationName || title;
  const visibleItems = (items ?? navigation).filter((item) => isModuleVisible(item.href, role));

  return (
    <aside className={cn("hidden w-16 shrink-0 flex-col items-center border-r bg-sidebar py-4 lg:flex", className)}>
      <Link href="/" aria-label={heading} title={heading} className="mb-6 flex size-10 items-center justify-center rounded-xl bg-primary/12 text-sm font-bold text-primary">
        QW
      </Link>
      <nav aria-label="Huvudnavigation" className="flex flex-1 flex-col items-center gap-2">
        {visibleItems.map((item: NavItem) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              aria-label={item.title}
              className={cn("flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-token hover:bg-accent hover:text-accent-foreground", active && "bg-primary text-primary-foreground shadow-sm")}
              href={item.href}
              key={item.href}
              title={item.title}
            >
              {item.icon}
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-col items-center gap-3">
        {footer}
        <AccountMenu />
      </div>
    </aside>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();
  const { session } = useOrgSession();
  const role = session?.role ?? "admin";
  const visibleItems = navigation.filter((item) => isModuleVisible(item.href, role));
  const settingsItem = visibleItems.find((item) => item.href === "/installningar");
  const primaryItems = visibleItems.filter((item) => item.href !== "/installningar").slice(0, 7);
  return (
    <nav aria-label="Huvudnavigation" className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t bg-background/95 px-2 py-2 backdrop-blur lg:hidden">
      {primaryItems.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return <Link aria-label={item.title} aria-current={active ? "page" : undefined} className={cn("flex size-10 items-center justify-center rounded-xl text-muted-foreground", active && "bg-primary text-primary-foreground")} href={item.href} key={item.href} title={item.title}>{item.icon}</Link>;
      })}
      {settingsItem ? (
        <Link aria-label={settingsItem.title} href={settingsItem.href} title={settingsItem.title} className="flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-token hover:bg-accent hover:text-accent-foreground">
          {settingsItem.icon}
        </Link>
      ) : null}
    </nav>
  );
}
