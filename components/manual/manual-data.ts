export interface ManualNode {
  id: string;
  title: string;
  children?: ManualNode[];
}

export const manualTree: ManualNode[] = [
  { id: "forsattsblad", title: "Försättsblad" },
  { id: "innehallsforteckning", title: "Innehållsförteckning" },
  {
    id: "policyer",
    title: "Policyer",
    children: [
      { id: "kvalitetspolicy", title: "Kvalitetspolicy" },
      { id: "miljopolicy", title: "Miljöpolicy" },
      { id: "arbetsmiljopolicy", title: "Arbetsmiljöpolicy" },
    ],
  },
  {
    id: "mal",
    title: "Mål",
    children: [
      { id: "kvalitetsmal", title: "Kvalitetsmål" },
      { id: "miljomal", title: "Miljömål" },
    ],
  },
  {
    id: "processer",
    title: "Processer",
    children: [
      { id: "ledningsprocess", title: "Ledningsprocess" },
      { id: "huvudprocess", title: "Huvudprocess" },
      { id: "stodprocess", title: "Stödprocess" },
    ],
  },
  {
    id: "rutiner",
    title: "Rutiner",
    children: [
      { id: "avvikelsehantering", title: "Avvikelsehantering" },
      { id: "dokumentstyrning", title: "Dokumentstyrning" },
      { id: "internrevision", title: "Internrevision" },
    ],
  },
  {
    id: "roller",
    title: "Roller och ansvar",
    children: [{ id: "ansvarsfordelning", title: "Ansvarsfördelning" }],
  },
  { id: "bilagor", title: "Bilagor" },
];

export const defaultDocumentContent = `Syfte

Detta dokument beskriver hur verksamheten arbetar systematiskt med kvalitet, miljö och arbetsmiljö.

Omfattning

Dokumentet gäller för samtliga medarbetare och samtliga enheter inom verksamheten.

Genomförande

1. Verksamhetens mål fastställs årligen av ledningen.
2. Avvikelser registreras och följs upp löpande.
3. Resultat granskas vid ledningens genomgång.

Ansvar

Kvalitetsansvarig ansvarar för att dokumentet hålls uppdaterat och att ändringar kommuniceras till berörda roller.`;

export function findNodeById(
  nodes: ManualNode[],
  id: string,
): ManualNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const match = findNodeById(node.children ?? [], id);
    if (match) return match;
  }
  return undefined;
}
