import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function SkapaKontoPage() {
  return (
    <AuthShell contentClassName="max-w-sm" title="Logga in">
      <Suspense fallback={<p className="text-center text-sm text-muted-foreground">Laddar…</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
