import type { WorkspaceContext } from "./context";
import type { Proposal, ProposalChange, ProposalWarning, SourceRef } from "./proposal";

export function createDemoProposal(inputText: string, context: WorkspaceContext): Proposal {
  const text = inputText.trim();
  const lower = text.toLocaleLowerCase("sv");
  const sources: SourceRef[] = [
    { id: "src_user", level: "user_input", label: "Din text", excerpt: text },
    { id: "src_ai", level: "ai_interpretation", label: "Tolkning" },
  ];
  const warnings: ProposalWarning[] = [];
  const changes: ProposalChange[] = [];
  const add = (fieldId: string, newValue: unknown, confidence: 0 | 1 | 2 | 3, reason: string, sourceRef: string, warningIds?: string[]) => {
    const field = context.fields.find((item) => item.id === fieldId);
    if (!field || !field.ai_writable || Object.is(field.value, newValue)) return;
    changes.push({ field_id: field.id, label: field.label, old_value: field.value, new_value: newValue, confidence, reason, source_ref: sourceRef, warning_ids: warningIds });
  };
  const fieldIdFor = (...ids: string[]) => ids.find((id) => context.fields.some((field) => field.id === id));
  const customerField = fieldIdFor("customer_name", "company_name");
  const contactField = fieldIdFor("contact_person", "contact_name");
  const ratingField = fieldIdFor("rating", "customer_rating", "satisfaction_score");
  const followUpField = fieldIdFor("follow_up_date", "follow_up_task", "follow_up");
  const noteField = fieldIdFor("comment", "note");

  const lines = text.split(/\r?\n|[,;]+/).map((line) => line.trim()).filter(Boolean);
  const compactNames = text.match(/^(.+?)\s+([A-ZÅÄÖ][\p{L}-]+)\s+\d\s*av\s*5/iu);
  const customer = text.match(/kunden är\s+([^.!?]+)/i)?.[1]?.trim() ?? (lines.length >= 4 ? lines[0] : compactNames?.[1]?.trim());
  if (customer && customerField) add(customerField, customer.replace(/\s+(?:är|och)$/, ""), 3, "Kunden namngavs i texten.", "src_user");
  const contact = text.match(/([A-ZÅÄÖ][\p{L}-]+) är kontaktperson/iu)?.[1] ?? (lines.length >= 4 ? lines[1] : compactNames?.[2]);
  if (contact && contactField) add(contactField, contact, 3, "Kontaktperson namngavs i texten.", "src_user");
  const rating = text.match(/(\d)\s*av\s*5/i)?.[1];
  if (rating && ratingField) add(ratingField, Number(rating), 3, "Användaren angav ett betyg.", "src_user");
  if (rating && noteField && !ratingField) {
    const warningId = "w_rating_note";
    warnings.push({ id: warningId, field_id: noteField, code: "unmapped_input", message: "Betyget saknar ett eget fält och föreslås därför som anteckning." });
    add(noteField, `Kundbetyg: ${rating}/5.`, 2, "Betyget mappades till den tillgängliga anteckningen.", "src_user", [warningId]);
  }
  const month = lower.match(/(?:i\s+)?(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)/);
  if (month) {
    const months = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
    const dateWarning = "w_date";
    warnings.push({ id: dateWarning, field_id: "follow_up_date", code: "ambiguous_date", message: "Ingen dag angavs. Kontrollera datumet innan du godkänner." });
    const followUpValue = followUpField ? `Följ upp kunden i ${month[1]}` : noteField ? `Följ upp kunden i ${month[1]}.` : null;
    if (followUpValue) add(followUpField ?? noteField!, followUpValue, 2, "En uppföljning med månad föreslogs i texten.", "src_user", followUpField ? [dateWarning] : [dateWarning]);
  }

  return { proposal_id: `prp_${Date.now()}`, created_at: new Date().toISOString(), app_id: context.app_id, record_id: context.record_id, input_text: text, status: "draft", changes, warnings, sources };
}
