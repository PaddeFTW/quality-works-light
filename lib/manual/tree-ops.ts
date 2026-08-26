import type { ManualNode } from "@/components/manual/manual-data";

export function slugifyTitle(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "dokument"}-${Date.now().toString(36)}`;
}

export function cloneTree(nodes: ManualNode[]): ManualNode[] {
  return nodes.map((node) => ({
    ...node,
    children: node.children ? cloneTree(node.children) : undefined,
  }));
}

export function findNode(nodes: ManualNode[], id: string): ManualNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const match = node.children ? findNode(node.children, id) : undefined;
    if (match) return match;
  }
  return undefined;
}

export function findParentId(nodes: ManualNode[], id: string, parentId: string | null = null): string | null {
  for (const node of nodes) {
    if (node.id === id) return parentId;
    if (node.children) {
      const match = findParentId(node.children, id, node.id);
      if (match !== undefined && findNode(nodes, id)) {
        const nested = findNode(node.children, id);
        if (nested) return findParentId(node.children, id, node.id);
      }
    }
  }
  return null;
}

export function getParentId(nodes: ManualNode[], id: string): string | null {
  for (const node of nodes) {
    if ((node.children ?? []).some((child) => child.id === id)) return node.id;
    const nested = getParentId(node.children ?? [], id);
    if (nested) return nested;
  }
  return null;
}

export function listFolders(nodes: ManualNode[], trail = ""): { id: string; label: string }[] {
  const result: { id: string; label: string }[] = [];
  for (const node of nodes) {
    if (node.kind === "folder") {
      const label = trail ? `${trail} / ${node.title}` : node.title;
      result.push({ id: node.id, label });
      result.push(...listFolders(node.children ?? [], label));
    }
  }
  return result;
}

export function listDocuments(nodes: ManualNode[]): ManualNode[] {
  const result: ManualNode[] = [];
  for (const node of nodes) {
    if (node.kind === "document") result.push(node);
    if (node.children) result.push(...listDocuments(node.children));
  }
  return result;
}

function mapTree(nodes: ManualNode[], mapper: (node: ManualNode) => ManualNode): ManualNode[] {
  return nodes.map((node) => {
    const next = mapper(node);
    return {
      ...next,
      children: next.children ? mapTree(next.children, mapper) : undefined,
    };
  });
}

export function renameNode(nodes: ManualNode[], id: string, title: string): ManualNode[] {
  return mapTree(nodes, (node) => (node.id === id ? { ...node, title } : node));
}

export function removeNode(nodes: ManualNode[], id: string): ManualNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => ({
      ...node,
      children: node.children ? removeNode(node.children, id) : undefined,
    }));
}

export function insertNode(
  nodes: ManualNode[],
  parentId: string | null,
  newNode: ManualNode,
): ManualNode[] {
  if (!parentId) return [...nodes, newNode];
  return nodes.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        kind: "folder",
        children: [...(node.children ?? []), newNode],
      };
    }
    return {
      ...node,
      children: node.children ? insertNode(node.children, parentId, newNode) : node.children,
    };
  });
}

export function moveNode(
  nodes: ManualNode[],
  id: string,
  newParentId: string | null,
): ManualNode[] {
  const node = findNode(nodes, id);
  if (!node) return nodes;
  if (id === newParentId) return nodes;
  const without = removeNode(nodes, id);
  return insertNode(without, newParentId, node);
}

export function firstDocumentId(nodes: ManualNode[]): string | null {
  for (const node of nodes) {
    if (node.kind === "document") return node.id;
    const nested = firstDocumentId(node.children ?? []);
    if (nested) return nested;
  }
  return null;
}
