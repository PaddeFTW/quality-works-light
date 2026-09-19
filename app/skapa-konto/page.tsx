import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export default function SkapaKontoPage() {
  return (
    <AuthShell
      contentClassName="max-w-sm"
      description="Du blir administratör för ditt företag. Andra bjuder du in sen."
      title="Skapa konto"
    >
      <SignupForm />
      <p className="text-center text-sm text-muted-foreground">
        <Link className="font-semibold text-primary hover:underline" href="/priser">
          Se priser
        </Link>
      </p>
    </AuthShell>
  );
}
