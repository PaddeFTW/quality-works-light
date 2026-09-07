export type ManualNodeKind = "folder" | "document";

export interface ManualNode {
  id: string;
  title: string;
  kind: ManualNodeKind;
  children?: ManualNode[];
}

export const defaultManualTree: ManualNode[] = [
  { id: "forsattsblad", title: "Försättsblad", kind: "document" },
  { id: "innehallsforteckning", title: "Innehållsförteckning", kind: "document" },
  {
    id: "policyer",
    title: "Policyer",
    kind: "folder",
    children: [
      { id: "kvalitetspolicy", title: "Kvalitetspolicy", kind: "document" },
      { id: "miljopolicy", title: "Miljöpolicy", kind: "document" },
      { id: "arbetsmiljopolicy", title: "Arbetsmiljöpolicy", kind: "document" },
    ],
  },
  {
    id: "mal",
    title: "Mål",
    kind: "folder",
    children: [
      { id: "kvalitetsmal", title: "Kvalitetsmål", kind: "document" },
      { id: "miljomal", title: "Miljömål", kind: "document" },
    ],
  },
  {
    id: "processer",
    title: "Processer",
    kind: "folder",
    children: [
      { id: "ledningsprocess", title: "Ledningsprocess", kind: "document" },
      { id: "huvudprocess", title: "Huvudprocess", kind: "document" },
      { id: "stodprocess", title: "Stödprocess", kind: "document" },
    ],
  },
  {
    id: "rutiner",
    title: "Rutiner",
    kind: "folder",
    children: [
      { id: "avvikelsehantering", title: "Avvikelsehantering", kind: "document" },
      { id: "dokumentstyrning", title: "Dokumentstyrning", kind: "document" },
      { id: "internrevision", title: "Internrevision", kind: "document" },
    ],
  },
  {
    id: "roller",
    title: "Roller och ansvar",
    kind: "folder",
    children: [{ id: "ansvarsfordelning", title: "Ansvarsfördelning", kind: "document" }],
  },
  { id: "bilagor", title: "Bilagor", kind: "folder", children: [] },
];

/** @deprecated use defaultManualTree */
export const manualTree = defaultManualTree;

export const defaultDocumentContent = "<p></p>";

export function nodeNumber(path: number[]): string {
  return `${path.join(".")}.0`;
}

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
