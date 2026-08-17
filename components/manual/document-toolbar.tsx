"use client";

import { useRef, useState } from "react";
import {
  Check,
  Download,
  FileDown,
  Link2,
  Paperclip,
  Printer,
  Save,
  Send,
  Share2,
  Trash2,
  Upload,
  UploadCloud,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type Attachment = {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
};

type ReviewStatus = {
  reviewer: string;
  sentAt: string;
};

const reviewers = [
  "Anna Lindqvist – Kvalitetsansvarig",
  "Johan Berg – Verksamhetschef",
  "Sara Nyström – Enhetschef",
  "Erik Hallgren – Skyddsombud",
];

const initialAttachments: Attachment[] = [
  { id: "1", name: "Kvalitetspolicy-2026.pdf", size: "248 kB", uploadedAt: "2026-08-14" },
  { id: "2", name: "Processkarta-avvikelser.xlsx", size: "96 kB", uploadedAt: "2026-08-09" },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentToolbar({
  documentTitle,
  published,
  onPublish,
}: {
  documentTitle: string;
  published: boolean;
  onPublish: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [openPanel, setOpenPanel] = useState<"attachments" | "share" | "review" | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [linkCopied, setLinkCopied] = useState(false);
  const [reviewer, setReviewer] = useState(reviewers[0]);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | null>(null);

  const shareLink = `https://qualityworx.se/manual/${documentTitle
    .toLowerCase()
    .replace(/å|ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;

  function handleSave() {
    setSaveState("saved");
    window.setTimeout(() => setSaveState("idle"), 2000);
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const uploaded = Array.from(files).map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      size: formatSize(file.size),
      uploadedAt: new Date().toISOString().slice(0, 10),
    }));
    setAttachments((current) => [...uploaded, ...current]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleCopyLink() {
    void navigator.clipboard?.writeText(shareLink).catch(() => undefined);
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 2000);
  }

  function handleSendForReview() {
    setReviewStatus({
      reviewer,
      sentAt: new Date().toLocaleDateString("sv-SE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    });
    setReviewMessage("");
    setOpenPanel(null);
  }

  function closePanel() {
    setOpenPanel(null);
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-token-xs sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleSave} size="sm">
            {saveState === "saved" ? <Check data-icon="inline-start" /> : <Save data-icon="inline-start" />}
            {saveState === "saved" ? "Sparat" : "Spara"}
          </Button>
          <Button onClick={onPublish} size="sm" variant="secondary">
            <UploadCloud data-icon="inline-start" /> Publicera
          </Button>

          <Separator className="hidden h-6 sm:block" orientation="vertical" />

          <Button onClick={() => setOpenPanel("attachments")} size="sm" variant="outline">
            <Paperclip data-icon="inline-start" /> Bilagor
            <span className="ml-1 rounded-full bg-primary/12 px-1.5 text-xs font-medium text-primary">
              {attachments.length}
            </span>
          </Button>
          <Button onClick={() => setOpenPanel("share")} size="sm" variant="outline">
            <Share2 data-icon="inline-start" /> Dela
          </Button>
          <Button onClick={() => setOpenPanel("review")} size="sm" variant="outline">
            <Send data-icon="inline-start" /> Skicka för granskning
          </Button>

          <Button onClick={() => window.print()} size="sm" variant="ghost">
            <FileDown data-icon="inline-start" /> Exportera PDF
          </Button>
          <Button onClick={() => window.print()} size="sm" variant="ghost">
            <Printer data-icon="inline-start" /> Skriv ut
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant={published ? "success" : "secondary"}>
            {published ? "Publicerad" : "Utkast"}
          </Badge>
          {reviewStatus ? (
            <Badge variant="warning">Väntar på granskning</Badge>
          ) : null}
          <span>
            {reviewStatus
              ? `Skickad till ${reviewStatus.reviewer.split(" – ")[0]} den ${reviewStatus.sentAt}.`
              : "Inga pågående granskningar."}
          </span>
        </div>
      </div>

      <Dialog onOpenChange={(open) => (open ? null : closePanel())} open={openPanel === "attachments"}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bilagor</DialogTitle>
            <DialogDescription>
              Ladda upp och hämta filer som hör till {documentTitle}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/40 p-6 text-center">
              <div className="rounded-full bg-primary/12 p-3 text-primary">
                <Upload className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Dra filer hit eller välj från datorn</p>
                <p className="text-xs text-muted-foreground">PDF, Word, Excel och bilder.</p>
              </div>
              <input
                className="sr-only"
                multiple
                onChange={(event) => handleFiles(event.target.files)}
                ref={fileInputRef}
                type="file"
              />
              <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="outline">
                Välj filer
              </Button>
            </div>

            {attachments.length ? (
              <ul className="flex flex-col divide-y rounded-xl border">
                {attachments.map((attachment) => (
                  <li className="flex items-center gap-3 p-3" key={attachment.id}>
                    <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{attachment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {attachment.size} · {attachment.uploadedAt}
                      </p>
                    </div>
                    <Button
                      aria-label={`Hämta ${attachment.name}`}
                      size="icon"
                      variant="ghost"
                    >
                      <Download />
                    </Button>
                    <Button
                      aria-label={`Ta bort ${attachment.name}`}
                      onClick={() =>
                        setAttachments((current) =>
                          current.filter((item) => item.id !== attachment.id),
                        )
                      }
                      size="icon"
                      variant="ghost"
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl bg-muted/60 p-4 text-center text-sm text-muted-foreground">
                Inga bilagor är uppladdade än.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button onClick={closePanel} variant="outline">
              Stäng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={(open) => (open ? null : closePanel())} open={openPanel === "share"}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Dela dokument</DialogTitle>
            <DialogDescription>
              Alla med länken och behörighet i organisationen kan läsa dokumentet.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium" htmlFor="share-link">
              Länk till dokumentet
            </label>
            <div className="flex gap-2">
              <Input id="share-link" readOnly value={shareLink} />
              <Button onClick={handleCopyLink} variant="outline">
                {linkCopied ? <Check data-icon="inline-start" /> : <Link2 data-icon="inline-start" />}
                {linkCopied ? "Kopierad" : "Kopiera"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Delningen är en placeholder och kopplas till behörighetssystemet senare.
            </p>
          </div>

          <DialogFooter>
            <Button onClick={closePanel} variant="outline">
              Stäng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={(open) => (open ? null : closePanel())} open={openPanel === "review"}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Skicka för granskning</DialogTitle>
            <DialogDescription>
              Välj vem som ska granska {documentTitle} innan publicering.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="reviewer">
                Granskare
              </label>
              <Select onValueChange={setReviewer} value={reviewer}>
                <SelectTrigger id="reviewer">
                  <SelectValue placeholder="Välj granskare" />
                </SelectTrigger>
                <SelectContent>
                  {reviewers.map((person) => (
                    <SelectItem key={person} value={person}>
                      {person}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="review-message">
                Meddelande (valfritt)
              </label>
              <Textarea
                id="review-message"
                onChange={(event) => setReviewMessage(event.target.value)}
                placeholder="Beskriv kort vad som ska granskas."
                value={reviewMessage}
              />
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
              Status efter sändning: <Badge variant="warning">Väntar på granskning</Badge>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={closePanel} variant="outline">
              Avbryt
            </Button>
            <Button onClick={handleSendForReview}>
              <Send data-icon="inline-start" /> Skicka
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
