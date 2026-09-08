import { createClient } from "@/lib/supabase/client";
import type {
  ActivityStatus,
  Deviation,
  DeviationStatus,
  OpsStats,
  Severity,
  Suggestion,
  SuggestionStatus,
  YearActivity,
} from "@/lib/ops/types";

function asDeviation(row: Record<string, unknown>): Deviation {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    number: Number(row.number),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    category: String(row.category ?? "kvalitet"),
    severity: (row.severity as Severity) ?? "medium",
    status: (row.status as DeviationStatus) ?? "open",
    action: String(row.action ?? ""),
    ownerName: String(row.owner_name ?? ""),
    dueDate: (row.due_date as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function asSuggestion(row: Record<string, unknown>): Suggestion {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    number: Number(row.number),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    status: (row.status as SuggestionStatus) ?? "new",
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function asActivity(row: Record<string, unknown>): YearActivity {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    title: String(row.title ?? ""),
    kind: String(row.kind ?? "other"),
    plannedOn: String(row.planned_on ?? ""),
    ownerName: String(row.owner_name ?? ""),
    status: (row.status as ActivityStatus) ?? "planned",
    notes: String(row.notes ?? ""),
  };
}

async function nextNumber(table: "deviations" | "suggestions", organizationId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(table)
    .select("number")
    .eq("organization_id", organizationId)
    .order("number", { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data?.[0]?.number ?? 0) + 1;
}

export async function listDeviations(organizationId: string): Promise<Deviation[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("deviations")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => asDeviation(row as Record<string, unknown>));
}

export async function createDeviation(params: {
  organizationId: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  severity: Severity;
}): Promise<Deviation> {
  const supabase = createClient();
  const number = await nextNumber("deviations", params.organizationId);
  const { data, error } = await supabase
    .from("deviations")
    .insert({
      organization_id: params.organizationId,
      number,
      title: params.title,
      description: params.description,
      category: params.category,
      severity: params.severity,
      status: "open",
      created_by: params.userId,
    })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Kunde inte spara avvikelsen");
  return asDeviation(data as Record<string, unknown>);
}

export async function updateDeviation(
  id: string,
  patch: Partial<Pick<Deviation, "status" | "action" | "ownerName" | "dueDate">>,
): Promise<void> {
  const supabase = createClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) {
    payload.status = patch.status;
    payload.closed_at = patch.status === "closed" ? new Date().toISOString() : null;
  }
  if (patch.action !== undefined) payload.action = patch.action;
  if (patch.ownerName !== undefined) payload.owner_name = patch.ownerName;
  if (patch.dueDate !== undefined) payload.due_date = patch.dueDate;
  const { error } = await supabase.from("deviations").update(payload).eq("id", id);
  if (error) throw error;
}

export async function listSuggestions(organizationId: string): Promise<Suggestion[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("suggestions")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => asSuggestion(row as Record<string, unknown>));
}

export async function createSuggestion(params: {
  organizationId: string;
  userId: string;
  title: string;
  description: string;
}): Promise<Suggestion> {
  const supabase = createClient();
  const number = await nextNumber("suggestions", params.organizationId);
  const { data, error } = await supabase
    .from("suggestions")
    .insert({
      organization_id: params.organizationId,
      number,
      title: params.title,
      description: params.description,
      status: "new",
      created_by: params.userId,
    })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Kunde inte spara förslaget");
  return asSuggestion(data as Record<string, unknown>);
}

export async function updateSuggestion(id: string, status: SuggestionStatus): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("suggestions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function listYearActivities(organizationId: string, year: number): Promise<YearActivity[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("year_activities")
    .select("*")
    .eq("organization_id", organizationId)
    .gte("planned_on", `${year}-01-01`)
    .lte("planned_on", `${year}-12-31`)
    .order("planned_on", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => asActivity(row as Record<string, unknown>));
}

export async function createYearActivity(params: {
  organizationId: string;
  title: string;
  kind: string;
  plannedOn: string;
  ownerName: string;
}): Promise<YearActivity> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("year_activities")
    .insert({
      organization_id: params.organizationId,
      title: params.title,
      kind: params.kind,
      planned_on: params.plannedOn,
      owner_name: params.ownerName,
      status: "planned",
    })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Kunde inte spara aktiviteten");
  return asActivity(data as Record<string, unknown>);
}

export async function updateYearActivity(
  id: string,
  patch: Partial<Pick<YearActivity, "status" | "notes" | "ownerName" | "plannedOn" | "title">>,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("year_activities")
    .update({
      status: patch.status,
      notes: patch.notes,
      owner_name: patch.ownerName,
      planned_on: patch.plannedOn,
      title: patch.title,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function loadOpsStats(organizationId: string): Promise<OpsStats> {
  const today = new Date();
  const until = new Date(today);
  until.setDate(today.getDate() + 30);
  const [deviations, suggestions, activities] = await Promise.all([
    listDeviations(organizationId),
    listSuggestions(organizationId),
    listYearActivities(organizationId, today.getFullYear()),
  ]);
  const upcoming = activities.filter((item) => {
    if (item.status !== "planned") return false;
    const date = new Date(item.plannedOn);
    return date >= new Date(today.toISOString().slice(0, 10)) && date <= until;
  });
  return {
    openDeviations: deviations.filter((item) => item.status !== "closed").length,
    openSuggestions: suggestions.filter((item) => item.status === "new" || item.status === "reviewing").length,
    upcomingActivities: upcoming.slice(0, 5),
    recentDeviations: deviations.slice(0, 5),
  };
}

export function caseNumber(prefix: string, number: number) {
  return `${prefix}-${String(number).padStart(3, "0")}`;
}

export function formatSvDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("sv-SE");
}

export function missingTableMessage(error: unknown) {
  const text = error instanceof Error ? error.message : String(error ?? "");
  if (/could not find the table|schema cache|does not exist/i.test(text)) {
    return "Tabellerna är inte skapade i molnet ännu. Kör supabase/schema_phase_c.sql i Supabase.";
  }
  return text || "Kunde inte läsa data.";
}
