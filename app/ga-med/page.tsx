"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

function JoinForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const [done, setDone] = useState(false);

  async function acceptInvite(userId: string) {
    const supabase = createClient();
    const { data: invite, error: inviteError } = await supabase
      .from("organization_invites")
      .select("id, organization_id, role, accepted_at")
      .eq("token", token)
      .maybeSingle();
    if (inviteError || !invite || invite.accepted_at) {
      throw new Error("Inbjudan är ogiltig eller redan använd.");
    }
    const { error: memberError } = await supabase.from("organization_members").insert({
      organization_id: invite.organization_id,
      user_id: userId,
      role: invite.role,
    });
    if (memberError && !/duplicate|unique/i.test(memberError.message)) {
      throw new Error(memberError.message);
    }
    await supabase
      .from("organization_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id);
  }

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      setLoggedIn(Boolean(user));
      if (!user || !token) return;
      setLoading(true);
      try {
        await acceptInvite(user.id);
        setDone(true);
        router.push("/");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kunde inte gå med.");
        setLoading(false);
      }
    });
  }, [token, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("full-name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const supabase = createClient();

    const { data: existing } = await supabase.auth.getUser();
    let userId = existing.user?.id ?? null;

    if (!userId) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (signUpError || !signUpData.user) {
        setLoading(false);
        setError(signUpError?.message ?? "Kunde inte skapa konto");
        return;
      }
      if (!signUpData.session) {
        setLoading(false);
        setError("Bekräfta e-post eller stäng av e-postbekräftelse i Supabase, logga sedan in och öppna länken igen.");
        return;
      }
      userId = signUpData.user.id;
    }

    try {
      await acceptInvite(userId);
      router.push("/");
      router.refresh();
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Kunde inte gå med.");
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-muted-foreground">
        Saknar inbjudningstoken. Be administratören om en ny länk.
      </p>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {loggedIn ? (
        <p className="text-sm text-muted-foreground">
          {done || loading ? "Du går med i företaget…" : "Du är inloggad. Klicka för att gå med."}
        </p>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="full-name">Namn</Label>
            <Input id="full-name" name="full-name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-post</Label>
            <Input id="email" name="email" required type="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Lösenord</Label>
            <Input id="password" minLength={6} name="password" required type="password" />
          </div>
        </>
      )}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button className="w-full" disabled={loading} type="submit">
        {loading ? "Ansluter…" : "Gå med i företaget"}
      </Button>
    </form>
  );
}

export default function GaMedPage() {
  return (
    <AuthShell description="Du har blivit inbjuden till ett företagskonto." title="Gå med">
      <Card>
        <CardContent className="pt-6">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Laddar…</p>}>
            <JoinForm />
          </Suspense>
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        Har du redan konto? <Link className="text-primary hover:underline" href="/login">Logga in</Link>
      </p>
    </AuthShell>
  );
}
