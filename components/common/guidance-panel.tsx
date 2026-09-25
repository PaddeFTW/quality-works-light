"use client";

import { LifeBuoy, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { articlesFor, type GuideArticle } from "@/lib/knowledge/guide";

export function GuidancePanel({
  place,
  intro,
  onClose,
}: {
  place: GuideArticle["place"];
  intro: string;
  onClose: () => void;
}) {
  const articles = articlesFor(place);
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-l bg-background">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <LifeBuoy className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">Vägledning</h2>
        </div>
        <Button aria-label="Stäng vägledning" onClick={onClose} size="icon" type="button" variant="ghost">
          <X />
        </Button>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4 text-sm">
        <p className="leading-6 text-muted-foreground">{intro}</p>
        {articles.map((article) => (
          <section key={article.id}>
            <h3 className="font-medium">{article.title}</h3>
            <p className="mt-1 leading-6 text-muted-foreground">{article.body}</p>
          </section>
        ))}
        <p className="text-xs text-muted-foreground">
          Korta svar om hur du gör. Inget måste.
        </p>
      </div>
    </aside>
  );
}
