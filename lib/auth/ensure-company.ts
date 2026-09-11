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

function asError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return new Error(swedishAuthError(error.message));
  if (typeof error === "object" && error && "message" in error) {
    const message = String((error as { message?: string }).message ?? "");
    if (message) return new Error(swedishAuthError(message));
  }
  return new Error(fallback);
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
  await supabase.from("profiles").upsert({
    id: params.userId,
    full_name: params.fullName || null,
  });

  const { data: existing } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", params.userId)
    .limit(1)
    .maybeSingle();
  if (existing?.id) return;

  const { error: rpcError } = await supabase.rpc("create_company", {
    p_name: params.companyName,
    p_full_name: params.fullName,
    p_org_number: params.orgNumber ?? null,
    p_industry: params.industry ?? null,
  });

  if (!rpcError) return;
  const rpcText = rpcError.message ?? "";
  if (!/could not find the function|schema cache|does not exist/i.test(rpcText)) {
    throw asError(rpcError, "Kunde inte spara företaget.");
  }

  const baseSlug = slugify(params.companyName) || "foretag";
  const slug = `${baseSlug}-${params.userId.slice(0, 8)}`;

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
  if (orgError || !org) throw asError(orgError, "Kunde inte spara företaget.");

  const { error: memberError } = await supabase.from("organization_members").insert({
    organization_id: org.id,
    user_id: params.userId,
    role: "admin",
  });
  if (memberError) throw asError(memberError, "Kunde inte koppla dig till företaget.");

  const { error: manualError } = await supabase.from("manuals").insert({
    organization_id: org.id,
    name: "Kvalitetsmanual",
    issuer: params.fullName,
    header_text: `Kvalitetsmanual – ${params.companyName}`,
    footer_text: "Internt dokument. Utskrift gäller endast utskriftsdagen.",
  });
  if (manualError) throw asError(manualError, "Företaget skapades men manualen kunde inte startas.");
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
  if (text.includes("expired") || text.includes("otp_expired") || text.includes("invalid token")) {
    return "Länken gick ut. Skicka en ny.";
  }
  if (text.includes("signups not allowed")) {
    return "Kunde inte skicka länken. Kolla e-postadressen och försök igen.";
  }
  if (text.includes("provider is not enabled") || text.includes("unsupported provider")) {
    return "Den inloggningen är inte påslagen än. Använd mejllänken.";
  }
  if (text.includes("row-level security") || text.includes("42501") || text.includes("permission denied")) {
    return "Databasen stoppar skapandet. Kör schema_create_company.sql i Supabase SQL Editor, sedan prova igen.";
  }
  if (text.includes("profiles") && (text.includes("foreign key") || text.includes("violates"))) {
    return "Användarprofil saknas. Kör schema_create_company.sql i Supabase SQL Editor, sedan prova igen.";
  }
  return message;
}
