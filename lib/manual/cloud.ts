import type { ManualNode, ManualNodeKind } from "@/components/manual/manual-data";
import { defaultDocumentContent, defaultManualTree } from "@/components/manual/manual-data";
import type { DocumentVersion, ManualAttachment } from "@/types/domain";
import type { ManualSettings } from "@/components/manual/manual-settings-panel";
import type { SupabaseClient } from "@supabase/supabase-js";

interface DocRow {
  id: string;
  manual_id: string;
  parent_id: string | null;
  slug: string;
  title: string;
  kind: ManualNodeKind;
  sort_order: number;
  draft_html: string;
}

function flattenSeed(
  nodes: ManualNode[],
  parentId: string | null,
  acc: { parentId: string | null; node: ManualNode; order: number }[] = [],
): { parentId: string | null; node: ManualNode; order: number }[] {
  nodes.forEach((node, index) => {
    acc.push({ parentId, node, order: index });
    if (node.children?.length) flattenSeed(node.children, node.id, acc);
  });
  return acc;
}

export function rowsToTree(rows: DocRow[]): ManualNode[] {
  const byParent = new Map<string | null, DocRow[]>();
  for (const row of rows) {
    const key = row.parent_id;
    const list = byParent.get(key) ?? [];
    list.push(row);
    byParent.set(key, list);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.sort_order - b.sort_order);
  }
  const walk = (parentId: string | null): ManualNode[] =>
    (byParent.get(parentId) ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      kind: row.kind === "folder" ? "folder" : "document",
      children: walk(row.id),
    }));
  return walk(null);
}

export async function ensureManual(
  supabase: SupabaseClient,
  organizationId: string,
  existingManualId: string | null,
): Promise<string> {
  if (existingManualId) return existingManualId;
  const { data, error } = await supabase
    .from("manual-attachments")
    .insert({
      organization_id: organizationId,
      name: "Kvalitetsmanual",
      header_text: "Kvalitetsmanual",
      footer_text: "Internt dokument. Utskrift gäller endast utskriftsdagen.",
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Kunde inte skapa manual");
  return data.id;
}

export async function loadManualBundle(supabase: SupabaseClient, manualId: string) {
  const [{ data: manual }, { data: docs }, { data: versions }] = await Promise.all([
    supabase.from("manual-attachments").select("*").eq("id", manualId).single(),
    supabase
      .from("manual_documents")
      .select("id, manual_id, parent_id, slug, title, kind, sort_order, draft_html")
      .eq("manual_id", manualId),
    supabase
      .from("document_versions")
      .select("id, document_id, edition, content_html, published_at, published_by")
      .order("edition", { ascending: false }),
  ]);

  return {
    manual,
    docs: (docs ?? []) as DocRow[],
    versions: versions ?? [],
  };
}

export async function loadAttachments(supabase: SupabaseClient, documentIds: string[]) {
  if (documentIds.length === 0) return {} as Record<string, ManualAttachment[]>;
  const { data, error } = await supabase
    .from("attachments")
    .select("id, document_id, file_name, file_size, mime_type, storage_path, created_at")
    .in("document_id", documentIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const result: Record<string, ManualAttachment[]> = {};
  for (const row of data ?? []) {
    const signed = await supabase.storage.from("manual-attachments").createSignedUrl(row.storage_path, 3600);
    const item: ManualAttachment = {
      id: row.id,
      name: row.file_name,
      size: row.file_size < 1024 ? `${row.file_size} B` : `${Math.round(row.file_size / 1024)} KB`,
      type: row.mime_type || "Fil",
      storagePath: row.storage_path,
      url: signed.data?.signedUrl,
    };
    result[row.document_id] = [...(result[row.document_id] ?? []), item];
  }
  return result;
}

export async function seedDefaultDocuments(
  supabase: SupabaseClient,
  manualId: string,
) {
  const flat = flattenSeed(defaultManualTree, null);
  const idMap = new Map<string, string>();

  for (const item of flat) {
    const parentDbId = item.parentId ? (idMap.get(item.parentId) ?? null) : null;
    const { data, error } = await supabase
      .from("manual_documents")
      .insert({
        manual_id: manualId,
        parent_id: parentDbId,
        slug: item.node.id,
        title: item.node.title,
        kind: item.node.kind,
        sort_order: item.order,
        draft_html: item.node.kind === "document" ? defaultDocumentContent : "",
      })
      .select("id")
      .single();
    if (error || !data) throw error ?? new Error("Kunde inte skapa dokument");
    idMap.set(item.node.id, data.id);
  }
}

export function settingsFromManual(manual: {
  name?: string | null;
  issuer?: string | null;
  reviewer?: string | null;
  approver?: string | null;
  logo_url?: string | null;
  header_text?: string | null;
  footer_text?: string | null;
}): ManualSettings {
  return {
    name: manual.name ?? "Kvalitetsmanual",
    issuer: manual.issuer ?? "",
    reviewer: manual.reviewer ?? "",
    approver: manual.approver ?? "",
    logo: manual.logo_url ?? "",
    headerText: manual.header_text ?? "",
    footerText: manual.footer_text ?? "",
  };
}

export function draftsFromRows(rows: DocRow[]): Record<string, string> {
  const drafts: Record<string, string> = {};
  for (const row of rows) {
    if (row.kind === "document") drafts[row.id] = row.draft_html || defaultDocumentContent;
  }
  return drafts;
}

export function versionsFromRows(
  rows: { id: string; document_id: string; edition: number; content_html: string; published_at: string }[],
): Record<string, DocumentVersion[]> {
  const map: Record<string, DocumentVersion[]> = {};
  for (const row of rows) {
    const list = map[row.document_id] ?? [];
    list.push({
      id: row.id,
      edition: row.edition,
      content: row.content_html,
      publishedAt: new Date(row.published_at).toLocaleString("sv-SE"),
    });
    map[row.document_id] = list;
  }
  return map;
}

export async function uploadAttachment(
  supabase: SupabaseClient,
  organizationId: string,
  documentId: string,
  userId: string,
  file: File,
): Promise<ManualAttachment> {
  const path = `${organizationId}/${documentId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("manual-attachments")
    .upload(path, file);
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("attachments")
    .insert({
      document_id: documentId,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      storage_path: path,
      uploaded_by: userId,
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Kunde inte spara bilaga");

  const { data: signed } = await supabase.storage
    .from("manual-attachments")
    .createSignedUrl(path, 60 * 60);

  return {
    id: data.id,
    name: file.name,
    size: file.size < 1024 ? `${file.size} B` : `${Math.round(file.size / 1024)} KB`,
    type: file.type || "Fil",
    storagePath: path,
    url: signed?.signedUrl,
  };
}
