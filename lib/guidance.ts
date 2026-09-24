/** Regel: hjälp är förslag. Aldrig tvång. */

export const GUIDANCE_RULE = {
  id: "forslag-inte-tvang",
  title: "Förslag, inte tvång",
  summary:
    "Programmet får visa hur ett ledningssystem ofta byggs. Användaren får alltid välja själv. Ett förslag ska kunna stängas. Efter stängning ska förslaget gå att öppna igen med en liten lampa.",
} as const;

const STORAGE_PREFIX = "qw.hint.dismissed.";

export interface GuidanceHintData {
  id: string;
  title: string;
  body: string;
  applyValue?: string;
  applyLabel?: string;
}

export const FIRST_DOCUMENT_HINT: GuidanceHintData = {
  id: "manual.first-document",
  title: "Ett vanligt första namn",
  body: "Många börjar manualen med Ledningssystemet. Klicka på knappen om du vill använda det. Annars skriv ett eget namn.",
  applyValue: "Ledningssystemet",
  applyLabel: "Använd Ledningssystemet",
};

export const SUBSECTION_HINT: GuidanceHintData = {
  id: "manual.subsection",
  title: "Namn på underdokument",
  body: "Skriv vad avsnittet handlar om. Till exempel Ansvar eller Hur vi gör. Numret sätts automatiskt.",
};

export function isHintDismissed(id: string) {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(`${STORAGE_PREFIX}${id}`) === "1";
}

export function setHintDismissed(id: string, dismissed: boolean) {
  if (typeof window === "undefined") return;
  const key = `${STORAGE_PREFIX}${id}`;
  if (dismissed) window.localStorage.setItem(key, "1");
  else window.localStorage.removeItem(key);
}
