"use client";

import { useEffect, useState, type FormEvent } from "react";

import { ModuleShell } from "@/components/common/module-shell";
import { SoundToggle } from "@/components/common/sound-toggle";
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
import { InviteForm } from "@/components/org/invite-form";
import { PlanGrid } from "@/components/billing/plan-grid";
import { ROLE_LABEL, type AppRole } from "@/lib/features";
import { planOf, type PlanId } from "@/lib/billing/plans";
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

  async function choosePlan(id: PlanId) {
    if (!session?.organizationId) return;
    const supabase = createClient();
    const { error } = await supabase.from("organizations").update({ plan: id }).eq("id", session.organizationId);
    if (error) {
      notice("Kunde inte spara paketet. Kör schema_plan.sql i Supabase.", "fel");
      return;
    }
    await refresh();
    notice(`${planOf(id).name} är valt.`);
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

  return (
    <ModuleShell description="Företag, användare, roller och hur programmet ser ut." title="Inställningar">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-1 py-2">
        {message ? (
          <p className={`text-sm ${tone === "fel" ? "text-destructive" : "text-muted-foreground"}`}>{message}</p>
        ) : null}
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
          <p className="mt-1 text-sm text-muted-foreground">Ljust eller mörkt. Knappljudet är svagt. Du kan stänga av det.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <ThemeToggle />
            <SoundToggle />
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
          <h3 className="text-base font-bold">Paket</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Ett pris per företag och år. Gratis räcker för Manualen. Betalning i programmet kommer snart – du kan välja paket här redan nu.
          </p>
          <div className="mt-4">
            <PlanGrid current={session?.plan} onChoose={(id) => void choosePlan(id)} />
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-token-sm">
          <h3 className="text-base font-bold">Bjud in användare</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {planOf(session?.plan).seats} platser i {planOf(session?.plan).name}. Nu är {members.length} med.
          </p>
          <div className="mt-4">
            {members.length >= planOf(session?.plan).seats ? (
              <p className="text-sm">
                Inga platser kvar. Välj Small, Standard eller Pro ovan.
              </p>
            ) : session?.organizationId && session.userId ? (
              <InviteForm
                organizationId={session.organizationId}
                organizationName={session.organizationName}
                userId={session.userId}
              />
            ) : null}
          </div>
        </section>
      </div>
    </ModuleShell>
  );
}
