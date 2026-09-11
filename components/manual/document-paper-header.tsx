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
    <header className="shrink-0">
      <div className="mx-6 mt-6 grid grid-cols-3 items-center border px-4 py-3 text-xs text-muted-foreground">
        <span>Logotyp</span>
        <span className="text-center font-medium text-foreground">{companyName || "Företagsnamn"}</span>
        <span className="text-right">ID-nr {documentCode}</span>
      </div>
      <div className="mx-6 grid grid-cols-3 border-x border-b px-4 py-2 text-xs text-muted-foreground">
        <span className="truncate">{issuer || "Utfärdare"}</span>
        <span className="text-center">{statusLabel}</span>
        <span className="text-right">{edition > 0 ? `Utgåva ${edition}` : "Ingen utgåva"}</span>
      </div>
      <h1 className="px-6 pt-5 text-lg font-semibold tracking-tight text-foreground">
        {documentCode} {documentTitle}
      </h1>
    </header>
  );
}
