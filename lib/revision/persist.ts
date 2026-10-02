import { createClient } from "@/lib/supabase/client";

export interface AuditItem {
  id: string;
  auditId: string;
  clause: string;
  prompt: string;
  score: 0 | 1 | 2 | 3;
  comment: string;
  dueOn: string;
  closed: boolean;
  sortOrder: number;
}

export interface AuditRecord {
  id: string;
  title: string;
  auditorName: string;
  auditedOn: string;
  standard: string;
  note: string;
}

export const EXAMPLE_CLAUSES: { clause: string; prompt: string }[] = [
  { clause: "4.1", prompt: "Förstår ni företaget och vad som påverkar er?" },
  { clause: "4.2", prompt: "Vet ni vilka som ställer krav på er?" },
  { clause: "4.4", prompt: "Kan ni visa hur arbetet hänger ihop?" },
  { clause: "5.2", prompt: "Finns en policy, och känner alla till den?" },
  { clause: "5.3", prompt: "Vet var och en vad den ansvarar för?" },
  { clause: "6.1", prompt: "Har ni tittat på risker och möjligheter?" },
  { clause: "6.2", prompt: "Finns mål, och följer ni dem?" },
  { clause: "7.2", prompt: "Kan de som gör jobbet det som krävs?" },
  { clause: "7.5", prompt: "Är dokumenten styrda och är det rätt utgåva?" },
  { clause: "8.2", prompt: "Vet ni vad kunden har beställt?" },
  { clause: "8.4", prompt: "Styr ni leverantörerna?" },
  { clause: "8.5", prompt: "Gör ni arbetet som det är sagt?" },
  { clause: "8.7", prompt: "Tar ni hand om fel i arbetet?" },
  { clause: "9.1.2", prompt: "Vet ni vad kunderna tycker?" },
  { clause: "9.2", prompt: "Gör ni intern revision varje år?" },
  { clause: "9.3", prompt: "Har ledningen gått igenom systemet?" },
  { clause: "10.2", prompt: "Åtgärdar ni fel så de inte kommer tillbaka?" },
];

function asScore(value: number): 0 | 1 | 2 | 3 {
  if (value === 1 || value === 2 || value === 3) return value;
  return 0;
}

export function revisionTableMessage(error: unknown) {
  const text = error instanceof Error ? error.message : String(error ?? "");
  if (/could not find the table|schema cache|does not exist/i.test(text)) {
    return "Revisionen saknas i databasen. Kör supabase/schema_revision.sql i Supabase.";
  }
  return text || "Kunde inte läsa revisionen.";
}

export async function loadAudits(organizationId: string) {
  const supabase = createClient();
  const [audits, items] = await Promise.all([
    supabase
      .from("audits")
      .select("id, title, auditor_name, audited_on, standard, note")
      .eq("organization_id", organizationId)
      .order("audited_on", { ascending: false }),
    supabase
      .from("audit_items")
      .select("id, audit_id, clause, prompt, score, comment, due_on, closed, sort_order")
      .eq("organization_id", organizationId)
      .order("sort_order"),
  ]);
  if (audits.error) throw audits.error;
  if (items.error) throw items.error;
  return {
    audits: (audits.data ?? []).map(
      (row): AuditRecord => ({
        id: String(row.id),
        title: String(row.title),
        auditorName: String(row.auditor_name ?? ""),
        auditedOn: String(row.audited_on).slice(0, 10),
        standard: String(row.standard ?? "ISO 9001"),
        note: String(row.note ?? ""),
      }),
    ),
    items: (items.data ?? []).map(
      (row): AuditItem => ({
        id: String(row.id),
        auditId: String(row.audit_id),
        clause: String(row.clause ?? ""),
        prompt: String(row.prompt),
        score: asScore(Number(row.score)),
        comment: String(row.comment ?? ""),
        dueOn: row.due_on ? String(row.due_on) : "",
        closed: Boolean(row.closed),
        sortOrder: Number(row.sort_order ?? 0),
      }),
    ),
  };
}

export async function createAudit(organizationId: string) {
  const supabase = createClient();
  const auditedOn = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("audits")
    .insert({ organization_id: organizationId, title: "Intern revision", audited_on: auditedOn })
    .select("id")
    .single();
  if (error) throw error;
  return {
    id: String(data.id),
    title: "Intern revision",
    auditorName: "",
    auditedOn,
    standard: "ISO 9001",
    note: "",
  } satisfies AuditRecord;
}

export async function saveAudit(audit: AuditRecord) {
  const supabase = createClient();
  const { error } = await supabase
    .from("audits")
    .update({
      title: audit.title.trim() || "Intern revision",
      auditor_name: audit.auditorName,
      audited_on: audit.auditedOn,
      standard: audit.standard,
      note: audit.note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", audit.id);
  if (error) throw error;
}

export async function deleteAudit(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("audits").delete().eq("id", id);
  if (error) throw error;
}

export async function addExampleItems(organizationId: string, auditId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("audit_items").insert(
    EXAMPLE_CLAUSES.map((item, index) => ({
      organization_id: organizationId,
      audit_id: auditId,
      clause: item.clause,
      prompt: item.prompt,
      sort_order: index + 1,
    })),
  );
  if (error) throw error;
}

export async function saveItem(item: AuditItem) {
  const supabase = createClient();
  const { error } = await supabase
    .from("audit_items")
    .update({
      clause: item.clause,
      prompt: item.prompt.trim() || "Nytt krav",
      score: item.score,
      comment: item.comment,
      due_on: item.score >= 2 && item.dueOn ? item.dueOn : null,
      closed: item.score >= 2 ? item.closed : false,
    })
    .eq("id", item.id);
  if (error) throw error;
}

export async function deleteItem(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("audit_items").delete().eq("id", id);
  if (error) throw error;
}
