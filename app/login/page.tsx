"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { swedishAuthError } from "@/lib/auth/ensure-company";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(swedishAuthError(signInError.message));
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <AuthShell
      contentClassName="max-w-sm"
      description="Använd det företagskonto du skapat här. Inte det gamla Quality Works-programmet."
      title="Logga in"
    >
      <Card>
        <CardContent className="space-y-5 pt-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Lösenord</Label>
                <Link
                  className="text-xs font-medium text-primary hover:underline"
                  href="/glomt-losenord"
                >
                  Glömt lösenord?
                </Link>
              </div>
              <Input
                autoComplete="current-password"
                id="password"
                name="password"
                required
                type="password"
              />
            </div>
            {error ? (
              <div className="space-y-2" role="alert">
                <p className="text-sm text-destructive">{error}</p>
                <p className="text-sm text-muted-foreground">
                  Har du inget konto här än?{" "}
                  <Link className="font-medium text-primary hover:underline" href="/skapa-konto">
                    Skapa företagskonto
                  </Link>
                </p>
              </div>
            ) : null}
            <Button className="w-full" disabled={loading} size="lg" type="submit">
              {loading ? "Loggar in…" : "Logga in"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        Första gången?{" "}
        <Link className="font-medium text-primary hover:underline" href="/skapa-konto">
          Skapa företagskonto
        </Link>
      </p>
    </AuthShell>
  );
}
