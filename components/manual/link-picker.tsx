"use client";

import { useEffect, useState } from "react";

import type { ManualAttachment } from "@/types/domain";
import type { DocLink, LinkKind } from "@/lib/manual/document-pack";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const KINDS: { id: LinkKind; label: string }[] = [
  { id: "web", label: "Webb" },
  { id: "doc", label: "Dokument i Manualen" },
  { id: "module", label: "Modul i programmet" },
  { id: "mail", label: "E-post" },
  { id: "file", label: "Fil i detta dokument" },
];

const MODULES = [
  { href: "/", label: "Start" },
  { href: "/arshjul", label: "Årshjul" },
  { href: "/avvikelse", label: "Ärenden" },
  { href: "/kompetens", label: "Personal" },
  { href: "/installningar", label: "Inställningar" },
];

export function LinkPicker({
  open,
  documents,
  attachments,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  documents: { id: string; label: string }[];
  attachments: ManualAttachment[];
  onOpenChange: (open: boolean) => void;
  onApply: (link: DocLink) => void;
}) {
  const [kind, setKind] = useState<LinkKind>("web");
  const [web, setWeb] = useState("https://");
  const [docId, setDocId] = useState(documents[0]?.id ?? "");
  const [moduleHref, setModuleHref] = useState("/");
  const [mail, setMail] = useState("");
  const [fileId, setFileId] = useState(attachments[0]?.id ?? "");

  useEffect(() => {
    if (!open) return;
    setDocId((current) => current || documents[0]?.id || "");
    setFileId((current) => current || attachments[0]?.id || "");
  }, [attachments, documents, open]);

  function apply() {
    if (kind === "web") {
      const href = web.trim();
      if (!href || href === "https://") return;
      onApply({ kind, href });
    }
    if (kind === "doc") {
      if (!docId) return;
      onApply({ kind, href: `qwl://doc/${docId}` });
    }
    if (kind === "module") onApply({ kind, href: `qwl://modul${moduleHref}` });
    if (kind === "mail") {
      const address = mail.trim();
      if (!address) return;
      onApply({ kind, href: address.startsWith("mailto:") ? address : `mailto:${address}` });
    }
    if (kind === "file") {
      if (!fileId) return;
      onApply({ kind, href: `qwl://fil/${fileId}` });
    }
    onOpenChange(false);
  }

  const preview =
    kind === "web"
      ? web
      : kind === "doc"
        ? documents.find((item) => item.id === docId)?.label || "saknas"
        : kind === "module"
          ? MODULES.find((item) => item.href === moduleHref)?.label
          : kind === "mail"
            ? mail
            : attachments.find((item) => item.id === fileId)?.name || "saknas";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Länk</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Välj dokument, modul eller webbadress.</p>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((item) => (
            <Button key={item.id} onClick={() => setKind(item.id)} size="sm" type="button" variant={kind === item.id ? "default" : "outline"}>
              {item.label}
            </Button>
          ))}
        </div>
        {kind === "web" ? (
          <div className="space-y-2">
            <Label htmlFor="link-web">Webbadress</Label>
            <Input id="link-web" onChange={(event) => setWeb(event.target.value)} value={web} />
          </div>
        ) : null}
        {kind === "doc" ? (
          <div className="space-y-2">
            <Label htmlFor="link-doc">Dokument</Label>
            <select className="h-10 w-full rounded-xl border bg-background px-3 text-sm" id="link-doc" onChange={(event) => setDocId(event.target.value)} value={docId}>
              {documents.length === 0 ? <option value="">Inget dokument</option> : null}
              {documents.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {kind === "module" ? (
          <div className="space-y-2">
            <Label htmlFor="link-mod">Modul</Label>
            <select className="h-10 w-full rounded-xl border bg-background px-3 text-sm" id="link-mod" onChange={(event) => setModuleHref(event.target.value)} value={moduleHref}>
              {MODULES.map((item) => (
                <option key={item.href} value={item.href}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {kind === "mail" ? (
          <div className="space-y-2">
            <Label htmlFor="link-mail">E-post</Label>
            <Input id="link-mail" onChange={(event) => setMail(event.target.value)} placeholder="namn@foretag.se" value={mail} />
          </div>
        ) : null}
        {kind === "file" ? (
          <div className="space-y-2">
            <Label htmlFor="link-file">Bilaga</Label>
            <select className="h-10 w-full rounded-xl border bg-background px-3 text-sm" id="link-file" onChange={(event) => setFileId(event.target.value)} value={fileId}>
              {attachments.length === 0 ? <option value="">Ingen fil</option> : null}
              {attachments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">Mål: {preview || "—"}</p>
        <div className="flex justify-end gap-2">
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            Avbryt
          </Button>
          <Button onClick={apply} type="button">
            Sätt länk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
