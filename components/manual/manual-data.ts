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
