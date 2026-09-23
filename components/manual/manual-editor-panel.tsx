"use client";

import { useEffect, useRef, useState } from "react";

import type { ManualAttachment } from "@/types/domain";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";

import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  FileDown,
  Highlighter,
  ImagePlus,
  Italic,
  Link,
  List,
  ListOrdered,
  Paperclip,
  Printer,
  Redo2,
  Strikethrough,
  Table2,
  Underline,
  Undo2,
  Upload,
} from "lucide-react";

import { DocumentPaperHeader } from "@/components/manual/document-paper-header";
import { downloadHtmlAsFile, printIfContent } from "@/lib/export-document";
import { cn } from "@/lib/utils";

function readLocalImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ManualEditorPanelProps {
  companyName: string;
  documentCode: string;
  documentTitle: string;
  issuer?: string;
  edition: number;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onPublish: () => void;
  saved: boolean;
  saveStatus: "sparar" | "sparad" | "osparad" | "fel";
  editable?: boolean;
  canExport?: boolean;
  attachments: ManualAttachment[];
  onAddAttachment: () => void;
  onUploadImage?: (file: File) => Promise<string | null>;
  onRemoveAttachment: (attachmentId: string) => void;
  onDownloadAttachment: (attachment: ManualAttachment) => void;
}

