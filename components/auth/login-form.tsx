"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { swedishAuthError } from "@/lib/auth/ensure-company";
import { createClient } from "@/lib/supabase/client";

const EMAIL_KEY = "qw.login.email";

function GoogleMark() {
  return (
    <svg aria-hidden className="size-4" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <svg aria-hidden className="size-4" viewBox="0 0 24 24">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"google" | "azure" | "link" | "password" | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(EMAIL_KEY);
    if (stored) setEmail(stored);
    const queryError = searchParams.get("error");
    if (queryError) setError(swedishAuthError(queryError));
  }, [searchParams]);

  function rememberEmail(value: string) {
    window.localStorage.setItem(EMAIL_KEY, value);
  }

  async function startOAuth(provider: "google" | "azure") {
    setError(null);
    setLoading(provider);
    const supabase = createClient();
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    });
    if (oauthError || !data.url) {
      setLoading(null);
      setError("Den inloggningen är inte påslagen. Använd mejllänken.");
      return;
    }

    const check = await fetch("/api/auth/oauth/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: data.url }),
    });
    if (!check.ok) {
      setLoading(null);
      setError(
        provider === "google"
          ? "Google är inte påslaget i Supabase än. Använd mejllänken."
          : "Microsoft är inte påslaget i Supabase än. Använd mejllänken.",
      );
      return;
    }

    window.location.assign(data.url);
  }

  async function sendLink(event?: FormEvent) {
    event?.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) return;
    rememberEmail(trimmed);
    setLoading("link");
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(null);
    if (otpError) {
      setError(swedishAuthError(otpError.message));
      setSent(false);
      return;
    }
    setSent(true);
  }

  async function signInWithPassword(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const trimmed = email.trim();
    rememberEmail(trimmed);
    setLoading("password");
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password,
    });
    setLoading(null);
    if (signInError) {
      setError(swedishAuthError(signInError.message));
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (sent) {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm font-medium">Kolla mejlen</p>
          <p className="text-sm leading-6 text-muted-foreground">
            En länk är skickad till <span className="font-medium text-foreground">{email}</span>.
            Klicka på den så är du inne. Länken gäller en stund.
          </p>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button asChild className="w-full" variant="outline">
            <a href="https://mail.google.com" rel="noreferrer" target="_blank">
              Öppna mejl
            </a>
          </Button>
          <Button
            className="w-full"
            disabled={loading === "link"}
            onClick={() => void sendLink()}
            type="button"
            variant="ghost"
          >
            {loading === "link" ? "Skickar…" : "Skicka igen"}
          </Button>
          <button
            className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            onClick={() => {
              setSent(false);
              setShowPassword(true);
            }}
            type="button"
          >
            Logga in med lösenord i stället
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <Button
          className="w-full justify-center"
          disabled={Boolean(loading)}
          onClick={() => void startOAuth("google")}
          size="lg"
          type="button"
          variant="outline"
        >
          <GoogleMark />
          Fortsätt med Google
        </Button>
        <Button
          className="w-full justify-center"
          disabled={Boolean(loading)}
          onClick={() => void startOAuth("azure")}
          size="lg"
          type="button"
          variant="outline"
        >
          <MicrosoftMark />
          Fortsätt med Microsoft
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">eller mejl</span>
          <Separator className="flex-1" />
        </div>

        <form className="space-y-3" onSubmit={showPassword ? signInWithPassword : sendLink}>
          <div className="space-y-2">
            <Label htmlFor="email">E-post</Label>
            <Input
              autoComplete="email"
              id="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="namn@foretag.se"
              required
              type="email"
              value={email}
            />
          </div>
          {showPassword ? (
            <div className="space-y-2">
              <Label htmlFor="password">Lösenord</Label>
              <Input
                autoComplete="current-password"
                id="password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </div>
          ) : null}
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button className="w-full" disabled={Boolean(loading)} size="lg" type="submit">
            {showPassword ? (
              loading === "password" ? "Loggar in…" : "Logga in"
            ) : (
              <>
                <Mail data-icon="inline-start" />
                {loading === "link" ? "Skickar länk…" : "Skicka inloggningslänk"}
              </>
            )}
          </Button>
        </form>

        <button
          className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          onClick={() => {
            setShowPassword((value) => !value);
            setError(null);
          }}
          type="button"
        >
          {showPassword ? "Använd mejllänk i stället" : "Logga in med lösenord"}
        </button>
      </CardContent>
    </Card>
  );
}
