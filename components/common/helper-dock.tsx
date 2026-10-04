"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { LifeBuoy } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tip } from "@/components/ui/tooltip";
import { consult, type ConsultAnswer } from "@/lib/knowledge/consultant";
import { articlesFor, type GuideArticle } from "@/lib/knowledge/guide";

function placeFromPath(path: string): GuideArticle["place"] {
  if (path.startsWith("/manual")) return "manual";
  if (path.startsWith("/arshjul")) return "arshjul";
  if (path.startsWith("/kompetens")) return "kompetens";
  if (path.startsWith("/lagar")) return "lagar";
  if (path.startsWith("/miljoaspekter")) return "miljo";
  if (path.startsWith("/mal")) return "mal";
  return "start";
}

type Turn = { id: number; question: string; answer: ConsultAnswer };

export function HelperDock() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const path = usePathname() || "/";
  const articles = articlesFor(placeFromPath(path));

  const ask = () => {
    const text = question.trim();
    if (!text) return;
    setTurns((current) => [{ id: Date.now(), question: text, answer: consult(text) }, ...current].slice(0, 6));
    setQuestion("");
  };

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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Konsult</DialogTitle>
            <DialogDescription>Svar från vägledningen. Inget skrivs i manualen eller i andra formulär.</DialogDescription>
          </DialogHeader>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              ask();
            }}
          >
            <Input
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Hur publicerar jag ett dokument?"
              value={question}
            />
            <Button type="submit">Fråga</Button>
          </form>
          <div className="flex flex-col gap-3">
            {turns.map((turn) => (
              <article className="rounded-xl border bg-card p-3 text-sm" key={turn.id}>
                <p className="font-medium">{turn.question}</p>
                <p className="mt-2 leading-6">{turn.answer.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">{turn.answer.source}</p>
              </article>
            ))}
          </div>
          <div className="space-y-4 border-t pt-4 text-sm">
            <p className="font-medium">På den här sidan</p>
            {articles.map((article) => (
              <section key={article.id}>
                <h3 className="font-medium">{article.title}</h3>
                <p className="mt-1 leading-6 text-muted-foreground">{article.body}</p>
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
