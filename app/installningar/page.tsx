"use client";

import { useEffect, useState, type FormEvent } from "react";

import { ModuleShell } from "@/components/common/module-shell";
import { ThemeToggle } from "@/components/common/theme-toggle";
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
import { ROLE_LABEL, type AppRole } from "@/lib/features";
import { createClient } from "@/lib/supabase/client";

interface MemberRow {
  id: string;
  role: AppRole;
  user_id: string;
  profiles?: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null;
}

function profileOf(member: MemberRow) {
  const row = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
  return {
    name: row?.full_name || row?.email || member.user_id,
    email: row?.email || "",
  };
}

export default function InstallningarPage() {
  const { session, refresh } = useOrgSession();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [myName, setMyName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("viewer");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"ok" | "fel">("ok");

  function notice(text: string, next: "ok" | "fel" = "ok") {
    setMessage(text);
    setTone(next);
  }

  async function loadMembers(organizationId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("organization_members")
      .select("id, role, user_id, profiles ( full_name, email )")
      .eq("organization_id", organizationId);
    setMembers((data as MemberRow[]) ?? []);
  }

  useEffect(() => {
    if (!session?.organizationId) return;
    setCompanyName(session.organizationName || "");
    setMyName(session.fullName || "");
    void loadMembers(session.organizationId);
  }, [session?.organizationId, session?.organizationName, session?.fullName]);

  async function saveCompany(event: FormEvent) {
    event.preventDefault();
    if (!session?.organizationId || !companyName.trim()) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("organizations")
      .update({ name: companyName.trim() })
      .eq("id", session.organizationId);
    if (error) {
      notice("Kunde inte spara företaget. Kör schema_members_admin.sql i Supabase.", "fel");
      return;
    }
    await refresh();
    notice("Företagsnamn sparat.");
  }

  async function saveMyName(event: FormEvent) {
    event.preventDefault();
    if (!session?.userId) return;
    const supabase = createClient();
    const { error } = await supabase.from("profiles").upsert({
      id: session.userId,
      full_name: myName.trim() || null,
    });
    if (error) {
      notice(error.message, "fel");
      return;
    }
    await supabase.auth.updateUser({ data: { full_name: myName.trim() } });
    await refresh();
    notice("Namnet är sparat.");
  }

  async function changeRole(memberId: string, nextRole: AppRole) {
    const supabase = createClient();
    const { error } = await supabase.from("organization_members").update({ role: nextRole }).eq("id", memberId);
    if (error) {
      notice("Kunde inte byta roll. Kör schema_members_admin.sql i Supabase.", "fel");
      return;
    }
    setMembers((current) => current.map((item) => (item.id === memberId ? { ...item, role: nextRole } : item)));
    notice("Rollen är ändrad.");
  }

  async function removeMember(member: MemberRow) {
    if (member.user_id === session?.userId) {
      notice("Du kan inte ta bort dig själv.", "fel");
      return;
    }
    if (!window.confirm(`Ta bort ${profileOf(member).name} från företaget?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("organization_members").delete().eq("id", member.id);
    if (error) {
      notice("Kunde inte ta bort. Kör schema_members_admin.sql i Supabase.", "fel");
      return;
    }
    setMembers((current) => current.filter((item) => item.id !== member.id));
    notice("Personen är borttagen.");
  }

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
      notice(error?.message ?? "Kunde inte skapa inbjudan. Kör schema_phase_a.sql.", "fel");
      return;
    }
    const url = `${window.location.origin}/ga-med?token=${data.token}`;
    setInviteUrl(url);
    setInviteEmail(email.trim());
    notice("Inbjudan skapad.");
    setEmail("");
  }

  if (session && session.role !== "admin") {
    return (
      <ModuleShell
        comingSoonPoints={["Be administratören om åtkomst"]}
        description="Endast administratörer kan hantera användare."
        title="Inställningar"
      />
    );
  }

  const mailHref = inviteUrl
    ? `mailto:${encodeURIComponent(inviteEmail)}?subject=${encodeURIComponent(`Inbjudan till ${session?.organizationName ?? "Quality Works"}`)}&body=${encodeURIComponent(`Du är inbjuden till ledningssystemet.\n\nÖppna länken och skapa ditt konto:\n${inviteUrl}\n`)}`
    : null;

  return (
    <ModuleShell description="Företag, användare, roller och hur programmet ser ut." title="Inställningar">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-1 py-2">
        <section className="rounded-2xl border bg-card p-5 shadow-token-sm">
          <h3 className="text-base font-bold">Företag</h3>
          <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(event) => void saveCompany(event)}>
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="company-name">Företagsnamn</Label>
              <Input id="company-name" onChange={(event) => setCompanyName(event.target.value)} value={companyName} />
            </div>
            <Button type="submit">Spara</Button>
          </form>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-token-sm">
          <h3 className="text-base font-bold">Mitt konto</h3>
          <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(event) => void saveMyName(event)}>
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="my-name">Namn</Label>
              <Input id="my-name" onChange={(event) => setMyName(event.target.value)} value={myName} />
            </div>
            <Button type="submit">Spara</Button>
          </form>
          <p className="mt-3 text-sm text-muted-foreground">Lösenord byter du via Glömt lösenord på inloggningen, eller när du är inloggad under Nytt lösenord-länken i mejlet.</p>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-token-sm">
          <h3 className="text-base font-bold">Utseende</h3>
          <p className="mt-1 text-sm text-muted-foreground">Ljust, mörkt eller hög kontrast.</p>
          <div className="mt-4">
            <ThemeToggle />
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-token-sm">
          <h3 className="text-base font-bold">Användare</h3>
          <ul className="mt-4 flex flex-col gap-3">
            {members.map((member) => {
              const profile = profileOf(member);
              return (
                <li className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center" key={member.id}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{profile.name}</p>
                    {profile.email ? <p className="truncate text-xs text-muted-foreground">{profile.email}</p> : null}
                  </div>
                  <Select onValueChange={(value) => void changeRole(member.id, value as AppRole)} value={member.role}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">{ROLE_LABEL.viewer}</SelectItem>
                      <SelectItem value="editor">{ROLE_LABEL.editor}</SelectItem>
                      <SelectItem value="admin">{ROLE_LABEL.admin}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    disabled={member.user_id === session?.userId}
                    onClick={() => void removeMember(member)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Ta bort
                  </Button>
                </li>
              );
            })}
            {members.length === 0 ? <li className="text-sm text-muted-foreground">Inga medlemmar hittades ännu.</li> : null}
          </ul>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-token-sm">
          <h3 className="text-base font-bold">Bjud in användare</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Skapar en länk. Personen skapar eget lösenord. Du väljer roll.
          </p>
          <form className="mt-4 flex flex-col gap-4" onSubmit={(event) => void handleInvite(event)}>
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
            <Button type="submit">Skapa inbjudan</Button>
          </form>
          {message ? (
            <p className={`mt-3 text-sm ${tone === "fel" ? "text-destructive" : "text-muted-foreground"}`}>{message}</p>
          ) : null}
          {inviteUrl ? (
            <div className="mt-3 flex flex-col gap-2">
              <p className="break-all rounded-md bg-muted p-3 text-xs">{inviteUrl}</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void navigator.clipboard.writeText(inviteUrl)} size="sm" type="button" variant="outline">
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
