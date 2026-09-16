interface DocumentPaperHeaderProps {
  companyName: string;
  documentCode: string;
  documentTitle: string;
  edition: number;
  statusLabel: string;
  issuer?: string;
}

export function DocumentPaperHeader({
  companyName,
  documentCode,
  documentTitle,
  edition,
  statusLabel,
  issuer,
}: DocumentPaperHeaderProps) {
  return (
    <header className="shrink-0 px-8 pt-8">
      <div className="flex items-center gap-4 border-b border-paper-border pb-5">
        <div className="flex size-[4.25rem] shrink-0 items-center justify-center rounded-md border border-dashed border-paper-border bg-muted/20 text-[10px] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Logotyp
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-paper-foreground">{companyName || "Företagsnamn"}</p>
          {issuer ? <p className="truncate text-xs text-paper-muted">{issuer}</p> : null}
          <p className="mt-1 text-xs text-paper-muted">{statusLabel}</p>
        </div>
        <div className="shrink-0 text-right text-xs leading-5 text-paper-muted">
          <p className="font-mono">{documentCode || "—"}</p>
          <p>{edition > 0 ? `Utgåva ${edition}` : "Ingen utgåva"}</p>
        </div>
      </div>
      {documentTitle ? (
        <h1 className="pt-5 text-xl font-semibold tracking-tight text-paper-foreground">
          {documentCode ? `${documentCode}  ${documentTitle}` : documentTitle}
        </h1>
      ) : null}
    </header>
  );
}
