"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
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
  const [phase, setPhase] = useState<Phase>("off");
  const [step, setStep] = useState(0);
  const [box, setBox] = useState<Box | null>(null);

  useEffect(() => {
    if (!tour) {
      setPhase("off");
      return;
    }
    setStep(0);
    const seen = window.localStorage.getItem(tourStorageKey(tour.id));
    if (seen) {
      setPhase("off");
      return;
    }
    window.localStorage.setItem(tourStorageKey(tour.id), "seen");
    setPhase("run");
  }, [path, tour]);

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
    if (!current || phase === "off") return;
    const el = current.target ? document.querySelector(current.target) : null;
    el?.scrollIntoView({ block: "center", inline: "nearest" });
  }, [current, phase, step]);

  useLayoutEffect(() => {
    if (!current || phase === "off") {
      setBox(null);
      return;
    }
    const measure = () => {
      const el = current.target ? document.querySelector(current.target) : null;
      if (!el) {
        setBox(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      setBox({ top: rect.top, left: rect.left, width: Math.max(rect.width, 8), height: Math.max(rect.height, 8) });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [current, phase, step]);

  if (!tour || !current || phase === "off") return null;

  const last = step >= tour.steps.length - 1;
  const number = step + 1;
  const side = box && box.left < 360 ? "right" : "bottom";
  const anchor = box ?? {
    top: Math.round(window.innerHeight * 0.35),
    left: Math.round(window.innerWidth * 0.5),
    width: 8,
    height: 8,
  };

  function finish(kind: "done" | "skipped") {
    if (!tour) return;
    window.localStorage.setItem(tourStorageKey(tour.id), kind);
    setPhase("off");
  }

  return (
    <>
      {box ? (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[70] rounded-xl ring-2 ring-blue-600"
          style={{
            top: box.top - 6,
            left: box.left - 6,
            width: box.width + 12,
            height: box.height + 12,
            boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.45), 0 0 0 4px white",
          }}
        />
      ) : (
        <div className="fixed inset-0 z-[70] bg-black/35" />
      )}
      <Popover open>
        <PopoverAnchor asChild>
          <div
            className="pointer-events-none fixed z-[76]"
            style={{ top: anchor.top, left: anchor.left, width: anchor.width, height: anchor.height }}
          />
        </PopoverAnchor>
        <PopoverContent
          align="start"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          side={side}
        >
          <button
            aria-label="Stäng rundturen"
            className="absolute right-2 top-2 rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
            onClick={() => setPhase("confirm")}
            type="button"
          >
            <X className="size-4" />
          </button>
          <p className="flex size-7 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
            {number}
          </p>
          <h2 className="mt-2 pr-6 text-base font-bold text-zinc-950">{current.title}</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-700">{current.body}</p>
          {phase === "confirm" ? (
            <div className="mt-3">
              <p className="text-sm font-medium text-zinc-950">Avbryta rundturen?</p>
              <div className="mt-2 flex gap-2">
                <Button className="bg-blue-700 text-white hover:bg-blue-800" onClick={() => finish("skipped")} size="sm" type="button">
                  Ja
                </Button>
                <Button onClick={() => setPhase("run")} size="sm" type="button" variant="outline">
                  Nej
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-xs text-zinc-500">
                {number} av {tour.steps.length}
              </p>
              <Button
                className="bg-blue-700 text-white hover:bg-blue-800"
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
        </PopoverContent>
      </Popover>
    </>
  );
}
