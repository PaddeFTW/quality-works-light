export type ConsultAnswer = {
  title: string;
  body: string;
  source: string;
};

type Entry = ConsultAnswer & { keys: string[] };

const ENTRIES: Entry[] = [
  {
    keys: ["först", "börja", "komma igång", "start"],
    title: "Börja i Manualen",
    body: "Skriv hur ni jobbar i Manualen. Det är texten andra ska följa. Årshjulet är datumen. Avvikelse är när något inte stämde.",
    source: "Vägledning i programmet",
  },
  {
    keys: ["manual", "dokument", "publicera", "original", "arbetsmanual", "utgåva"],
    title: "Manualen",
    body: "Arbetsmanual är det du skriver. Original är det som gäller efter att du publicerat. Spara ofta. Publicera när texten stämmer. Numret på dokumentet låses när du skapar det.",
    source: "Vägledning i programmet",
  },
  {
    keys: ["årshjul", "arshjul", "årshjulet", "skyddsrond", "genomgång"],
    title: "Årshjulet",
    body: "Lägg in jobb som återkommer: intern revision, skyddsrond och ledningens genomgång. Försenade jobb syns på Start.",
    source: "Vägledning i programmet",
  },
  {
    keys: ["revision", "intern revision"],
    title: "Intern revision",
    body: "Det är ett jobb ni gör själva för att se att ni arbetar som Manualen säger. Lägg datumet i Årshjulet. Frågelista är ett senare steg.",
    source: "Vägledning i programmet",
  },
  {
    keys: ["avvikelse", "avvikelser", "brist", "fel"],
    title: "Avvikelse",
    body: "Skriv vad som hänt, vad ni gör åt det, vem som håller i det och när det ska vara klart. Noll öppna är bra. Det betyder att inget är anmält, inte att ni saknar system.",
    source: "Vägledning i programmet",
  },
  {
    keys: ["förslag", "förbättring", "idé"],
    title: "Förslag",
    body: "Ett förslag är en idé som kan göra arbetet bättre. Alla kan lämna. Någon med behörighet tar det vidare eller avslår.",
    source: "Vägledning i programmet",
  },
  {
    keys: ["personal", "bjuda", "inbjudan", "behörighet", "roll", "lösenord"],
    title: "Personal och behörighet",
    body: "Öppna Personal eller Inställningar. Skriv personens e-post, välj roll och skicka inbjudan. Läsare kan läsa. Den som ska ändra behöver en högre roll.",
    source: "Vägledning i programmet",
  },
  {
    keys: ["lag", "lagar", "lagefterlevnad"],
    title: "Lagar",
    body: "Välj lagen. Skriv vad den betyder för er, hur ni följer den, och lägg länken till lagtexten. Programmet skriver inte lagtexten åt er.",
    source: "Vägledning i programmet",
  },
  {
    keys: ["miljö", "miljo", "aspekt"],
    title: "Miljöaspekt",
    body: "Skriv vad som påverkar miljön, välj område, sätt en siffra från 1 till 5 och skriv vad ni gör åt det. Spara.",
    source: "Vägledning i programmet",
  },
  {
    keys: ["mål", "mal"],
    title: "Mål",
    body: "Skriv vad ni vill bli bättre på, hur ni ser att det går och vem som håller i det. Spara.",
    source: "Vägledning i programmet",
  },
  {
    keys: ["iso", "9001", "14001", "45001", "standard", "krav", "klausul", "certifiering"],
    title: "Om ISO-kraven",
    body: "Jag återger inte standardtexten. ISO 9001 handlar om kvalitet, ISO 14001 om miljö och ISO 45001 om arbetsmiljö. I programmet visar ni det genom Manualen, Årshjulet, avvikelser och mål. Säg vilket arbete ni vill göra, så visar jag steget.",
    source: "Vägledning i programmet. Standardtexten ligger inte här.",
  },
  {
    keys: ["kund", "kunder", "omdöme"],
    title: "Kunder",
    body: "Lägg till kunden, kontaktperson, e-post och telefon. Omdömet är vad ni tror att kunden tycker, eller kundens egna svar. Spara när uppgifterna stämmer.",
    source: "Vägledning i programmet",
  },
  {
    keys: ["leverantör", "leverantor"],
    title: "Leverantörer",
    body: "En leverantör är någon ni köper av. Bedömningen gör ni själva. Skriv vem det är och vad ni kom fram till. Spara.",
    source: "Vägledning i programmet",
  },
];

const STOP = new Set(["och", "att", "det", "en", "ett", "i", "på", "är", "hur", "vad", "jag", "vi", "ni", "om", "för", "ska", "den", "detta", "med"]);

function words(text: string) {
  return text
    .toLocaleLowerCase("sv")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 2 && !STOP.has(word));
}

export function consult(question: string): ConsultAnswer {
  const asked = words(question);
  if (asked.length === 0) {
    return {
      title: "Skriv en fråga",
      body: "Skriv vad du vill göra. Till exempel: hur publicerar jag, eller vad är en avvikelse.",
      source: "Vägledning i programmet",
    };
  }
  let best: Entry | null = null;
  let score = 0;
  for (const entry of ENTRIES) {
    const hit = entry.keys.reduce((sum, key) => (asked.some((word) => key.includes(word) || word.includes(key)) ? sum + 1 : sum), 0);
    if (hit > score) {
      score = hit;
      best = entry;
    }
  }
  if (!best || score === 0) {
    return {
      title: "Det står inte i vägledningen",
      body: "Jag hittar inte på ett krav. Fråga om Manualen, Årshjulet, avvikelse, personal, lagar, miljö eller mål.",
      source: "Ingen källa",
    };
  }
  return { title: best.title, body: best.body, source: best.source };
}
