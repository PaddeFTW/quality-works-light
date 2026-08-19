"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";

import type { ManualAttachment } from "@/components/manual/manual-workspace";

import {
  Bold,
  Check,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  Paperclip,
  Redo2,
  Save,
  Table2,
  Underline,
  Undo2,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface ManualEditorPanelProps {
  documentTitle: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onPublish: () => void;
  saved: boolean;
  attachments: ManualAttachment[];
  onAddAttachment: () => void;
  onRemoveAttachment: (attachmentId: string) => void;
}

export function ManualEditorPanel({
  documentTitle,
  value,
  onChange,
  onSave,
  onPublish,
  saved,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
}: ManualEditorPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<string[]>([value]);
  const redoRef = useRef<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const restoreSelection = (selectionStart: number, selectionEnd: number) => {
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const commit = (nextValue: string, selectionStart: number, selectionEnd: number) => {
    const history = historyRef.current;
    if (history[history.length - 1] !== nextValue) {
      history.push(nextValue);
      if (history.length > 50) history.shift();
    }
    redoRef.current = [];
    setCanUndo(historyRef.current.length > 1);
    setCanRedo(redoRef.current.length > 0);
    onChange(nextValue);
    restoreSelection(selectionStart, selectionEnd);
  };

  const handleTextareaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    const history = historyRef.current;
    if (history[history.length - 1] !== nextValue) {
      history.push(nextValue);
      if (history.length > 50) history.shift();
    }
    redoRef.current = [];
    setCanUndo(historyRef.current.length > 1);
    setCanRedo(redoRef.current.length > 0);
    onChange(nextValue);
  };

  const wrapSelection = (prefix: string, suffix: string, placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const nextValue = `${value.slice(0, start)}${prefix}${selected}${suffix}${value.slice(end)}`;
    const cursorStart = start + prefix.length;
    commit(nextValue, cursorStart, cursorStart + selected.length);
  };

  const prefixLines = (linePrefix: string, numbered = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEndIndex = value.indexOf("\n", end);
    const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
    const block = value.slice(lineStart, lineEnd);
    const nextLines = block.split("\n").map((line, index) =>
      numbered ? `${index + 1}. ${line}` : `${linePrefix}${line}`,
    );
    const nextBlock = nextLines.join("\n");
    const nextValue = `${value.slice(0, lineStart)}${nextBlock}${value.slice(lineEnd)}`;
    const delta = nextBlock.length - block.length;
    commit(nextValue, start + (numbered ? 3 : linePrefix.length), end + delta);
  };

  const handleUndo = () => {
    const history = historyRef.current;
    if (history.length <= 1) return;
    const current = history.pop();
    if (current !== undefined) redoRef.current.push(current);
    const previous = history[history.length - 1];
    setCanUndo(historyRef.current.length > 1);
    setCanRedo(redoRef.current.length > 0);
    onChange(previous);
    restoreSelection(previous.length, previous.length);
  };

  const handleRedo = () => {
    const next = redoRef.current.pop();
    if (!next) return;
    historyRef.current.push(next);
    setCanUndo(historyRef.current.length > 1);
    setCanRedo(redoRef.current.length > 0);
    onChange(next);
    restoreSelection(next.length, next.length);
  };

  const insertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || "länktext";
    const url = window.prompt("Ange URL", "https://");
    if (!url) return;
    const link = `[${selected}](${url})`;
    const nextValue = `${value.slice(0, start)}${link}${value.slice(end)}`;
    commit(nextValue, start + link.length, start + link.length);
  };

  const insertTable = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const table = "| Kolumn 1 | Kolumn 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n| Cell 3 | Cell 4 |";
    const nextValue = `${value.slice(0, start)}${table}${value.slice(start)}`;
    commit(nextValue, start + table.length, start + table.length);
  };

  const insertModuleLink = (moduleTitle: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const modulePath = modules.find((module) => module.title === moduleTitle)?.path ?? `/${moduleTitle.toLocaleLowerCase("sv-SE")}`;
    const link = `[${moduleTitle}](${modulePath})`;
    const nextValue = `${value.slice(0, start)}${link}${value.slice(end)}`;
    commit(nextValue, start + link.length, start + link.length);
  };

  const toolbarButtonClass = "size-8 p-0";
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const modules = [
    { title: "Årshjul", path: "/arshjul" },
    { title: "Avvikelsehantering", path: "/avvikelse" },
    { title: "Förbättringsförslag", path: "/forbattringsforslag" },
    { title: "Riskbedömning", path: "/riskbedomning" },
    { title: "Intern Revision", path: "/intern-revision" },
    { title: "Protokoll", path: "/protokoll" },
    { title: "Kundtillfredsställelse", path: "/kundtillfredsstallelse" },
    { title: "Leverantörsbedömning", path: "/leverantorsbedomning" },
    { title: "Lagar & Bindande krav", path: "/lagar-bindande-krav" },
    { title: "Personalenkät", path: "/personalenkat" },
    { title: "Personal & Kompetens", path: "/personal-kompetens" },
    { title: "Miljöaspekter", path: "/miljoaspekter" },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/10">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b bg-muted/30 px-4 py-2.5">
        <Button onClick={onSave} size="sm" variant="outline">
          {saved ? <Check data-icon="inline-start" /> : <Save data-icon="inline-start" />}
          {saved ? "Sparat" : "Spara"}
        </Button>
        <Button onClick={onPublish} size="sm">
          <Upload data-icon="inline-start" />
          Publicera
        </Button>
        <Dialog onOpenChange={setAttachmentsOpen} open={attachmentsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost">
              <Paperclip data-icon="inline-start" />
              Bilagor
              {attachments.length > 0 ? <Badge variant="secondary">{attachments.length}</Badge> : null}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bilagor för {documentTitle}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/15 bg-primary/5 p-3">
                <div>
                  <p className="font-medium">Dokumentbilagor</p>
                  <p className="text-sm text-muted-foreground">Filerna hör till det valda dokumentet.</p>
                </div>
                <Button onClick={onAddAttachment} size="sm" variant="outline">
                  <Upload data-icon="inline-start" />
                  Ladda upp
                </Button>
              </div>
              {attachments.length === 0 ? (
                <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 text-center">
                  <Paperclip className="size-5 text-muted-foreground" />
                  <p className="font-medium">Inga bilagor ännu</p>
                  <p className="text-sm text-muted-foreground">Ladda upp en fil för att lägga till en bilaga.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {attachments.map((attachment) => (
                    <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3" key={attachment.id}>
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="rounded-md bg-primary/10 p-2 text-primary"><Paperclip className="size-4" /></div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground">{attachment.size} · {attachment.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button onClick={() => window.alert("Nedladdning är en platshållare.")} size="sm" variant="outline">Ladda ner</Button>
                        <Button onClick={() => onRemoveAttachment(attachment.id)} size="sm" variant="ghost">Ta bort</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        <span className="ml-auto text-xs text-muted-foreground" aria-live="polite">
          {saved ? "Utkast sparat" : "Osparat"}
          <span className="mx-2" aria-hidden="true">·</span>
          Redigerar: <span className="font-medium text-foreground">{documentTitle}</span>
        </span>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b bg-background px-4 py-2">
        <Button aria-label="Fetstil" className={toolbarButtonClass} onClick={() => wrapSelection("**", "**", "fetstil")} size="sm" title="Fetstil" type="button" variant="ghost"><Bold /></Button>
        <Button aria-label="Kursiv" className={toolbarButtonClass} onClick={() => wrapSelection("*", "*", "kursiv text")} size="sm" title="Kursiv" type="button" variant="ghost"><Italic /></Button>
        <Button aria-label="Understruken" className={toolbarButtonClass} onClick={() => wrapSelection("<u>", "</u>", "understruken text")} size="sm" title="Understruken" type="button" variant="ghost"><Underline /></Button>
        <Separator className="mx-1 h-6" orientation="vertical" />
        <Button aria-label="Rubrik 1" className={toolbarButtonClass} onClick={() => prefixLines("# ")} size="sm" title="Rubrik 1" type="button" variant="ghost"><Heading1 /></Button>
        <Button aria-label="Rubrik 2" className={toolbarButtonClass} onClick={() => prefixLines("## ")} size="sm" title="Rubrik 2" type="button" variant="ghost"><Heading2 /></Button>
        <Button aria-label="Rubrik 3" className={toolbarButtonClass} onClick={() => prefixLines("### ")} size="sm" title="Rubrik 3" type="button" variant="ghost"><Heading3 /></Button>
        <Separator className="mx-1 h-6" orientation="vertical" />
        <Button aria-label="Punktlista" className={toolbarButtonClass} onClick={() => prefixLines("- ")} size="sm" title="Punktlista" type="button" variant="ghost"><List /></Button>
        <Button aria-label="Numrerad lista" className={toolbarButtonClass} onClick={() => prefixLines("", true)} size="sm" title="Numrerad lista" type="button" variant="ghost"><ListOrdered /></Button>
        <Separator className="mx-1 h-6" orientation="vertical" />
        <Button aria-label="Infoga länk" className={toolbarButtonClass} onClick={insertLink} size="sm" title="Infoga länk" type="button" variant="ghost"><Link /></Button>
        <Button aria-label="Infoga tabell" className={toolbarButtonClass} onClick={insertTable} size="sm" title="Infoga tabell" type="button" variant="ghost"><Table2 /></Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button aria-label="Länka modul" className="h-8 px-2 text-xs" size="sm" title="Länka modul" type="button" variant="outline">
              Länka modul
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Länka modul</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2 sm:grid-cols-2">
              {modules.map((module) => (
                <DialogClose asChild key={module.title}>
                  <Button
                    className="justify-start"
                    onClick={() => insertModuleLink(module.title)}
                    type="button"
                    variant="outline"
                  >
                    {module.title}
                  </Button>
                </DialogClose>
              ))}
            </div>
          </DialogContent>
        </Dialog>
        <Separator className="mx-1 h-6" orientation="vertical" />
        <Button aria-label="Ångra" className={toolbarButtonClass} disabled={!canUndo} onClick={handleUndo} size="sm" title="Ångra" type="button" variant="ghost"><Undo2 /></Button>
        <Button aria-label="Gör om" className={toolbarButtonClass} disabled={!canRedo} onClick={handleRedo} size="sm" title="Gör om" type="button" variant="ghost"><Redo2 /></Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4 md:p-6">
        <Textarea
          aria-label={`Arbetsmanual för ${documentTitle}`}
          className="min-h-[38rem] h-full resize-none rounded-xl border-border/70 bg-background px-6 py-6 font-serif text-base leading-8 shadow-sm focus-visible:ring-primary/30"
          onChange={handleTextareaChange}
          ref={textareaRef}
          value={value}
        />
      </div>
    </div>
  );
}
