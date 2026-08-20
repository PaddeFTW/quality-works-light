"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/");
  }

  return (
    <AuthShell contentClassName="max-w-sm" title="Quality Works">
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
            <Button className="w-full" size="lg" type="submit">
              Logga in
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        Har du inget företagskonto?{" "}
        <Link className="font-medium text-primary hover:underline" href="/skapa-konto">
          Skapa företagskonto
        </Link>
      </p>
    </AuthShell>
  );
}
