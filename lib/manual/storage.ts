import { defaultManualTree, type ManualNode } from "@/components/manual/manual-data";

const TREE_KEY = "qwl-manual-tree";
const DRAFTS_KEY = "qwl-manual-drafts";
const SETTINGS_KEY = "qwl-manual-settings";

export function loadTree(): ManualNode[] {
  if (typeof window === "undefined") return defaultManualTree;
  try {
    const raw = window.localStorage.getItem(TREE_KEY);
    if (!raw) return defaultManualTree;
    const parsed = JSON.parse(raw) as ManualNode[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultManualTree;
  } catch {
    return defaultManualTree;
  }
}

export function saveTree(nodes: ManualNode[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TREE_KEY, JSON.stringify(nodes));
}

export function loadDrafts(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(DRAFTS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function saveDrafts(drafts: Record<string, string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

export function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export { SETTINGS_KEY };
