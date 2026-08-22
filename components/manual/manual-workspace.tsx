"use client";

import { useRef, useState } from "react";
import {
  BadgeCheck,
  Check,
  ChevronRight,
  FileDown,
  History,
  ListTree,
  Printer,
  Send,
  Share2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  defaultDocumentContent,
  findNodeById,
  manualTree,
  type ManualNode,
} from "@/components/manual/manual-data";
import { ManualEditorPanel } from "@/components/manual/manual-editor-panel";
import { ManualOriginalPanel } from "@/components/manual/manual-original-panel";
import {
  ManualSettingsPanel,
  type ManualSettings,
} from "@/components/manual/manual-settings-panel";
import { ManualTree } from "@/components/manual/manual-tree";
import { downloadHtmlAsFile, printDocument } from "@/lib/export-document";
import type { DocumentVersion, ManualAttachment } from "@/types/domain";

const initialAttachments: Record<string, ManualAttachment[]> = {
  kvalitetspolicy: [
    { id: "policy-1", name: "Kvalitetspolicy.pdf", size: "248 KB", type: "PDF" },
    { id: "policy-2", name: "Ansvarsfördelning.docx", size: "84 KB", type: "Word" },
  ],
  avvikelsehantering: [
    { id: "deviation-1", name: "Avvikelseblankett.xlsx", size: "36 KB", type: "Excel" },
  ],
};

