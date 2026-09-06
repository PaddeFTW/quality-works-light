export type ManualNodeKind = "folder" | "document";

export interface ManualNode {
  id: string;
  title: string;
  kind: ManualNodeKind;
  children?: ManualNode[];
}

export const defaultManualTree: ManualNode[] = [];

/** @deprecated use defaultManualTree */
export const manualTree = defaultManualTree;

export const defaultDocumentContent = `<h2>Syfte</h2>
<p>Detta dokument beskriver hur verksamheten arbetar systematiskt med kvalitet, miljö och arbetsmiljö.</p>
<h2>Omfattning</h2>
<p>Dokumentet gäller för samtliga medarbetare och samtliga enheter inom verksamheten.</p>
<h2>Genomförande</h2>
<ol>
<li>Verksamhetens mål fastställs årligen av ledningen.</li>
<li>Avvikelser registreras och följs upp löpande.</li>
<li>Resultat granskas vid ledningens genomgång.</li>
</ol>
<h2>Ansvar</h2>
<p>Kvalitetsansvarig ansvarar för att dokumentet hålls uppdaterat och att ändringar kommuniceras till berörda roller.</p>`;

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
