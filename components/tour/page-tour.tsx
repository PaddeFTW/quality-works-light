"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { tourForPath, tourStorageKey } from "@/lib/tours";

type Phase = "off" | "run" | "confirm";

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function PageTour() {
  const path = usePathname() || "/";
  const tour = tourForPath(path);
  const auto = path === "/";
  const [phase, setPhase] = useState<Phase>("off");
  const [step, setStep] = useState(0);
  const [box, setBox] = useState<Box | null>(null);

  useEffect(() => {
    if (!tour) {
      setPhase("off");
      return;
    }
    setStep(0);
    if (!auto) {
      setPhase("off");
      return;
    }
    const seen = window.localStorage.getItem(tourStorageKey(tour.id));
    setPhase(seen ? "off" : "run");
  }, [path, auto, tour]);

  useEffect(() => {
    function onStart() {
      if (!tour) return;
      setStep(0);
      setPhase("run");
    }
    window.addEventListener("qw:start-tour", onStart);
    return () => window.removeEventListener("qw:start-tour", onStart);
  }, [tour]);

  const current = tour?.steps[step];

  useLayoutEffect(() => {
    if (!current || (phase !== "run" && phase !== "confirm")) {
      setBox(null);
      return;
    }
    const el = current.target ? document.querySelector(current.target) : null;
    const place = () => {
      if (!el) {
        setBox(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      setBox({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [current, phase, step]);

  if (!tour || !current || phase === "off") return null;

  const last = step >= tour.steps.length - 1;
  const number = step + 1;

  function finish(kind: "done" | "skipped") {
    if (!tour) return;
    window.localStorage.setItem(tourStorageKey(tour.id), kind);
    setPhase("off");
  }

  const cardWidth = 320;
  let cardTop = window.innerHeight - 220;
  let cardLeft = window.innerWidth - cardWidth - 24;
  if (box) {
    cardTop = box.top + box.height + 12;
    cardLeft = box.left;
    if (cardTop + 190 > window.innerHeight) cardTop = Math.max(12, box.top - 190);
    if (cardLeft + cardWidth > window.innerWidth - 12) cardLeft = window.innerWidth - cardWidth - 12;
    if (cardLeft < 12) cardLeft = 12;
  }

  return (
    <>
      {box ? (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[70] rounded-xl ring-4 ring-primary"
          style={{ top: box.top - 4, left: box.left - 4, width: box.width + 8, height: box.height + 8 }}
        />
      ) : null}
      <div
        className="fixed z-[80] w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border bg-card p-4 text-card-foreground shadow-token-lg"
        role="dialog"
        style={{ top: cardTop, left: cardLeft }}
      >
        <button
          aria-label="Stäng rundturen"
          className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={() => setPhase("confirm")}
          type="button"
        >
          <X className="size-4" />
        </button>
        <p className="flex size-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {number}
        </p>
        <h2 className="mt-2 pr-6 text-base font-bold">{current.title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{current.body}</p>
        {phase === "confirm" ? (
          <div className="mt-3">
            <p className="text-sm font-medium">Avbryta rundturen?</p>
            <div className="mt-2 flex gap-2">
              <Button onClick={() => finish("skipped")} size="sm" type="button">
                Ja
              </Button>
              <Button onClick={() => setPhase("run")} size="sm" type="button" variant="outline">
                Nej
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-2">
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
    </>
  );
}
