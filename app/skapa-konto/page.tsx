"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

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

const branschAlternativ = [
  { value: "bygg", label: "Bygg och anläggning" },
  { value: "tillverkning", label: "Tillverkning" },
  { value: "handel", label: "Handel och detaljhandel" },
  { value: "tjanster", label: "Tjänster och konsulting" },
  { value: "ovrigt", label: "Övrigt" },
];

export default function SkapaKontoPage() {
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/");
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
                  <Select name="industry">
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
                  />
                </div>
              </div>
            </fieldset>

            <div className="space-y-3">
              <Button className="w-full" size="lg" type="submit">
                Skapa företagskonto
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
