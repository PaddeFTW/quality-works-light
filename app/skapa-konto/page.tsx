"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ensureCompany, swedishAuthError } from "@/lib/auth/ensure-company";
import { createClient } from "@/lib/supabase/client";

const branschAlternativ = [
  { value: "bygg", label: "Bygg och anläggning" },
  { value: "tillverkning", label: "Tillverkning" },
  { value: "handel", label: "Handel och detaljhandel" },
  { value: "tjanster", label: "Tjänster och konsulting" },
  { value: "ovrigt", label: "Övrigt" },
];

export default function SkapaKontoPage() {
  const router = useRouter();
  const [industry, setIndustry] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const companyName = String(form.get("company-name") ?? "").trim();
    const orgNumber = String(form.get("org-number") ?? "").trim();
    const fullName = String(form.get("full-name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirm-password") ?? "");

    if (password !== confirmPassword) {
      setLoading(false);
      setError("Lösenorden matchar inte.");
      return;
    }

    const supabase = createClient();
    let userId: string | undefined;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError || !signInData.user) {
        setLoading(false);
        setError(swedishAuthError(signUpError.message));
        return;
      }
      userId = signInData.user.id;
    } else {
      userId = signUpData.user?.id;
      if (!signUpData.session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError || !signInData.user) {
          setLoading(false);
          setError(
            "Kontot skapades men du är inte inloggad. Stäng av Confirm email i Supabase → Authentication → Providers → Email.",
          );
          return;
        }
        userId = signInData.user.id;
      }
    }

    if (!userId) {
      setLoading(false);
      setError("Kunde inte skapa användare.");
      return;
    }

    try {
      await ensureCompany(supabase, {
        userId,
        fullName,
        companyName,
        orgNumber,
        industry,
      });
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? swedishAuthError(err.message) : "Kunde inte skapa företag.");
      return;
    }

    setLoading(false);
    router.push("/");
    router.refresh();
  }

  return (
    <AuthShell
      contentClassName="max-w-lg"
      description="Skriv företagsnamn, din mejl och ett nytt lösen. Sen är du inne."
      title="Skapa företagskonto"
    >
      <Card>
        <CardContent className="pt-6">
          <form className="space-y-8" onSubmit={handleSubmit}>
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-foreground">Företag</legend>
              <div className="space-y-2">
                <Label htmlFor="company-name">Företagsnamn</Label>
                <Input id="company-name" name="company-name" placeholder="Exempel AB" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="org-number">Organisationsnummer</Label>
                  <Input id="org-number" name="org-number" placeholder="XXXXXX-XXXX" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Bransch</Label>
                  <Select onValueChange={setIndustry} value={industry}>
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Välj bransch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branschAlternativ.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </fieldset>

            <Separator />

            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-foreground">Du</legend>
              <div className="space-y-2">
                <Label htmlFor="full-name">Namn</Label>
                <Input id="full-name" name="full-name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <Input autoComplete="email" id="email" name="email" required type="email" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Nytt lösenord</Label>
                  <Input autoComplete="new-password" id="password" minLength={6} name="password" required type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Samma lösenord igen</Label>
                  <Input autoComplete="new-password" id="confirm-password" minLength={6} name="confirm-password" required type="password" />
                </div>
              </div>
            </fieldset>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <Button className="w-full" disabled={loading} size="lg" type="submit">
              {loading ? "Skapar konto…" : "Skapa konto och logga in"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        Har du redan konto?{" "}
        <Link className="font-medium text-primary hover:underline" href="/login">
          Logga in
        </Link>
      </p>
    </AuthShell>
  );
}
