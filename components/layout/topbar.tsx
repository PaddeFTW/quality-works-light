"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { AccountMenu } from "@/components/layout/account-menu";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useOrgSession } from "@/components/providers/org-provider";
import { planOf } from "@/lib/billing/plans";

interface TopbarProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

const PAGE_TITLE: Record<string, string> = {
  "/": "Start",
  "/arshjul": "Årshjul",
  "/kompetens": "Personal",
  "/lagar": "Lagar",
  "/avvikelse": "Avvikelser",
  "/forslag": "Förslag",
  "/installningar": "Inställningar",
};

export function Topbar({
  title,
  description,
  actions,
  className,
}: TopbarProps) {
  const pathname = usePathname() || "/";
  const { session } = useOrgSession();
  const page = Object.entries(PAGE_TITLE).find(([href]) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href),
  )?.[1];
  const heading = title ?? session?.organizationName ?? "Quality Works Light";
  const sub = description ?? page ?? "Ledningssystem";

  return (
    <div
      className={cn(
        "shrink-0 rounded-2xl border bg-card/90 px-4 py-3 shadow-token-xs sm:px-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{sub}</p>
          <h2 className="truncate text-sm font-bold">{heading}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
          <ThemeToggle />
          <AccountMenu />
        </div>
      </div>
    </div>
  );
}
