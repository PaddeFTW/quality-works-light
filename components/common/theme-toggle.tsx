"use client";

import { Contrast, Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import { useMounted } from "@/hooks/use-mounted";
import { Button } from "@/components/ui/button";
import { Tip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const modes = [
  { id: "light", label: "Ljust", icon: SunMedium },
  { id: "dark", label: "Mörkt", icon: Moon },
  { id: "contrast", label: "Kontrast", icon: Contrast },
  { id: "contrast-dark", label: "Kontrast mörk", icon: Contrast },
] as const;

export function ThemeToggle() {
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();

  if (!mounted) {
    return <div className="h-9 w-[9.5rem] rounded-md border bg-background" />;
  }

  return (
    <div className="inline-flex overflow-hidden rounded-xl border bg-muted/40 p-0.5">
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
              <span className="sr-only">{mode.label}</span>
            </Button>
          </Tip>
        );
      })}
    </div>
  );
}
