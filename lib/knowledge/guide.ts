export interface GuideArticle {
  id: string;
  title: string;
  body: string;
  place?: "manual" | "start" | "all";
}

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    id: "manual-nav",
    place: "manual",
    title: "Vad är Manualen?",
    body: "Manualen är boken för hur ni jobbar. Trädet till vänster är kapitel. Mitten är papperet. Original är det som gäller. Arbetsmanual är kladden.",
  },
  {
    id: "skapa-10",
    place: "manual",
    title: "Skapa 1.0",
    body: "Första bladet får nummer 1.0. Numret låses. Namnet väljer du. Många tar Ledningssystemet, men det är bara ett förslag.",
  },
  {
    id: "editor",
    place: "manual",
    title: "Skriva i bladet",
    body: "Markera text och välj typsnitt, storlek, färg och justering. Spara ofta. Öppna i Word laddar ner en fil som Word kan öppna.",
  },
  {
    id: "publicera",
    place: "manual",
    title: "Spara och publicera",
    body: "Spara ofta. Publicera när texten stämmer. Då låses en utgåva. Andra läser originalet, inte kladden.",
  },
  {
    id: "remiss",
    place: "manual",
    title: "Remiss",
    body: "Skicka bladet till en kollega. Hen svarar Godkänn eller Avstyrk. Du kan inte publicera medan du väntar.",
  },
  {
    id: "revision",
    place: "all",
    title: "Intern revision",
    body: "Klicka Intern revision i Manualen. Då hamnar en rad i Årshjulet. Sen syns den på Start. Det är samma kalender, inte en ny modul.",
  },
  {
    id: "start",
    place: "start",
    title: "Startsidan",
    body: "Start visar det som behöver göras nu: öppna avvikelser, förslag, årshjul och remisser.",
  },
];

export function articlesFor(place: GuideArticle["place"]) {
  return GUIDE_ARTICLES.filter((item) => item.place === place || item.place === "all");
}
