"use client";

import { useState } from "react";
import { BadgeCheck, Check, ChevronRight, ListTree } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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

interface PublishedDocument {
  content: string;
  publishedAt: string;
}

const initialSettings: ManualSettings = {
  name: "Kvalitetsmanual",
  issuer: "Anna Lind",
  reviewer: "Johan Berg",
  approver: "Maria Ek",
  logo: "",
  headerText: "Kvalitetsmanual – Quality WorX",
  footerText: "Internt dokument. Utskrift gäller endast utskriftsdagen.",
};

export function ManualWorkspace() {
  const [selectedId, setSelectedId] = useState("kvalitetspolicy");
  const [activeTab, setActiveTab] = useState("work");
  const [settings, setSettings] = useState<ManualSettings>(initialSettings);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [publishedDocuments, setPublishedDocuments] = useState<
    Record<string, PublishedDocument>
  >({});
  const [attachments, setAttachments] = useState<Record<string, number>>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);
  const [edition, setEdition] = useState(1);
  const [treeOpen, setTreeOpen] = useState(false);

  const selectedNode = findNodeById(manualTree, selectedId);
  const documentTitle = selectedNode?.title ?? "Dokument";
  const draft = drafts[selectedId] ?? defaultDocumentContent;
  const published = publishedDocuments[selectedId] ?? null;
  const isAcknowledged = acknowledgedIds.includes(selectedId);

  function handleSelect(node: ManualNode) {
    setSelectedId(node.id);
    setSavedId(null);
    setTreeOpen(false);
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
    setPublishedDocuments((current) => ({
      ...current,
      [selectedId]: {
        content: draft,
        publishedAt: new Date().toLocaleDateString("sv-SE"),
      },
    }));
    setEdition((current) => current + 1);
    setAcknowledgedIds((current) => current.filter((id) => id !== selectedId));
    setActiveTab("original");
  }

  function handleAddAttachment() {
    setAttachments((current) => ({
      ...current,
      [selectedId]: (current[selectedId] ?? 0) + 1,
    }));
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
              <span className="font-medium text-foreground">
                {documentTitle}
              </span>
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
          </div>

          <TabsContent
            className="flex min-h-0 flex-col overflow-auto"
            value="settings"
          >
            <ManualSettingsPanel onChange={setSettings} settings={settings} />
          </TabsContent>

          <TabsContent className="flex min-h-0 flex-col" value="work">
            <ManualEditorPanel
              attachments={attachments[selectedId] ?? 0}
              documentTitle={documentTitle}
              onAddAttachment={handleAddAttachment}
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
              footerText={settings.footerText}
              headerText={settings.headerText}
              publishedAt={published?.publishedAt ?? null}
            />
          </TabsContent>
        </Tabs>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/30 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium">Utgåva {edition}</span>
            {isAcknowledged ? (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <BadgeCheck className="size-4 text-success" />
                Kvitterad
              </span>
            ) : null}
          </div>
          <Button
            disabled={isAcknowledged}
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
