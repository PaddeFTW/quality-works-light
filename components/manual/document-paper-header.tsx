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
    <header className="shrink-0 px-10 pt-9">
      <div className="flex items-center gap-5 pb-6">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-secondary/80 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
          Logotyp
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-paper-foreground">{companyName || "Företagsnamn"}</p>
          {issuer ? <p className="truncate text-xs text-paper-muted">{issuer}</p> : null}
          <p className="mt-1 text-xs font-medium text-primary">{statusLabel}</p>
        </div>
        <div className="shrink-0 rounded-xl bg-muted/50 px-3 py-2 text-right text-xs leading-5 text-paper-muted">
          <p className="font-mono text-paper-foreground">{documentCode || "—"}</p>
          <p>{edition > 0 ? `Utgåva ${edition}` : "Inte publicerad"}</p>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-paper-border to-transparent" />
      {documentTitle ? (
        <h1 className="pt-5 text-xl font-semibold tracking-tight text-paper-foreground">
          {documentCode ? `${documentCode}  ${documentTitle}` : documentTitle}
        </h1>
      ) : null}
    </header>
  );
}
