"use client";

import { useState } from "react";
import { FileLock2, Printer } from "lucide-react";

import { DocumentPaperHeader } from "@/components/manual/document-paper-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DocumentVersion } from "@/types/domain";

interface ManualOriginalPanelProps {
  companyName: string;
  documentCode: string;
  documentTitle: string;
  content: string | null;
  publishedAt: string | null;
  edition: number;
  issuer?: string;
  headerText: string;
  footerText: string;
  versions?: DocumentVersion[];
  onRestore?: (edition: number) => void;
}

export function ManualOriginalPanel({
  companyName,
  documentCode,
  documentTitle,
  content,
  publishedAt,
  edition,
  issuer,
  footerText,
  versions = [],
  onRestore,
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
      <div className="mx-auto flex w-full max-w-[210mm] flex-col gap-5 px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Original – gällande version, låst</p>
            <p className="text-xs text-muted-foreground">
              {visibleDate ? `Godkänt ${visibleDate}` : "Gällande utgåva"}
            </p>
          </div>
          <Button onClick={() => window.print()} size="sm" variant="outline">
            <Printer data-icon="inline-start" />
            Skriv ut
          </Button>
        </div>
        {versions.length > 0 ? (
          <div className="rounded-md border bg-background p-3" aria-label="Arkiverade dokument">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Arkiverade dokument
            </p>
            <div className="grid grid-cols-[5rem_1fr_auto] gap-2 text-xs">
              <span className="text-muted-foreground">Utgåva</span>
              <span className="text-muted-foreground">Reviderad</span>
              <span />
              {versions.map((version) => (
                <div className="contents" key={version.id}>
                  <button
                    className="text-left font-medium"
                    onClick={() => setSelectedEdition(version.edition)}
                    type="button"
                  >
                    <Badge variant={version.edition === visibleEdition ? "default" : "outline"}>
                      {version.edition}
                    </Badge>
                  </button>
                  <button
                    className="text-left text-muted-foreground"
                    onClick={() => setSelectedEdition(version.edition)}
                    type="button"
                  >
                    {version.publishedAt}
                  </button>
                  {onRestore ? (
                    <button
                      className="text-xs text-primary underline"
                      onClick={() => onRestore(version.edition)}
                      type="button"
                    >
                      Återställ till arbetsmanual
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
            </div>
            {selectedVersion ? (
              <button className="mt-2 text-xs text-primary underline" onClick={() => setSelectedEdition(null)} type="button">
                Visa senaste
              </button>
            ) : null}
          </div>
        ) : null}
        <article className="document-paper overflow-hidden">
          <DocumentPaperHeader
            companyName={companyName}
            documentCode={documentCode}
            documentTitle={documentTitle}
            edition={visibleEdition}
            issuer={issuer}
            statusLabel="Original – gällande version, låst"
          />
          <div
            className="manual-tiptap-editor px-6 pb-10 pt-2 font-serif text-base leading-8"
            dangerouslySetInnerHTML={{ __html: visibleContent ?? "" }}
          />
          <div className="border-t px-6 py-3 text-xs text-muted-foreground">{footerText}</div>
        </article>
      </div>
    </ScrollArea>
  );
}
