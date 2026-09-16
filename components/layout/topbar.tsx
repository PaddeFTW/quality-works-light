import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { AccountMenu } from "@/components/layout/account-menu";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Separator } from "@/components/ui/separator";

interface TopbarProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function Topbar({
  title = "Min arbetsyta",
  description = "Din samlade vy för kvalitet och verksamhet.",
  actions,
  className,
}: TopbarProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
          <ThemeToggle />
          <Separator className="mx-1 hidden h-8 sm:block" orientation="vertical" />
          <AccountMenu />
        </div>
      </div>
    </div>
  );
}
