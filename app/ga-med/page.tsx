"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("full-name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    const supabase = createClient();
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

    const { data: invite, error: inviteError } = await supabase
      .from("organization_invites")
      .select("id, organization_id, role, accepted_at")
      .eq("token", token)
      .maybeSingle();

    if (inviteError || !invite || invite.accepted_at) {
      setLoading(false);
      setError("Inbjudan är ogiltig eller redan använd.");
      return;
    }

    const { error: memberError } = await supabase.from("organization_members").insert({
      organization_id: invite.organization_id,
      user_id: signUpData.user.id,
      role: invite.role,
    });
    if (memberError) {
      setLoading(false);
      setError(memberError.message);
      return;
    }

    await supabase
      .from("organization_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    setLoading(false);
    router.push("/");
    router.refresh();
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
