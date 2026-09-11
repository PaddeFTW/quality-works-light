export type ManualNodeKind = "folder" | "document";

export interface ManualNode {
  id: string;
  title: string;
  kind: ManualNodeKind;
  children?: ManualNode[];
}

export const defaultManualTree: ManualNode[] = [];
export const manualTree = defaultManualTree;
export const defaultDocumentContent = "<p></p>";

export function findNodeById(nodes: ManualNode[], id: string): ManualNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const match = findNodeById(node.children ?? [], id);
    if (match) return match;
  }
  return undefined;
}

export function getNodeNumber(nodes: ManualNode[], id: string, path: number[] = []): string | null {
  for (let index = 0; index < nodes.length; index += 1) {
    const next = [...path, index + 1];
    if (nodes[index].id === id) return next.length === 1 ? `${next[0]}.0` : next.join(".");
    const child = getNodeNumber(nodes[index].children ?? [], id, next);
    if (child) return child;
  }
  return null;
}

export function countPlainText(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
}
