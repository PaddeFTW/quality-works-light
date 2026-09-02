"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { isModuleVisible } from "@/lib/features";
import { useOrgSession } from "@/components/providers/org-provider";
import { navigationGroups } from "@/components/layout/navigation";
import type { NavItem } from "@/types";

interface SidebarProps {
  title?: string;
  subtitle?: string;
  items?: NavItem[];
  footer?: ReactNode;
  className?: string;
}

export function Sidebar({ items, className }: SidebarProps) {
  const pathname = usePathname();
  const { session } = useOrgSession();
  const role = session?.role ?? "admin";
  const visibleItems = (items?.length ? items : navigationGroups.flatMap((group) => group.items)).filter(
    (item) => isModuleVisible(item.href, role),
  );

  const isActive = (item: NavItem) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

  return (
    <aside
      aria-label="Huvudnavigation"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex h-14 border-t bg-sidebar text-sidebar-foreground lg:static lg:h-screen lg:w-12 lg:shrink-0 lg:flex-col lg:border-r lg:border-t-0",
        className,
      )}
    >
      <div className="hidden h-12 items-center justify-center border-b lg:flex" title="Quality Works Light">
        <PanelLeft aria-hidden="true" className="size-5 text-primary" />
      </div>
      <nav className="flex w-full items-center justify-around gap-1 px-2 lg:flex-1 lg:flex-col lg:justify-start lg:gap-2 lg:px-1 lg:py-3">
        {visibleItems.map((item) => (
          <Link
            aria-current={isActive(item) ? "page" : undefined}
            aria-label={item.title}
            className={cn(
              "flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-token hover:bg-accent hover:text-accent-foreground",
              isActive(item) && "bg-accent text-accent-foreground",
            )}
            href={item.href}
            key={item.href}
            title={item.title}
          >
            {item.icon}
            <span className="sr-only">{item.title}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
