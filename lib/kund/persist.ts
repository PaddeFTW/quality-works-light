import { createClient } from "@/lib/supabase/client";

export type CustomerGrade = 1 | 2 | 3;
export type ReviewFilledBy = "oss" | "kund";
export type QuestionArea = "Kvalitet" | "Miljö" | "Arbetsmiljö";

export interface CustomerItem {
  id: string;
  customerNumber: string;
  company: string;
  contactName: string;
  ourContact: string;
  email: string;
  phone: string;
  grade: CustomerGrade;
  note: string;
}

export interface CustomerQuestion {
  id: string;
  area: QuestionArea;
  prompt: string;
  sortOrder: number;
}

export interface CustomerReview {
  id: string;
  customerId: string;
  reviewedOn: string;
  filledBy: ReviewFilledBy;
  comment: string;
  scores: Record<string, number>;
}

const AREAS: QuestionArea[] = ["Kvalitet", "Miljö", "Arbetsmiljö"];

export const EXAMPLE_QUESTIONS: { area: QuestionArea; prompt: string }[] = [
  { area: "Kvalitet", prompt: "Fick ni offert eller förslag i tid?" },
  { area: "Kvalitet", prompt: "Var offerten tydlig?" },
  { area: "Kvalitet", prompt: "Är ni nöjda med kvaliteten?" },
  { area: "Kvalitet", prompt: "Är vår personal kunnig?" },
  { area: "Kvalitet", prompt: "Är ni nöjda med priset?" },
  { area: "Kvalitet", prompt: "Håller vi utlovad leveranstid?" },
  { area: "Kvalitet", prompt: "Får ni besked om något blir sent?" },
  { area: "Kvalitet", prompt: "Är ni nöjda när vi rättar ett fel?" },
  { area: "Kvalitet", prompt: "Skulle ni anlita oss igen?" },
];

function asArea(value: string): QuestionArea {
  return AREAS.includes(value as QuestionArea) ? (value as QuestionArea) : "Kvalitet";
}

function asGrade(value: number): CustomerGrade {
  if (value === 1 || value === 3) return value;
  return 2;
}

function asScores(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  const scores: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const score = Number(raw);
    if (score >= 1 && score <= 6) scores[key] = score;
  }
  return scores;
}

export function reviewPercent(scores: Record<string, number>) {
  const values = Object.values(scores).filter((score) => score >= 1 && score <= 6);
  if (!values.length) return null;
  return Math.round((values.reduce((sum, score) => sum + score, 0) / (values.length * 6)) * 100);
}

export function reviewBand(percent: number) {
  if (percent >= 86) return "Mycket bra";
  if (percent >= 71) return "Bra";
  if (percent >= 61) return "Godkänd";
  if (percent >= 51) return "Godkänd, flera saker att bli bättre på";
  return "Underkänd";
}

export function customerTableMessage(error: unknown) {
  const text = error instanceof Error ? error.message : String(error ?? "");
  if (/could not find the table|schema cache|does not exist/i.test(text)) {
    return "Kunderna saknas i databasen. Kör supabase/schema_kunder.sql i Supabase.";
  }
  return text || "Kunde inte läsa kunderna.";
}

