"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import { Check, Home, LifeBuoy, Maximize, Minimize, Minus, PanelLeft, Plus, Square, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { DocumentPaperHeader } from "@/components/manual/document-paper-header";
import { ManualTree } from "@/components/manual/manual-tree";
import { useOrgSession } from "@/components/providers/org-provider";
import { GuidanceHint } from "@/components/common/guidance-hint";
import { GuidancePanel } from "@/components/common/guidance-panel";
import { PageTour } from "@/components/tour/page-tour";
import { Tip } from "@/components/ui/tooltip";
import { FIRST_DOCUMENT_HINT, SUBSECTION_HINT } from "@/lib/guidance";
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
  persistReviewClose,
  persistReviewRespond,
  persistReviewSend,
  persistSettings,
} from "@/lib/manual/persist";
import { createYearActivity, missingTableMessage } from "@/lib/ops/persist";
import { canPlan } from "@/lib/billing/plans";
import { cloudReadMessage } from "@/lib/manual/cloud";
import { latestReferralFor, openReferralFor } from "@/lib/manual/referral";
import { loadOrgMembers, type OrgMember } from "@/lib/org/members";
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
import type { DocumentVersion, ManualAttachment, ReviewRequest } from "@/types/domain";

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

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
type DialogMode = "create-doc" | "rename" | "delete" | "publish" | "revise" | "remiss" | "respond" | "audit" | null;

