import { createClient } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/features";

export interface OrgMember {
  userId: string;
  name: string;
  email: string;
  role: AppRole;
}

function profileName(value: unknown): { name: string; email: string } {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") return { name: "Medarbetare", email: "" };
  const record = row as { full_name?: string | null; email?: string | null };
  return {
    name: record.full_name || record.email || "Medarbetare",
    email: record.email || "",
  };
}

export async function loadOrgMembers(organizationId: string): Promise<OrgMember[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("role, user_id, profiles ( full_name, email )")
    .eq("organization_id", organizationId);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const profile = profileName(row.profiles);
    return {
      userId: row.user_id as string,
      name: profile.name,
      email: profile.email,
      role: row.role as AppRole,
    };
  });
}
