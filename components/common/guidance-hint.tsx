"use client";

import { useState } from "react";
import { Lightbulb, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  isHintDismissed,
  setHintDismissed,
  type GuidanceHintData,
} from "@/lib/guidance";
import { cn } from "@/lib/utils";

export function GuidanceHint({
  hint,
  onApply,
  className,
}: {
  hint: GuidanceHintData;
  onApply?: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(() => !isHintDismissed(hint.id));

  function hide() {
    setOpen(false);
    setHintDismissed(hint.id, true);
  }

  function show() {
    setOpen(true);
    setHintDismissed(hint.id, false);
  }

  if (!open) {
    return (
      <Button
        aria-label="Visa tips"
        className={cn("size-8", className)}
        onClick={show}
        size="icon"
        title="Visa tips"
        type="button"
        variant="ghost"
      >
        <Lightbulb />
      </Button>
    );
  }

  return (
    <div className={cn("relative rounded-md border bg-muted/40 px-3 py-2.5 pr-9 text-sm", className)}>
      <button
        aria-label="Stäng tips"
        className="absolute right-1.5 top-1.5 rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        onClick={hide}
        type="button"
      >
        <X className="size-3.5" />
      </button>
      <p className="font-medium">{hint.title}</p>
      <p className="mt-1 text-muted-foreground">{hint.body}</p>
      {hint.applyValue && onApply ? (
        <Button
          className="mt-2"
          onClick={() => onApply(hint.applyValue ?? "")}
          size="sm"
          type="button"
          variant="outline"
        >
          {hint.applyLabel ?? "Använd förslaget"}
        </Button>
      ) : null}
    </div>
  );
}

