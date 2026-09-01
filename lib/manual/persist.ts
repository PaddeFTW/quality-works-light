import { createClient } from "@/lib/supabase/client";
import { slugifyTitle } from "@/lib/manual/tree-ops";
import { defaultDocumentContent } from "@/components/manual/manual-data";
import type { ManualSettings } from "@/components/manual/manual-settings-panel";
import { uploadAttachment } from "@/lib/manual/cloud";

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
) {
  const supabase = createClient();
  await persistDraft(documentId, content);
  const { data, error } = await supabase
    .from("document_versions")
    .insert({
      document_id: documentId,
      edition,
      content_html: content,
      published_by: userId,
    })
    .select("id, edition, content_html, published_at")
    .single();
  if (error || !data) throw error ?? new Error("Publicering misslyckades");
  return data;
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
    const { error } = await supabase.storage.from("manual-attachments").remove([storagePath]);
    if (error) throw error;
  }
  const { error } = await supabase.from("attachments").delete().eq("id", attachmentId);
  if (error) throw error;
}

export async function persistReview(documentId: string, userId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("document_reviews").upsert({
    document_id: documentId,
    requested_by: userId,
    status: "pending",
  }, { onConflict: "document_id" });
  if (error) throw error;
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