export function ManualWorkspace({
  openDocumentId = null,
}: {
  initialView?: ViewMode;
  openDocumentId?: string | null;
}) {
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
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [dialogTarget, setDialogTarget] = useState<ManualNode | null>(null);
  const [dialogName, setDialogName] = useState("");
  const [dialogParent, setDialogParent] = useState<string>("root");
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"ok" | "fel">("ok");
  const [saveStatus, setSaveStatus] = useState<"sparar" | "sparad" | "osparad" | "fel">("sparad");
  const [approvedBy, setApprovedBy] = useState("");
  const [approvedAt, setApprovedAt] = useState("");
  const [revisedBy, setRevisedBy] = useState("");
  const [revisedAt, setRevisedAt] = useState("");
  const [revisionStarted, setRevisionStarted] = useState<Record<string, boolean>>({});
  const [tipsOpen, setTipsOpen] = useState(false);
  const [reviews, setReviews] = useState<ReviewRequest[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [remissTo, setRemissTo] = useState("");
  const [remissDue, setRemissDue] = useState("");
  const [remissMessage, setRemissMessage] = useState("Stämmer detta med hur ni jobbar?");
  const [remissResponse, setRemissResponse] = useState("");
  const [publishAnyway, setPublishAnyway] = useState(false);
  const [auditAt, setAuditAt] = useState("");
  const [auditOwner, setAuditOwner] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canEdit = session?.role !== "viewer";
  const canExport = canPlan(session?.plan, "export");
  const canAudit = canPlan(session?.plan, "audit");
  const canRemiss = canPlan(session?.plan, "remiss");

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
          const selected =
            openDocumentId && findNodeById(result.tree, openDocumentId)
              ? openDocumentId
              : result.selectedId;
          setSelectedId(selected);
          setLastOpenedId(result.lastOpenedId);
          setReviews(result.reviews);
          notice(null);
          setReady(true);
          return;
        } catch (error) {
          console.error(error);
          notice(cloudReadMessage(error), "fel");
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
  }, [orgLoading, session?.organizationId, session?.manualId, openDocumentId]);

  useEffect(() => {
    if (!session?.organizationId) return;
    void loadOrgMembers(session.organizationId)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [session?.organizationId]);

  useEffect(() => {
    if (!ready || cloud) return;
    saveTree(tree);
    saveDrafts(drafts);
    saveJson(SETTINGS_KEY, settings);
  }, [tree, drafts, settings, ready, cloud]);

  const selectedNode = selectedId ? findNodeById(tree, selectedId) : undefined;
  const selectedIsDocument = selectedNode?.kind === "document";
  const documentTitle = selectedIsDocument ? selectedNode.title : "";
  const documentCode = selectedId ? (getNodeNumber(tree, selectedId) ?? "–") : "–";
  const openReferral = openReferralFor(reviews, selectedId);
  const latestReferral = latestReferralFor(reviews, selectedId);
  const isReferralRecipient =
    Boolean(openReferral && session && openReferral.reviewerUserId === session.userId);
  const canSeeDraft = canEdit || isReferralRecipient;
  const draft = selectedId && selectedIsDocument ? (drafts[selectedId] ?? defaultDocumentContent) : "";
  const versions = selectedId ? (versionsByDoc[selectedId] ?? []) : [];
  const published = versions[0] ?? null;
  const edition = published?.edition ?? 0;
  const isDirty = selectedId ? dirtyIds.includes(selectedId) : false;
  const [treeCollapsed, setTreeCollapsed] = useState(false);
  const [treeWidth, setTreeWidth] = useState(300);
  const treeWidthRef = useRef(300);
  const binderRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = async () => {
    const node = binderRef.current;
    if (!node) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await node.requestFullscreen();
  };

  useEffect(() => {
    const stored = Number(window.localStorage.getItem("qw.manual.treeWidth"));
    if (stored >= 220 && stored <= 460) {
      setTreeWidth(stored);
      treeWidthRef.current = stored;
    }
  }, []);

  function startTreeResize(event: ReactMouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    const startX = event.clientX;
    const startW = treeWidthRef.current;
    const move = (next: MouseEvent) => {
      const width = Math.min(460, Math.max(220, startW + next.clientX - startX));
      treeWidthRef.current = width;
      setTreeWidth(width);
    };
    const up = () => {
      window.localStorage.setItem("qw.manual.treeWidth", String(treeWidthRef.current));
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  function notice(message: string | null, tone: "ok" | "fel" = "ok") {
    setStatus(message);
    setStatusTone(tone);
  }

  function markDirty(id: string) {
    setDirtyIds((current) => (current.includes(id) ? current : [...current, id]));
    setSavedId(null);
    setSaveStatus("osparad");
  }

  function openCreate(parentId: string | null) {
    setDialog("create-doc");
    setDialogName("");
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
      setStatus("Skriv texten först. Sedan kan du publicera.");
      return;
    }
    if (openReferral) {
      setStatus(`Väntar på ${openReferral.reviewerName || "remiss"}. Publicera när svaret kommit.`);
      return;
    }
    if (edition > 0 && selectedId && !revisionStarted[selectedId]) {
      setRevisionStarted((current) => ({ ...current, [selectedId]: true }));
    }
    setPublishAnyway(false);
    setApprovedBy(settings.approver || settings.issuer || "Administratör");
    setApprovedAt(new Date().toISOString().slice(0, 10));
    setDialog("publish");
  }

  function openAudit() {
    if (!selectedId || !selectedIsDocument) return;
    setAuditOwner(settings.issuer || session?.fullName || "");
    setAuditAt(new Date().toISOString().slice(0, 10));
    setDialog("audit");
  }

  async function confirmAudit() {
    if (!selectedId || !session?.organizationId) return;
    try {
      await createYearActivity({
        organizationId: session.organizationId,
        title: `Intern revision ${documentCode} ${documentTitle}`,
        kind: "revision",
        plannedOn: auditAt,
        ownerName: auditOwner,
      });
      setDialog(null);
      notice("Lagd i årshjulet.", "ok");
    } catch (error) {
      notice(missingTableMessage(error), "fel");
    }
  }

  function openRemiss() {
    if (!selectedId || !selectedIsDocument) return;
    const firstOther = members.find((member) => member.userId !== session?.userId);
    setRemissTo(firstOther?.userId || members[0]?.userId || "");
    setRemissDue(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
    setRemissMessage("Stämmer detta med hur ni jobbar?");
    setDialog("remiss");
  }

  async function confirmRemiss() {
    if (!selectedId || !session) return;
    const member = members.find((item) => item.userId === remissTo);
    const reviewerName = member?.name || "Medarbetare";
    if (cloud) {
      try {
        const row = await persistReviewSend({
          documentId: selectedId,
          requestedBy: session.userId,
          reviewerUserId: remissTo || null,
          reviewerName,
          dueAt: remissDue,
          message: remissMessage,
        });
        setReviews((current) => [row, ...current.filter((item) => item.documentId !== selectedId || item.status !== "pending")]);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Kunde inte skicka remiss");
        return;
      }
    } else {
      setReviews((current) => [
        {
          id: `remiss-${Date.now()}`,
          documentId: selectedId,
          reviewerName,
          reviewerUserId: remissTo,
          requestedBy: session.userId,
          status: "pending",
          createdAt: new Date().toISOString(),
          message: remissMessage,
          dueAt: remissDue,
        },
        ...current,
      ]);
    }
    setDialog(null);
    notice(`Remiss skickad till ${reviewerName}.`, "ok");
  }

  async function confirmRespond(statusValue: "approved" | "rejected") {
    if (!selectedId || !openReferral) return;
    if (cloud) {
      try {
        await persistReviewRespond({
          reviewId: openReferral.id,
          documentId: selectedId,
          status: statusValue,
          dueAt: openReferral.dueAt ?? "",
          instruction: openReferral.message ?? "",
          response: remissResponse,
        });
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Kunde inte spara svaret");
        return;
      }
    }
    setReviews((current) =>
      current.map((item) =>
        item.id === openReferral.id
          ? { ...item, status: statusValue, responseText: remissResponse }
          : item,
      ),
    );
    setDialog(null);
    setStatus(statusValue === "approved" ? "Remissen är godkänd." : "Remissen är avstyrkt.");
  }

  async function confirmRevise() {
    if (!selectedId) return;
    setRevisionStarted((current) => ({ ...current, [selectedId]: true }));
    setDialog(null);
    setStatus(`Revision startad ${revisedAt} av ${revisedBy}. Originalet är orört.`);
  }

  async function confirmPublish() {
    if (!selectedId || !selectedIsDocument) return;
    if (latestReferral?.status === "rejected" && !publishAnyway) {
      setStatus("Remissen är avstyrkt. Kryssa i Publicera ändå.");
      return;
    }
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
    if (cloud) {
      try {
        await persistReviewClose(selectedId);
      } catch {
        /* remiss already closed or missing */
      }
    }
    setReviews((current) =>
      current.map((item) =>
        item.documentId === selectedId && item.status === "pending"
          ? { ...item, status: "approved" as const }
          : item,
      ),
    );
    setDialog(null);
    notice("Publicerat. Originalet är uppdaterat. Du kan skriva vidare.", "ok");
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
    const title = dialogName.trim();
    if (!title) {
      notice("Skriv ett namn, eller använd förslaget.", "fel");
      return;
    }
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
        return uploaded;
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Uppladdning misslyckades");
      }
    }
    return [];
  }

  async function handleUploadImage(file: File) {
    const uploaded = await handleAddAttachmentFiles((() => {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      return transfer.files;
    })());
    if (uploaded?.[0]?.url) return uploaded[0].url;
    return readFileAsDataUrl(file);
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
    onDelete: (node: ManualNode) => {
      setDialogTarget(node);
      setDialog("delete");
    },
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
    <div className="flex h-screen min-h-0 overflow-hidden bg-muted/40" ref={binderRef}>
      <aside
        className="relative hidden shrink-0 bg-sidebar md:flex md:flex-col"
        data-tour="trad"
        style={treeCollapsed ? { width: 48 } : { width: treeWidth }}
      >
        {treeCollapsed ? (
          <Button
            aria-label="Visa innehållet"
            className="m-2"
            onClick={() => setTreeCollapsed(false)}
            size="icon"
            variant="ghost"
          >
            <PanelLeft />
          </Button>
        ) : (
          <ManualTree onCollapse={() => setTreeCollapsed(true)} {...treeProps} />
        )}
        {treeCollapsed ? null : (
          <button
            aria-label="Ändra bredd på innehållet"
            className="absolute inset-y-0 right-0 z-10 w-2 cursor-col-resize bg-transparent hover:bg-primary/25"
            onMouseDown={startTreeResize}
            type="button"
          />
        )}
      </aside>
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
          <div className="flex flex-col gap-2 border-b bg-card/90 px-4 pt-3 shadow-token-xs sm:px-5">
            <div className="flex items-center gap-2 pb-1">
              <Button aria-label="Visa innehållsförteckning" className="md:hidden" onClick={() => setTreeOpen(true)} size="icon" variant="ghost">
                <PanelLeft />
              </Button>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {selectedIsDocument
                  ? `${documentCode} ${documentTitle}`
                  : tree.length
                    ? "Välj ett blad till vänster"
                    : settings.name || "Manualen"}
              </span>
              <Button asChild size="sm" variant="ghost">
                <Link href="/">
                  <Home data-icon="inline-start" />
                  Start
                </Link>
              </Button>
              <div className="flex overflow-hidden rounded-lg border bg-background">
                <Button
                  aria-label="Dölj innehållet"
                  className="rounded-none"
                  onClick={() => setTreeCollapsed(true)}
                  size="icon"
                  variant="ghost"
                >
                  <Minus />
                </Button>
                <Button
                  aria-label="Visa innehållet"
                  className="rounded-none"
                  onClick={() => {
                    setTreeCollapsed(false);
                    if (document.fullscreenElement) void document.exitFullscreen();
                  }}
                  size="icon"
                  variant="ghost"
                >
                  <Square />
                </Button>
                <Button aria-label={isFullscreen ? "Lämna helskärm" : "Helskärm"} className="rounded-none" onClick={() => void toggleFullscreen()} size="icon" variant="ghost">{isFullscreen ? <Minimize /> : <Maximize />}</Button>
                <Button aria-label="Stäng manualen" className="rounded-none" asChild variant="ghost">
                  <Link href="/"><X /></Link>
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pb-3">
              <TabsList variant="line">
                <TabsTrigger value="settings">Grundinställningar</TabsTrigger>
                <TabsTrigger value="work">Arbetsmanual</TabsTrigger>
                <TabsTrigger value="original">Original</TabsTrigger>
              </TabsList>
              <div className="ml-auto flex items-center gap-1.5">
                {selectedIsDocument ? (
                  <>
                    <Button disabled={!canEdit || edition === 0} onClick={openRevise} size="sm" variant="ghost">
                      Revidera
                    </Button>
                    <Button disabled={!canEdit} onClick={() => void handleSave()} size="sm" variant="outline">
                      Spara
                    </Button>
                    <Button disabled={!canEdit || !canAudit} onClick={openAudit} size="sm" variant="ghost">
                      Intern revision
                    </Button>
                    <Button disabled={!canEdit || !canRemiss} onClick={openRemiss} size="sm" variant="ghost">
                      Remiss
                    </Button>
                    <Button disabled={!canEdit} onClick={openPublish} size="sm">
                      Publicera
                    </Button>
                  </>
                ) : null}
                <Tip label="Hjälp">
                  <Button
                    aria-label="Hjälp"
                    id="tour-home"
                    onClick={() => setTipsOpen((open) => !open)}
                    size="icon"
                    variant={tipsOpen ? "default" : "ghost"}
                  >
                    <LifeBuoy />
                  </Button>
                </Tip>
              </div>
              {status ? (
                <span className={statusTone === "fel" ? "w-full text-xs text-destructive" : "w-full text-xs text-muted-foreground"}>
                  {status}
                  {(status.includes("molnet") || status.includes("Databasen") || status.includes("Kunde inte läsa")) ? (
                    <button className="ml-2 underline" onClick={() => window.location.reload()} type="button">
                      Försök igen
                    </button>
                  ) : null}
                  {status === "Lagd i årshjulet." ? (
                    <Link className="ml-2 font-semibold text-primary underline" href="/arshjul">
                      Öppna årshjul
                    </Link>
                  ) : null}
                </span>
              ) : null}
            </div>
          </div>
          <TabsContent className="flex min-h-0 flex-col overflow-auto" value="settings">
            <ManualSettingsPanel onChange={handleSettingsChange} settings={settings} />
          </TabsContent>
          <TabsContent className="flex min-h-0 flex-col" value="work">
            {selectedIsDocument && (openReferral || latestReferral?.status === "rejected") ? (
              <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-4 py-2 text-sm">
                {openReferral ? (
                  isReferralRecipient ? (
                    <>
                      <span>Du har en remiss på {documentCode}. Svara senast {openReferral.dueAt || "–"}.</span>
                      <Button onClick={() => { setRemissResponse(""); setDialog("respond"); }} size="sm">
                        Svara
                      </Button>
                    </>
                  ) : (
                    <span>Väntar på {openReferral.reviewerName}. Svara senast {openReferral.dueAt || "–"}.</span>
                  )
                ) : latestReferral?.status === "rejected" ? (
                  <span className="text-destructive">
                    Remissen är avstyrkt{latestReferral.responseText ? `: ${latestReferral.responseText}` : "."}
                  </span>
                ) : null}
              </div>
            ) : null}
            {selectedIsDocument && canSeeDraft ? (
              <ManualEditorPanel
                key={selectedId}
                attachments={attachments[selectedId ?? ""] ?? []}
                companyName={session?.organizationName || settings.name}
                documentCode={documentCode}
                documentTitle={documentTitle}
                editable={canEdit}
                canExport={canExport}
                edition={edition}
                issuer={settings.issuer}
                onAddAttachment={() => fileInputRef.current?.click()}
                onUploadImage={handleUploadImage}
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
            ) : selectedIsDocument ? (
              <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
                Du läser boken i fliken Original.
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 justify-center overflow-auto bg-[radial-gradient(900px_480px_at_50%_0%,hsl(190_45%_93%),transparent)] p-6 md:p-10">
                <div className="document-paper flex min-h-[42rem] w-full max-w-[210mm] flex-col">
                  <DocumentPaperHeader
                    companyName={session?.organizationName || settings.name}
                    documentCode=""
                    documentTitle=""
                    edition={0}
                    issuer={settings.issuer}
                    statusLabel={tree.length ? "Välj ett blad i trädet" : "Ny pärm"}
                  />
                  <div className="flex flex-1 flex-col items-center justify-center gap-4 px-10 py-16 text-center">
                    <p className="max-w-sm text-sm leading-7 text-paper-muted">
                      {tree.length
                        ? "Klicka ett blad till vänster. Då öppnas det på papperet."
                        : "Pärmen är tom. Första bladet får nummer 1.0. Namnet väljer du."}
                    </p>
                    {!tree.length && canEdit ? (
                      <Button onClick={() => openCreate(null)}>
                        <Plus data-icon="inline-start" />
                        Skapa 1.0
                      </Button>
                    ) : null}
                  </div>
                </div>
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
        <footer className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t bg-card/90 px-5 py-2 text-xs text-muted-foreground">
          {selectedIsDocument ? (
            <>
              <span>{saveStatus === "sparar" ? "Sparar…" : saveStatus === "sparad" ? "Sparad" : saveStatus === "fel" ? "Kunde inte spara" : "Osparat"}</span>
              <span>{countPlainText(draft)} tecken</span>
              <span>{canEdit ? "Arbetsmanual – du kan ändra" : "Läsa"}</span>
              <span>{edition > 0 ? `Utgåva ${edition}` : "Ingen utgåva"}</span>
              {edition > 0 ? (
                <span className="ml-auto">
                  <Button
                    disabled={!published || !selectedId || acknowledgedIds.includes(selectedId)}
                    onClick={() => {
                      if (!selectedId) return;
                      setAcknowledgedIds((current) => [...current, selectedId]);
                      if (cloud && session) void persistAck(selectedId, session.userId, edition);
                    }}
                    size="sm"
                    variant="outline"
                  >
                    {selectedId && acknowledgedIds.includes(selectedId) ? <><Check /> Kvitterad</> : "Kvittera"}
                  </Button>
                </span>
              ) : null}
            </>
          ) : (
            <span>Pärmen är tom. Skapa 1.0 när du är redo.</span>
          )}
        </footer>
      </div>
      {tipsOpen ? (
        <GuidancePanel
          intro={
            selectedIsDocument
              ? `Du är i ${documentCode} ${documentTitle}. Skriv hur ni gör. Publicera när det stämmer.`
              : "Skapa 1.0. Numret låses. Namnet väljer du. Andra läser bara originalet."
          }
          onClose={() => setTipsOpen(false)}
          place="manual"
        />
      ) : null}
      <PageTour />
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
                      : dialog === "remiss"
                        ? "Skicka remiss"
                        : dialog === "respond"
                          ? "Svara på remiss"
                          : dialog === "audit"
                            ? "Intern revision"
                            : dialogParent === "root"
                            ? tree.length
                              ? "Nytt dokument"
                              : "Skapa 1.0"
                            : "Nytt underavsnitt"}
            </DialogTitle>
          </DialogHeader>
          {dialog === "delete" ? (
            <p className="text-sm text-muted-foreground">
              Ta bort {dialogTarget?.title}? Det går inte att ångra.
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
              {latestReferral?.status === "rejected" ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    checked={publishAnyway}
                    onChange={(event) => setPublishAnyway(event.target.checked)}
                    type="checkbox"
                  />
                  Publicera ändå (remissen är avstyrkt)
                </label>
              ) : null}
            </div>
          ) : dialog === "remiss" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {documentCode} {documentTitle}. Mottagaren läser utkastet och svarar Godkänn eller Avstyrk.
              </p>
              <div className="space-y-2">
                <Label>Till</Label>
                <Select onValueChange={setRemissTo} value={remissTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj person" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="remiss-due">Sista svarsdatum</Label>
                <Input id="remiss-due" onChange={(e) => setRemissDue(e.target.value)} type="date" value={remissDue} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remiss-message">Meddelande</Label>
                <Textarea id="remiss-message" onChange={(e) => setRemissMessage(e.target.value)} value={remissMessage} />
              </div>
            </div>
          ) : dialog === "respond" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{openReferral?.message}</p>
              <div className="space-y-2">
                <Label htmlFor="remiss-response">Kommentar</Label>
                <Textarea id="remiss-response" onChange={(e) => setRemissResponse(e.target.value)} value={remissResponse} />
              </div>
            </div>
          ) : dialog === "audit" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {documentCode} {documentTitle} läggs i årshjulet. Inte en ny modul – samma kalender som skyddsrond och ledningens genomgång.
              </p>
              <div className="space-y-2">
                <Label htmlFor="audit-at">Datum</Label>
                <Input id="audit-at" onChange={(e) => setAuditAt(e.target.value)} type="date" value={auditAt} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audit-owner">Ansvarig</Label>
                <Input id="audit-owner" onChange={(e) => setAuditOwner(e.target.value)} value={auditOwner} />
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
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="doc-name">Dokumentnamn</Label>
                <Input
                  id="doc-name"
                  onChange={(e) => setDialogName(e.target.value)}
                  placeholder="Ange dokumentnamn"
                  value={dialogName}
                />
              </div>
              {dialog === "create-doc" ? (
                <>
                  <GuidanceHint
                    hint={dialogParent === "root" && !tree.length ? FIRST_DOCUMENT_HINT : SUBSECTION_HINT}
                    onApply={
                      dialogParent === "root" && !tree.length
                        ? (value) => setDialogName(value)
                        : undefined
                    }
                  />
                  <p className="text-xs text-muted-foreground">Numret låses vid skapande. Namnet väljer du själv.</p>
                </>
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
            {dialog === "remiss" ? <Button disabled={!remissTo} onClick={() => void confirmRemiss()}>Skicka</Button> : null}
            {dialog === "respond" ? (
              <>
                <Button onClick={() => void confirmRespond("rejected")} variant="outline">Avstyrk</Button>
                <Button onClick={() => void confirmRespond("approved")}>Godkänn</Button>
              </>
            ) : null}
            {dialog === "audit" ? <Button disabled={!auditAt} onClick={() => void confirmAudit()}>Lägg in i årshjulet</Button> : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
