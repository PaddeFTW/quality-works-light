import type { FieldInstance } from "./field-contract";

export type FillHit = {
  field_id: string;
  label: string;
  value: string;
  reason: string;
};

export type FillMiss = {
  field_id: string;
  label: string;
};

export type FillExtra = {
  id: string;
  label: string;
  value: string;
};

export type FillAnalysis = {
  hits: FillHit[];
  missing: FillMiss[];
  extras: FillExtra[];
};

const KIND_BY_ID: Record<string, string> = {
  company_name: "company",
  customer_name: "company",
  contact_person: "contact",
  contact_name: "contact",
  our_contact: "our_contact",
  email: "email",
  phone: "phone",
  customer_number: "number",
  note: "note",
  comment: "note",
};

function kindOf(field: FieldInstance) {
  if (KIND_BY_ID[field.id]) return KIND_BY_ID[field.id];
  const label = field.label.toLocaleLowerCase("sv");
  if (label.includes("e-post") || label.includes("epost")) return "email";
  if (label.includes("telefon")) return "phone";
  if (label.includes("kundnummer")) return "number";
  if (label.includes("vår kontakt")) return "our_contact";
  if (label.includes("kontakt")) return "contact";
  if (label.includes("företag") || label.includes("kundnamn") || label.includes("leverantör")) return "company";
  if (label.includes("anteckning") || label.includes("beskrivning")) return "note";
  return "";
}

export function cleanPhone(raw: string) {
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+46")) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith("46") && digits.length >= 10) digits = `0${digits.slice(2)}`;
  if (/^0\d{8,10}$/.test(digits)) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return raw.trim();
}

function clean(value: string) {
  return value.replace(/\s+/g, " ").replace(/[.,;:]+$/g, "").trim();
}

function extractCompany(text: string) {
  const named = text.match(/(?:kund(?:en)?|företag(?:et)?|leverantör(?:en)?|kundnamn)\s*(?:är|heter|:)\s*([^.,;\n]+)/i);
  if (named?.[1]) return clean(named[1]);
  const leading = text.match(/^([A-ZÅÄÖ][^.\n]{1,80}?)\s+(?:grundades|arbetar|jobbar|är ett|är en)/u);
  if (leading?.[1]) return clean(leading[1]);
  const firm = text.match(/\b([A-ZÅÄÖ][\p{L}\d& .'’-]*?\s(?:AB|HB|KB))\b/u);
  return firm?.[1] ? clean(firm[1]) : null;
}

function extractContact(text: string) {
  const named = text.match(/kontaktperson(?:en)?\s*(?:är|heter|:)\s*([A-ZÅÄÖ][\p{L}’'-]+(?:\s+[A-ZÅÄÖ][\p{L}’'-]+){0,2})/iu);
  if (named?.[1]) return clean(named[1]);
  const before = text.match(/([A-ZÅÄÖ][\p{L}’'-]+(?:\s+[A-ZÅÄÖ][\p{L}’'-]+){0,2})\s+är kontaktperson/iu);
  return before?.[1] ? clean(before[1]) : null;
}

function extractOurContact(text: string) {
  const named = text.match(/vår kontakt(?:person)?\s*(?:är|heter|:)\s*([A-ZÅÄÖ][\p{L}’'-]+(?:\s+[A-ZÅÄÖ][\p{L}’'-]+){0,2})/iu);
  return named?.[1] ? clean(named[1]) : null;
}

function extractEmail(text: string) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
}

function extractPhone(text: string) {
  const match = text.match(/(?:\+46|0)\s*(?:\d[\s-]?){7,12}\d/);
  return match ? cleanPhone(match[0]) : null;
}

function extractNumber(text: string) {
  const match = text.match(/kundnummer\s*(?:är|:)?\s*([A-Za-z0-9-]+)/i);
  return match?.[1] ? clean(match[1]) : null;
}

function extractNote(text: string) {
  const work = text.match(/(?:arbetar|jobbar)\s+(?:främst\s+)?med\s+([^.!\n]+)/i);
  return work?.[1] ? `Arbetar med ${clean(work[1])}.` : null;
}

function extractExtras(text: string, used: Set<string>): FillExtra[] {
  const extras: FillExtra[] = [];
  const staff = text.match(/(?:cirka|ca\.?|ungefär)?\s*(\d{1,5})\s+anställda/i);
  if (staff?.[1]) extras.push({ id: "extra_staff", label: "Antal anställda", value: staff[1] });
  const certMatch = text.match(/ISO\s*\d{4,5}(?:\s*(?:,|och)\s*(?:ISO\s*)?\d{4,5})*/i);
  const uniqueCerts = certMatch ? [...certMatch[0].matchAll(/\d{4,5}/g)].map((item) => `ISO ${item[0]}`) : [];
  if (uniqueCerts.length) extras.push({ id: "extra_certs", label: "Certifieringar", value: uniqueCerts.join(", ") });
  const org = text.match(/organisationsnummer\s*(?:är|:)?\s*(\d{6}-?\d{4})/i);
  if (org?.[1] && !used.has("org")) extras.push({ id: "extra_org", label: "Organisationsnummer", value: org[1] });
  return extras;
}

const REASONS: Record<string, string> = {
  company: "Företagsnamnet stod i texten.",
  contact: "Kontaktpersonen stod i texten.",
  our_contact: "Vår kontakt stod i texten.",
  email: "E-postadressen stod i texten.",
  phone: "Telefonnumret stod i texten.",
  number: "Kundnumret stod i texten.",
  note: "Verksamheten stod i texten.",
};

export function analyzeModuleText(text: string, fields: FieldInstance[]): FillAnalysis {
  const source = text.trim();
  const found: Record<string, string | null> = {
    company: extractCompany(source),
    contact: extractContact(source),
    our_contact: extractOurContact(source),
    email: extractEmail(source),
    phone: extractPhone(source),
    number: extractNumber(source),
    note: extractNote(source),
  };
  const hits: FillHit[] = [];
  const missing: FillMiss[] = [];
  const used = new Set<string>();

  for (const field of fields) {
    if (!field.ai_writable) continue;
    const kind = kindOf(field);
    if (!kind) continue;
    if (used.has(kind)) continue;
    used.add(kind);
    const value = found[kind];
    if (!value || String(field.value ?? "") === value) {
      if (!value) missing.push({ field_id: field.id, label: field.label });
      continue;
    }
    hits.push({ field_id: field.id, label: field.label, value, reason: REASONS[kind] ?? "Hittades i texten." });
  }

  return { hits, missing, extras: extractExtras(source, used) };
}
