import { createClient } from "@/lib/supabase/client";

export type CertAnswer = "" | "yes" | "no";

export interface CertCheck {
  id: string;
  prompt: string;
  hint: string;
  answer: CertAnswer;
  dueOn: string;
  sortOrder: number;
}

export const EXAMPLE_CHECKS: { prompt: string; hint: string }[] = [
  { prompt: "Är alla dokument i ledningssystemet uppdaterade och godkända?", hint: "" },
  { prompt: "Stämmer ledningssystemet med hur ni arbetar?", hint: "" },
  { prompt: "Har ni gått igenom alla dokument noggrant?", hint: "" },
  { prompt: "Finns allt som standarden kräver med i ledningssystemet?", hint: "Jämför med ISO 9001 och ISO 14001." },
  { prompt: "Kan ni förklara hur ni styr dokumenten?", hint: "" },
  { prompt: "Har den som läser rätt utgåva?", hint: "" },
  { prompt: "Är det ordning på blanketter även utanför boken?", hint: "" },
  { prompt: "Använder alla aktuella blanketter?", hint: "" },
  { prompt: "Är det lätt att hitta mallar och checklistor?", hint: "" },
  { prompt: "Är listan över ifyllda dokument aktuell?", hint: "Inte ett krav i standarden, men bra att ha." },
  { prompt: "Är årets jobb inplanerade?", hint: "Det som ska göras i år, med vem och när." },
  { prompt: "Kan ni visa en leverantörsbedömning?", hint: "Den ska göras varje år." },
  { prompt: "Kan ni visa vad kunderna tycker?", hint: "Det ska också göras varje år." },
  { prompt: "Kan ni visa att avvikelser tas om hand?", hint: "Inte varje småsak. Det ni har bestämt är en avvikelse." },
  { prompt: "Kan ni förklara er policy?", hint: "Alla ska känna till den." },
  { prompt: "Kan ni förklara era mål?", hint: "De ska göra kvalitet eller miljö bättre." },
  { prompt: "Är ledningens genomgång gjord, med protokoll?", hint: "Minst en gång per år." },
  { prompt: "Är intern revision gjord?", hint: "Minst en gång per år, och den ska vara skriftlig." },
  { prompt: "Är felen från intern revision åtgärdade?", hint: "" },
  { prompt: "Vet alla hur organisationen ser ut?", hint: "" },
  { prompt: "Vet var och en vad den ska göra?", hint: "" },
  { prompt: "Är lagarna uppdaterade och kontrollerade?", hint: "Visa när ni senast kontrollerade varje krav." },
  { prompt: "Finns en lista på vilka som ställer krav på er?", hint: "Till exempel kunder, myndigheter och branschen." },
  { prompt: "Finns en riskanalys?", hint: "En SWOT räcker. Gå igenom den en gång per år." },
  { prompt: "Kan ni berätta hur era processer hänger ihop?", hint: "" },
  { prompt: "Kan ni visa miljöutredningen?", hint: "El, resor, vatten, avfall och kemikalier." },
  { prompt: "Är säkerhetsdatabladen aktuella?", hint: "Alla ska veta var de finns." },
  { prompt: "Har alla fått den information de behöver?", hint: "" },
];

function asAnswer(value: string): CertAnswer {
  if (value === "yes" || value === "no") return value;
  return "";
}

export function certTableMessage(error: unknown) {
  const text = error instanceof Error ? error.message : String(error ?? "");
  if (/could not find the table|schema cache|does not exist/i.test(text)) {
    return "Checklistan saknas i databasen. Kör supabase/schema_certifiering.sql i Supabase.";
  }
  return text || "Kunde inte läsa checklistan.";
}

export async function loadChecks(organizationId: string): Promise<CertCheck[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cert_checks")
    .select("id, prompt, hint, answer, due_on, sort_order")
    .eq("organization_id", organizationId)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: String(row.id),
    prompt: String(row.prompt),
    hint: String(row.hint ?? ""),
    answer: asAnswer(String(row.answer ?? "")),
    dueOn: row.due_on ? String(row.due_on) : "",
    sortOrder: Number(row.sort_order ?? 0),
  }));
}

export async function addExampleChecks(organizationId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("cert_checks").insert(
    EXAMPLE_CHECKS.map((item, index) => ({
      organization_id: organizationId,
      prompt: item.prompt,
      hint: item.hint,
      sort_order: index + 1,
    })),
  );
  if (error) throw error;
}

export async function createCheck(organizationId: string, sortOrder: number) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cert_checks")
    .insert({ organization_id: organizationId, prompt: "Ny fråga", sort_order: sortOrder })
    .select("id")
    .single();
  if (error) throw error;
  return {
    id: String(data.id),
    prompt: "Ny fråga",
    hint: "",
    answer: "" as const,
    dueOn: "",
    sortOrder,
  } satisfies CertCheck;
}

export async function saveCheck(check: CertCheck) {
  const supabase = createClient();
  const { error } = await supabase
    .from("cert_checks")
    .update({
      prompt: check.prompt.trim() || "Ny fråga",
      hint: check.hint,
      answer: check.answer,
      due_on: check.answer === "no" && check.dueOn ? check.dueOn : null,
      sort_order: check.sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq("id", check.id);
  if (error) throw error;
}

export async function deleteCheck(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("cert_checks").delete().eq("id", id);
  if (error) throw error;
}
