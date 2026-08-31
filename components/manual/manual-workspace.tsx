"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Check,
  ChevronRight,
  FilePlus,
  FolderPlus,
  ListTree,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Printer,
  Share2,
  Upload,
  ClipboardCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  defaultDocumentContent,
  findNodeById,
  type ManualNode,
} from "@/components/manual/manual-data";
import { ManualEditorPanel } from "@/components/manual/manual-editor-panel";
import { ManualOriginalPanel } from "@/components/manual/manual-original-panel";
import {
  ManualSettingsPanel,
  type ManualSettings,
} from "@/components/manual/manual-settings-panel";
import { ManualTree } from "@/components/manual/manual-tree";
import { useOrgSession } from "@/components/providers/org-provider";
import { downloadHtmlAsFile, printDocument } from "@/lib/export-document";
import { bootManualFromCloud } from "@/components/manual/manual-boot";
import {
  persistAck,
  persistCreate,
  persistDelete,
  persistDraft,
  persistDeleteAttachment,
  persistFiles,
  persistMove,
  persistPublish,
  persistReview,
  persistRename,
  persistSettings,
} from "@/lib/manual/persist";
import {
  firstDocumentId,
  getParentId,
  insertNode,
  listFolders,
  moveNode,
  removeNode,
  renameNode,
} from "@/lib/manual/tree-ops";
import {
  loadDrafts,
  loadJson,
  loadTree,
  saveDrafts,
  saveJson,
  saveTree,
  SETTINGS_KEY,
} from "@/lib/manual/storage";
import type { DocumentVersion, ManualAttachment } from "@/types/domain";

const initialSettings: ManualSettings = {
  name: "Kvalitetsmanual",
  issuer: "",
  reviewer: "",
  approver: "",
  logo: "",
  headerText: "Kvalitetsmanual – Quality Works Light",
  footerText: "Internt dokument. Utskrift gäller endast utskriftsdagen.",
};

type ViewMode = "normal" | "focus" | "full";
type DialogMode = "create-doc" | "create-folder" | "rename" | "move" | "delete" | null;

