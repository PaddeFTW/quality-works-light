import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { HelperDock } from "@/components/common/helper-dock";
import type { NavItem } from "@/types";

interface AppLayoutProps {
  children: ReactNode;
  navigation?: NavItem[];
  sidebarFooter?: ReactNode;
  topbarActions?: ReactNode;
  contentClassName?: string;
  hideSidebar?: boolean;
}

export function AppLayout({
  children,
  navigation,
  sidebarFooter,
  topbarActions,
  contentClassName,
  hideSidebar = false,
}: AppLayoutProps) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        href="#innehall"
      >
        Hoppa till innehållet
      </a>
      {hideSidebar ? null : <Sidebar footer={sidebarFooter} items={navigation} />}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Topbar actions={topbarActions} />
        <main
          className={cn("min-h-0 flex-1 overflow-y-auto px-4 py-6 pb-20 sm:px-6 lg:px-8 lg:pb-8", contentClassName)}
          id="innehall"
        >
          {children}
        </main>
        <HelperDock />
      </div>
    </div>
  );
}
