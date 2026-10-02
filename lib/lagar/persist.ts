import { createClient } from "@/lib/supabase/client";
import { MANUAL_BUCKET } from "@/lib/manual/cloud";

export type LawArea = "Arbetsmiljö" | "Miljö" | "Kvalitet" | "Övrigt";
export type LawStatus = "open" | "partial" | "ok" | "skip";

export interface LawFile {
  id: string;
  name: string;
  path: string;
}

export interface LawItem {
  id: string;
  area: LawArea;
  name: string;
  description: string;
  impact: string;
  complianceText: string;
  lawUrl: string;
  updateUrl: string;
  status: LawStatus;
  files: LawFile[];
}

const AREAS: LawArea[] = ["Arbetsmiljö", "Miljö", "Kvalitet", "Övrigt"];

function asArea(value: string): LawArea {
  return AREAS.includes(value as LawArea) ? (value as LawArea) : "Övrigt";
}

export async function loadLaws(organizationId: string): Promise<LawItem[]> {
  const supabase = createClient();
  const [laws, files] = await Promise.all([
    supabase.from("laws").select("id, area, name, description, impact, compliance_text, law_url, update_url, status").eq("organization_id", organizationId).order("name"),
    supabase.from("law_files").select("id, law_id, file_name, storage_path").eq("organization_id", organizationId),
  ]);
  if (laws.error) throw laws.error;
  if (files.error) throw files.error;
  const byLaw = new Map<string, LawFile[]>();
  for (const row of files.data ?? []) {
    const list = byLaw.get(String(row.law_id)) ?? [];
    list.push({ id: String(row.id), name: String(row.file_name), path: String(row.storage_path) });
    byLaw.set(String(row.law_id), list);
  }
  return (laws.data ?? []).map((row) => ({
    id: String(row.id),
    area: asArea(String(row.area)),
    name: String(row.name),
    description: String(row.description ?? ""),
    impact: String(row.impact ?? ""),
    complianceText: String(row.compliance_text ?? ""),
    lawUrl: String(row.law_url ?? ""),
    updateUrl: String(row.update_url ?? ""),
    status: row.status as LawStatus,
    files: byLaw.get(String(row.id)) ?? [],
  }));
}

export async function createLaw(organizationId: string, name: string, area: LawArea, lawUrl = "") {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("laws")
    .insert({ organization_id: organizationId, name, area, law_url: lawUrl })
    .select("id")
    .single();
  if (error) throw error;
  return {
    id: String(data.id),
    area,
    name,
    description: "",
    impact: "",
    complianceText: "",
    lawUrl,
    updateUrl: "",
    status: "open" as const,
    files: [],
  } satisfies LawItem;
}

export async function saveLaw(law: LawItem) {
  const supabase = createClient();
  const { error } = await supabase
    .from("laws")
    .update({
      area: law.area,
      name: law.name.trim() || "Ny lag",
      description: law.description,
      impact: law.impact,
      compliance_text: law.complianceText,
      law_url: law.lawUrl,
      update_url: law.updateUrl,
      status: law.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", law.id);
  if (error) throw error;
}

export async function deleteLaw(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("laws").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadLawFile(organizationId: string, lawId: string, file: File) {
  const supabase = createClient();
  const path = `laws/${organizationId}/${lawId}/${Date.now()}-${file.name}`;
  let bucket: string = MANUAL_BUCKET;
  const first = await supabase.storage.from(MANUAL_BUCKET).upload(path, file);
  if (first.error) {
    bucket = "manual-attachments";
    const second = await supabase.storage.from(bucket).upload(path, file);
    if (second.error) throw second.error;
  }
  const { data, error } = await supabase
    .from("law_files")
    .insert({ organization_id: organizationId, law_id: lawId, file_name: file.name, storage_path: path })
    .select("id")
    .single();
  if (error) throw error;
  return { id: String(data.id), name: file.name, path } satisfies LawFile;
}

export async function fileUrl(path: string) {
  const supabase = createClient();
  const first = await supabase.storage.from(MANUAL_BUCKET).createSignedUrl(path, 3600);
  if (first.data?.signedUrl) return first.data.signedUrl;
  const second = await supabase.storage.from("manual-attachments").createSignedUrl(path, 3600);
  if (second.error || !second.data?.signedUrl) throw second.error ?? new Error("Kunde inte öppna filen");
  return second.data.signedUrl;
}

export async function removeLawFile(file: LawFile) {
  const supabase = createClient();
  await supabase.storage.from(MANUAL_BUCKET).remove([file.path]);
  await supabase.storage.from("manual-attachments").remove([file.path]);
  const { error } = await supabase.from("law_files").delete().eq("id", file.id);
  if (error) throw error;
}

export function lawTableMessage(error: unknown) {
  const text = error instanceof Error ? error.message : String(error ?? "");
  if (/could not find the table|schema cache|does not exist/i.test(text)) {
    return "Laglistan saknas i databasen. Kör supabase/schema_lagar.sql i Supabase.";
  }
  return text || "Kunde inte läsa lagarna.";
}

export const LAW_AREAS: LawArea[] = AREAS;

export const STARTER_LAWS: { name: string; area: LawArea; lawUrl: string }[] = [
  {
    name: "Arbetsmiljölagen (1977:1160)",
    area: "Arbetsmiljö",
    lawUrl: "https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/arbetsmiljolag-19771160_sfs-1977-1160",
  },
  {
    name: "Miljöbalken (1998:808)",
    area: "Miljö",
    lawUrl: "https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/miljobalk-1998808_sfs-1998-808",
  },
  {
    name: "Diskrimineringslagen (2008:567)",
    area: "Övrigt",
    lawUrl: "https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/diskrimineringslag-2008567_sfs-2008-567",
  },
];
