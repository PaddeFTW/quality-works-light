"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { AccountMenu } from "@/components/layout/account-menu";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useOrgSession } from "@/components/providers/org-provider";
import { Separator } from "@/components/ui/separator";
import { planOf } from "@/lib/billing/plans";

interface TopbarProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function Topbar({
  title,
  description,
  actions,
  className,
}: TopbarProps) {
  const { session } = useOrgSession();
  const heading = title ?? "Quality Works Light";
  const sub = description ?? session?.organizationName ?? "Ledningssystem";

  return (
    <div
      className={cn(
        "sticky top-0 z-30 shrink-0 border-b bg-background/90 backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 px-6 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold">{heading}</h2>
          <p className="truncate text-xs text-muted-foreground">
            {sub}
            {session?.plan ? ` · ${planOf(session.plan).name}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
          <ThemeToggle />
          <Separator className="mx-1 hidden h-8 sm:block" orientation="vertical" />
          <AccountMenu />
        </div>
      </div>
    </div>
  );
}
