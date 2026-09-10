"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";

import { AuthShell } from "@/components/auth/auth-shell";
import { createClient } from "@/lib/supabase/client";
import { swedishAuthError } from "@/lib/auth/ensure-company";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Loggar in…");

  useEffect(() => {
    const supabase = createClient();
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const tokenHash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type");
    const errorDescription = url.searchParams.get("error_description") ?? url.searchParams.get("error");

    async function finish() {
      if (errorDescription) {
        router.replace(`/login?error=${encodeURIComponent(swedishAuthError(errorDescription))}`);
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace(`/login?error=${encodeURIComponent(swedishAuthError(error.message))}`);
          return;
        }
      } else if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as EmailOtpType,
        });
        if (error) {
          router.replace(`/login?error=${encodeURIComponent(swedishAuthError(error.message))}`);
          return;
        }
      } else {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          router.replace("/login?error=Länken gick ut. Skicka en ny.");
          return;
        }
      }

      router.replace("/");
      router.refresh();
    }

    void finish().catch(() => {
      setStatus("Kunde inte logga in.");
      router.replace("/login?error=Kunde inte logga in. Skicka en ny länk.");
    });
  }, [router]);

  return (
    <AuthShell contentClassName="max-w-sm" title="Loggar in">
      <p className="text-center text-sm text-muted-foreground">{status}</p>
    </AuthShell>
  );
}
