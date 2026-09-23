import { createClient } from "@/lib/supabase/client";

export type CompetenceLevel = "missing" | "training" | "ok";

export interface Competence {
  id: string;
  name: string;
}

export interface ExtraPerson {
  personKey: string;
  name: string;
}

export interface LevelCell {
  competenceId: string;
  personKey: string;
  level: CompetenceLevel;
}

export async function loadCompetence(organizationId: string) {
  const supabase = createClient();
  const [skills, people, levels] = await Promise.all([
    supabase.from("competences").select("id, name").eq("organization_id", organizationId).order("created_at"),
    supabase.from("competence_people").select("person_key, name").eq("organization_id", organizationId).order("name"),
    supabase.from("competence_levels").select("competence_id, person_key, level").eq("organization_id", organizationId),
  ]);
  if (skills.error) throw skills.error;
  if (people.error) throw people.error;
  if (levels.error) throw levels.error;
  return {
    skills: (skills.data ?? []).map((row) => ({ id: String(row.id), name: String(row.name) })) as Competence[],
    extras: (people.data ?? []).map((row) => ({
      personKey: String(row.person_key),
      name: String(row.name),
    })) as ExtraPerson[],
    levels: (levels.data ?? []).map((row) => ({
      competenceId: String(row.competence_id),
      personKey: String(row.person_key),
      level: row.level as CompetenceLevel,
    })) as LevelCell[],
  };
}

export async function addCompetence(organizationId: string, name: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("competences")
    .insert({ organization_id: organizationId, name })
    .select("id, name")
    .single();
  if (error) throw error;
  return { id: String(data.id), name: String(data.name) } as Competence;
}

export async function removeCompetence(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("competences").delete().eq("id", id);
  if (error) throw error;
}

export async function addExtraPerson(organizationId: string, name: string) {
  const supabase = createClient();
  const personKey = `name:${name.trim().toLowerCase()}`;
  const { error } = await supabase.from("competence_people").insert({
    organization_id: organizationId,
    person_key: personKey,
    name: name.trim(),
  });
  if (error) throw error;
  return { personKey, name: name.trim() } as ExtraPerson;
}

export async function removeExtraPerson(organizationId: string, personKey: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("competence_people")
    .delete()
    .eq("organization_id", organizationId)
    .eq("person_key", personKey);
  if (error) throw error;
}

export async function setLevel(params: {
  organizationId: string;
  competenceId: string;
  personKey: string;
  level: CompetenceLevel | "";
}) {
  const supabase = createClient();
  if (!params.level) {
    const { error } = await supabase
      .from("competence_levels")
      .delete()
      .eq("competence_id", params.competenceId)
      .eq("person_key", params.personKey);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("competence_levels").upsert(
    {
      organization_id: params.organizationId,
      competence_id: params.competenceId,
      person_key: params.personKey,
      level: params.level,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "competence_id,person_key" },
  );
  if (error) throw error;
}

export function competenceTableMessage(error: unknown) {
  const text = error instanceof Error ? error.message : String(error ?? "");
  if (/could not find the table|schema cache|does not exist/i.test(text)) {
    return "Kompetens-tabellerna saknas. Kör supabase/schema_kompetens.sql i Supabase.";
  }
  if (/duplicate|unique/i.test(text)) return "Den finns redan.";
  return text || "Kunde inte läsa kompetens.";
}
