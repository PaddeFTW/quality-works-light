export interface GuideArticle {
  id: string;
  title: string;
  body: string;
  place?: "manual" | "start" | "arshjul" | "kompetens" | "all";
}

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    id: "start-forst",
    place: "start",
    title: "Vad gör jag först?",
    body: "Öppna Manualen och skriv hur ni jobbar. Noll avvikelser är bra. Det betyder att inget fel är anmält.",
  },
  {
    id: "personal",
    place: "start",
    title: "Hur bjuder jag in någon?",
    body: "Öppna Personal eller Inställningar. Skriv e-post. Välj roll. Klicka Skicka inbjudan. Hen får ett mejl.",
  },
  {
    id: "avvikelse",
    place: "start",
    title: "Vad är en avvikelse?",
    body: "När något inte stämmer med hur det ska vara. Lämna vad som hänt. Noll stycken är bra.",
  },
  {
    id: "forslag",
    place: "start",
    title: "Vad är ett förslag?",
    body: "En idé som gör arbetet bättre. Alla kan lämna. Admin tar vidare eller avslår.",
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
    id: "kompetens-matris",
    place: "kompetens",
    title: "Hur fyller jag i matrisen?",
    body: "Lägg till en kompetens, till exempel Truckkort. Välj Saknas, Utbildas eller Kan för varje person. Kan betyder att personen får göra jobbet.",
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
