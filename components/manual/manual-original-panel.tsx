"use client";

import { useState, type MouseEvent } from "react";
import { FileLock2, Printer } from "lucide-react";

import { DocumentPaperHeader } from "@/components/manual/document-paper-header";
import { FlowCanvas } from "@/components/manual/flow-canvas";
import { pageLabel, printPackedDocument, unpackDocument } from "@/lib/manual/document-pack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DocumentVersion, ManualAttachment } from "@/types/domain";

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
  documents?: { id: string; label: string }[];
  attachments?: ManualAttachment[];
  onOpenDocument?: (id: string) => void;
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
  documents = [],
  attachments = [],
  onOpenDocument,
}: ManualOriginalPanelProps) {
  const [selectedEdition, setSelectedEdition] = useState<number | null>(null);
  const selectedVersion = versions.find((version) => version.edition === selectedEdition);
  const packed = selectedVersion?.content ?? content ?? "";
  const parsed = unpackDocument(packed);
  const visibleContent = parsed.html;
  const known = new Set(documents.map((item) => item.id));
  const html = visibleContent.replace(/<a ([^>]*href="qwl:\/\/doc\/([^"]+)"[^>]*)>([\s\S]*?)<\/a>/g, (full, _attrs, id: string, text: string) =>
    known.size === 0 || known.has(id) ? full : `${text} <span class="text-muted-foreground">saknas</span>`,
  );

  function follow(event: MouseEvent<HTMLElement>) {
    const anchor = (event.target as HTMLElement).closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href") || "";
    if (!href || href.startsWith("#")) return;
    event.preventDefault();
    if (href.startsWith("http")) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    if (href.startsWith("mailto:")) {
      window.location.href = href;
      return;
    }
    if (href.startsWith("qwl://doc/")) {
      const id = href.slice("qwl://doc/".length);
      if (known.size > 0 && !known.has(id)) return;
      onOpenDocument?.(id);
      return;
    }
    if (href.startsWith("qwl://modul")) {
      window.location.assign(href.slice("qwl://modul".length) || "/");
      return;
    }
    if (href.startsWith("qwl://fil/")) {
      const file = attachments.find((item) => item.id === href.slice("qwl://fil/".length));
      if (file?.url) window.open(file.url, "_blank", "noopener,noreferrer");
    }
  }
  const visibleEdition = selectedVersion?.edition ?? edition;
  const visibleDate = selectedVersion?.publishedAt ?? publishedAt;

  if (!content) {
    return (
      <div className="flex min-h-0 flex-1 justify-center overflow-auto bg-gradient-to-b from-muted/70 to-muted/30 p-6 md:p-10">
        <div className="document-paper flex min-h-[42rem] w-full max-w-[210mm] flex-col">
          <DocumentPaperHeader
            companyName={companyName}
            documentCode={documentCode}
            documentTitle={documentTitle}
            edition={edition}
            issuer={issuer}
            statusLabel="Inget original än"
          />
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-10 py-16 text-center">
            <FileLock2 className="size-6 text-paper-muted" />
            <p className="max-w-sm text-sm leading-7 text-paper-muted">Inget publicerat dokument ännu.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="min-h-0 flex-1 bg-muted/40">
      <div className="mx-auto flex w-full flex-col gap-5 px-6 py-8" style={{ maxWidth: parsed.page === "landscape" ? "297mm" : "210mm" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Original – låst</p>
            <p className="text-xs text-muted-foreground">
              {visibleDate ? `Godkänt ${visibleDate}` : "Gällande utgåva"}
            </p>
          </div>
          <Button onClick={() => printPackedDocument(`${documentCode} ${documentTitle}`, packed, companyName, footerText)} size="sm" variant="outline">
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
                    {version.changeNote ? ` · ${version.changeNote}` : ""}
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
        <article className={`document-paper is-current overflow-hidden ${parsed.page === "landscape" ? "is-landscape" : ""}`} style={{ width: parsed.page === "landscape" ? "297mm" : "210mm", minHeight: parsed.page === "landscape" ? "210mm" : "297mm" }}>
          <DocumentPaperHeader
            companyName={companyName}
            documentCode={documentCode}
            documentTitle={documentTitle}
            edition={visibleEdition}
            issuer={issuer}
            statusLabel={visibleEdition > 0 ? `Original · utgåva ${visibleEdition} · låst · ${pageLabel(parsed.page)}` : `Original · låst · ${pageLabel(parsed.page)}`}
          />
          <div
            className="manual-tiptap-editor px-6 pb-4 pt-2 font-serif text-base leading-8"
            dangerouslySetInnerHTML={{ __html: html }}
            onClick={follow}
          />
          {parsed.flow.shapes.length > 0 ? (
            <FlowCanvas editable={false} height={parsed.page === "landscape" ? 460 : 360} hideBar onChange={() => undefined} onFollow={(link) => {
              if (link.href.startsWith("http")) window.open(link.href, "_blank", "noopener,noreferrer");
              else if (link.href.startsWith("mailto:")) window.location.href = link.href;
              else if (link.href.startsWith("qwl://doc/")) {
                const id = link.href.slice("qwl://doc/".length);
                if (known.size > 0 && !known.has(id)) return;
                onOpenDocument?.(id);
              }
              else if (link.href.startsWith("qwl://modul")) window.location.assign(link.href.slice("qwl://modul".length) || "/");
              else if (link.href.startsWith("qwl://fil/")) {
                const file = attachments.find((item) => item.id === link.href.slice("qwl://fil/".length));
                if (file?.url) window.open(file.url, "_blank", "noopener,noreferrer");
              }
            }} value={parsed.flow} />
          ) : null}
          <footer className="border-t px-6 py-3 text-xs text-muted-foreground">{footerText}</footer>
        </article>
      </div>
    </ScrollArea>
  );
}
