import { createClient } from "@/lib/supabase/client";
import { slugifyTitle } from "@/lib/manual/tree-ops";
import { defaultDocumentContent } from "@/components/manual/manual-data";
import type { ManualSettings } from "@/components/manual/manual-settings-panel";
import { MANUAL_BUCKET, uploadAttachment } from "@/lib/manual/cloud";
import { encodeReferralMessage, mapReviewRow } from "@/lib/manual/referral";

export async function persistDraft(documentId: string, html: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("manual_documents")
    .update({ draft_html: html, updated_at: new Date().toISOString() })
    .eq("id", documentId);
  if (error) throw error;
}

export async function persistSettings(manualId: string, settings: ManualSettings) {
  const supabase = createClient();
  const { error } = await supabase
    .from("manuals")
    .update({
      name: settings.name,
      issuer: settings.issuer,
      reviewer: settings.reviewer,
      approver: settings.approver,
      logo_url: settings.logo || null,
      header_text: settings.headerText,
      footer_text: settings.footerText,
      updated_at: new Date().toISOString(),
    })
    .eq("id", manualId);
  if (error) throw error;
}

export async function persistPublish(
  documentId: string,
  content: string,
  edition: number,
  userId: string,
  changeNote = "",
) {
  const supabase = createClient();
  await persistDraft(documentId, content);
  const row = {
    document_id: documentId,
    edition,
    content_html: content,
    published_by: userId,
    change_note: changeNote,
  };
  let result = await supabase.from("document_versions").insert(row).select("id, edition, content_html, published_at").single();
  if (result.error && /change_note|column/i.test(result.error.message)) {
    const { change_note: _note, ...without } = row;
    result = await supabase.from("document_versions").insert(without).select("id, edition, content_html, published_at").single();
  }
  if (result.error || !result.data) throw result.error ?? new Error("Publicering misslyckades");
  await supabase
    .from("manual_documents")
    .update({ review_status: "approved", updated_at: new Date().toISOString() })
    .eq("id", documentId);
  return result.data;
}

export async function persistCreate(params: {
  manualId: string;
  parentId: string | null;
  title: string;
  kind: "folder" | "document";
  html?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("manual_documents")
    .insert({
      manual_id: params.manualId,
      parent_id: params.parentId,
      slug: slugifyTitle(params.title),
      title: params.title,
      kind: params.kind,
      sort_order: 99,
      draft_html: params.kind === "document" ? (params.html ?? defaultDocumentContent) : "",
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Kunde inte skapa dokument");
  return data.id as string;
}

export async function persistRename(id: string, title: string) {
  const supabase = createClient();
  const { error } = await supabase.from("manual_documents").update({ title }).eq("id", id);
  if (error) throw error;
}

export async function persistMove(id: string, parentId: string | null) {
  const supabase = createClient();
  const { error } = await supabase
    .from("manual_documents")
    .update({ parent_id: parentId })
    .eq("id", id);
  if (error) throw error;
}

export async function persistDelete(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("manual_documents").delete().eq("id", id);
  if (error) throw error;
}

export async function persistAck(documentId: string, userId: string, edition: number) {
  const supabase = createClient();
  const { error } = await supabase.from("document_acknowledgements").insert({
    document_id: documentId,
    user_id: userId,
    edition,
  });
  if (error && !error.message.toLowerCase().includes("duplicate")) throw error;
}

export async function persistDeleteAttachment(attachmentId: string, storagePath?: string) {
  const supabase = createClient();
  if (storagePath) {
    const first = await supabase.storage.from(MANUAL_BUCKET).remove([storagePath]);
    if (first.error) {
      await supabase.storage.from("manual-attachments").remove([storagePath]);
    }
  }
  const { error } = await supabase.from("attachments").delete().eq("id", attachmentId);
  if (error) throw error;
}

export async function persistReview(documentId: string, userId: string) {
  return persistReviewSend({
    documentId,
    requestedBy: userId,
    reviewerUserId: null,
    reviewerName: "",
    dueAt: "",
    message: "",
  });
}

export async function persistReviewSend(params: {
  documentId: string;
  requestedBy: string;
  reviewerUserId: string | null;
  reviewerName: string;
  dueAt: string;
  message: string;
}) {
  const supabase = createClient();
  const { error: statusError } = await supabase
    .from("manual_documents")
    .update({ review_status: "pending", updated_at: new Date().toISOString() })
    .eq("id", params.documentId);
  if (statusError) throw statusError;
  const { data, error } = await supabase
    .from("review_requests")
    .insert({
      document_id: params.documentId,
      requested_by: params.requestedBy,
      reviewer_user_id: params.reviewerUserId,
      reviewer_name: params.reviewerName,
      status: "pending",
      message: encodeReferralMessage(params.dueAt, params.message),
    })
    .select("id, document_id, reviewer_user_id, reviewer_name, status, message, created_at, requested_by")
    .single();
  if (error || !data) throw error ?? new Error("Kunde inte skicka remiss");
  return mapReviewRow(data);
}

export async function persistReviewRespond(params: {
  reviewId: string;
  documentId: string;
  status: "approved" | "rejected";
  dueAt: string;
  instruction: string;
  response: string;
}) {
  const supabase = createClient();
  const { error } = await supabase
    .from("review_requests")
    .update({
      status: params.status,
      resolved_at: new Date().toISOString(),
      message: encodeReferralMessage(params.dueAt, params.instruction, params.response),
    })
    .eq("id", params.reviewId);
  if (error) throw error;
  await supabase
    .from("manual_documents")
    .update({
      review_status: params.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.documentId);
}

export async function persistReviewClose(documentId: string) {
  const supabase = createClient();
  await supabase
    .from("review_requests")
    .update({ status: "approved", resolved_at: new Date().toISOString() })
    .eq("document_id", documentId)
    .eq("status", "pending");
  await supabase
    .from("manual_documents")
    .update({ review_status: "approved", updated_at: new Date().toISOString() })
    .eq("id", documentId);
}

export async function persistFiles(
  organizationId: string,
  documentId: string,
  userId: string,
  files: FileList,
) {
  const supabase = createClient();
  const uploaded = [];
  for (const file of Array.from(files)) {
    uploaded.push(await uploadAttachment(supabase, organizationId, documentId, userId, file));
  }
  return uploaded;
}
