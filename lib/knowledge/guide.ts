export interface GuideArticle {
  id: string;
  title: string;
  body: string;
  place?: "manual" | "start" | "arshjul" | "all";
}

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    id: "start-forst",
    place: "start",
    title: "Vad gör jag först?",
    body: "Öppna Manualen och skriv hur ni jobbar. Noll avvikelser är bra. Det betyder att inget fel är anmält.",
  },
  {
    id: "start-inbjudan",
    place: "start",
    title: "Hur bjuder jag in någon?",
    body: "Gå till Inställningar. Skriv personens e-post. Klicka Skicka inbjudan. Hen får ett mejl med en länk.",
  },
  {
    id: "start-arshjul",
    place: "start",
    title: "Vad är Årshjulet?",
    body: "Kalendern för jobb som kommer varje år. Intern revision, skyddsrond och ledningens genomgång. Klicka Årshjul i menyn till vänster.",
  },
  {
    id: "manual-vad",
    place: "manual",
    title: "Vad är Manualen?",
    body: "Det är boken för hur ni jobbar. Till vänster är kapitel. I mitten är papperet. Original är det som gäller. Arbetsmanual är kladden.",
  },
  {
    id: "manual-10",
    place: "manual",
    title: "Skapa första bladet",
    body: "Klicka Skapa 1.0. Numret låses. Namnet väljer du själv. Ledningssystemet är bara ett förslag.",
  },
  {
    id: "manual-spara",
    place: "manual",
    title: "Spara och publicera",
    body: "Spara medan du skriver. Publicera när texten stämmer. Då kan andra läsa originalet.",
  },
  {
    id: "manual-remiss",
    place: "manual",
    title: "Vad är remiss?",
    body: "Du skickar bladet till någon i företaget. Hen svarar Godkänn eller Avstyrk. Vänta in svaret innan du publicerar.",
  },
  {
    id: "revision",
    place: "all",
    title: "Intern revision",
    body: "Ett återkommande jobb. Lägg det i Årshjulet. Då syns datumet på Start. Du kan också lägga in det från ett blad i Manualen.",
  },
  {
    id: "arshjul-tom",
    place: "arshjul",
    title: "Hur fyller jag årshjulet?",
    body: "Om det är tomt: klicka Intern revision, Skyddsrond eller Ledningens genomgång. Ett klick räcker. Sen kan du byta datum.",
  },
];

export function articlesFor(place: GuideArticle["place"]) {
  return GUIDE_ARTICLES.filter((item) => item.place === place || item.place === "all");
}
