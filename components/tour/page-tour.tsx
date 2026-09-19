"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { tourForPath, tourStorageKey } from "@/lib/tours";

type Phase = "off" | "run" | "confirm" | "fly";

export function PageTour() {
  const path = usePathname() || "/";
  const tour = tourForPath(path);
  const [phase, setPhase] = useState<Phase>("off");
  const [step, setStep] = useState(0);
  const [fly, setFly] = useState({ x: 24, y: 24 });

  useEffect(() => {
    if (!tour) {
      setPhase("off");
      return;
    }
    const seen = window.localStorage.getItem(tourStorageKey(tour.id));
    setStep(0);
    setPhase(seen ? "off" : "run");
  }, [tour]);

  useEffect(() => {
    function onStart() {
      if (!tour) return;
      setStep(0);
      setPhase("run");
    }
    window.addEventListener("qw:start-tour", onStart);
    return () => window.removeEventListener("qw:start-tour", onStart);
  }, [tour]);

  if (!tour || phase === "off") return null;

  const current = tour.steps[step];
  const last = step >= tour.steps.length - 1;
  const number = step + 1;

  function finish(kind: "done" | "skipped") {
    if (!tour) return;
    window.localStorage.setItem(tourStorageKey(tour.id), kind);
    setPhase("off");
  }

  function skipToBuoy() {
    const home = document.getElementById("tour-home");
    const box = home?.getBoundingClientRect();
    setFly({
      x: box ? box.left + box.width / 2 - 18 : window.innerWidth - 56,
      y: box ? box.top + box.height / 2 - 18 : window.innerHeight - 56,
    });
    setPhase("fly");
    window.setTimeout(() => finish("skipped"), 420);
  }

  if (phase === "fly") {
    return (
      <div
        aria-hidden
        className="pointer-events-none fixed z-[80] flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-token-lg transition-all duration-300"
        style={{ left: fly.x, top: fly.y }}
      >
        {number}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none">
      <div className="pointer-events-auto absolute bottom-24 left-1/2 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border bg-card p-4 shadow-token-lg">
        <button
          aria-label="Stäng rundturen"
          className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={() => setPhase("confirm")}
          type="button"
        >
          <X className="size-4" />
        </button>
        <p className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {number}
        </p>
        <h2 className="mt-3 text-base font-bold">{current.title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{current.body}</p>
        {phase === "confirm" ? (
          <div className="mt-4 rounded-xl bg-muted/70 p-3">
            <p className="text-sm font-medium">Vill du avbryta rundturen?</p>
            <div className="mt-3 flex gap-2">
              <Button onClick={skipToBuoy} size="sm" type="button">
                Ja, avbryt
              </Button>
              <Button onClick={() => setPhase("run")} size="sm" type="button" variant="outline">
                Nej, fortsätt
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Du kan starta den igen vid livbojen.</p>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {number} av {tour.steps.length}
            </p>
            <Button
              onClick={() => {
                if (last) finish("done");
                else setStep((n) => n + 1);
              }}
              size="sm"
              type="button"
            >
              {last ? "Klar" : "Nästa"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
