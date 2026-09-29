"use client";

import { useMemo, useState } from "react";

import { SmartWorkspacePanel } from "@/components/common/smart-workspace-panel";
import { useOrgSession } from "@/components/providers/org-provider";
import type { WorkspaceAppContract, WorkspaceContext } from "@/lib/workspace/context";
import { demoCompanyContext } from "@/lib/workspace/company";
import type { FieldInstance } from "@/lib/workspace/field-contract";

const initialFields: FieldInstance[] = [
  { id: "customer_name", label: "Kund", type: "text", required: true, ai_writable: true, value: "", placeholder: "Kundnamn" },
  { id: "contact_person", label: "Kontaktperson", type: "text", required: false, ai_writable: true, value: "", placeholder: "Namn" },
  { id: "rating", label: "Betyg", type: "rating", required: false, ai_writable: true, value: "", min: 1, max: 5 },
  { id: "comment", label: "Kommentar", type: "textarea", required: false, ai_writable: true, value: "", multiline: true },
  { id: "follow_up_date", label: "Uppföljningsdatum", type: "date", required: false, ai_writable: true, value: "" },
];

export function QwlSmartWorkspace() {
  const { session } = useOrgSession();
  const [fields, setFields] = useState(initialFields);

  const contract = useMemo<WorkspaceAppContract>(() => {
    const context: WorkspaceContext = {
      app_id: "quality-works-light",
      app_name: "Quality WorX Light",
      locale: "sv",
      page_id: "dashboard",
      record_id: session?.organizationId ?? "demo-company",
      user_role: session?.role,
      permissions: { canOpenWorkspace: true, canApplyWorkspace: true },
      fields,
      company: session?.organizationId
        ? { ...demoCompanyContext, company_id: session.organizationId, display_name: session.organizationName || demoCompanyContext.display_name }
        : demoCompanyContext,
    };

    return {
      app_id: context.app_id,
      app_name: context.app_name,
      workspace_enabled: true,
      locale: context.locale,
      getContext: () => context,
      applyFieldUpdates: async ({ changes }) => {
        setFields((current) => current.map((field) => {
          const update = changes.find((change) => change.field_id === field.id);
          return update ? { ...field, value: update.new_value } : field;
        }));
        return { ok: true, applied_field_ids: changes.map((change) => change.field_id) };
      },
    };
  }, [fields, session?.organizationId, session?.organizationName, session?.role]);

  return <SmartWorkspacePanel contract={contract} />;
}