export function ManualEditorPanel({
  companyName,
  documentCode,
  documentTitle,
  issuer,
  edition,
  value,
  onChange,
  onSave,
  onPublish,
  saveStatus,
  editable = true,
  canExport = false,
  attachments,
  onAddAttachment,
  onUploadImage,
  onRemoveAttachment,
  onDownloadAttachment,
}: ManualEditorPanelProps) {
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const lastEmitted = useRef(value);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);
  const uploadImageRef = useRef(onUploadImage);
  uploadImageRef.current = onUploadImage;

  const insertImages = async (files: File[]) => {
    const images = files.filter((file) => file.type.startsWith("image/"));
    const current = editorRef.current;
    if (!current || !images.length) return;
    for (const file of images) {
      const src = uploadImageRef.current ? await uploadImageRef.current(file) : await readLocalImage(file);
      if (!src) continue;
      current.chain().focus().setImage({ src, alt: file.name }).run();
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      ImageExtension.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({
        placeholder: "Skriv hur ni gör.",
        emptyEditorClass: "is-editor-empty",
      }),
      LinkExtension.configure({ openOnClick: false, autolink: true }),
      TextStyleKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": `Arbetsmanual för ${documentTitle}`,
        class: "min-h-[36rem] px-6 pb-10 pt-4 font-serif text-base leading-8",
      },
      handlePaste: (_view, event) => {
        const files = event.clipboardData?.files;
        if (!files?.length) return false;
        const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
        if (!images.length) return false;
        void insertImages(images);
        return true;
      },
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
        if (!images.length) return false;
        event.preventDefault();
        void insertImages(images);
        return true;
      },
    },
    onUpdate: ({ editor: nextEditor }) => {
      const html = nextEditor.getHTML();
      lastEmitted.current = html;
      onChange(html);
    },
  });
  editorRef.current = editor;

  const [, setTick] = useState(0);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!editor) return;
    const ping = () => setTick((n) => n + 1);
    const onFocus = () => setFocused(true);
    const onBlur = () => setFocused(false);
    editor.on("selectionUpdate", ping);
    editor.on("transaction", ping);
    editor.on("focus", onFocus);
    editor.on("blur", onBlur);
    return () => {
      editor.off("selectionUpdate", ping);
      editor.off("transaction", ping);
      editor.off("focus", onFocus);
      editor.off("blur", onBlur);
    };
  }, [editor]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!editor) return;
    if (value === lastEmitted.current) return;
    if (editor.isFocused) return;
    lastEmitted.current = value;
    editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
  }, [editor, value]);

  const insertLink = () => {
    if (!editor) return;
    const url = window.prompt("Ange URL", "https://");
    if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const toolbarButtonClass = "size-8 p-0";
  const statusText =
    saveStatus === "sparar"
      ? "Sparar…"
      : saveStatus === "fel"
        ? "Kunde inte spara"
        : saveStatus === "sparad"
          ? "Sparad"
          : "Osparat";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[radial-gradient(1200px_600px_at_50%_-10%,hsl(190_40%_94%),transparent)] bg-muted/40">
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b bg-card px-3 py-2">
        <Button aria-label="Ångra" className={toolbarButtonClass} disabled={!editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()} size="sm" title="Ångra" type="button" variant="ghost"><Undo2 /></Button>
        <Button aria-label="Gör om" className={toolbarButtonClass} disabled={!editor?.can().redo()} onClick={() => editor?.chain().focus().redo().run()} size="sm" title="Gör om" type="button" variant="ghost"><Redo2 /></Button>
        <select
          aria-label="Rubrik"
          className="h-8 rounded-lg border-0 bg-muted/70 px-2 text-xs"
          disabled={!editable}
          onChange={(event) => {
            const value = event.target.value;
            if (!editor) return;
            if (value === "p") editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: Number(value) as 1 | 2 | 3 }).run();
          }}
          value={editor?.isActive("heading", { level: 1 }) ? "1" : editor?.isActive("heading", { level: 2 }) ? "2" : editor?.isActive("heading", { level: 3 }) ? "3" : "p"}
        >
          <option value="p">Brödtext</option>
          <option value="1">Rubrik 1</option>
          <option value="2">Rubrik 2</option>
          <option value="3">Rubrik 3</option>
        </select>
        <select
          aria-label="Typsnitt"
          className="h-8 max-w-32 rounded-lg border-0 bg-muted/70 px-2 text-xs"
          disabled={!editable}
          onChange={(event) => {
            const family = event.target.value;
            if (family === "inherit") editor?.chain().focus().unsetFontFamily().run();
            else editor?.chain().focus().setFontFamily(family).run();
          }}
          value={(editor?.getAttributes("textStyle").fontFamily as string | undefined) || "inherit"}
        >
          <option value="inherit">Typsnitt</option>
          <option value="Georgia, serif">Georgia</option>
          <option value='"Times New Roman", Times, serif'>Times</option>
          <option value="Inter, sans-serif">Inter</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="Calibri, sans-serif">Calibri</option>
        </select>
        <select
          aria-label="Textstorlek"
          className="h-8 rounded-lg border-0 bg-muted/70 px-2 text-xs"
          disabled={!editable}
          onChange={(event) => {
            const size = event.target.value;
            if (size === "inherit") editor?.chain().focus().unsetFontSize().run();
            else editor?.chain().focus().setFontSize(size).run();
          }}
          value={(editor?.getAttributes("textStyle").fontSize as string | undefined) || "inherit"}
        >
          <option value="inherit">Storlek</option>
          <option value="12px">12</option>
          <option value="14px">14</option>
          <option value="16px">16</option>
          <option value="18px">18</option>
          <option value="24px">24</option>
          <option value="32px">32</option>
        </select>
        <Button aria-label="Fetstil" className={toolbarButtonClass} onClick={() => editor?.chain().focus().toggleBold().run()} size="sm" title="Fetstil" type="button" variant={editor?.isActive("bold") ? "secondary" : "ghost"}><Bold /></Button>
        <Button aria-label="Kursiv" className={toolbarButtonClass} onClick={() => editor?.chain().focus().toggleItalic().run()} size="sm" title="Kursiv" type="button" variant={editor?.isActive("italic") ? "secondary" : "ghost"}><Italic /></Button>
        <Button aria-label="Understruken" className={toolbarButtonClass} onClick={() => editor?.chain().focus().toggleUnderline().run()} size="sm" title="Understruken" type="button" variant={editor?.isActive("underline") ? "secondary" : "ghost"}><Underline /></Button>
        <Button aria-label="Genomstruken" className={toolbarButtonClass} onClick={() => editor?.chain().focus().toggleStrike().run()} size="sm" title="Genomstruken" type="button" variant={editor?.isActive("strike") ? "secondary" : "ghost"}><Strikethrough /></Button>
        <label className="inline-flex size-8 items-center justify-center" title="Textfärg">
          <span className="sr-only">Textfärg</span>
          <input
            aria-label="Textfärg"
            className="size-6 cursor-pointer rounded-full border-0 bg-transparent"
            disabled={!editable}
            onChange={(event) => editor?.chain().focus().setColor(event.target.value).run()}
            type="color"
            value={(editor?.getAttributes("textStyle").color as string | undefined) || "#111111"}
          />
        </label>
        <Button aria-label="Markera" className={toolbarButtonClass} onClick={() => editor?.chain().focus().toggleHighlight().run()} size="sm" title="Markera" type="button" variant={editor?.isActive("highlight") ? "secondary" : "ghost"}><Highlighter /></Button>
        <Button aria-label="Vänsterställd" className={toolbarButtonClass} onClick={() => editor?.chain().focus().setTextAlign("left").run()} size="sm" title="Vänsterställd" type="button" variant={editor?.isActive({ textAlign: "left" }) ? "secondary" : "ghost"}><AlignLeft /></Button>
        <Button aria-label="Centrerad" className={toolbarButtonClass} onClick={() => editor?.chain().focus().setTextAlign("center").run()} size="sm" title="Centrerad" type="button" variant={editor?.isActive({ textAlign: "center" }) ? "secondary" : "ghost"}><AlignCenter /></Button>
        <Button aria-label="Högerställd" className={toolbarButtonClass} onClick={() => editor?.chain().focus().setTextAlign("right").run()} size="sm" title="Högerställd" type="button" variant={editor?.isActive({ textAlign: "right" }) ? "secondary" : "ghost"}><AlignRight /></Button>
        <Button aria-label="Justera" className={toolbarButtonClass} onClick={() => editor?.chain().focus().setTextAlign("justify").run()} size="sm" title="Justera" type="button" variant={editor?.isActive({ textAlign: "justify" }) ? "secondary" : "ghost"}><AlignJustify /></Button>
        <Button aria-label="Punktlista" className={toolbarButtonClass} onClick={() => editor?.chain().focus().toggleBulletList().run()} size="sm" title="Punktlista" type="button" variant={editor?.isActive("bulletList") ? "secondary" : "ghost"}><List /></Button>
        <Button aria-label="Numrerad lista" className={toolbarButtonClass} onClick={() => editor?.chain().focus().toggleOrderedList().run()} size="sm" title="Numrerad lista" type="button" variant={editor?.isActive("orderedList") ? "secondary" : "ghost"}><ListOrdered /></Button>
        <Button aria-label="Infoga tabell" className={toolbarButtonClass} onClick={() => editor?.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()} size="sm" title="Infoga tabell" type="button" variant="ghost"><Table2 /></Button>
        <Button aria-label="Infoga bild" className={toolbarButtonClass} onClick={() => imageInputRef.current?.click()} size="sm" title="Infoga bild" type="button" variant="ghost"><ImagePlus /></Button>
        <Button aria-label="Infoga länk" className={toolbarButtonClass} onClick={insertLink} size="sm" title="Infoga länk" type="button" variant="ghost"><Link /></Button>
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
              <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
                <div>
                  <p className="font-medium">Dokumentbilagor</p>
                  <p className="text-sm text-muted-foreground">Filer som hör till bladet, inte till brödtexten.</p>
                </div>
                <Button disabled={!editable} onClick={onAddAttachment} size="sm" variant="outline">
                  <Upload data-icon="inline-start" />
                  Ladda upp
                </Button>
              </div>
              {attachments.length === 0 ? (
                <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center">
                  <Paperclip className="size-5 text-muted-foreground" />
                  <p className="font-medium">Inga bilagor ännu</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {attachments.map((attachment) => (
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border p-3" key={attachment.id}>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {attachment.size} · {attachment.type}
                        </p>
                      </div>
                      <Button onClick={() => onDownloadAttachment(attachment)} size="sm" variant="outline">
                        Ladda ner
                      </Button>
                      <Button onClick={() => onRemoveAttachment(attachment.id)} size="sm" variant="ghost">
                        Ta bort
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        {canExport ? (
          <Button
            aria-label="Öppna i Word"
            className={toolbarButtonClass}
            onClick={() =>
              downloadHtmlAsFile(
                `${documentCode} ${documentTitle}.doc`,
                `${documentCode} ${documentTitle}`,
                companyName,
                value,
                "Arbetsmanual – utkast",
              )
            }
            size="sm"
            title="Öppna i Word"
            type="button"
            variant="ghost"
          >
            <FileDown />
          </Button>
        ) : null}
        <Button aria-label="Skriv ut" className={toolbarButtonClass} onClick={() => printIfContent(value)} size="sm" title="Skriv ut" type="button" variant="ghost"><Printer /></Button>
        <span className="ml-auto text-xs font-medium text-muted-foreground" aria-live="polite">
          {statusText}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-muted/30 p-4 lg:p-8">
        <div className={cn("document-paper is-draft mx-auto min-h-[42rem] max-w-[210mm]", focused && "is-writing")} data-tour="papper">
          <DocumentPaperHeader
            companyName={companyName}
            documentCode={documentCode}
            documentTitle={documentTitle}
            edition={edition}
            issuer={issuer}
            statusLabel="Arbetsmanual – du kan ändra"
          />
          <div
            onClick={() => editor?.commands.focus()}
            onDragOver={(event) => {
              if (event.dataTransfer.types.includes("Files")) event.preventDefault();
            }}
            onDrop={(event) => {
              const files = Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith("image/"));
              if (!files.length) return;
              event.preventDefault();
              void insertImages(files);
            }}
            onKeyDown={() => undefined}
            role="presentation"
          >
            <EditorContent className="manual-tiptap-editor" editor={editor} />
          </div>
          <footer className="border-t px-6 py-3 text-xs text-muted-foreground">
            Utkast – inte original
          </footer>
        </div>
      </div>
      <input
        accept="image/*"
        className="hidden"
        multiple
        onChange={(event) => {
          void insertImages(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
        ref={imageInputRef}
        type="file"
      />
    </div>
  );
}
