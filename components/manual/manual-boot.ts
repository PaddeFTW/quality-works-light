"use client";

import { createClient } from "@/lib/supabase/client";
import {
  draftsFromRows,
  ensureManual,
  loadAttachments,
  loadManualBundle,
  loadReviews,
  rowsToTree,
  settingsFromManual,
  versionsFromRows,
} from "@/lib/manual/cloud";
import type { ManualNode } from "@/components/manual/manual-data";
import type { ManualSettings } from "@/components/manual/manual-settings-panel";
import type { DocumentVersion, ManualAttachment, ReviewRequest } from "@/types/domain";

const LAST_OPENED_KEY = "qw.manual.lastOpened";

export interface BootResult {
  manualId: string;
  tree: ManualNode[];
  drafts: Record<string, string>;
  settings: ManualSettings;
  versions: Record<string, DocumentVersion[]>;
  selectedId: string | null;
  lastOpenedId: string | null;
  attachments: Record<string, ManualAttachment[]>;
  reviews: ReviewRequest[];
}

export async function bootManualFromCloud(
  organizationId: string,
  existingManualId: string | null,
): Promise<BootResult> {
  const supabase = createClient();
  const manualId = await ensureManual(supabase, organizationId, existingManualId);
  let bundle = await loadManualBundle(supabase, manualId);
  const tree = rowsToTree(bundle.docs);
  const documentIds = bundle.docs.filter((row) => row.kind === "document").map((row) => row.id);
  const [attachments, reviews] = await Promise.all([
    loadAttachments(supabase, documentIds).catch(() => ({})),
    loadReviews(supabase, documentIds).catch(() => []),
  ]);
  const storedOpened = typeof window === "undefined" ? null : window.localStorage.getItem(LAST_OPENED_KEY);
  const selectedId = storedOpened && bundle.docs.some((row) => row.id === storedOpened)
    ? storedOpened
    : null;
  return {
    manualId,
    tree,
    drafts: draftsFromRows(bundle.docs),
    settings: bundle.manual
      ? settingsFromManual(bundle.manual)
      : {
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
    reviews,
    selectedId,
    lastOpenedId: selectedId,
  };
}

export function rememberLastOpened(id: string) {
  window.localStorage.setItem(LAST_OPENED_KEY, id);
}
