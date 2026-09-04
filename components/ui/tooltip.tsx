"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface TooltipProps {
  label: string;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

const sideClass: Record<NonNullable<TooltipProps["side"]>, string> = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
};

export function Tooltip({ label, children, side = "top", className }: TooltipProps) {
  if (!label) return children;

  return (
    <span className={cn("relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-md transition-opacity delay-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100",
          sideClass[side],
        )}
      >
        {label}
      </span>
    </span>
  );
}

export function Tip({ label, side = "top", className, children }: TooltipProps) {
  return (
    <span className={cn("group/tip inline-flex", className)}>
      <Tooltip label={label} side={side}>
        {children}
      </Tooltip>
    </span>
  );
}
