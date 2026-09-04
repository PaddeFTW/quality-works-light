"use client";

import { Contrast, Monitor, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import { useMounted } from "@/hooks/use-mounted";
import { Button } from "@/components/ui/button";
import { Tip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const modes = [
  { id: "system", label: "System", icon: Monitor },
  { id: "light", label: "Ljust", icon: SunMedium },
  { id: "dark", label: "H\u00f6g kontrast", icon: Contrast },
] as const;

export function ThemeToggle() {
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();

  if (!mounted) {
    return <div className="h-9 w-[9.5rem] rounded-md border bg-background" />;
  }

  return (
    <div className="inline-flex overflow-visible rounded-md border">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const active = theme === mode.id;
        return (
          <Tip key={mode.id} label={mode.label}>
            <Button
              aria-label={mode.label}
              className={cn("rounded-none border-0 shadow-none", active && "bg-primary text-primary-foreground")}
              onClick={() => setTheme(mode.id)}
              size="sm"
              type="button"
              variant={active ? "default" : "ghost"}
            >
              <Icon className="size-3.5" />
              <span className="sr-only sm:not-sr-only sm:inline">{mode.label}</span>
            </Button>
          </Tip>
        );
      })}
    </div>
  );
}
