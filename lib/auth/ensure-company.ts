import type { SupabaseClient } from "@supabase/supabase-js";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function ensureCompany(
  supabase: SupabaseClient,
  params: {
    userId: string;
    fullName: string;
    companyName: string;
    orgNumber?: string;
    industry?: string;
  },
) {
  const { data: existing } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", params.userId)
    .limit(1)
    .maybeSingle();
  if (existing?.id) return;

  const baseSlug = slugify(params.companyName) || "foretag";
  const slug = `${baseSlug}-${params.userId.slice(0, 6)}`;

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: params.companyName,
      org_number: params.orgNumber || null,
      industry: params.industry || null,
      slug,
    })
    .select("id")
    .single();
  if (orgError || !org) throw orgError ?? new Error("Kunde inte skapa företag.");

  const { error: memberError } = await supabase.from("organization_members").insert({
    organization_id: org.id,
    user_id: params.userId,
    role: "admin",
  });
  if (memberError) throw memberError;

  await supabase.from("manuals").insert({
    organization_id: org.id,
    name: "Kvalitetsmanual",
    issuer: params.fullName,
    header_text: `Kvalitetsmanual – ${params.companyName}`,
    footer_text: "Internt dokument. Utskrift gäller endast utskriftsdagen.",
  });
}

export function swedishAuthError(message: string) {
  const text = message.toLowerCase();
  if (text.includes("already registered") || text.includes("user already")) {
    return "Den här e-posten finns redan. Logga in i stället, eller använd en annan e-post.";
  }
  if (text.includes("invalid login") || text.includes("invalid credentials")) {
    return "Fel e-post eller lösenord. Använd kontot du skapat här, inte det gamla Quality Works-programmet.";
  }
  if (text.includes("email not confirmed")) {
    return "E-posten är inte bekräftad. I Supabase: Authentication → Providers → Email → stäng av Confirm email. Sen prova igen.";
  }
  if (text.includes("password") && !text.includes("invalid login")) {
    return "Lösenordet duger inte. Använd minst 6 tecken.";
  }
  if (text.includes("rate limit") || text.includes("too many")) {
    return "För många försök. Vänta en minut och prova igen.";
  }
  if (text.includes("signups not allowed")) {
    return "Kunde inte skicka länken. Kolla e-postadressen och försök igen.";
  }
  if (text.includes("provider is not enabled") || text.includes("unsupported provider")) {
    return "Den inloggningen är inte påslagen än. Använd mejllänken.";
  }
  return message;
}
