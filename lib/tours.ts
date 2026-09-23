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
      { title: "Nytt kapitel", body: "Den här knappen skapar 1.0, sedan 2.0. Du behöver inte leta i menyn.", target: "[data-tour='nytt-kapitel']" },
      { title: "Nytt underavsnitt", body: "Klicka först ett kapitel. Sedan den här knappen. Då blir det 1.1 under det kapitlet.", target: "[data-tour='underavsnitt']" },
      { title: "Skriv här", body: "Papperet i mitten är där texten ska stå.", target: "[data-tour='papper']" },
      { title: "Spara", body: "Spara medan du skriver. Publicera när texten stämmer.", target: "[data-tour='spara']" },
    ],
  },
  {
    id: "arshjul",
    steps: [
      { title: "Årshjulet", body: "Här ligger jobb som kommer varje år.", target: "[data-tour='sidhuvud']" },
      { title: "Ett klick", body: "Klicka Intern revision. Då läggs den in.", target: "[data-tour='preset']" },
    ],
  },
  {
    id: "avvikelse",
    steps: [
      { title: "Avvikelse", body: "När något inte stämmer, lämna det här.", target: "[data-tour='sidhuvud']" },
      { title: "Noll är bra", body: "Tom lista betyder att inget fel är anmält.", target: "[data-tour='sidhuvud']" },
    ],
  },
  {
    id: "forslag",
    steps: [
      { title: "Förslag", body: "En idé som gör jobbet bättre.", target: "[data-tour='sidhuvud']" },
      { title: "Alla får lämna", body: "Admin tar vidare eller säger nej.", target: "[data-tour='sidhuvud']" },
    ],
  },
  {
    id: "kompetens",
    steps: [
      { title: "Vem kan vad", body: "Raderna är personer. Kolumnerna är kompetenser.", target: "[data-tour='matris']" },
      { title: "Tre val", body: "I rutan väljer du Saknas, Utbildas eller Kan.", target: "[data-tour='matris']" },
    ],
  },
  {
    id: "mal",
    steps: [
      { title: "Målen", body: "Till vänster är målen, samlade efter område.", target: "[data-tour='mallista']" },
      { title: "Ett mål i taget", body: "Skriv hur ni ser att det går, och vem som håller i det.", target: "[data-tour='malform']" },
    ],
  },
  {
    id: "miljo",
    steps: [
      { title: "Aspekterna", body: "Till vänster är det som påverkar miljön.", target: "[data-tour='miljolista']" },
      { title: "Poängen", body: "1 är liten påverkan. 5 är störst. Spara.", target: "[data-tour='miljoform']" },
    ],
  },
  {
    id: "lagar",
    steps: [
      { title: "Laglistan", body: "Till vänster är lagarna, samlade efter område.", target: "[data-tour='laglista']" },
      { title: "En lag i taget", body: "Till höger skriver du vad lagen betyder för er, hur ni följer den, och länken.", target: "[data-tour='lagform']" },
    ],
  },
  {
    id: "installningar",
    steps: [
      { title: "Inställningar", body: "Namn, tema, personer och paket sitter här.", target: "[data-tour='sidhuvud']" },
      { title: "Paket", body: "Gratis räcker för Manualen. Betala när ni behöver mer.", target: "[data-tour='sidhuvud']" },
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
  if (path.startsWith("/mal")) return TOURS.find((item) => item.id === "mal") ?? null;
  if (path.startsWith("/miljoaspekter")) return TOURS.find((item) => item.id === "miljo") ?? null;
  if (path.startsWith("/lagar")) return TOURS.find((item) => item.id === "lagar") ?? null;
  if (path.startsWith("/installningar")) return TOURS.find((item) => item.id === "installningar") ?? null;
  return null;
}

export function tourStorageKey(id: string) {
  return `qw.tour.v2.${id}`;
}

export function startTourEvent() {
  window.dispatchEvent(new Event("qw:start-tour"));
}
