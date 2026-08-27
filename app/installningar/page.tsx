"use client";

import { useEffect, useState, type FormEvent } from "react";

import { ModuleShell } from "@/components/common/module-shell";
import { useOrgSession } from "@/components/providers/org-provider";
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
import { createClient } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/features";

interface MemberRow {
  id: string;
  role: AppRole;
  user_id: string;
  profiles?: { full_name: string | null; email: string | null } | null;
}

export default function InstallningarPage() {
  const { session } = useOrgSession();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("viewer");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.organizationId) return;
    const supabase = createClient();
    void supabase
      .from("organization_members")
      .select("id, role, user_id, profiles ( full_name, email )")
      .eq("organization_id", session.organizationId)
      .then(({ data }) => setMembers((data as MemberRow[]) ?? []));
  }, [session?.organizationId]);

  async function handleInvite(event: FormEvent) {
    event.preventDefault();
    if (!session?.organizationId || !email.trim()) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("organization_invites")
      .insert({
        organization_id: session.organizationId,
        email: email.trim(),
        role,
        invited_by: session.userId,
      })
      .select("token")
      .single();
    if (error || !data) {
      setMessage(error?.message ?? "Kunde inte skapa inbjudan. Kör schema_phase_a.sql.");
      return;
    }
    const url = `${window.location.origin}/ga-med?token=${data.token}`;
    setInviteUrl(url);
    setInviteEmail(email.trim());
    setMessage("Inbjudan skapad.");
    setEmail("");
  }

  if (session && session.role !== "admin") {
    return (
      <ModuleShell
        title="Inställningar"
        description="Endast administratörer kan hantera användare."
        comingSoonPoints={["Be administratören om åtkomst"]}
      />
    );
  }

  const mailHref = inviteUrl
    ? `mailto:${encodeURIComponent(inviteEmail)}?subject=${encodeURIComponent(`Inbjudan till ${session?.organizationName ?? "Quality Works"}`)}&body=${encodeURIComponent(`Du är inbjuden till ledningssystemet.\n\nÖppna länken och skapa ditt konto:\n${inviteUrl}\n`)}
    : null;

  return (
    <ModuleShell title="Inställningar" description="Företag, användare och behörigheter.">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-1 py-2">
        <section className="rounded-xl border bg-card p-5 shadow-token-xs">
          <h3 className="text-base font-semibold">Företag</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {session?.organizationName || "Inget företag kopplat"}
          </p>
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-token-xs">
          <h3 className="text-base font-semibold">Användare</h3>
          <ul className="mt-4 flex flex-col gap-3">
            {members.map((member) => (
              <li className="flex items-center justify-between gap-3 text-sm" key={member.id}>
                <span>
                  {member.profiles?.full_name || member.profiles?.email || member.user_id}
                </span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                  {member.role}
                </span>
              </li>
            ))}
            {members.length === 0 ? (
              <li className="text-sm text-muted-foreground">Inga medlemmar hittades ännu.</li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-token-xs">
          <h3 className="text-base font-semibold">Bjud in användare</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Skapar en länk. Öppna e-postprogrammet för att skicka den.
          </p>
          <form className="mt-4 flex flex-col gap-4" onSubmit={handleInvite}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invite-email">E-post</Label>
                <Input
                  id="invite-email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </div>
              <div className="space-y-2">
                <Label>Roll</Label>
                <Select onValueChange={(value) => setRole(value as AppRole)} value={role}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Läsare (läsa + kvittera)</SelectItem>
                    <SelectItem value="editor">Redigerare</SelectItem>
                    <SelectItem value="admin">Administratör</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit">Skapa inbjudan</Button>
          </form>
          {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
          {inviteUrl ? (
            <div className="mt-3 flex flex-col gap-2">
              <p className="break-all rounded-md bg-muted p-3 text-xs">{inviteUrl}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => void navigator.clipboard.writeText(inviteUrl)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
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
        </section>
      </div>
    </ModuleShell>
  );
}
