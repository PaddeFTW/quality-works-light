import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function SkapaKontoPage() {
  return (
    <AuthShell contentClassName="max-w-sm" title="Logga in">
      <LoginForm />
    </AuthShell>
  );
}
