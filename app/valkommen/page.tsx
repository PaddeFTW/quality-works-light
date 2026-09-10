"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrgSession } from "@/components/providers/org-provider";
import { ensureCompany, swedishAuthError } from "@/lib/auth/ensure-company";
import { createClient } from "@/lib/supabase/client";

export default function ValkommenPage() {
  const router = useRouter();
  const { session, refresh } = useOrgSession();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setError(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const companyName = String(form.get("company-name") ?? "").trim();
    try {
      const supabase = createClient();
      await ensureCompany(supabase, {
        userId: session.userId,
        fullName: session.fullName,
        companyName,
      });
      await refresh();
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? swedishAuthError(err.message) : "Kunde inte spara företaget.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      contentClassName="max-w-sm"
      description="Du är inloggad. Skriv bara vad företaget heter."
      title="Vad heter företaget?"
    >
      <Card>
        <CardContent className="pt-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="company-name">Företag</Label>
              <Input autoFocus id="company-name" name="company-name" placeholder="Exempel AB" required />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button className="w-full" disabled={loading || !session} size="lg" type="submit">
              {loading ? "Sparar…" : "Fortsätt"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
