"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { isModuleVisible } from "@/lib/features";
import { useOrgSession } from "@/components/providers/org-provider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { navigationGroups } from "@/components/layout/navigation";
import type { NavItem } from "@/types";

interface SidebarProps {
  title?: string;
  subtitle?: string;
  items?: NavItem[];
  footer?: ReactNode;
  className?: string;
}

export function Sidebar({
  title = "Quality Works Light",
  subtitle = "Ledningssystem",
  items,
  footer,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const { session } = useOrgSession();
  const role = session?.role ?? "admin";
  const useGroups = !items || items.length === 0;
  const heading = session?.organizationName || title;

  return (
    <aside
      className={cn(
        "hidden w-80 shrink-0 border-r bg-sidebar text-sidebar-foreground lg:flex lg:flex-col",
        className,
      )}
    >
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="rounded-xl bg-primary/12 p-2 text-primary">
          <PanelLeft className="size-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">{heading}</h2>
          <p className="text-xs text-muted-foreground">
            {session?.role === "admin"
              ? "Administratör"
              : session?.role === "editor"
                ? "Redigerare"
                : session?.role === "viewer"
                  ? "Läsare"
                  : subtitle}
          </p>
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 px-3 py-5">
          {useGroups
            ? navigationGroups.map((group) => {
                const visibleItems = group.items.filter((item) =>
                  isModuleVisible(item.href, role),
                );
                if (visibleItems.length === 0) return null;
                return (
                  <div key={group.label} className="space-y-1">
                    <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </p>
                    {visibleItems.map((item) => {
                      const active =
                        item.href === "/"
                          ? pathname === "/"
                          : pathname.startsWith(item.href);
                      return (
                        <Link
                          className={cn(
                            "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-token",
                            active
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          )}
                          href={item.href}
                          key={item.href}
                        >
                          <span className="flex items-center gap-3">
                            {item.icon}
                            <span>{item.title}</span>
                          </span>
                          {item.badge ? (
                            <Badge className="border-transparent" variant="secondary">
                              {item.badge}
                            </Badge>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                );
              })
            : items
                .filter((item) => isModuleVisible(item.href, role))
                .map((item) => (
                  <Link
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-token hover:bg-accent hover:text-accent-foreground"
                    href={item.href}
                    key={item.href}
                  >
                    <span className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.title}</span>
                    </span>
                    {item.badge ? (
                      <Badge className="border-transparent" variant="secondary">
                        {item.badge}
                      </Badge>
                    ) : null}
                  </Link>
                ))}
        </div>
      </ScrollArea>
      {footer ? (
        <>
          <Separator />
          <div className="p-4">{footer}</div>
        </>
      ) : null}
    </aside>
  );
}
