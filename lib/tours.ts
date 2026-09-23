export interface TourStep {
  title: string;
  body: string;
  target?: string;
}

export interface Tour {
  id: string;
  steps: TourStep[];
}

const TOURS: Tour[] = [
  {
    id: "start",
    steps: [
      { title: "Det här är Start", body: "Här ser du vad du ska göra nu.", target: "[data-tour='idag']" },
      { title: "Öppna boken", body: "Klicka Öppna manual. Det är hjärtat i programmet.", target: "[data-tour='oppen-manual']" },
      { title: "Bjud in", body: "När du vill: Inställningar, skriv e-post, skicka.", target: "[data-tour='bjud-in']" },
    ],
  },
  {
    id: "manual",
    steps: [
      { title: "Innehållet", body: "Till vänster är kapitlen. Klicka ett blad.", target: "[data-tour='trad']" },
      { title: "Papperet", body: "I mitten skriver du. Klicka och börja.", target: "[data-tour='papper']" },
      { title: "Spara", body: "Spara ofta. Publicera när texten stämmer." },
    ],
  },
  {
    id: "arshjul",
    steps: [
      { title: "Årshjulet", body: "Här ligger jobb som kommer varje år." },
      { title: "Ett klick", body: "Tomt? Klicka Intern revision. Klart." },
    ],
  },
  {
    id: "avvikelse",
    steps: [
      { title: "Avvikelse", body: "När något inte stämmer, lämna det här." },
      { title: "Noll är bra", body: "Tom lista betyder att inget fel är anmält." },
    ],
  },
  {
    id: "forslag",
    steps: [
      { title: "Förslag", body: "En idé som gör jobbet bättre." },
      { title: "Alla får lämna", body: "Admin tar vidare eller säger nej." },
    ],
  },
  {
    id: "kompetens",
    steps: [
      { title: "Personal", body: "Här är personerna i företaget." },
      { title: "Bjud in", body: "Skriv e-post. Hen får en länk." },
    ],
  },
  {
    id: "installningar",
    steps: [
      { title: "Inställningar", body: "Namn, tema, personer och paket." },
      { title: "Paket", body: "Gratis räcker för Manualen. Betala när ni behöver mer." },
    ],
  },
];

export function tourForPath(path: string): Tour | null {
  if (path === "/") return TOURS[0];
  if (path.startsWith("/manual")) return TOURS[1];
  if (path.startsWith("/arshjul")) return TOURS[2];
  if (path.startsWith("/avvikelse")) return TOURS[3];
  if (path.startsWith("/forslag")) return TOURS[4];
  if (path.startsWith("/kompetens")) return TOURS[5];
  if (path.startsWith("/installningar")) return TOURS[6];
  return null;
}

export function tourStorageKey(id: string) {
  return `qw.tour.${id}`;
}

export function startTourEvent() {
  window.dispatchEvent(new Event("qw:start-tour"));
}