const initialSettings: ManualSettings = {
  name: "Kvalitetsmanual",
  issuer: "Anna Lind",
  reviewer: "Johan Berg",
  approver: "Maria Ek",
  logo: "",
  headerText: "Kvalitetsmanual – Quality Works Light",
  footerText: "Internt dokument. Utskrift gäller endast utskriftsdagen.",
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileTypeLabel(file: File) {
  if (file.type.includes("pdf")) return "PDF";
  if (file.type.includes("word") || file.name.endsWith(".docx")) return "Word";
  if (file.type.includes("sheet") || file.name.endsWith(".xlsx")) return "Excel";
  if (file.type.startsWith("image/")) return "Bild";
  return file.type || "Fil";
}

export function ManualWorkspace() {
  const [selectedId, setSelectedId] = useState("kvalitetspolicy");
  const [activeTab, setActiveTab] = useState("work");
  const [settings, setSettings] = useState<ManualSettings>(initialSettings);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [versionsByDoc, setVersionsByDoc] = useState<
    Record<string, DocumentVersion[]>
  >({});
  const [attachments, setAttachments] =
    useState<Record<string, ManualAttachment[]>>(initialAttachments);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);
  const [treeOpen, setTreeOpen] = useState(false);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedNode = findNodeById(manualTree, selectedId);
  const documentTitle = selectedNode?.title ?? "Dokument";
  const draft = drafts[selectedId] ?? defaultDocumentContent;
  const versions = versionsByDoc[selectedId] ?? [];
  const published = versions[0] ?? null;
  const edition = published?.edition ?? 0;
  const isAcknowledged = acknowledgedIds.includes(selectedId);

  function handleSelect(node: ManualNode) {
    setSelectedId(node.id);
    setSavedId(null);
    setTreeOpen(false);
    setShareStatus(null);
    if (activeTab === "settings") {
      setActiveTab("work");
    }
  }

  function handleDraftChange(value: string) {
    setDrafts((current) => ({ ...current, [selectedId]: value }));
    setSavedId(null);
  }

  function handleSave() {
    setSavedId(selectedId);
  }

  function handlePublish() {
    const nextEdition = (versions[0]?.edition ?? 0) + 1;
    const version: DocumentVersion = {
      id: `${selectedId}-v${nextEdition}-${Date.now()}`,
      edition: nextEdition,
      content: draft,
      publishedAt: new Date().toLocaleString("sv-SE"),
      publishedByName: settings.issuer || "Administratör",
    };
    setVersionsByDoc((current) => ({
      ...current,
      [selectedId]: [version, ...(current[selectedId] ?? [])],
    }));
    setAcknowledgedIds((current) => current.filter((id) => id !== selectedId));
    setActiveTab("original");
  }

  function handleAddAttachmentFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const next: ManualAttachment[] = Array.from(fileList).map((file) => ({
      id: `${selectedId}-${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      size: formatFileSize(file.size),
      type: fileTypeLabel(file),
      url: URL.createObjectURL(file),
      file,
    }));
    setAttachments((current) => ({
      ...current,
      [selectedId]: [...(current[selectedId] ?? []), ...next],
    }));
  }

  function handleRemoveAttachment(attachmentId: string) {
    setAttachments((current) => {
      const list = current[selectedId] ?? [];
      const target = list.find((item) => item.id === attachmentId);
      if (target?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(target.url);
      }
      return {
        ...current,
        [selectedId]: list.filter((attachment) => attachment.id !== attachmentId),
      };
    });
  }

  function handleDownloadAttachment(attachment: ManualAttachment) {
    if (attachment.url) {
      const a = document.createElement("a");
      a.href = attachment.url;
      a.download = attachment.name;
      a.click();
      return;
    }
    window.alert("Nedladdning kräver uppladdad fil eller lagring (Supabase Storage)."
    );
  }

  async function handleShare() {
    const url = window.location.href;
    try {
      await navigator.clipboard?.writeText(url);
      setShareStatus("Länk kopierad");
    } catch {
      setShareStatus(url);
    }
  }

  function handleExportPdf() {
    if (!published) {
      window.alert("Publicera dokumentet först för att exportera Original.");
      setActiveTab("work");
      return;
    }
    printDocument(
      documentTitle,
      settings.headerText,
      published.content,
      `${settings.footerText} · Utgåva ${published.edition} · ${published.publishedAt}`,
    );
  }

  function handleExportWord() {
    if (!published) {
      window.alert("Publicera dokumentet först för att exportera Original.");
      setActiveTab("work");
      return;
    }
    downloadHtmlAsFile(
      `${documentTitle.replaceAll(" ", "-")}-utgava-${published.edition}.doc`,
      documentTitle,
      settings.headerText,
      published.content,
      `${settings.footerText} · Utgåva ${published.edition}`,
    );
  }

  function restoreVersion(version: DocumentVersion) {
    setDrafts((current) => ({ ...current, [selectedId]: version.content }));
    setSavedId(null);
    setActiveTab("work");
  }

  return (
    <div className="flex h-[calc(100vh-5.5rem)] min-h-0 overflow-hidden bg-background">
      <aside className="hidden w-[300px] shrink-0 border-r bg-sidebar md:flex md:flex-col">
        <ManualTree
          nodes={manualTree}
          onSelect={handleSelect}
          selectedId={selectedId}
        />
      </aside>

      <input
        accept="*/*"
        className="hidden"
        multiple
        onChange={(event) => {
          handleAddAttachmentFiles(event.target.files);
          event.target.value = "";
        }}
        ref={fileInputRef}
        type="file"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Tabs
          className="flex min-h-0 flex-1 flex-col gap-0"
          onValueChange={setActiveTab}
          value={activeTab}
        >
          <div className="flex flex-col gap-3 border-b px-4 pt-4 sm:px-6">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Dialog onOpenChange={setTreeOpen} open={treeOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="-ml-2 mr-1 md:hidden"
                    size="icon"
                    variant="ghost"
                  >
                    <ListTree className="size-4" />
                    <span className="sr-only">Visa dokumentträd</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] overflow-hidden p-0">
                  <DialogHeader className="sr-only">
                    <DialogTitle>Manualens dokumentträd</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[80vh] overflow-hidden">
                    <ManualTree
                      nodes={manualTree}
                      onSelect={handleSelect}
                      selectedId={selectedId}
                    />
                  </div>
                </DialogContent>
              </Dialog>
              <span className="hidden sm:inline">{settings.name}</span>
              <ChevronRight className="hidden size-3.5 sm:inline" />
              <span className="font-medium text-foreground">{documentTitle}</span>
              {published ? (
                <Badge className="ml-1" variant="success">
                  Publicerad
                </Badge>
              ) : (
                <Badge className="ml-1" variant="secondary">
                  Utkast
                </Badge>
              )}
            </div>
            <TabsList variant="line">
              <TabsTrigger value="settings">Grundinställningar</TabsTrigger>
              <TabsTrigger value="work">Arbetsmanual</TabsTrigger>
              <TabsTrigger value="original">Original</TabsTrigger>
            </TabsList>
            <div className="flex flex-wrap items-center gap-2 border-t py-3">
              <Button onClick={handleShare} size="sm" variant="outline">
                <Share2 data-icon="inline-start" />
                Dela
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Send data-icon="inline-start" />
                    Skicka för granskning
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Skicka för granskning</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium" htmlFor="reviewer-name">
                      Namn
                    </label>
                    <Input
                      id="reviewer-name"
                      onChange={(event) => setReviewerName(event.target.value)}
                      placeholder="Ange granskarens namn"
                      value={reviewerName}
                    />
                    {reviewStatus ? (
                      <p className="text-sm text-muted-foreground">{reviewStatus}</p>
                    ) : null}
                  </div>
                  <DialogFooter>
                    <Button
                      disabled={!reviewerName.trim()}
                      onClick={() =>
                        setReviewStatus(
                          `Skickat till ${reviewerName.trim()} (sparas i databasen när auth är inkopplad)`,
                        )
                      }
                    >
                      Skicka
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <History data-icon="inline-start" />
                    Versioner{versions.length ? ` (${versions.length})` : ""}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Versionshistorik – {documentTitle}</DialogTitle>
                  </DialogHeader>
                  {versions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Inga publicerade utgåvor ännu. Publicera från Arbetsmanual.
                    </p>
                  ) : (
                    <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
                      {versions.map((version) => (
                        <div
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                          key={version.id}
                        >
                          <div>
                            <p className="font-medium">Utgåva {version.edition}</p>
                            <p className="text-xs text-muted-foreground">
                              {version.publishedAt}
                              {version.publishedByName
                                ? ` · ${version.publishedByName}`
                                : ""}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                setActiveTab("original");
                              }}
                              size="sm"
                              variant="outline"
                            >
                              Visa
                            </Button>
                            <Button
                              onClick={() => restoreVersion(version)}
                              size="sm"
                              variant="secondary"
                            >
                              Återställ till utkast
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
              <Button onClick={handleExportPdf} size="sm" variant="outline">
                <FileDown data-icon="inline-start" />
                Exportera PDF
              </Button>
              <Button onClick={handleExportWord} size="sm" variant="outline">
                <FileDown data-icon="inline-start" />
                Exportera Word
              </Button>
              <Button onClick={handleExportPdf} size="sm" variant="outline">
                <Printer data-icon="inline-start" />
                Skriv ut
              </Button>
              {shareStatus ? (
                <span className="text-xs text-muted-foreground">{shareStatus}</span>
              ) : null}
            </div>
          </div>

          <TabsContent
            className="flex min-h-0 flex-col overflow-auto"
            value="settings"
          >
            <ManualSettingsPanel onChange={setSettings} settings={settings} />
          </TabsContent>

          <TabsContent className="flex min-h-0 flex-col" value="work">
            <ManualEditorPanel
              attachments={attachments[selectedId] ?? []}
              documentTitle={documentTitle}
              onAddAttachment={() => fileInputRef.current?.click()}
              onDownloadAttachment={handleDownloadAttachment}
              onRemoveAttachment={handleRemoveAttachment}
              onChange={handleDraftChange}
              onPublish={handlePublish}
              onSave={handleSave}
              saved={savedId === selectedId}
              value={draft}
            />
          </TabsContent>

          <TabsContent className="flex min-h-0 flex-col" value="original">
            <ManualOriginalPanel
              content={published?.content ?? null}
              documentTitle={documentTitle}
              edition={edition || 1}
              footerText={settings.footerText}
              headerText={settings.headerText}
              publishedAt={published?.publishedAt ?? null}
            />
          </TabsContent>
        </Tabs>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/30 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium">
              {edition > 0 ? `Utgåva ${edition}` : "Ingen publicerad utgåva"}
            </span>
            {isAcknowledged ? (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <BadgeCheck className="size-4 text-success" />
                Kvitterad
              </span>
            ) : null}
          </div>
          <Button
            disabled={isAcknowledged || !published}
            onClick={() =>
              setAcknowledgedIds((current) => [...current, selectedId])
            }
            size="sm"
            variant={isAcknowledged ? "outline" : "default"}
          >
            {isAcknowledged ? <Check /> : null}
            {isAcknowledged ? "Kvitterad" : "Kvittera"}
          </Button>
        </footer>
      </div>
    </div>
  );
}
