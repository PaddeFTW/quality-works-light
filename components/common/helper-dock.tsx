"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { LifeBuoy } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tip } from "@/components/ui/tooltip";
import { articlesFor, type GuideArticle } from "@/lib/knowledge/guide";
import { startTourEvent, tourForPath } from "@/lib/tours";

function placeFromPath(path: string): GuideArticle["place"] {
  if (path.startsWith("/manual")) return "manual";
  if (path.startsWith("/arshjul")) return "arshjul";
  if (path.startsWith("/kompetens")) return "kompetens";
  if (path.startsWith("/lagar")) return "lagar";
  if (path.startsWith("/mal")) return "mal";
  return "start";
}

export function HelperDock() {
  const [open, setOpen] = useState(false);
  const path = usePathname() || "/";
  const articles = articlesFor(placeFromPath(path));
  const hasTour = Boolean(tourForPath(path));

  return (
    <>
      <Tip label="Hjälp">
        <Button
          aria-label="Hjälp"
          className="fixed bottom-4 right-4 z-40 size-12 rounded-full bg-primary text-primary-foreground shadow-token-lg"
          id="tour-home"
          onClick={() => setOpen(true)}
          size="icon"
          type="button"
        >
          <LifeBuoy className="size-5" />
        </Button>
      </Tip>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hjälp</DialogTitle>
          </DialogHeader>
          {hasTour ? (
            <Button
              onClick={() => {
                setOpen(false);
                startTourEvent();
              }}
              type="button"
              variant="outline"
            >
              Visa rundtur
            </Button>
          ) : null}
          <div className="space-y-4 text-sm">
            {articles.map((article) => (
              <section key={article.id}>
                <h3 className="font-bold">{article.title}</h3>
                <p className="mt-1 leading-6 text-muted-foreground">{article.body}</p>
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
