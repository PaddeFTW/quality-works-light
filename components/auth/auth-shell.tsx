import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AuthShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function AuthShell({
  title,
  description,
  children,
  className,
  contentClassName,
}: AuthShellProps) {
  return (
    <main
      className={cn(
        "flex min-h-screen w-full items-center justify-center px-4 py-12",
        className,
      )}
    >
      <div className={cn("w-full space-y-8", contentClassName)}>
        <div className="flex flex-col items-center gap-2 text-center">
          <span
            aria-hidden
            className="flex size-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-token-sm"
          >
            QW
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </main>
  );
}
