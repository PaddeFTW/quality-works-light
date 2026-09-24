"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

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

import { FlowCanvas, FLOW_TOOLS } from "@/components/manual/flow-canvas";
import { DocumentPaperHeader } from "@/components/manual/document-paper-header";
import { LinkPicker } from "@/components/manual/link-picker";
import { packDocument, pageLabel, printPackedDocument, unpackDocument, type DocLink, type FlowDoc, type FlowShape, type PageFormat } from "@/lib/manual/document-pack";
import { downloadHtmlAsFile } from "@/lib/export-document";
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
  documents?: { id: string; label: string }[];
  onFollowLink?: (href: string) => void;
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
  documents = [],
  onFollowLink,
}: ManualEditorPanelProps) {
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const initial = unpackDocument(value);
  const [page, setPage] = useState<PageFormat>(initial.page);
  const [flow, setFlow] = useState<FlowDoc>(initial.flow);
  const [surface, setSurface] = useState<"text" | "flow">(initial.page === "landscape" ? "flow" : "text");
  const [zoom, setZoom] = useState(1);
  const [zoomChoice, setZoomChoice] = useState("1");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkShape, setLinkShape] = useState<FlowShape | null>(null);
  const [flowTool, setFlowTool] = useState<(typeof FLOW_TOOLS)[number]["id"]>("select");
  const [undoSignal, setUndoSignal] = useState(0);
  const [redoSignal, setRedoSignal] = useState(0);
  const [deleteSignal, setDeleteSignal] = useState(0);
  const [linkSignal, setLinkSignal] = useState(0);
  const pageRef = useRef(initial.page);
  const flowRef = useRef(initial.flow);
  const frameRef = useRef<HTMLDivElement>(null);
  pageRef.current = page;
  flowRef.current = flow;
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
    content: unpackDocument(value).html,
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
      const packed = packDocument(html, pageRef.current, flowRef.current);
      lastEmitted.current = packed;
      onChange(packed);
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
    const next = unpackDocument(value);
    setPage(next.page);
    pageRef.current = next.page;
    if (JSON.stringify(next.flow) !== JSON.stringify(flowRef.current)) {
      flowRef.current = next.flow;
      setFlow(next.flow);
    }
    if (!editor) return;
    if (value === lastEmitted.current) return;
    if (editor.isFocused) return;
    lastEmitted.current = value;
    editor.commands.setContent(next.html || "<p></p>", { emitUpdate: false });
  }, [editor, value]);

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    function onWheel(event: WheelEvent) {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      setZoom((current) => Math.min(1.5, Math.max(0.5, current * (event.deltaY < 0 ? 1.1 : 0.9))));
      setZoomChoice("custom");
    }
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  function emitFlow(next: FlowDoc) {
    flowRef.current = next;
    setFlow(next);
    const html = editor?.getHTML() ?? unpackDocument(value).html;
    const packed = packDocument(html, pageRef.current, next);
    lastEmitted.current = packed;
    onChange(packed);
  }

  function follow(link: DocLink) {
    if (link.kind === "web" || link.href.startsWith("http")) {
      window.open(link.href, "_blank", "noopener,noreferrer");
      return;
    }
    onFollowLink?.(link.href);
  }

  const insertLink = () => {
    setLinkShape(null);
    setLinkOpen(true);
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
        <Button aria-label="Ångra" className={toolbarButtonClass} disabled={surface === "text" ? !editor?.can().undo() : false} onClick={() => (surface === "flow" ? setUndoSignal((n) => n + 1) : editor?.chain().focus().undo().run())} size="sm" title="Ångra" type="button" variant="ghost"><Undo2 /></Button>
        <Button aria-label="Gör om" className={toolbarButtonClass} disabled={surface === "text" ? !editor?.can().redo() : false} onClick={() => (surface === "flow" ? setRedoSignal((n) => n + 1) : editor?.chain().focus().redo().run())} size="sm" title="Gör om" type="button" variant="ghost"><Redo2 /></Button>
        <div className={surface === "flow" ? "hidden" : "contents"}>
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
        </div>
        {surface === "flow" ? (
          <>
            {FLOW_TOOLS.map((item) => (
              <Button key={item.id} onClick={() => setFlowTool(item.id)} size="sm" type="button" variant={flowTool === item.id ? "secondary" : "ghost"}>
                {item.label}
              </Button>
            ))}
            <Button onClick={() => setDeleteSignal((n) => n + 1)} size="sm" type="button" variant="ghost">Ta bort</Button>
            <Button onClick={() => { setLinkShape(null); setLinkSignal((n) => n + 1); }} size="sm" type="button" variant="ghost">Länk</Button>
            <Button onClick={() => emitFlow({ ...flowRef.current, snap: !flowRef.current.snap })} size="sm" type="button" variant={flow.snap ? "secondary" : "ghost"}>
              Rutnät {flow.snap ? "på" : "av"}
            </Button>
          </>
        ) : null}
        <div className="flex rounded-lg border bg-muted/40 p-0.5">
          <Button onClick={() => { setSurface("text"); }} size="sm" type="button" variant={surface === "text" ? "default" : "ghost"}>Text</Button>
          <Button onClick={() => { setSurface("flow"); editor?.commands.blur(); }} size="sm" type="button" variant={surface === "flow" ? "default" : "ghost"}>Flöde</Button>
        </div>
        <span className="rounded-md bg-muted px-2 py-1 text-xs">{pageLabel(page)}</span>
        <select
          aria-label="Zoom"
          className="h-8 rounded-lg bg-muted/70 px-2 text-xs"
          onChange={(event) => {
            if (event.target.value === "fit") {
              const frame = frameRef.current;
              if (!frame) return;
              const baseW = page === "landscape" ? 1123 : 794;
              const baseH = page === "landscape" ? 794 : 1123;
              const scale = Math.min((frame.clientWidth - 48) / baseW, (frame.clientHeight - 48) / baseH);
              setZoom(Math.min(1.5, Math.max(0.2, scale)));
              setZoomChoice("fit");
              return;
            }
            setZoomChoice(event.target.value);
            setZoom(Number(event.target.value));
          }}
          value={zoomChoice}
        >
          {zoomChoice === "custom" ? <option value="custom">{Math.round(zoom * 100)} %</option> : null}
          <option value="0.5">50 %</option>
          <option value="0.75">75 %</option>
          <option value="1">100 %</option>
          <option value="1.25">125 %</option>
          <option value="1.5">150 %</option>
          <option value="fit">Anpassa</option>
        </select>
        <span className="text-xs text-muted-foreground">{Math.round(zoom * 100)} %</span>
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
                  <p className="text-sm text-muted-foreground">Filer som hör till dokumentet, inte till brödtexten.</p>
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
                unpackDocument(value).html,
                "Arbetsmanual – inte original",
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
        <Button aria-label="Skriv ut" className={toolbarButtonClass} onClick={() => printPackedDocument(`${documentCode} ${documentTitle}`, value, companyName, "Arbetsmanual")} size="sm" title="Skriv ut" type="button" variant="ghost"><Printer /></Button>
        <span className="ml-auto text-xs font-medium text-muted-foreground" aria-live="polite">
          {statusText}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-muted/30 p-4 lg:p-8" ref={frameRef}>
        <div className="mx-auto" style={{ width: `${(page === "landscape" ? 1123 : 794) * zoom}px` }}>
        <div className={cn("document-paper is-draft origin-top-left", page === "landscape" && "is-landscape", focused && "is-writing")} data-paper data-tour="papper" style={{ width: page === "landscape" ? "297mm" : "210mm", minHeight: page === "landscape" ? "210mm" : "297mm", zoom } as CSSProperties}>
          <DocumentPaperHeader
            companyName={companyName}
            documentCode={documentCode}
            documentTitle={documentTitle}
            edition={edition}
            issuer={issuer}
            statusLabel={`Arbetsmanual – du kan ändra · ${pageLabel(page)}`}
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
            <EditorContent className={cn("manual-tiptap-editor", surface === "flow" && "pointer-events-none opacity-80")} editor={editor} />
          </div>
          {surface === "flow" || flow.shapes.length > 0 ? (
          <FlowCanvas
            deleteSignal={deleteSignal}
            editable={editable && surface === "flow"}
            height={page === "landscape" ? 460 : 360}
            hideBar
            linkSignal={linkSignal}
            onChange={emitFlow}
            onFollow={follow}
            onLink={(shape) => {
              setLinkShape(shape);
              setLinkOpen(true);
            }}
            onToolChange={setFlowTool}
            redoSignal={redoSignal}
            tool={flowTool}
            undoSignal={undoSignal}
            value={flow}
          />
          ) : null}
          <footer className="border-t px-6 py-3 text-xs text-muted-foreground">
            Arbetsmanual – inte original
          </footer>
        </div>
        </div>
      </div>
      <LinkPicker
        attachments={attachments}
        documents={documents}
        onApply={(link) => {
          if (linkShape) {
            emitFlow({ ...flowRef.current, shapes: flowRef.current.shapes.map((shape) => (shape.id === linkShape.id ? { ...shape, link } : shape)) });
            setLinkShape(null);
            return;
          }
          editor?.chain().focus().extendMarkRange("link").setLink({ href: link.href }).run();
        }}
        onOpenChange={setLinkOpen}
        open={linkOpen}
      />
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
