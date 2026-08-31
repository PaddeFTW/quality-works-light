"use client";

import { createClient } from "@/lib/supabase/client";
import {
  draftsFromRows,
  ensureManual,
  loadAttachments,
  loadManualBundle,
  rowsToTree,
  seedDefaultDocuments,
  settingsFromManual,
  versionsFromRows,
} from "@/lib/manual/cloud";
import type { ManualNode } from "@/components/manual/manual-data";
import type { ManualSettings } from "@/components/manual/manual-settings-panel";
import type { DocumentVersion } from "@/types/domain";
import { firstDocumentId } from "@/lib/manual/tree-ops";

export interface BootResult {
  manualId: string;
  tree: ManualNode[];
  drafts: Record<string, string>;
  settings: ManualSettings;
  versions: Record<string, DocumentVersion[]>;
  selectedId: string | null;
  attachments: Record<string, import("@/types/domain").ManualAttachment[]>;
}

export async function bootManualFromCloud(
  organizationId: string,
  existingManualId: string | null,
): Promise<BootResult> {
  const supabase = createClient();
  const manualId = await ensureManual(supabase, organizationId, existingManualId);
  let bundle = await loadManualBundle(supabase, manualId);
  if ((bundle.docs ?? []).length === 0) {
    await seedDefaultDocuments(supabase, manualId);
    bundle = await loadManualBundle(supabase, manualId);
  }
  const tree = rowsToTree(bundle.docs);
  const attachments = await loadAttachments(supabase, bundle.docs.filter((row) => row.kind === "document").map((row) => row.id));
  return {
    manualId,
    tree,
    drafts: draftsFromRows(bundle.docs),
    settings: bundle.manual ? settingsFromManual(bundle.manual) : {
      name: "Kvalitetsmanual",
      issuer: "",
      reviewer: "",
      approver: "",
      logo: "",
      headerText: "",
      footerText: "",
    },
    versions: versionsFromRows(bundle.versions ?? []),
    attachments,
    selectedId: firstDocumentId(tree),
  };
}
