"use client";

import { Contrast, Monitor, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import { useMounted } from "@/hooks/use-mounted";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const modes = [
  { id: "system", label: "System", icon: Monitor },
  { id: "light", label: "Ljust", icon: SunMedium },
  { id: "dark", label: "Hög kontrast", icon: Contrast },
] as const;

export function ThemeToggle() {
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();

  if (!mounted) {
    return <div className="h-9 w-[9.5rem] rounded-md border bg-background" />;
  }

  return (
    <div className="inline-flex overflow-hidden rounded-md border">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const active = theme === mode.id;
        return (
          <Button
            aria-label={mode.label}
            className={cn("rounded-none border-0 shadow-none", active && "bg-primary text-primary-foreground")}
            key={mode.id}
            onClick={() => setTheme(mode.id)}
            size="sm"
            title={mode.label}
            type="button"
            variant={active ? "default" : "ghost"}
          >
            <Icon className="size-3.5" />
            <span className="sr-only sm:not-sr-only sm:inline">{mode.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