export async function loadCustomers(organizationId: string) {
  const supabase = createClient();
  const [customers, questions, reviews] = await Promise.all([
    supabase
      .from("customers")
      .select("id, customer_number, company, contact_name, our_contact, email, phone, grade, note")
      .eq("organization_id", organizationId)
      .order("company"),
    supabase
      .from("customer_questions")
      .select("id, area, prompt, sort_order")
      .eq("organization_id", organizationId)
      .order("sort_order"),
    supabase
      .from("customer_reviews")
      .select("id, customer_id, reviewed_on, filled_by, comment, scores")
      .eq("organization_id", organizationId)
      .order("reviewed_on", { ascending: false }),
  ]);
  if (customers.error) throw customers.error;
  if (questions.error) throw questions.error;
  if (reviews.error) throw reviews.error;
  return {
    customers: (customers.data ?? []).map(
      (row): CustomerItem => ({
        id: String(row.id),
        customerNumber: String(row.customer_number ?? ""),
        company: String(row.company),
        contactName: String(row.contact_name ?? ""),
        ourContact: String(row.our_contact ?? ""),
        email: String(row.email ?? ""),
        phone: String(row.phone ?? ""),
        grade: asGrade(Number(row.grade)),
        note: String(row.note ?? ""),
      }),
    ),
    questions: (questions.data ?? []).map(
      (row): CustomerQuestion => ({
        id: String(row.id),
        area: asArea(String(row.area)),
        prompt: String(row.prompt),
        sortOrder: Number(row.sort_order ?? 0),
      }),
    ),
    reviews: (reviews.data ?? []).map(
      (row): CustomerReview => ({
        id: String(row.id),
        customerId: String(row.customer_id),
        reviewedOn: String(row.reviewed_on).slice(0, 10),
        filledBy: row.filled_by === "kund" ? "kund" : "oss",
        comment: String(row.comment ?? ""),
        scores: asScores(row.scores),
      }),
    ),
  };
}

export async function createCustomer(organizationId: string, company: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({ organization_id: organizationId, company })
    .select("id")
    .single();
  if (error) throw error;
  return {
    id: String(data.id),
    customerNumber: "",
    company,
    contactName: "",
    ourContact: "",
    email: "",
    phone: "",
    grade: 2 as const,
    note: "",
  } satisfies CustomerItem;
}

export async function saveCustomer(customer: CustomerItem) {
  const supabase = createClient();
  const { error } = await supabase
    .from("customers")
    .update({
      customer_number: customer.customerNumber,
      company: customer.company.trim() || "Ny kund",
      contact_name: customer.contactName,
      our_contact: customer.ourContact,
      email: customer.email,
      phone: customer.phone,
      grade: customer.grade,
      note: customer.note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customer.id);
  if (error) throw error;
}

export async function deleteCustomer(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}

export async function addExampleQuestions(organizationId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("customer_questions").insert(
    EXAMPLE_QUESTIONS.map((item, index) => ({
      organization_id: organizationId,
      area: item.area,
      prompt: item.prompt,
      sort_order: index + 1,
    })),
  );
  if (error) throw error;
}

export async function createQuestion(organizationId: string, sortOrder: number) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("customer_questions")
    .insert({ organization_id: organizationId, prompt: "Ny fråga", sort_order: sortOrder })
    .select("id")
    .single();
  if (error) throw error;
  return { id: String(data.id), area: "Kvalitet" as const, prompt: "Ny fråga", sortOrder };
}

export async function saveQuestion(question: CustomerQuestion) {
  const supabase = createClient();
  const { error } = await supabase
    .from("customer_questions")
    .update({ area: question.area, prompt: question.prompt.trim() || "Ny fråga", sort_order: question.sortOrder })
    .eq("id", question.id);
  if (error) throw error;
}

export async function deleteQuestion(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("customer_questions").delete().eq("id", id);
  if (error) throw error;
}

export async function createReview(organizationId: string, customerId: string) {
  const supabase = createClient();
  const reviewedOn = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("customer_reviews")
    .insert({ organization_id: organizationId, customer_id: customerId, reviewed_on: reviewedOn, filled_by: "oss" })
    .select("id")
    .single();
  if (error) throw error;
  return {
    id: String(data.id),
    customerId,
    reviewedOn,
    filledBy: "oss" as const,
    comment: "",
    scores: {},
  } satisfies CustomerReview;
}

export async function saveReview(review: CustomerReview) {
  const supabase = createClient();
  const { error } = await supabase
    .from("customer_reviews")
    .update({
      reviewed_on: review.reviewedOn || new Date().toISOString().slice(0, 10),
      filled_by: review.filledBy,
      comment: review.comment,
      scores: review.scores,
    })
    .eq("id", review.id);
  if (error) throw error;
}

export async function deleteReview(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("customer_reviews").delete().eq("id", id);
  if (error) throw error;
}
