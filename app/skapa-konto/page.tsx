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
import { createClient } from "@/lib/supabase/client";

const branschAlternativ = [
  { value: "bygg", label: "Bygg och anläggning" },
  { value: "tillverkning", label: "Tillverkning" },
  { value: "handel", label: "Handel och detaljhandel" },
  { value: "tjanster", label: "Tjänster och konsulting" },
  { value: "ovrigt", label: "Övrigt" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export default function SkapaKontoPage() {
  const router = useRouter();
  const [industry, setIndustry] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
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

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      setLoading(false);
      setError("Kunde inte skapa användare.");
      return;
    }

    // If email confirmation is required, there may be no session yet.
    if (!signUpData.session) {
      setLoading(false);
      setInfo(
        "Kontot är skapat. Bekräfta e-posten (eller stäng av e-postbekräftelse i Supabase Auth för utveckling) och logga sedan in.",
      );
      return;
    }

    const baseSlug = slugify(companyName) || "foretag";
    const slug = `${baseSlug}-${userId.slice(0, 6)}`;

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: companyName,
        org_number: orgNumber || null,
        industry: industry || null,
        slug,
      })
      .select("id")
      .single();

    if (orgError || !org) {
      setLoading(false);
      setError(orgError?.message ?? "Kunde inte skapa företag.");
      return;
    }

    const { error: memberError } = await supabase.from("organization_members").insert({
      organization_id: org.id,
      user_id: userId,
      role: "admin",
    });

    if (memberError) {
      setLoading(false);
      setError(memberError.message);
      return;
    }

    await supabase.from("manuals").insert({
      organization_id: org.id,
      name: "Kvalitetsmanual",
      issuer: fullName,
      header_text: `Kvalitetsmanual – ${companyName}`,
      footer_text: "Internt dokument. Utskrift gäller endast utskriftsdagen.",
    });

    setLoading(false);
    router.push("/");
    router.refresh();
  }

  return (
    <AuthShell
      contentClassName="max-w-lg"
      description="Skapa ett konto för ditt företag och bjud in kollegor senare."
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
                  <Input
                    id="org-number"
                    name="org-number"
                    placeholder="XXXXXX-XXXX"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Bransch</Label>
                  <Select onValueChange={setIndustry} value={industry}>
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Välj bransch (valfritt)" />
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
              <legend className="text-sm font-semibold text-foreground">
                Din användare (blir administratör)
              </legend>
              <div className="space-y-2">
                <Label htmlFor="full-name">Namn</Label>
                <Input id="full-name" name="full-name" placeholder="Förnamn Efternamn" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <Input
                  autoComplete="email"
                  id="email"
                  name="email"
                  placeholder="namn@foretag.se"
                  required
                  type="email"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Lösenord</Label>
                  <Input
                    autoComplete="new-password"
                    id="password"
                    name="password"
                    required
                    type="password"
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Bekräfta lösenord</Label>
                  <Input
                    autoComplete="new-password"
                    id="confirm-password"
                    name="confirm-password"
                    required
                    type="password"
                    minLength={6}
                  />
                </div>
              </div>
            </fieldset>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            {info ? (
              <p className="text-sm text-muted-foreground" role="status">
                {info}
              </p>
            ) : null}

            <div className="space-y-3">
              <Button className="w-full" disabled={loading} size="lg" type="submit">
                {loading ? "Skapar konto…" : "Skapa företagskonto"}
              </Button>
              <p className="text-center text-xs leading-5 text-muted-foreground">
                Du blir automatiskt administratör för företaget.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        Har du redan ett konto?{" "}
        <Link className="font-medium text-primary hover:underline" href="/login">
          Logga in
        </Link>
      </p>
    </AuthShell>
  );
}
