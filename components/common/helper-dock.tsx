"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { LifeBuoy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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
      <Sheet onOpenChange={setOpen} open={open}>
        <SheetContent>
          <div className="pr-8">
            <h2 className="text-lg font-semibold">Konsult</h2>
            <p className="mt-1 text-sm text-muted-foreground">Svar från vägledningen. Inget skrivs i manualen eller i andra formulär.</p>
          </div>
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
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            {turns.map((turn) => (
              <article className="rounded-xl border bg-background p-3 text-sm" key={turn.id}>
                <p className="font-medium">{turn.question}</p>
                <p className="mt-2 leading-6">{turn.answer.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">{turn.answer.source}</p>
              </article>
            ))}
            <div className="space-y-4 border-t pt-4 text-sm">
              <p className="font-medium">På den här sidan</p>
              {articles.map((article) => (
                <section key={article.id}>
                  <h3 className="font-medium">{article.title}</h3>
                  <p className="mt-1 leading-6 text-muted-foreground">{article.body}</p>
                </section>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
