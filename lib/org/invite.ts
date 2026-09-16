import { createClient } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/features";

export async function sendOrgInvite(params: {
  organizationId: string;
  userId: string;
  email: string;
  role: AppRole;
  origin: string;
}): Promise<{ url: string; mailed: boolean; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("organization_invites")
    .insert({
      organization_id: params.organizationId,
      email: params.email,
      role: params.role,
      invited_by: params.userId,
    })
    .select("token")
    .single();
  if (error || !data) {
    return { url: "", mailed: false, error: error?.message ?? "Kunde inte skapa inbjudan." };
  }
  const joinPath = `/ga-med?token=${data.token}`;
  const url = `${params.origin}${joinPath}`;
  const { error: mailError } = await supabase.auth.signInWithOtp({
    email: params.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${params.origin}/auth/callback?next=${encodeURIComponent(joinPath)}`,
    },
  });
  return { url, mailed: !mailError, error: mailError?.message };
}
