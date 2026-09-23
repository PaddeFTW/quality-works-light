import { createClient } from "@/lib/supabase/client";

export type GoalArea = "Kvalitet" | "Miljö" | "Arbetsmiljö";
export type GoalStatus = "plan" | "going" | "late" | "done";

export interface GoalItem {
  id: string;
  area: GoalArea;
  name: string;
  measure: string;
  targetText: string;
  ownerName: string;
  dueOn: string;
  status: GoalStatus;
}

const AREAS: GoalArea[] = ["Kvalitet", "Miljö", "Arbetsmiljö"];

function asArea(value: string): GoalArea {
  return AREAS.includes(value as GoalArea) ? (value as GoalArea) : "Kvalitet";
}

export async function loadGoals(organizationId: string): Promise<GoalItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("id, area, name, measure, target_text, owner_name, due_on, status")
    .eq("organization_id", organizationId)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: String(row.id),
    area: asArea(String(row.area)),
    name: String(row.name),
    measure: String(row.measure ?? ""),
    targetText: String(row.target_text ?? ""),
    ownerName: String(row.owner_name ?? ""),
    dueOn: row.due_on ? String(row.due_on) : "",
    status: row.status as GoalStatus,
  }));
}

export async function createGoal(organizationId: string, name: string, area: GoalArea) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("goals")
    .insert({ organization_id: organizationId, name, area })
    .select("id")
    .single();
  if (error) throw error;
  return {
    id: String(data.id),
    area,
    name,
    measure: "",
    targetText: "",
    ownerName: "",
    dueOn: "",
    status: "plan" as const,
  } satisfies GoalItem;
}

export async function saveGoal(goal: GoalItem) {
  const supabase = createClient();
  const { error } = await supabase
    .from("goals")
    .update({
      area: goal.area,
      name: goal.name.trim() || "Nytt mål",
      measure: goal.measure,
      target_text: goal.targetText,
      owner_name: goal.ownerName,
      due_on: goal.dueOn || null,
      status: goal.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", goal.id);
  if (error) throw error;
}

export async function deleteGoal(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw error;
}

export function goalTableMessage(error: unknown) {
  const text = error instanceof Error ? error.message : String(error ?? "");
  if (/could not find the table|schema cache|does not exist/i.test(text)) {
    return "Målen saknas i databasen. Kör supabase/schema_mal.sql i Supabase.";
  }
  return text || "Kunde inte läsa målen.";
}

export const GOAL_AREAS = AREAS;

export const STARTER_GOALS: { name: string; area: GoalArea }[] = [
  { name: "Färre reklamationer", area: "Kvalitet" },
  { name: "Mindre avfall", area: "Miljö" },
  { name: "Inga olyckor", area: "Arbetsmiljö" },
];
