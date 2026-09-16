"use client";

import { useState } from "react";
import { LifeBuoy } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tip } from "@/components/ui/tooltip";
import { articlesFor } from "@/lib/knowledge/guide";

export function HelperDock() {
  const [open, setOpen] = useState(false);
  const articles = articlesFor("start");

  return (
    <>
      <Tip label="Vägledning">
        <Button
          aria-label="Vägledning"
          className="fixed bottom-4 right-4 z-40 size-12 rounded-full shadow-token-lg"
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
            <DialogTitle>Vägledning</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {articles.map((article) => (
              <section key={article.id}>
                <h3 className="font-medium">{article.title}</h3>
                <p className="mt-1 leading-6 text-muted-foreground">{article.body}</p>
              </section>
            ))}
            <p className="text-xs text-muted-foreground">
              Färdiga svar från kunskapsbanken. En pratande hjälpreda kommer senare.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
