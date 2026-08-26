"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Check,
  ChevronRight,
  Expand,
  FilePlus,
  FolderPlus,
  History,
  ListTree,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Printer,
  Send,
  Share2,
  Upload,
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
import { downloadHtmlAsFile, printDocument } from "@/lib/export-document";
import {
  firstDocumentId,
  getParentId,
  insertNode,
  listFolders,
  moveNode,
  removeNode,
  renameNode,
  slugifyTitle,
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

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ManualWorkspace({ initialView = "normal" }: { initialView?: ViewMode }) {
  const [ready, setReady] = useState(false);
  const [tree, setTree] = useState<ManualNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
  const [reviewerName, setReviewerName] = useState("");
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadDocRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const nextTree = loadTree();
    const nextDrafts = loadDrafts();
    const nextSettings = loadJson(SETTINGS_KEY, initialSettings);
    setTree(nextTree);
    setDrafts(nextDrafts);
    setSettings(nextSettings);
    setSelectedId(firstDocumentId(nextTree));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveTree(tree);
  }, [tree, ready]);

  useEffect(() => {
    if (!ready) return;
    saveDrafts(drafts);
  }, [drafts, ready]);

  useEffect(() => {
    if (!ready) return;
    saveJson(SETTINGS_KEY, settings);
  }, [settings, ready]);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (dirtyIds.length === 0) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirtyIds]);

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

  function clearDirty(id: string) {
    setDirtyIds((current) => current.filter((item) => item !== id));
  }

  function handleSelect(node: ManualNode) {
    if (selectedId && dirtyIds.includes(selectedId) && node.id !== selectedId) {
      const ok = window.confirm("Du har osparade ändringar. Byt dokument ändå?");
      if (!ok) return;
    }
    setSelectedId(node.id);
    setTreeOpen(false);
    setShareStatus(null);
    if (node.kind === "document" && activeTab === "settings") setActiveTab("work");
  }

  function openCreate(kind: "create-doc" | "create-folder", parentId: string | null) {
    setDialog(kind);
    setDialogName(kind === "create-doc" ? "Nytt dokument" : "Ny mapp");
    setDialogParent(parentId ?? "root");
    setDialogTarget(null);
  }

  function confirmCreate() {
    const title = dialogName.trim() || (dialog === "create-folder" ? "Ny mapp" : "Nytt dokument");
    const parentId = dialogParent === "root" ? null : dialogParent;
    const node: ManualNode =
      dialog === "create-folder"
        ? { id: slugifyTitle(title), title, kind: "folder", children: [] }
        : { id: slugifyTitle(title), title, kind: "document" };
    setTree((current) => insertNode(current, parentId, node));
    if (node.kind === "document") {
      setDrafts((current) => ({ ...current, [node.id]: defaultDocumentContent }));
      setSelectedId(node.id);
      setActiveTab("work");
    }
    setDialog(null);
  }

  function confirmRename() {
    if (!dialogTarget) return;
    const title = dialogName.trim();
    if (!title) return;
    setTree((current) => renameNode(current, dialogTarget.id, title));
    setDialog(null);
  }

  function confirmMove() {
    if (!dialogTarget) return;
    const parentId = dialogParent === "root" ? null : dialogParent;
    setTree((current) => moveNode(current, dialogTarget.id, parentId));
    setDialog(null);
  }

  function confirmDelete() {
    if (!dialogTarget) return;
    const removedId = dialogTarget.id;
    setTree((current) => {
      const next = removeNode(current, removedId);
      if (selectedId === removedId) {
        setSelectedId(firstDocumentId(next));
      }
      return next;
    });
    setDrafts((current) => {
      const copy = { ...current };
      delete copy[removedId];
      return copy;
    });
    setDialog(null);
  }

  async function handleUploadDocuments(fileList: FileList | null) {
    if (!fileList?.length) return;
    const parentId =
      selectedNode?.kind === "folder"
        ? selectedNode.id
        : selectedId
          ? getParentId(tree, selectedId)
          : null;
    let lastId: string | null = null;
    let nextTree = tree;
    const nextDrafts = { ...drafts };
    for (const file of Array.from(fileList)) {
      const title = file.name.replace(/\.[^.]+$/, "");
      const id = slugifyTitle(title);
      const node: ManualNode = { id, title, kind: "document" };
      nextTree = insertNode(nextTree, parentId, node);
      lastId = id;
      if (file.type.startsWith("text/") || /\.(md|html|txt)$/i.test(file.name)) {
        nextDrafts[id] = await file.text();
      } else {
        nextDrafts[id] = `<h2>${title}</h2><p>Uppladdad fil: ${file.name} (${formatFileSize(file.size)}). Innehållet kan redigeras här. Originalfilen finns som bilaga.</p>`;
        setAttachments((current) => ({
          ...current,
          [id]: [
            {
              id: `${id}-src`,
              name: file.name,
              size: formatFileSize(file.size),
              type: file.type || "Fil",
              url: URL.createObjectURL(file),
              file,
            },
          ],
        }));
      }
    }
    setTree(nextTree);
    setDrafts(nextDrafts);
    if (lastId) {
      setSelectedId(lastId);
      setActiveTab("work");
    }
  }

  function handleDraftChange(value: string) {
    if (!selectedId || !selectedIsDocument) return;
    setDrafts((current) => ({ ...current, [selectedId]: value }));
    markDirty(selectedId);
  }

  function handleSave() {
    if (!selectedId) return;
    setSavedId(selectedId);
    clearDirty(selectedId);
  }

  function handlePublish() {
    if (!selectedId || !selectedIsDocument) return;
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
    clearDirty(selectedId);
    setSavedId(selectedId);
    setAcknowledgedIds((current) => current.filter((id) => id !== selectedId));
    setActiveTab("original");
  }

  function handleAddAttachmentFiles(fileList: FileList | null) {
    if (!fileList?.length || !selectedId) return;
    const next: ManualAttachment[] = Array.from(fileList).map((file) => ({
      id: `${selectedId}-${file.name}-${Date.now()}`,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type || "Fil",
      url: URL.createObjectURL(file),
      file,
    }));
    setAttachments((current) => ({
      ...current,
      [selectedId]: [...(current[selectedId] ?? []), ...next],
    }));
  }

  function handleExport() {
    if (!published) {
      window.alert("Publicera dokumentet först för att exportera Original.");
      setActiveTab("work");
      return;
    }
    printDocument(
      documentTitle,
      settings.headerText,
      published.content,
      `${settings.footerText} · Utgåva ${published.edition}`,
    );
  }

  function handleExportWord() {
    if (!published) {
      window.alert("Publicera dokumentet först för att exportera Original.");
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

  if (!ready) {
    return <div className="flex h-[calc(100vh-5.5rem)] items-center justify-center text-sm text-muted-foreground">Laddar manual…</div>;
  }

  return (
    <div className={viewMode === "full" ? "flex h-[calc(100vh-3rem)] min-h-0 overflow-hidden bg-muted/30" : "flex h-[calc(100vh-5.5rem)] min-h-0 overflow-hidden bg-muted/30"}>
      {hideTree ? null : (
        <aside className="hidden w-[300px] shrink-0 border-r bg-sidebar md:flex md:flex-col">
          <ManualTree
            nodes={tree}
            onDelete={(node) => {
              setDialogTarget(node);
              setDialog("delete");
            }}
            onMove={(node) => {
              setDialogTarget(node);
              setDialogParent(getParentId(tree, node.id) ?? "root");
              setDialog("move");
            }}
            onNewDocument={(parentId) => openCreate("create-doc", parentId)}
            onNewFolder={(parentId) => openCreate("create-folder", parentId)}
            onRename={(node) => {
              setDialogTarget(node);
              setDialogName(node.title);
              setDialog("rename");
            }}
            onSelect={handleSelect}
            selectedId={selectedId}
          />
        </aside>
      )}

      <input accept=".txt,.md,.html,.htm,.pdf,.doc,.docx,.odt" className="hidden" multiple onChange={(e) => { void handleUploadDocuments(e.target.files); e.target.value = ""; }} ref={uploadDocRef} type="file" />
      <input className="hidden" multiple onChange={(e) => { handleAddAttachmentFiles(e.target.files); e.target.value = ""; }} ref={fileInputRef} type="file" />

      <div className="flex min-w-0 flex-1 flex-col">
        <Tabs className="flex min-h-0 flex-1 flex-col gap-0" onValueChange={setActiveTab} value={activeTab}>
          <div className="flex flex-col gap-3 border-b bg-background px-4 pt-3 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <Button className="md:hidden" onClick={() => setTreeOpen(true)} size="icon" variant="ghost">
                <ListTree className="size-4" />
                <span className="sr-only">Visa träd</span>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/">Dashboard</Link>
              </Button>
              <ChevronRight className="size-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{settings.name}</span>
              <ChevronRight className="size-3.5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{documentTitle}</span>
              {selectedIsDocument ? (
                isDirty ? <Badge variant="secondary">Osparat</Badge> : published ? <Badge variant="success">Publicerad</Badge> : <Badge variant="secondary">Utkast</Badge>
              ) : null}
              <div className="ml-auto flex items-center gap-1">
                <Button onClick={() => setViewMode((m) => (m === "focus" ? "normal" : "focus"))} size="icon" title={hideTree ? "Visa träd" : "Fokusläge"} variant="ghost">
                  {hideTree ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
                </Button>
                <Button asChild size="icon" title="Öppna helsida" variant="ghost">
                  <Link href="/manual/full" target="_blank">
                    <Maximize2 className="size-4" />
                  </Link>
                </Button>
                {viewMode === "full" ? (
                  <Button asChild size="icon" title="Tillbaka" variant="ghost">
                    <Link href="/manual"><Minimize2 className="size-4" /></Link>
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pb-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm"><Plus data-icon="inline-start" />Nytt</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => openCreate("create-doc", selectedNode?.kind === "folder" ? selectedNode.id : getParentId(tree, selectedId ?? ""))}>
                    <FilePlus className="size-4" /> Dokument
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openCreate("create-folder", selectedNode?.kind === "folder" ? selectedNode.id : getParentId(tree, selectedId ?? ""))}>
                    <FolderPlus className="size-4" /> Mapp
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => uploadDocRef.current?.click()}>
                    <Upload className="size-4" /> Ladda upp fil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline"><MoreHorizontal data-icon="inline-start" />Åtgärder</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem disabled={!selectedNode} onClick={() => selectedNode && (setDialogTarget(selectedNode), setDialogName(selectedNode.title), setDialog("rename"))}>
                    Byt namn
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={!selectedNode} onClick={() => selectedNode && (setDialogTarget(selectedNode), setDialogParent(getParentId(tree, selectedNode.id) ?? "root"), setDialog("move"))}>
                    Flytta
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => { await navigator.clipboard?.writeText(window.location.href); setShareStatus("Länk kopierad"); }}>
                    <Share2 className="size-4" /> Dela länk
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExport}><Printer className="size-4" /> Exportera PDF / skriv ut</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportWord}>Exportera Word</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled={!selectedNode} onClick={() => selectedNode && (setDialogTarget(selectedNode), setDialog("delete"))} variant="destructive">
                    Ta bort
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <TabsList variant="line" className="ml-2">
                <TabsTrigger value="settings">Grundinställningar</TabsTrigger>
                <TabsTrigger value="work">Arbetsmanual</TabsTrigger>
                <TabsTrigger value="original">Original</TabsTrigger>
              </TabsList>
              {shareStatus ? <span className="text-xs text-muted-foreground">{shareStatus}</span> : null}
            </div>
          </div>

          <TabsContent className="flex min-h-0 flex-col overflow-auto" value="settings">
            <ManualSettingsPanel onChange={setSettings} settings={settings} />
          </TabsContent>

          <TabsContent className="flex min-h-0 flex-col" value="work">
            {selectedIsDocument ? (
              <ManualEditorPanel
                attachments={attachments[selectedId ?? ""] ?? []}
                documentTitle={documentTitle}
                onAddAttachment={() => fileInputRef.current?.click()}
                onChange={handleDraftChange}
                onDownloadAttachment={(attachment) => {
                  if (!attachment.url) return;
                  const a = document.createElement("a");
                  a.href = attachment.url;
                  a.download = attachment.name;
                  a.click();
                }}
                onPublish={handlePublish}
                onRemoveAttachment={(id) =>
                  setAttachments((current) => ({
                    ...current,
                    [selectedId ?? ""]:
                      (current[selectedId ?? ""] ?? []).filter((item) => item.id !== id),
                  }))
                }
                onSave={handleSave}
                saved={savedId === selectedId && !isDirty}
                value={draft}
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <p className="text-sm text-muted-foreground">Välj ett dokument i trädet eller skapa ett nytt.</p>
                <Button onClick={() => openCreate("create-doc", selectedNode?.kind === "folder" ? selectedNode.id : null)}>
                  Nytt dokument
                </Button>
              </div>
            )}
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

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t bg-background px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium">{edition > 0 ? `Utgåva ${edition}` : "Ingen publicerad utgåva"}</span>
            {selectedId && acknowledgedIds.includes(selectedId) ? (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <BadgeCheck className="size-4 text-success" /> Kvitterad
              </span>
            ) : null}
          </div>
          <Button
            disabled={!published || !selectedId || acknowledgedIds.includes(selectedId)}
            onClick={() => selectedId && setAcknowledgedIds((current) => [...current, selectedId])}
            size="sm"
            variant={selectedId && acknowledgedIds.includes(selectedId) ? "outline" : "default"}
          >
            {selectedId && acknowledgedIds.includes(selectedId) ? <Check /> : null}
            {selectedId && acknowledgedIds.includes(selectedId) ? "Kvitterad" : "Kvittera"}
          </Button>
        </footer>
      </div>

      <Dialog onOpenChange={setTreeOpen} open={treeOpen}>
        <DialogContent className="max-h-[80vh] overflow-hidden p-0">
          <DialogHeader className="sr-only"><DialogTitle>Dokumentträd</DialogTitle></DialogHeader>
          <div className="max-h-[80vh] overflow-hidden">
            <ManualTree
              nodes={tree}
              onDelete={(node) => { setTreeOpen(false); setDialogTarget(node); setDialog("delete"); }}
              onMove={(node) => { setTreeOpen(false); setDialogTarget(node); setDialogParent(getParentId(tree, node.id) ?? "root"); setDialog("move"); }}
              onNewDocument={(parentId) => { setTreeOpen(false); openCreate("create-doc", parentId); }}
              onNewFolder={(parentId) => { setTreeOpen(false); openCreate("create-folder", parentId); }}
              onRename={(node) => { setTreeOpen(false); setDialogTarget(node); setDialogName(node.title); setDialog("rename"); }}
              onSelect={handleSelect}
              selectedId={selectedId}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={(open) => !open && setDialog(null)} open={dialog === "create-doc" || dialog === "create-folder" || dialog === "rename" || dialog === "move" || dialog === "delete"}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "create-doc" && "Nytt dokument"}
              {dialog === "create-folder" && "Ny mapp"}
              {dialog === "rename" && "Byt namn"}
              {dialog === "move" && "Flytta"}
              {dialog === "delete" && "Ta bort"}
            </DialogTitle>
          </DialogHeader>
          {dialog === "delete" ? (
            <p className="text-sm text-muted-foreground">
              Ta bort “{dialogTarget?.title}”? Detta kan inte ångras i webbläsaren.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {dialog !== "move" ? (
                <div className="space-y-2">
                  <Label htmlFor="doc-name">Namn</Label>
                  <Input autoFocus id="doc-name" onChange={(e) => setDialogName(e.target.value)} value={dialogName} />
                </div>
              ) : null}
              {dialog === "create-doc" || dialog === "create-folder" || dialog === "move" ? (
                <div className="space-y-2">
                  <Label>Placering</Label>
                  <Select onValueChange={setDialogParent} value={dialogParent}>
                    <SelectTrigger><SelectValue placeholder="Rot" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="root">Roten av manualen</SelectItem>
                      {folders
                        .filter((folder) => folder.id !== dialogTarget?.id)
                        .map((folder) => (
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
            {dialog === "delete" ? (
              <Button onClick={confirmDelete} variant="destructive">Ta bort</Button>
            ) : dialog === "rename" ? (
              <Button onClick={confirmRename}>Spara</Button>
            ) : dialog === "move" ? (
              <Button onClick={confirmMove}>Flytta</Button>
            ) : (
              <Button onClick={confirmCreate}>Skapa</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
