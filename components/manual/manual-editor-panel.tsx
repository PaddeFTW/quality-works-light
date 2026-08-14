"use client";

import { useRef } from "react";
import type { ChangeEvent } from "react";

import {
  Bold,
  Check,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Paperclip,
  Save,
  Undo2,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ManualEditorPanelProps {
  documentTitle: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onPublish: () => void;
  saved: boolean;
  attachments: number;
  onAddAttachment: () => void;
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
}: ManualEditorPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<string[]>([value]);

  const commit = (nextValue: string, selectionStart: number, selectionEnd: number) => {
    const history = historyRef.current;
    if (history[history.length - 1] !== nextValue) {
      history.push(nextValue);
      if (history.length > 50) {
        history.shift();
      }
    }
    onChange(nextValue);
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const handleTextareaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    const history = historyRef.current;
    if (history[history.length - 1] !== nextValue) {
      history.push(nextValue);
      if (history.length > 50) {
        history.shift();
      }
    }
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
    const lines = block.split("\n");
    const nextLines = lines.map((line, index) =>
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
    history.pop();
    const previous = history[history.length - 1];
    onChange(previous);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const toolbarButtonClass = "h-8 w-8 p-0";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-4 py-2.5">
        <Button onClick={onSave} size="sm" variant="outline">
          {saved ? <Check /> : <Save />}
          {saved ? "Sparat" : "Spara"}
        </Button>
        <Button onClick={onPublish} size="sm">
          <Upload />
          Publicera
        </Button>
        <Button onClick={onAddAttachment} size="sm" variant="ghost">
          <Paperclip />
          Bilagor
          {attachments > 0 ? (
            <Badge className="ml-1" variant="secondary">
              {attachments}
            </Badge>
          ) : null}
        </Button>
        <p className="ml-auto text-xs text-muted-foreground">
          Redigerar: <span className="font-medium text-foreground">{documentTitle}</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1 border-b bg-background px-4 py-2">
        <Button
          aria-label="Fetstil"
          className={cn(toolbarButtonClass)}
          onClick={() => wrapSelection("**", "**", "fetstil")}
          size="sm"
          title="Fetstil"
          type="button"
          variant="ghost"
        >
          <Bold />
        </Button>
        <Button
          aria-label="Kursiv"
          className={cn(toolbarButtonClass)}
          onClick={() => wrapSelection("*", "*", "kursiv text")}
          size="sm"
          title="Kursiv"
          type="button"
          variant="ghost"
        >
          <Italic />
        </Button>
        <Button
          aria-label="Rubrik"
          className={cn(toolbarButtonClass)}
          onClick={() => prefixLines("## ")}
          size="sm"
          title="Rubrik"
          type="button"
          variant="ghost"
        >
          <Heading2 />
        </Button>
        <Separator className="mx-1 h-6" orientation="vertical" />
        <Button
          aria-label="Punktlista"
          className={cn(toolbarButtonClass)}
          onClick={() => prefixLines("- ")}
          size="sm"
          title="Punktlista"
          type="button"
          variant="ghost"
        >
          <List />
        </Button>
        <Button
          aria-label="Numrerad lista"
          className={cn(toolbarButtonClass)}
          onClick={() => prefixLines("", true)}
          size="sm"
          title="Numrerad lista"
          type="button"
          variant="ghost"
        >
          <ListOrdered />
        </Button>
        <Separator className="mx-1 h-6" orientation="vertical" />
        <Button
          aria-label="Ångra"
          className={cn(toolbarButtonClass)}
          disabled={historyRef.current.length <= 1}
          onClick={handleUndo}
          size="sm"
          title="Ångra"
          type="button"
          variant="ghost"
        >
          <Undo2 />
        </Button>
      </div>
      <div className="min-h-0 flex-1 p-4">
        <Textarea
          aria-label={`Arbetsmanual för ${documentTitle}`}
          className="h-full min-h-[28rem] resize-none rounded-lg leading-7"
          onChange={handleTextareaChange}
          ref={textareaRef}
          value={value}
        />
      </div>
    </div>
  );
}
