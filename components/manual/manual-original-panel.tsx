"use client";

import { useState } from "react";
import { FileLock2, Link2, Printer, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DocumentVersion } from "@/types/domain";

interface ManualOriginalPanelProps {
  documentTitle: string;
  content: string | null;
  publishedAt: string | null;
  edition: number;
  headerText: string;
  footerText: string;
  versions?: DocumentVersion[];
}

export function ManualOriginalPanel({
  documentTitle,
  content,
  publishedAt,
  edition,
  headerText,
  footerText,
  versions = [],
}: ManualOriginalPanelProps) {
  const [selectedEdition, setSelectedEdition] = useState<number | null>(null);
  const selectedVersion = versions.find((version) => version.edition === selectedEdition);
  const visibleContent = selectedVersion?.content ?? content;
  const visibleEdition = selectedVersion?.edition ?? edition;
  const visibleDate = selectedVersion?.publishedAt ?? publishedAt;

  if (!content) {
    return (
      <div className="flex min-h-[28rem] flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <div className="rounded-2xl bg-muted p-4 text-muted-foreground">
          <FileLock2 className="size-6" />
        </div>
        <h3 className="text-lg font-semibold">Inget publicerat dokument ännu</h3>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          Publicera från Arbetsmanual för att låsa en originalutgåva.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="min-h-0 flex-1 bg-muted/40">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="font-semibold">Du är i originalmanualen</p>
              <p className="text-xs text-muted-foreground">Skrivskyddad senaste utgåva</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => window.print()} size="sm" variant="outline"><Printer data-icon="inline-start" />Skriv ut</Button>
            <Button onClick={() => void navigator.clipboard.writeText(window.location.href)} size="sm" variant="outline"><Link2 data-icon="inline-start" />Kopiera länk</Button>
            <Badge variant="secondary">Utgåva {visibleEdition}</Badge>
            {visibleDate ? <span className="text-xs text-muted-foreground">{visibleDate}</span> : null}
          </div>
        </div>
        {versions.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-background p-3" aria-label="Versionshistorik">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Versioner</span>
            {versions.map((version) => (
              <button className="rounded-md" key={version.id} onClick={() => setSelectedEdition(version.edition)} type="button">
                <Badge variant={version.edition === visibleEdition ? "default" : "outline"}>Utgåva {version.edition} · {version.publishedAt}</Badge>
              </button>
            ))}
            {selectedVersion ? <button className="text-xs text-primary underline" onClick={() => setSelectedEdition(null)} type="button">Visa senaste</button> : null}
          </div>
        ) : null}
        <article className="document-paper overflow-hidden rounded-sm">
          <div className="grid grid-cols-3 border-b px-6 py-3 text-xs text-muted-foreground">
            <span>Granskad / utfärdare</span>
            <span className="text-center font-medium text-foreground">{headerText || documentTitle}</span>
            <span className="text-right">Utgåva {visibleEdition}</span>
          </div>
          <div className="px-10 py-10">
            <h3 className="mb-4 text-xl font-semibold tracking-tight">{documentTitle}</h3>
            <div
              className="manual-tiptap-editor text-sm leading-7"
              dangerouslySetInnerHTML={{ __html: visibleContent ?? "" }}
            />
          </div>
          <div className="border-t px-6 py-3 text-xs text-muted-foreground">{footerText}</div>
        </article>
      </div>
    </ScrollArea>
  );
}
