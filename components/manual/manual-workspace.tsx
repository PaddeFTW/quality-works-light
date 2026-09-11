"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Home, Maximize, Minimize, Minus, PanelLeft, Plus, Square, X } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  defaultDocumentContent,
  findNodeById,
  getNodeNumber,
  countPlainText,
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
import { bootManualFromCloud, rememberLastOpened } from "@/components/manual/manual-boot";
import {
  persistAck,
  persistCreate,
  persistDelete,
  persistDeleteAttachment,
  persistDraft,
  persistFiles,
  persistPublish,
  persistRename,
  persistSettings,
} from "@/lib/manual/persist";
import { firstDocumentId, insertNode, removeNode, renameNode } from "@/lib/manual/tree-ops";
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
type DialogMode = "create-doc" | "rename" | "delete" | "publish" | "revise" | null;

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
  const [status, setStatus] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"sparar" | "sparad" | "osparad" | "fel">("sparad");
  const [approvedBy, setApprovedBy] = useState("");
  const [approvedAt, setApprovedAt] = useState("");
  const [revisedBy, setRevisedBy] = useState("");
  const [revisedAt, setRevisedAt] = useState("");
  const [revisionStarted, setRevisionStarted] = useState<Record<string, boolean>>({});
  const [tipsOpen, setTipsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
          setLastOpenedId(result.lastOpenedId);
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
  const documentCode = selectedId ? (getNodeNumber(tree, selectedId) ?? "–") : "–";
  const draft = selectedId && selectedIsDocument ? (drafts[selectedId] ?? defaultDocumentContent) : "";
  const versions = selectedId ? (versionsByDoc[selectedId] ?? []) : [];
  const published = versions[0] ?? null;
  const edition = published?.edition ?? 0;
  const isDirty = selectedId ? dirtyIds.includes(selectedId) : false;
  const hideTree = viewMode === "focus";
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  function markDirty(id: string) {
    setDirtyIds((current) => (current.includes(id) ? current : [...current, id]));
    setSavedId(null);
    setSaveStatus("osparad");
  }

  function openCreate(parentId: string | null) {
    const isRoot = parentId === null;
    const name = isRoot ? (tree.length ? "Nytt kapitel" : "Ledningssystemet") : "Nytt avsnitt";
    setDialog("create-doc");
    setDialogName(name);
    setDialogParent(parentId ?? "root");
  }

  async function handleSave() {
    if (!selectedId) return;
    setSaveStatus("sparar");
    if (cloud) {
      try {
        await persistDraft(selectedId, drafts[selectedId] ?? draft);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Kunde inte spara");
        setSaveStatus("fel");
        return;
      }
    }
    setSavedId(selectedId);
    setDirtyIds((current) => current.filter((item) => item !== selectedId));
    setSaveStatus("sparad");
  }

  useEffect(() => {
    if (!ready || !selectedId || !isDirty) return;
    const timer = window.setTimeout(() => {
      void handleSave();
    }, 900);
    return () => window.clearTimeout(timer);
    // Autosave follows the current draft; handleSave reads latest state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, selectedId, isDirty, ready]);

  function openRevise() {
    setRevisedBy(settings.issuer || session?.fullName || "Administratör");
    setRevisedAt(new Date().toISOString().slice(0, 10));
    setDialog("revise");
  }

  function openPublish() {
    if (!selectedId || !selectedIsDocument) return;
    const plain = countPlainText(draft);
    if (!plain) {
      setStatus("Inget att publicera.");
      return;
    }
    if (edition > 0 && !revisionStarted[selectedId]) {
      openRevise();
      return;
    }
    setApprovedBy(settings.approver || settings.issuer || "Administratör");
    setApprovedAt(new Date().toISOString().slice(0, 10));
    setDialog("publish");
  }

  async function confirmRevise() {
    if (!selectedId) return;
    setRevisionStarted((current) => ({ ...current, [selectedId]: true }));
    setDialog(null);
    setStatus(`Revision startad ${revisedAt} av ${revisedBy}. Originalet är orört.`);
  }

  async function confirmPublish() {
    if (!selectedId || !selectedIsDocument) return;
    const nextEdition = (versions[0]?.edition ?? 0) + 1;
    const publishedLabel = approvedAt
      ? new Date(`${approvedAt}T12:00:00`).toLocaleDateString("sv-SE")
      : new Date().toLocaleDateString("sv-SE");
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
              publishedAt: publishedLabel,
              publishedByName: approvedBy,
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
            publishedAt: publishedLabel,
            publishedByName: approvedBy,
          },
          ...(current[selectedId] ?? []),
        ],
      }));
    }
    setDirtyIds((current) => current.filter((item) => item !== selectedId));
    setSavedId(selectedId);
    setSaveStatus("sparad");
    setRevisionStarted((current) => ({ ...current, [selectedId]: false }));
    setActiveTab("original");
    setDialog(null);
  }

  function restoreEdition(editionNumber: number) {
    if (!selectedId) return;
    const version = (versionsByDoc[selectedId] ?? []).find((item) => item.edition === editionNumber);
    if (!version) return;
    if (!window.confirm(`Kopiera utgåva ${editionNumber} till arbetsmanualen? Originalet ändras inte.`)) return;
    setDrafts((current) => ({ ...current, [selectedId]: version.content }));
    markDirty(selectedId);
    setRevisionStarted((current) => ({ ...current, [selectedId]: true }));
    setActiveTab("work");
  }

  async function confirmCreate() {
    const parentId = dialogParent === "root" ? null : dialogParent;
    const kind = "document" as const;
    const title = dialogName.trim() || (parentId ? "Nytt avsnitt" : tree.length ? "Nytt kapitel" : "Ledningssystemet");
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
    setDrafts((current) => ({ ...current, [id]: defaultDocumentContent }));
    setSelectedId(id);
    setLastOpenedId(id);
    rememberLastOpened(id);
    setActiveTab("work");
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
    if (node.kind === "document") {
      setLastOpenedId(node.id);
      rememberLastOpened(node.id);
    }
    setTreeOpen(false);
    if (node.kind === "document" && activeTab === "settings") setActiveTab("work");
  }

  const treeProps = {
    nodes: tree,
    lastOpenedId,
    publishedIds: Object.entries(versionsByDoc)
      .filter(([, list]) => list.length > 0)
      .map(([id]) => id),
    onNewDocument: openCreate,
    onHide: () => undefined,
    onRename: (node: ManualNode) => {
      setDialogTarget(node);
      setDialogName(node.title);
      setDialog("rename");
    },
    onSelect: handleSelect,
    selectedId,
  };

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Laddar manual…
      </div>
    );
  }

  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-muted/30">
      {hideTree ? null : (
        <aside className="hidden w-[288px] shrink-0 border-r bg-sidebar md:flex md:flex-col">
          <ManualTree {...treeProps} />
        </aside>
      )}
      <Dialog onOpenChange={setTreeOpen} open={treeOpen}>
        <DialogContent className="h-[80vh] p-0 md:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Innehållsförteckning</DialogTitle>
          </DialogHeader>
          <ManualTree {...treeProps} />
        </DialogContent>
      </Dialog>
      <input className="hidden" multiple onChange={(e) => { void handleAddAttachmentFiles(e.target.files); e.target.value = ""; }} ref={fileInputRef} type="file" />

      <div className="flex min-w-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <Tabs className="flex min-h-0 flex-1 flex-col gap-0" onValueChange={setActiveTab} value={activeTab}>
          <div className="flex flex-col gap-3 border-b bg-background px-4 pt-3 sm:px-5">
            <div className="flex items-center gap-2 px-1 py-1">
              <Button aria-label="Visa innehållsförteckning" className="md:hidden" onClick={() => setTreeOpen(true)} size="icon" variant="ghost">
                <PanelLeft />
              </Button>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {selectedIsDocument ? `${documentCode} ${documentTitle}` : documentTitle}
              </span>
              <Button asChild size="sm" variant="ghost">
                <Link href="/">
                  <Home data-icon="inline-start" />
                  Till startsida
                </Link>
              </Button>
              <div className="flex items-center">
                <Button aria-label="Minimera" onClick={() => setViewMode("focus")} size="icon" variant="ghost"><Minus /></Button>
                <Button aria-label="Fönsterläge" onClick={() => setViewMode("normal")} size="icon" variant="ghost"><Square /></Button>
                <Button aria-label={isFullscreen ? "Lämna helskärm" : "Helskärm"} onClick={() => void toggleFullscreen()} size="icon" variant="ghost">{isFullscreen ? <Minimize /> : <Maximize />}</Button>
                <Button aria-label="Stäng manualen" onClick={() => window.history.back()} size="icon" variant="ghost"><X /></Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pb-3">
              {!tree.length ? (
                <Button disabled={!canEdit} onClick={() => openCreate(null)} size="sm">
                  <Plus data-icon="inline-start" />
                  Skapa 1.0
                </Button>
              ) : (
                <Button disabled={!canEdit} onClick={() => openCreate(null)} size="sm" variant="outline">
                  <Plus data-icon="inline-start" />
                  Nytt kapitel
                </Button>
              )}
              <div className="ml-auto flex items-center gap-2">
                <Button disabled={!selectedIsDocument || !canEdit || edition === 0} onClick={openRevise} size="sm" variant="outline">
                  Revidera
                </Button>
                <Button disabled={!selectedIsDocument || !canEdit} onClick={() => void handleSave()} size="sm" variant="outline">
                  Spara
                </Button>
                <Button disabled={!selectedIsDocument || !canEdit} onClick={openPublish} size="sm">
                  Publicera
                </Button>
                <Button onClick={() => setTipsOpen((open) => !open)} size="sm" variant="ghost">
                  Tips
                </Button>
              </div>
              <TabsList className="ml-2" variant="line">
                <TabsTrigger value="settings">Grundinställningar</TabsTrigger>
                <TabsTrigger value="work">Arbetsmanual</TabsTrigger>
                <TabsTrigger value="original">Original</TabsTrigger>
              </TabsList>
              {status ? <span className="text-xs text-destructive">{status}</span> : null}
            </div>
          </div>
          <TabsContent className="flex min-h-0 flex-col overflow-auto" value="settings">
            <ManualSettingsPanel onChange={handleSettingsChange} settings={settings} />
          </TabsContent>
          <TabsContent className="flex min-h-0 flex-col" value="work">
            {selectedIsDocument ? (
              <ManualEditorPanel
                attachments={attachments[selectedId ?? ""] ?? []}
                companyName={session?.organizationName || settings.name}
                documentCode={documentCode}
                documentTitle={documentTitle}
                editable={canEdit}
                edition={edition}
                issuer={settings.issuer}
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
                onPublish={openPublish}
                onRemoveAttachment={(id) => {
                  const attachment = (attachments[selectedId ?? ""] ?? []).find((item) => item.id === id);
                  if (cloud) void persistDeleteAttachment(id, attachment?.storagePath).catch((error) => setStatus(error instanceof Error ? error.message : "Kunde inte ta bort bilagan"));
                  setAttachments((current) => ({ ...current, [selectedId ?? ""]: (current[selectedId ?? ""] ?? []).filter((item) => item.id !== id) }));
                }}
                onSave={() => void handleSave()}
                saveStatus={saveStatus}
                saved={savedId === selectedId && !isDirty}
                value={draft}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
                {tree.length ? "Välj ett dokument i trädet." : "Manualen är tom. Skapa första kapitlet."}
              </div>
            )}
          </TabsContent>
          <TabsContent className="flex min-h-0 flex-col" value="original">
            <ManualOriginalPanel
              companyName={session?.organizationName || settings.name}
              content={published?.content ?? null}
              documentCode={documentCode}
              documentTitle={documentTitle}
              edition={edition}
              footerText={settings.footerText}
              headerText={settings.headerText}
              issuer={settings.issuer}
              onRestore={canEdit ? restoreEdition : undefined}
              publishedAt={published?.publishedAt ?? null}
              versions={versions}
            />
          </TabsContent>
        </Tabs>
        <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t bg-background px-4 py-2 text-xs text-muted-foreground">
          <span>{saveStatus === "sparar" ? "Sparar…" : saveStatus === "sparad" ? "Sparad" : saveStatus === "fel" ? "Kunde inte spara" : "Osparat"}</span>
          <span>{countPlainText(draft)} tecken</span>
          <span>{canEdit ? "Redigera" : "Läsa"}</span>
          <span>{edition > 0 ? `Utgåva ${edition}` : "Ingen utgåva"}</span>
          <span>Godkänt {published?.publishedAt ?? "–"}</span>
          <span className="ml-auto">
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
          </span>
        </footer>
      </div>
      {tipsOpen ? (
        <aside className="hidden w-72 shrink-0 overflow-auto border-l bg-background p-4 md:block">
          <h2 className="text-sm font-semibold">Tips och vägledning</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {selectedIsDocument
              ? `Skriv hur ni faktiskt gör i ${documentCode} ${documentTitle}. Originalet är boken andra läser. Publicera när det stämmer.`
              : "Skapa 1.0 och skriv första kapitlet. Numret låses. Medarbetare ser bara originalet."}
          </p>
        </aside>
      ) : null}
      </div>

      <Dialog onOpenChange={(open) => !open && setDialog(null)} open={Boolean(dialog)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "delete"
                ? "Ta bort"
                : dialog === "rename"
                  ? "Byt namn"
                  : dialog === "publish"
                    ? "Publicera dokumentet"
                    : dialog === "revise"
                      ? "Information om dokumentet som håller på att revideras"
                      : dialogParent === "root"
                        ? tree.length
                          ? "Nytt kapitel"
                          : "Skapa 1.0"
                        : "Nytt underavsnitt"}
            </DialogTitle>
          </DialogHeader>
          {dialog === "delete" ? (
            <p className="text-sm text-muted-foreground">
              Ta bort {documentCode} {dialogTarget?.title}?
            </p>
          ) : dialog === "publish" ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="approved-at">Godkänt datum</Label>
                <Input id="approved-at" onChange={(e) => setApprovedAt(e.target.value)} type="date" value={approvedAt} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="approved-by">Godkänd av</Label>
                <Input id="approved-by" onChange={(e) => setApprovedBy(e.target.value)} value={approvedBy} />
              </div>
            </div>
          ) : dialog === "revise" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {documentCode} {documentTitle}. Originalet ligger kvar tills du publicerar.
              </p>
              <div className="space-y-2">
                <Label htmlFor="revised-by">Reviderat av</Label>
                <Input id="revised-by" onChange={(e) => setRevisedBy(e.target.value)} value={revisedBy} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="revised-at">Datum</Label>
                <Input id="revised-at" onChange={(e) => setRevisedAt(e.target.value)} type="date" value={revisedAt} />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="doc-name">Namn</Label>
              <Input id="doc-name" onChange={(e) => setDialogName(e.target.value)} value={dialogName} />
              {dialog === "create-doc" ? (
                <p className="text-xs text-muted-foreground">Numret låses vid skapande.</p>
              ) : null}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDialog(null)} variant="outline">Avbryt</Button>
            {dialog === "delete" ? <Button onClick={() => void confirmDelete()} variant="destructive">Ta bort</Button> : null}
            {dialog === "rename" ? <Button onClick={() => void confirmRename()}>Spara</Button> : null}
            {dialog === "create-doc" ? <Button onClick={() => void confirmCreate()}>Skapa</Button> : null}
            {dialog === "publish" ? <Button onClick={() => void confirmPublish()}>Publicera</Button> : null}
            {dialog === "revise" ? <Button onClick={() => void confirmRevise()}>Spara</Button> : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
