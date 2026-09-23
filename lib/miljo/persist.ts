import { createClient } from "@/lib/supabase/client";

export const ASPECT_AREAS = ["Avfall", "Energi", "Utsläpp", "Kemikalier", "Transporter", "Vatten"] as const;
export type AspectArea = (typeof ASPECT_AREAS)[number];

export interface AspectItem {
  id: string;
  area: AspectArea;
  name: string;
  happens: string;
  score: number;
  action: string;
  ownerName: string;
}

function asArea(value: string): AspectArea {
  return ASPECT_AREAS.includes(value as AspectArea) ? (value as AspectArea) : "Avfall";
}

export async function loadAspects(organizationId: string): Promise<AspectItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("environmental_aspects")
    .select("id, area, name, happens, score, action, owner_name")
    .eq("organization_id", organizationId)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: String(row.id),
    area: asArea(String(row.area)),
    name: String(row.name),
    happens: String(row.happens ?? ""),
    score: Number(row.score ?? 3),
    action: String(row.action ?? ""),
    ownerName: String(row.owner_name ?? ""),
  }));
}

export async function createAspect(organizationId: string, name: string, area: AspectArea) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("environmental_aspects")
    .insert({ organization_id: organizationId, name, area })
    .select("id")
    .single();
  if (error) throw error;
  return { id: String(data.id), area, name, happens: "", score: 3, action: "", ownerName: "" } satisfies AspectItem;
}

export async function saveAspect(item: AspectItem) {
  const supabase = createClient();
  const { error } = await supabase
    .from("environmental_aspects")
    .update({
      area: item.area,
      name: item.name.trim() || "Ny aspekt",
      happens: item.happens,
      score: item.score,
      action: item.action,
      owner_name: item.ownerName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", item.id);
  if (error) throw error;
}

export async function deleteAspect(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("environmental_aspects").delete().eq("id", id);
  if (error) throw error;
}

export function aspectTableMessage(error: unknown) {
  const text = error instanceof Error ? error.message : String(error ?? "");
  if (/could not find the table|schema cache|does not exist/i.test(text)) {
    return "Miljöaspekterna saknas i databasen. Kör supabase/schema_miljo.sql i Supabase.";
  }
  return text || "Kunde inte läsa miljöaspekterna.";
}

export const STARTER_ASPECTS: { name: string; area: AspectArea }[] = [
  { name: "Restavfall", area: "Avfall" },
  { name: "El i lokalen", area: "Energi" },
  { name: "Firmabilar", area: "Transporter" },
];

export function scoreLabel(score: number) {
  if (score >= 4) return "Betydande";
  if (score === 3) return "Medel";
  return "Liten";
}