export function ManualWorkspace({ initialView = "normal" }: { initialView?: ViewMode }) {
  const { session, loading: orgLoading } = useOrgSession();
  const [ready, setReady] = useState(false);
  const [cloud, setCloud] = useState(false);
  const [manualId, setManualId] = useState<string | null>(null);
  const [tree, setTree] = useState<ManualNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastOpenedId, setLastOpenedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("work");
  const [settings, setSettings] = useState<ManualSettings>(initialSettings);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [dirtyIds, setDirtyIds] = useState<string[]>([]);
  const [versionsByDoc, setVersionsByDoc] = useState<Record<string, DocumentVersion[]>>({});
  const [attachments, setAttachments] = useState<Record<string, ManualAttachment[]>>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);
  const [treeOpen, setTreeOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [dialogTarget, setDialogTarget] = useState<ManualNode | null>(null);
  const [dialogName, setDialogName] = useState("");
  const [dialogParent, setDialogParent] = useState<string>("root");
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"draft" | "pending">("draft");
  const [status, setStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadDocRef = useRef<HTMLInputElement>(null);
  const canEdit = session?.role !== "viewer";

  useEffect(() => {
    if (orgLoading) return;
    let cancelled = false;
    async function boot() {
      if (session?.organizationId) {
        try {
          const result = await bootManualFromCloud(session.organizationId, session.manualId);
          if (cancelled) return;
          setCloud(true);
          setManualId(result.manualId);
          setTree(result.tree);
          setDrafts(result.drafts);
          setSettings(result.settings);
          setVersionsByDoc(result.versions);
          setAttachments(result.attachments);
          setSelectedId(result.selectedId);
          setReady(true);
          return;
        } catch (error) {
          console.error(error);
          setStatus("Kunde inte läsa manualen från molnet. Kontrollera anslutningen och försök igen.");
          setReady(true);
          return;
        }
      }
      const nextTree = loadTree();
      setTree(nextTree);
      setDrafts(loadDrafts());
      setSettings(loadJson(SETTINGS_KEY, initialSettings));
      setSelectedId(firstDocumentId(nextTree));
      setCloud(false);
      setReady(true);
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [orgLoading, session?.organizationId, session?.manualId]);

  useEffect(() => {
    if (!ready || cloud) return;
    saveTree(tree);
    saveDrafts(drafts);
    saveJson(SETTINGS_KEY, settings);
  }, [tree, drafts, settings, ready, cloud]);

  const selectedNode = selectedId ? findNodeById(tree, selectedId) : undefined;
  const selectedIsDocument = selectedNode?.kind === "document";
  const documentTitle = selectedIsDocument ? selectedNode.title : "Välj dokument";
  const draft = selectedId && selectedIsDocument ? (drafts[selectedId] ?? defaultDocumentContent) : "";
  const versions = selectedId ? (versionsByDoc[selectedId] ?? []) : [];
  const published = versions[0] ?? null;
  const edition = published?.edition ?? 0;
  const isDirty = selectedId ? dirtyIds.includes(selectedId) : false;
  const folders = useMemo(() => listFolders(tree), [tree]);
  const hideTree = viewMode === "focus";

  function markDirty(id: string) {
    setDirtyIds((current) => (current.includes(id) ? current : [...current, id]));
    setSavedId(null);
  }

  async function handleSave() {
    if (!selectedId) return;
    if (cloud) {
      try {
        await persistDraft(selectedId, drafts[selectedId] ?? draft);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Kunde inte spara");
        return;
      }
    }
    setSavedId(selectedId);
    setDirtyIds((current) => current.filter((item) => item !== selectedId));
  }

  async function handleReview() {
    if (!selectedId || !session || !canEdit) return;
    try {
      if (cloud) await persistReview(selectedId, session.userId);
      setReviewStatus("pending");
      setStatus("Dokumentet är skickat för granskning.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Kunde inte skicka för granskning");
    }
  }

  async function handlePublish() {
    if (!selectedId || !selectedIsDocument) return;
    const nextEdition = (versions[0]?.edition ?? 0) + 1;
    if (cloud && session) {
      try {
        const row = await persistPublish(selectedId, draft, nextEdition, session.userId);
        setVersionsByDoc((current) => ({
          ...current,
          [selectedId]: [
            {
              id: row.id,
              edition: row.edition,
              content: row.content_html,
              publishedAt: new Date(row.published_at).toLocaleString("sv-SE"),
            },
            ...(current[selectedId] ?? []),
          ],
        }));
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Publicering misslyckades");
        return;
      }
    } else {
      setVersionsByDoc((current) => ({
        ...current,
        [selectedId]: [
          {
            id: `${selectedId}-v${nextEdition}`,
            edition: nextEdition,
            content: draft,
            publishedAt: new Date().toLocaleString("sv-SE"),
            publishedByName: settings.issuer || "Administratör",
          },
          ...(current[selectedId] ?? []),
        ],
      }));
    }
    setDirtyIds((current) => current.filter((item) => item !== selectedId));
    setSavedId(selectedId);
    setActiveTab("original");
  }

  async function confirmCreate() {
    const title = dialogName.trim() || (dialog === "create-folder" ? "Ny mapp" : "Nytt dokument");
    const parentId = dialogParent === "root" ? null : dialogParent;
    const kind = dialog === "create-folder" ? "folder" : "document";
    let id = `${kind}-${Date.now()}`;
    if (cloud && manualId) {
      try {
        id = await persistCreate({ manualId, parentId, title, kind });
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Kunde inte skapa");
        return;
      }
    }
    const node: ManualNode = kind === "folder" ? { id, title, kind, children: [] } : { id, title, kind };
    setTree((current) => insertNode(current, parentId, node));
    if (kind === "document") {
      setDrafts((current) => ({ ...current, [id]: defaultDocumentContent }));
      setSelectedId(id);
      setActiveTab("work");
    }
    setDialog(null);
  }

  async function confirmRename() {
    if (!dialogTarget) return;
    const title = dialogName.trim();
    if (!title) return;
    if (cloud) {
      try {
        await persistRename(dialogTarget.id, title);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Kunde inte byta namn");
        return;
      }
    }
    setTree((current) => renameNode(current, dialogTarget.id, title));
    setDialog(null);
  }

  async function confirmMove() {
    if (!dialogTarget) return;
    const parentId = dialogParent === "root" ? null : dialogParent;
    if (cloud) {
      try {
        await persistMove(dialogTarget.id, parentId);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Kunde inte flytta");
        return;
      }
    }
    setTree((current) => moveNode(current, dialogTarget.id, parentId));
    setDialog(null);
  }

  async function confirmDelete() {
    if (!dialogTarget) return;
    const removedId = dialogTarget.id;
    if (cloud) {
      try {
        await persistDelete(removedId);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Kunde inte ta bort");
        return;
      }
    }
    setTree((current) => {
      const next = removeNode(current, removedId);
      if (selectedId === removedId) setSelectedId(firstDocumentId(next));
      return next;
    });
    setDialog(null);
  }

  async function handleAddAttachmentFiles(fileList: FileList | null) {
    if (!fileList?.length || !selectedId) return;
    if (cloud && session?.organizationId) {
      try {
        const uploaded = await persistFiles(session.organizationId, selectedId, session.userId, fileList);
        setAttachments((current) => ({
          ...current,
          [selectedId]: [...(current[selectedId] ?? []), ...uploaded],
        }));
        return;
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Uppladdning misslyckades");
      }
    }
  }

  async function handleSettingsChange(next: ManualSettings) {
    setSettings(next);
    if (cloud && manualId) {
      try {
        await persistSettings(manualId, next);
      } catch {
        /* keep local */
      }
    }
  }

  function handleSelect(node: ManualNode) {
    if (selectedId && dirtyIds.includes(selectedId) && node.id !== selectedId) {
      if (!window.confirm("Du har osparade ändringar. Byt dokument ändå?")) return;
    }
    setSelectedId(node.id);
    if (node.kind === "document") setLastOpenedId(node.id);
    setTreeOpen(false);
    if (node.kind === "document" && activeTab === "settings") setActiveTab("work");
  }

  if (!ready) {
    return (
      <div className="flex h-[calc(100vh-5.5rem)] items-center justify-center text-sm text-muted-foreground">
        Laddar manual…
      </div>
    );
  }

  return (
    <div className={viewMode === "full" ? "flex h-[calc(100vh-3rem)] min-h-0 overflow-hidden bg-muted/30" : "flex h-[calc(100vh-5.5rem)] min-h-0 overflow-hidden bg-muted/30"}>
      {hideTree ? null : (
        <aside className="hidden w-[300px] shrink-0 border-r bg-sidebar md:flex md:flex-col">
          <ManualTree
            nodes={tree}
            lastOpenedId={lastOpenedId}
            onDelete={(node) => { setDialogTarget(node); setDialog("delete"); }}
            onMove={(node) => { setDialogTarget(node); setDialogParent(getParentId(tree, node.id) ?? "root"); setDialog("move"); }}
            onNewDocument={(parentId) => { setDialog("create-doc"); setDialogName("Nytt dokument"); setDialogParent(parentId ?? "root"); }}
            onNewFolder={(parentId) => { setDialog("create-folder"); setDialogName("Ny mapp"); setDialogParent(parentId ?? "root"); }}
            onRename={(node) => { setDialogTarget(node); setDialogName(node.title); setDialog("rename"); }}
            onSelect={handleSelect}
            selectedId={selectedId}
          />
        </aside>
      )}
      <input className="hidden" multiple onChange={(e) => { void handleAddAttachmentFiles(e.target.files); e.target.value = ""; }} ref={fileInputRef} type="file" />
      <input accept=".txt,.md,.html,.htm,.pdf,.doc,.docx" className="hidden" multiple ref={uploadDocRef} type="file" />

      <div className="flex min-w-0 flex-1 flex-col">
        <Tabs className="flex min-h-0 flex-1 flex-col gap-0" onValueChange={setActiveTab} value={activeTab}>
          <div className="flex flex-col gap-3 border-b bg-background px-4 pt-3 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <Button className="md:hidden" onClick={() => setTreeOpen(true)} size="icon" variant="ghost">
                <ListTree className="size-4" />
              </Button>
              <Button asChild size="sm" variant="ghost"><Link href="/">Dashboard</Link></Button>
              <ChevronRight className="size-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{settings.name}</span>
              <ChevronRight className="size-3.5 text-muted-foreground" />
              <span className="text-sm font-medium">{documentTitle}</span>
              {cloud ? <Badge variant="secondary">Moln</Badge> : <Badge variant="outline">Lokalt</Badge>}
              {selectedIsDocument ? (isDirty ? <Badge variant="secondary">Osparat</Badge> : published ? <Badge variant="success">Publicerad</Badge> : <Badge variant="secondary">Utkast</Badge>) : null}
              <div className="ml-auto flex items-center gap-1">
                <Button onClick={() => setViewMode((m) => (m === "focus" ? "normal" : "focus"))} size="icon" variant="ghost">
                  {hideTree ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
                </Button>
                <Button asChild size="icon" variant="ghost"><Link href="/manual/full" target="_blank"><Maximize2 className="size-4" /></Link></Button>
                {viewMode === "full" ? <Button asChild size="icon" variant="ghost"><Link href="/manual"><Minimize2 className="size-4" /></Link></Button> : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pb-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button disabled={!canEdit} size="sm"><Plus data-icon="inline-start" />Nytt</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => { setDialog("create-doc"); setDialogName("Nytt dokument"); setDialogParent(selectedNode?.kind === "folder" ? selectedNode.id : getParentId(tree, selectedId ?? "") ?? "root"); }}>
                    <FilePlus className="size-4" /> Dokument
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setDialog("create-folder"); setDialogName("Ny mapp"); setDialogParent(selectedNode?.kind === "folder" ? selectedNode.id : getParentId(tree, selectedId ?? "") ?? "root"); }}>
                    <FolderPlus className="size-4" /> Mapp
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button disabled={!selectedIsDocument || !canEdit || reviewStatus === "pending"} onClick={() => void handleReview()} size="sm" variant="outline">
                <ClipboardCheck data-icon="inline-start" />
                {reviewStatus === "pending" ? "Skickad för granskning" : "Skicka för granskning"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline"><MoreHorizontal data-icon="inline-start" />Åtgärder</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem disabled={!canEdit || !selectedNode} onClick={() => selectedNode && (setDialogTarget(selectedNode), setDialogName(selectedNode.title), setDialog("rename"))}>Byt namn</DropdownMenuItem>
                  <DropdownMenuItem disabled={!canEdit || !selectedNode} onClick={() => selectedNode && (setDialogTarget(selectedNode), setDialogParent(getParentId(tree, selectedNode.id) ?? "root"), setDialog("move"))}>Flytta</DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => { await navigator.clipboard.writeText(window.location.href); setShareStatus("Länk kopierad"); }}><Share2 className="size-4" /> Dela</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => published && printDocument(documentTitle, settings.headerText, published.content, settings.footerText)}><Printer className="size-4" /> Skriv ut</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => published && downloadHtmlAsFile(`${documentTitle}.doc`, documentTitle, settings.headerText, published.content, settings.footerText)}>Exportera Word</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled={!canEdit || !selectedNode} onClick={() => selectedNode && (setDialogTarget(selectedNode), setDialog("delete"))} variant="destructive">Ta bort</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <TabsList className="ml-2" variant="line">
                <TabsTrigger value="settings">Grundinställningar</TabsTrigger>
                <TabsTrigger value="work">Arbetsmanual</TabsTrigger>
                <TabsTrigger value="original">Original</TabsTrigger>
              </TabsList>
              {status ? <span className="text-xs text-destructive">{status}</span> : null}
              {shareStatus ? <span className="text-xs text-muted-foreground">{shareStatus}</span> : null}
            </div>
          </div>
          <TabsContent className="flex min-h-0 flex-col overflow-auto" value="settings">
            <ManualSettingsPanel onChange={handleSettingsChange} settings={settings} />
          </TabsContent>
          <TabsContent className="flex min-h-0 flex-col" value="work">
            {selectedIsDocument ? (
              <ManualEditorPanel
                attachments={attachments[selectedId ?? ""] ?? []}
                documentTitle={documentTitle}
                onAddAttachment={() => fileInputRef.current?.click()}
                onChange={(value) => {
                  if (!selectedId || !canEdit) return;
                  setDrafts((current) => ({ ...current, [selectedId]: value }));
                  markDirty(selectedId);
                }}
                onDownloadAttachment={(attachment) => {
                  if (!attachment.url) return;
                  const a = document.createElement("a");
                  a.href = attachment.url;
                  a.download = attachment.name;
                  a.click();
                }}
                onPublish={() => void handlePublish()}
                onRemoveAttachment={(id) => {
                  const attachment = (attachments[selectedId ?? ""] ?? []).find((item) => item.id === id);
                  if (cloud) void persistDeleteAttachment(id, attachment?.storagePath).catch((error) => setStatus(error instanceof Error ? error.message : "Kunde inte ta bort bilagan"));
                  setAttachments((current) => ({ ...current, [selectedId ?? ""]: (current[selectedId ?? ""] ?? []).filter((item) => item.id !== id) }));
                }}
                onSave={() => void handleSave()}
                saved={savedId === selectedId && !isDirty}
                value={draft}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">Välj ett dokument i trädet.</div>
            )}
          </TabsContent>
          <TabsContent className="flex min-h-0 flex-col" value="original">
            <ManualOriginalPanel content={published?.content ?? null} documentTitle={documentTitle} edition={edition || 1} footerText={settings.footerText} headerText={settings.headerText} publishedAt={published?.publishedAt ?? null} versions={versions} />
          </TabsContent>
        </Tabs>
        <footer className="flex items-center justify-between border-t bg-background px-4 py-3">
          <span className="text-sm font-medium">{edition > 0 ? `Utgåva ${edition}` : "Ingen publicerad utgåva"}</span>
          <Button
            disabled={!published || !selectedId || acknowledgedIds.includes(selectedId)}
            onClick={() => {
              if (!selectedId) return;
              setAcknowledgedIds((current) => [...current, selectedId]);
              if (cloud && session) void persistAck(selectedId, session.userId, edition);
            }}
            size="sm"
          >
            {selectedId && acknowledgedIds.includes(selectedId) ? <><Check /> Kvitterad</> : "Kvittera"}
          </Button>
        </footer>
      </div>

      <Dialog onOpenChange={(open) => !open && setDialog(null)} open={Boolean(dialog)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "delete" ? "Ta bort" : dialog === "rename" ? "Byt namn" : dialog === "move" ? "Flytta" : dialog === "create-folder" ? "Ny mapp" : "Nytt dokument"}
            </DialogTitle>
          </DialogHeader>
          {dialog === "delete" ? (
            <p className="text-sm text-muted-foreground">Ta bort “{dialogTarget?.title}”?</p>
          ) : (
            <div className="space-y-4">
              {dialog !== "move" ? (
                <div className="space-y-2">
                  <Label htmlFor="doc-name">Namn</Label>
                  <Input id="doc-name" onChange={(e) => setDialogName(e.target.value)} value={dialogName} />
                </div>
              ) : null}
              {dialog === "create-doc" || dialog === "create-folder" || dialog === "move" ? (
                <div className="space-y-2">
                  <Label>Placering</Label>
                  <Select onValueChange={setDialogParent} value={dialogParent}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="root">Roten av manualen</SelectItem>
                      {folders.filter((folder) => folder.id !== dialogTarget?.id).map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>{folder.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDialog(null)} variant="outline">Avbryt</Button>
            {dialog === "delete" ? <Button onClick={() => void confirmDelete()} variant="destructive">Ta bort</Button> : null}
            {dialog === "rename" ? <Button onClick={() => void confirmRename()}>Spara</Button> : null}
            {dialog === "move" ? <Button onClick={() => void confirmMove()}>Flytta</Button> : null}
            {dialog === "create-doc" || dialog === "create-folder" ? <Button onClick={() => void confirmCreate()}>Skapa</Button> : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
