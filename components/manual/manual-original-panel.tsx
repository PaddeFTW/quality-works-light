"use client";

import { FileLock2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ManualOriginalPanelProps {
  documentTitle: string;
  content: string | null;
  publishedAt: string | null;
  headerText: string;
  footerText: string;
}

export function ManualOriginalPanel({
  documentTitle,
  content,
  publishedAt,
  headerText,
  footerText,
}: ManualOriginalPanelProps) {
  if (!content) {
    return (
      <div className="flex min-h-[28rem] flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <div className="rounded-2xl bg-muted p-4 text-muted-foreground">
          <FileLock2 className="size-6" />
        </div>
        <h3 className="text-lg font-semibold">Inget publicerat dokument ännu</h3>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          Publicera innehållet från fliken Arbetsmanual för att skapa en
          låst originalversion.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-6 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Read-only</Badge>
          {publishedAt ? (
            <span className="text-xs text-muted-foreground">
              Publicerad {publishedAt}
            </span>
          ) : null}
        </div>
        <div className="rounded-xl border bg-card shadow-token-xs">
          <div className="border-b px-6 py-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {headerText}
          </div>
          <div className="px-6 py-6">
            <h3 className="mb-4 text-xl font-semibold tracking-tight">
              {documentTitle}
            </h3>
            <div className="whitespace-pre-line text-sm leading-7 text-foreground">
              {content}
            </div>
          </div>
          <div className="border-t px-6 py-3 text-xs leading-5 text-muted-foreground">
            {footerText}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
