import { createClient } from "@/lib/supabase/client";

export type SupplierGrade = 1 | 2 | 3;
export type SupplierStatus = "approved" | "improve" | "only";

export interface SupplierItem {
  id: string;
  supplierNumber: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  grade: SupplierGrade;
  status: SupplierStatus;
  note: string;
}

export interface SupplierQuestion {
  id: string;
  prompt: string;
  sortOrder: number;
}

export interface SupplierReview {
  id: string;
  supplierId: string;
  reviewedOn: string;
  assessorName: string;
  comment: string;
  scores: Record<string, number>;
}

export const EXAMPLE_SUPPLIER_QUESTIONS = [
  "Skickar de orderbekräftelse?",
  "Hur är relationen med kontaktpersonen?",
  "Hur nöjda är vi med leveranstiderna?",
  "Håller de den tid de lovar?",
  "Kan de leverera snabbt när det är bråttom?",
  "Säger de till i tid om något blir sent?",
  "Hur hanterar de våra reklamationer?",
  "Hur sällan ger deras vara klagomål från våra kunder?",
  "Är priset bra jämfört med andra?",
  "Har de kunnig personal?",
  "Sköter de skatt och moms?",
];

function asGrade(value: number): SupplierGrade {
  if (value === 1 || value === 3) return value;
  return 2;
}

function asStatus(value: string): SupplierStatus {
  if (value === "approved" || value === "only") return value;
  return "improve";
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

export function supplierTableMessage(error: unknown) {
  const text = error instanceof Error ? error.message : String(error ?? "");
  if (/could not find the table|schema cache|does not exist/i.test(text)) {
    return "Leverantörerna saknas i databasen. Kör supabase/schema_leverantorer.sql i Supabase.";
  }
  return text || "Kunde inte läsa leverantörerna.";
}

export async function loadSuppliers(organizationId: string) {
  const supabase = createClient();
  const [suppliers, questions, reviews] = await Promise.all([
    supabase
      .from("suppliers")
      .select("id, supplier_number, company, contact_name, email, phone, address, grade, status, note")
      .eq("organization_id", organizationId)
      .order("company"),
    supabase.from("supplier_questions").select("id, prompt, sort_order").eq("organization_id", organizationId).order("sort_order"),
    supabase
      .from("supplier_reviews")
      .select("id, supplier_id, reviewed_on, assessor_name, comment, scores")
      .eq("organization_id", organizationId)
      .order("reviewed_on", { ascending: false }),
  ]);
  if (suppliers.error) throw suppliers.error;
  if (questions.error) throw questions.error;
  if (reviews.error) throw reviews.error;
  return {
    suppliers: (suppliers.data ?? []).map(
      (row): SupplierItem => ({
        id: String(row.id),
        supplierNumber: String(row.supplier_number ?? ""),
        company: String(row.company),
        contactName: String(row.contact_name ?? ""),
        email: String(row.email ?? ""),
        phone: String(row.phone ?? ""),
        address: String(row.address ?? ""),
        grade: asGrade(Number(row.grade)),
        status: asStatus(String(row.status)),
        note: String(row.note ?? ""),
      }),
    ),
    questions: (questions.data ?? []).map(
      (row): SupplierQuestion => ({
        id: String(row.id),
        prompt: String(row.prompt),
        sortOrder: Number(row.sort_order ?? 0),
      }),
    ),
    reviews: (reviews.data ?? []).map(
      (row): SupplierReview => ({
        id: String(row.id),
        supplierId: String(row.supplier_id),
        reviewedOn: String(row.reviewed_on).slice(0, 10),
        assessorName: String(row.assessor_name ?? ""),
        comment: String(row.comment ?? ""),
        scores: asScores(row.scores),
      }),
    ),
  };
}

export async function createSupplier(organizationId: string, company: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("suppliers").insert({ organization_id: organizationId, company }).select("id").single();
  if (error) throw error;
  return {
    id: String(data.id),
    supplierNumber: "",
    company,
    contactName: "",
    email: "",
    phone: "",
    address: "",
    grade: 2 as const,
    status: "improve" as const,
    note: "",
  } satisfies SupplierItem;
}

export async function saveSupplier(supplier: SupplierItem) {
  const supabase = createClient();
  const { error } = await supabase
    .from("suppliers")
    .update({
      supplier_number: supplier.supplierNumber,
      company: supplier.company.trim() || "Ny leverantör",
      contact_name: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      grade: supplier.grade,
      status: supplier.status,
      note: supplier.note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", supplier.id);
  if (error) throw error;
}

export async function deleteSupplier(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) throw error;
}

export async function addExampleQuestions(organizationId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("supplier_questions").insert(
    EXAMPLE_SUPPLIER_QUESTIONS.map((prompt, index) => ({
      organization_id: organizationId,
      prompt,
      sort_order: index + 1,
    })),
  );
  if (error) throw error;
}

export async function createQuestion(organizationId: string, sortOrder: number) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("supplier_questions")
    .insert({ organization_id: organizationId, prompt: "Ny fråga", sort_order: sortOrder })
    .select("id")
    .single();
  if (error) throw error;
  return { id: String(data.id), prompt: "Ny fråga", sortOrder };
}

export async function saveQuestion(question: SupplierQuestion) {
  const supabase = createClient();
  const { error } = await supabase
    .from("supplier_questions")
    .update({ prompt: question.prompt.trim() || "Ny fråga", sort_order: question.sortOrder })
    .eq("id", question.id);
  if (error) throw error;
}

export async function deleteQuestion(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("supplier_questions").delete().eq("id", id);
  if (error) throw error;
}

export async function createReview(organizationId: string, supplierId: string) {
  const supabase = createClient();
  const reviewedOn = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("supplier_reviews")
    .insert({ organization_id: organizationId, supplier_id: supplierId, reviewed_on: reviewedOn })
    .select("id")
    .single();
  if (error) throw error;
  return {
    id: String(data.id),
    supplierId,
    reviewedOn,
    assessorName: "",
    comment: "",
    scores: {},
  } satisfies SupplierReview;
}

export async function saveReview(review: SupplierReview) {
  const supabase = createClient();
  const { error } = await supabase
    .from("supplier_reviews")
    .update({
      reviewed_on: review.reviewedOn || new Date().toISOString().slice(0, 10),
      assessor_name: review.assessorName,
      comment: review.comment,
      scores: review.scores,
    })
    .eq("id", review.id);
  if (error) throw error;
}

export async function deleteReview(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("supplier_reviews").delete().eq("id", id);
  if (error) throw error;
}
