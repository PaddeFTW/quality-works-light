import type { ReviewRequest, ReviewStatus } from "@/types/domain";

interface ReferralPayload {
  dueAt?: string;
  text?: string;
  response?: string;
}

export function encodeReferralMessage(dueAt: string, text: string, response = "") {
  return JSON.stringify({ dueAt, text, response } satisfies ReferralPayload);
}

export function decodeReferralMessage(raw: string | null | undefined): Required<ReferralPayload> {
  if (!raw) return { dueAt: "", text: "", response: "" };
  try {
    const parsed = JSON.parse(raw) as ReferralPayload;
    if (parsed && typeof parsed === "object") {
      return {
        dueAt: parsed.dueAt ?? "",
        text: parsed.text ?? "",
        response: parsed.response ?? "",
      };
    }
  } catch {
    /* plain text from older rows */
  }
  return { dueAt: "", text: raw, response: "" };
}

export function mapReviewRow(row: {
  id: string;
  document_id: string;
  reviewer_user_id?: string | null;
  reviewer_name?: string | null;
  status: string;
  message?: string | null;
  created_at: string;
  requested_by?: string | null;
}): ReviewRequest {
  const payload = decodeReferralMessage(row.message);
  return {
    id: row.id,
    documentId: row.document_id,
    reviewerUserId: row.reviewer_user_id ?? undefined,
    reviewerName: row.reviewer_name ?? "",
    requestedBy: row.requested_by ?? undefined,
    status: row.status as ReviewStatus,
    createdAt: row.created_at,
    message: payload.text,
    dueAt: payload.dueAt,
    responseText: payload.response,
  };
}

export function openReferralFor(reviews: ReviewRequest[], documentId: string | null) {
  if (!documentId) return null;
  return reviews.find((item) => item.documentId === documentId && item.status === "pending") ?? null;
}

export function latestReferralFor(reviews: ReviewRequest[], documentId: string | null) {
  if (!documentId) return null;
  return reviews.find((item) => item.documentId === documentId) ?? null;
}
