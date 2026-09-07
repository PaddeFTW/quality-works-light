"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Maximize2, Minimize2, MoreHorizontal, Plus } from "lucide-react";

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
type DialogMode = "create-doc" | "rename" | "delete" | null;

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
      setSelectedId(null);
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
  const hideTree = viewMode === "focus";
  const isFullscreen = typeof document !== "undefined" && Boolean(document.fullscreenElement);
  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  };

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
    const parentId = dialogParent === "root" ? null : dialogParent;
  const kind = "document" as const;
  const title = dialogName.trim() || "Nytt avsnitt";

    let id = `${kind}-${Date.now()}`;
    if (cloud && manualId) {
      try {
        id = await persistCreate({ manualId, parentId, title, kind });
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Kunde inte skapa");
        return;
      }
    }
    const node: ManualNode = { id, title, kind, children: [] };
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
    <div className="flex h-screen min-h-0 overflow-hidden bg-muted/30">
      {hideTree ? null : (
        <aside className="hidden w-[288px] shrink-0 border-r bg-sidebar md:flex md:flex-col">
          <ManualTree
            nodes={tree}
            lastOpenedId={lastOpenedId}
            onNewDocument={(parentId) => { setDialog("create-doc"); setDialogName("Nytt avsnitt"); setDialogParent(parentId ?? "root"); }}
            onHide={() => undefined}
            onRename={(node) => { setDialogTarget(node); setDialogName(node.title); setDialog("rename"); }}
            onSelect={handleSelect}
            selectedId={selectedId}
          />
        </aside>
      )}
      <Dialog onOpenChange={setTreeOpen} open={treeOpen}>
        <DialogContent className="h-[80vh] p-0 md:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Dokumentträd</DialogTitle>
          </DialogHeader>
          <ManualTree
            nodes={tree}
            lastOpenedId={lastOpenedId}
            onNewDocument={(parentId) => { setDialog("create-doc"); setDialogName("Nytt avsnitt"); setDialogParent(parentId ?? "root"); }}
            onHide={() => undefined}
            onRename={(node) => { setDialogTarget(node); setDialogName(node.title); setDialog("rename"); }}
            onSelect={handleSelect}
            selectedId={selectedId}
          />
        </DialogContent>
      </Dialog>
      <input className="hidden" multiple onChange={(e) => { void handleAddAttachmentFiles(e.target.files); e.target.value = ""; }} ref={fileInputRef} type="file" />
      <input accept=".txt,.md,.html,.htm,.pdf,.doc,.docx" className="hidden" multiple ref={uploadDocRef} type="file" />

      <div className="flex min-w-0 flex-1 flex-col">
        <Tabs className="flex min-h-0 flex-1 flex-col gap-0" onValueChange={setActiveTab} value={activeTab}>
          <div className="flex flex-col gap-3 border-b bg-background px-4 pt-3 sm:px-5">
            <div className="flex items-center gap-2 px-1 py-1">
              <span className="truncate text-sm font-medium">{documentTitle}</span>
              <div className="ml-auto flex items-center gap-1">
                <Button aria-label="Minimera" onClick={() => setViewMode("focus")} size="icon" variant="ghost"><Minimize2 /></Button>
                <Button aria-label="Fönsterläge" onClick={() => setViewMode("normal")} size="icon" variant="ghost"><Maximize2 /></Button>
                <Button aria-label={isFullscreen ? "Avsluta helskärm" : "Helskärm"} onClick={() => void toggleFullscreen()} size="icon" variant="ghost"><Maximize2 /></Button>
                <Button aria-label="Stäng" onClick={() => window.history.back()} size="icon" variant="ghost">×</Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pb-3">
              {!tree.length ? <Button disabled={!canEdit} onClick={() => { setDialog("create-doc"); setDialogName("Ledningssystemet"); setDialogParent("root"); }} size="sm"><Plus data-icon="inline-start" />Skapa 1.0</Button> : null}
              <div className="ml-auto flex items-center gap-2">
                <Button disabled={!selectedIsDocument || !canEdit} onClick={() => void handleSave()} size="sm" variant="outline">Spara</Button>
                <Button disabled={!selectedIsDocument || !canEdit} onClick={() => void handlePublish()} size="sm">Publicera</Button>
              </div>
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
              {dialog === "delete" ? "Ta bort" : dialog === "rename" ? "Byt namn" : "Nytt avsnitt"}
            </DialogTitle>
          </DialogHeader>
          {dialog === "delete" ? (
            <p className="text-sm text-muted-foreground">Ta bort “{dialogTarget?.title}”?</p>
          ) : (
            <div className="space-y-4">
              {dialog !== null ? (
                <div className="space-y-2">
                  <Label htmlFor="doc-name">Namn</Label>
                  <Input id="doc-name" onChange={(e) => setDialogName(e.target.value)} value={dialogName} />
                </div>
              ) : null}

            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDialog(null)} variant="outline">Avbryt</Button>
            {dialog === "delete" ? <Button onClick={() => void confirmDelete()} variant="destructive">Ta bort</Button> : null}
            {dialog === "rename" ? <Button onClick={() => void confirmRename()}>Spara</Button> : null}
            {dialog === "create-doc" ? <Button onClick={() => void confirmCreate()}>Skapa</Button> : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
