import { createClient } from "@/lib/supabase/client";

export interface ReviewMeeting {
  id: string;
  heldOn: string;
  chairName: string;
  secretaryName: string;
  attendees: string;
  nextOn: string;
  verdict: "" | "ok" | "change";
}

export interface ReviewNote {
  point: string;
  body: string;
}

export interface ReviewDecision {
  id: string;
  reviewId: string;
  body: string;
  ownerName: string;
  dueOn: string;
  done: boolean;
}

export interface ReviewFacts {
  goals: number | null;
  goalsDone: number | null;
  goalsLate: number | null;
  deviationsOpen: number | null;
  suggestionsOpen: number | null;
  customers: number | null;
  customerReviews: number | null;
  suppliers: number | null;
  suppliersWeak: number | null;
  findings: number | null;
  laws: number | null;
  lawsOk: number | null;
  jobsLeft: number | null;
  certYes: number | null;
  certAll: number | null;
  aspects: number | null;
  people: number | null;
}

export const AGENDA = [
  { id: "forra", title: "Förra mötet" },
  { id: "mal", title: "Mål" },
  { id: "avvikelse", title: "Avvikelser och förslag" },
  { id: "kund", title: "Kunder" },
  { id: "leverantor", title: "Leverantörer" },
  { id: "revision", title: "Intern revision" },
  { id: "lagar", title: "Lagar" },
  { id: "system", title: "Räcker systemet?" },
] as const;

function asVerdict(value: string): ReviewMeeting["verdict"] {
  if (value === "ok" || value === "change") return value;
  return "";
}

async function count(table: string, organizationId: string, filters: Record<string, string | number | boolean> = {}) {
  const supabase = createClient();
  let query = supabase.from(table).select("id", { count: "exact", head: true }).eq("organization_id", organizationId);
  for (const [key, value] of Object.entries(filters)) query = query.eq(key, value);
  const { count: total, error } = await query;
  if (error) return null;
  return total ?? 0;
}

export async function loadFacts(organizationId: string): Promise<ReviewFacts> {
  const [goals, goalsDone, goalsLate, deviationsOpen, suggestionsOpen, customers, customerReviews, suppliers, suppliersWeak, findings, laws, lawsOk, jobsLeft, certYes, certAll, aspects, people] =
    await Promise.all([
      count("goals", organizationId),
      count("goals", organizationId, { status: "done" }),
      count("goals", organizationId, { status: "late" }),
      count("deviations", organizationId, { status: "open" }),
      count("suggestions", organizationId, { status: "new" }),
      count("customers", organizationId),
      count("customer_reviews", organizationId),
      count("suppliers", organizationId),
      count("suppliers", organizationId, { status: "improve" }),
      count("audit_items", organizationId, { closed: false }),
      count("laws", organizationId),
      count("laws", organizationId, { status: "ok" }),
      count("year_activities", organizationId, { status: "planned" }),
      count("cert_checks", organizationId, { answer: "yes" }),
      count("cert_checks", organizationId),
      count("environmental_aspects", organizationId),
      count("competence_people", organizationId),
    ]);
  const openFindings = findings === null ? null : await countOpenFindings(organizationId);
  return {
    goals,
    goalsDone,
    goalsLate,
    deviationsOpen,
    suggestionsOpen,
    customers,
    customerReviews,
    suppliers,
    suppliersWeak,
    findings: openFindings,
    laws,
    lawsOk,
    jobsLeft,
    certYes,
    certAll,
    aspects,
    people,
  };
}

async function countOpenFindings(organizationId: string) {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("audit_items")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("closed", false)
    .gte("score", 2);
  if (error) return null;
  return count ?? 0;
}

export function factLine(id: string, facts: ReviewFacts) {
  const n = (value: number | null) => (value === null ? "inte inlagt" : String(value));
  if (id === "mal") return `${n(facts.goalsDone)} av ${n(facts.goals)} mål är klara. ${n(facts.goalsLate)} är efter.`;
  if (id === "avvikelse") return `${n(facts.deviationsOpen)} öppna avvikelser. ${n(facts.suggestionsOpen)} nya förslag.`;
  if (id === "kund") return `${n(facts.customers)} kunder. ${n(facts.customerReviews)} omdömen.`;
  if (id === "leverantor") return `${n(facts.suppliers)} leverantörer. ${n(facts.suppliersWeak)} måste bli bättre.`;
  if (id === "revision") return `${n(facts.findings)} öppna fel från revisionen. ${n(facts.certYes)} av ${n(facts.certAll)} punkter inför certifiering är ja.`;
  if (id === "lagar") return `${n(facts.lawsOk)} av ${n(facts.laws)} lagar är ok. ${n(facts.aspects)} miljöaspekter.`;
  if (id === "system") return `${n(facts.jobsLeft)} jobb kvar i årshjulet. ${n(facts.people)} personer i personal.`;
  return "Gå igenom vad ni bestämde förra gången.";
}

