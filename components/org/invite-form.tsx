"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABEL, type AppRole } from "@/lib/features";
import { sendOrgInvite } from "@/lib/org/invite";

export function InviteForm({
  organizationId,
  userId,
  organizationName,
}: {
  organizationId: string;
  userId: string;
  organizationName?: string;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("viewer");
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [invitedEmail, setInvitedEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"ok" | "fel">("ok");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const trimmed = email.trim();
    const result = await sendOrgInvite({
      organizationId,
      userId,
      email: trimmed,
      role,
      origin: window.location.origin,
    });
    setBusy(false);
    if (!result.url) {
      setTone("fel");
      setMessage(result.error ?? "Kunde inte skapa inbjudan.");
      return;
    }
    setUrl(result.url);
    setInvitedEmail(trimmed);
    setEmail("");
    if (!result.mailed) {
      setTone("fel");
      setMessage("Länken skapades men mejlet gick inte. Kopiera länken och skicka den själv.");
      return;
    }
    setTone("ok");
    setMessage(`Mejl skickat till ${trimmed}. Hen klickar i mejlet och går med.`);
  }

  const mailHref = url
    ? `mailto:${encodeURIComponent(invitedEmail)}?subject=${encodeURIComponent(`Inbjudan till ${organizationName ?? "Quality Works"}`)}&body=${encodeURIComponent(`Du är inbjuden till ledningssystemet.\n\nÖppna länken:\n${url}\n`)}`
    : null;

  return (
    <div className="flex flex-col gap-4">
      <form className="flex flex-col gap-4" onSubmit={(event) => void onSubmit(event)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="invite-email">E-post</Label>
            <Input id="invite-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </div>
          <div className="space-y-2">
            <Label>Roll</Label>
            <Select onValueChange={(value) => setRole(value as AppRole)} value={role}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">{ROLE_LABEL.viewer} (läsa)</SelectItem>
                <SelectItem value="editor">{ROLE_LABEL.editor}</SelectItem>
                <SelectItem value="admin">{ROLE_LABEL.admin}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button disabled={busy} type="submit">
          {busy ? "Skickar…" : "Skicka inbjudan"}
        </Button>
      </form>
      {message ? (
        <p className={`text-sm ${tone === "fel" ? "text-destructive" : "text-muted-foreground"}`}>{message}</p>
      ) : null}
      {url ? (
        <div className="flex flex-col gap-2">
          <p className="break-all rounded-md bg-muted p-3 text-xs">{url}</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void navigator.clipboard.writeText(url)} size="sm" type="button" variant="outline">
              Kopiera länk
            </Button>
            {mailHref ? (
              <Button asChild size="sm">
                <a href={mailHref}>Öppna e-post</a>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