export function reviewTableMessage(error: unknown) {
  const text = error instanceof Error ? error.message : String(error ?? "");
  if (/could not find the table|schema cache|does not exist/i.test(text)) {
    return "Mötesprotokollet saknas i databasen. Kör supabase/schema_ledning.sql i Supabase.";
  }
  return text || "Kunde inte läsa mötet.";
}

export async function loadReviews(organizationId: string) {
  const supabase = createClient();
  const [reviews, notes, decisions] = await Promise.all([
    supabase
      .from("management_reviews")
      .select("id, held_on, chair_name, secretary_name, attendees, next_on, verdict")
      .eq("organization_id", organizationId)
      .order("held_on", { ascending: false }),
    supabase.from("management_notes").select("review_id, point, body").eq("organization_id", organizationId),
    supabase
      .from("management_decisions")
      .select("id, review_id, body, owner_name, due_on, done")
      .eq("organization_id", organizationId)
      .order("created_at"),
  ]);
  if (reviews.error) throw reviews.error;
  if (notes.error) throw notes.error;
  if (decisions.error) throw decisions.error;
  return {
    reviews: (reviews.data ?? []).map(
      (row): ReviewMeeting => ({
        id: String(row.id),
        heldOn: String(row.held_on).slice(0, 10),
        chairName: String(row.chair_name ?? ""),
        secretaryName: String(row.secretary_name ?? ""),
        attendees: String(row.attendees ?? ""),
        nextOn: row.next_on ? String(row.next_on) : "",
        verdict: asVerdict(String(row.verdict ?? "")),
      }),
    ),
    notes: (notes.data ?? []).map((row) => ({
      reviewId: String(row.review_id),
      point: String(row.point),
      body: String(row.body ?? ""),
    })),
    decisions: (decisions.data ?? []).map(
      (row): ReviewDecision => ({
        id: String(row.id),
        reviewId: String(row.review_id),
        body: String(row.body),
        ownerName: String(row.owner_name ?? ""),
        dueOn: row.due_on ? String(row.due_on) : "",
        done: Boolean(row.done),
      }),
    ),
  };
}

export async function createReview(organizationId: string) {
  const supabase = createClient();
  const heldOn = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("management_reviews")
    .insert({ organization_id: organizationId, held_on: heldOn })
    .select("id")
    .single();
  if (error) throw error;
  return {
    id: String(data.id),
    heldOn,
    chairName: "",
    secretaryName: "",
    attendees: "",
    nextOn: "",
    verdict: "" as const,
  } satisfies ReviewMeeting;
}

export async function saveReview(review: ReviewMeeting) {
  const supabase = createClient();
  const { error } = await supabase
    .from("management_reviews")
    .update({
      held_on: review.heldOn,
      chair_name: review.chairName,
      secretary_name: review.secretaryName,
      attendees: review.attendees,
      next_on: review.nextOn || null,
      verdict: review.verdict,
      updated_at: new Date().toISOString(),
    })
    .eq("id", review.id);
  if (error) throw error;
}

export async function deleteReview(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("management_reviews").delete().eq("id", id);
  if (error) throw error;
}

export async function saveNote(organizationId: string, reviewId: string, point: string, body: string) {
  const supabase = createClient();
  const { error } = await supabase.from("management_notes").upsert(
    { organization_id: organizationId, review_id: reviewId, point, body },
    { onConflict: "review_id,point" },
  );
  if (error) throw error;
}

export async function createDecision(organizationId: string, reviewId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("management_decisions")
    .insert({ organization_id: organizationId, review_id: reviewId, body: "Nytt beslut" })
    .select("id")
    .single();
  if (error) throw error;
  return {
    id: String(data.id),
    reviewId,
    body: "Nytt beslut",
    ownerName: "",
    dueOn: "",
    done: false,
  } satisfies ReviewDecision;
}

export async function saveDecision(decision: ReviewDecision) {
  const supabase = createClient();
  const { error } = await supabase
    .from("management_decisions")
    .update({
      body: decision.body.trim() || "Nytt beslut",
      owner_name: decision.ownerName,
      due_on: decision.dueOn || null,
      done: decision.done,
    })
    .eq("id", decision.id);
  if (error) throw error;
}

export async function deleteDecision(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("management_decisions").delete().eq("id", id);
  if (error) throw error;
}
