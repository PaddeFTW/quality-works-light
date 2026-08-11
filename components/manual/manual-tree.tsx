"use client";

import { useMemo, useState } from "react";
import { ChevronRight, FileText, Folder, FolderOpen, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ManualNode } from "@/components/manual/manual-data";

interface ManualTreeProps {
  nodes: ManualNode[];
  selectedId: string;
  onSelect: (node: ManualNode) => void;
}

function matchesQuery(node: ManualNode, query: string): boolean {
  if (node.title.toLowerCase().includes(query)) return true;
  return (node.children ?? []).some((child) => matchesQuery(child, query));
}

function filterNodes(nodes: ManualNode[], query: string): ManualNode[] {
  if (!query) return nodes;
  return nodes.reduce<ManualNode[]>((accumulator, node) => {
    if (node.title.toLowerCase().includes(query)) {
      accumulator.push(node);
      return accumulator;
    }
    const children = filterNodes(node.children ?? [], query);
    if (children.length > 0) {
      accumulator.push({ ...node, children });
    }
    return accumulator;
  }, []);
}

export function ManualTree({ nodes, selectedId, onSelect }: ManualTreeProps) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<string[]>([]);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleNodes = useMemo(
    () => filterNodes(nodes, normalizedQuery),
    [nodes, normalizedQuery],
  );

  function toggleFolder(id: string) {
    setCollapsed((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function renderNode(node: ManualNode, depth: number) {
    const hasChildren = (node.children ?? []).length > 0;
    // While searching, keep every matching branch open.
    const isOpen = normalizedQuery ? true : !collapsed.includes(node.id);
    const isSelected = node.id === selectedId;

    if (hasChildren) {
      return (
        <li key={node.id}>
          <button
            aria-expanded={isOpen}
            className="flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left text-sm font-medium text-foreground transition-token hover:bg-accent hover:text-accent-foreground"
            onClick={() => toggleFolder(node.id)}
            style={{ paddingLeft: `${depth * 0.75 + 0.375}rem` }}
            type="button"
          >
            <ChevronRight
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground transition-transform",
                isOpen && "rotate-90",
              )}
            />
            {isOpen ? (
              <FolderOpen className="size-4 shrink-0 text-primary" />
            ) : (
              <Folder className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate">{node.title}</span>
          </button>
          {isOpen ? (
            <ul>
              {(node.children ?? []).map((child) => renderNode(child, depth + 1))}
            </ul>
          ) : null}
        </li>
      );
    }

    return (
      <li key={node.id}>
        <button
          aria-current={isSelected ? "page" : undefined}
          className={cn(
            "flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left text-sm transition-token",
            isSelected
              ? "bg-primary/10 font-medium text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
          onClick={() => onSelect(node)}
          style={{ paddingLeft: `${depth * 0.75 + 0.375}rem` }}
          type="button"
        >
          <span className="size-3.5 shrink-0" aria-hidden="true" />
          <FileText
            className={cn(
              "size-4 shrink-0",
              isSelected ? "text-primary" : "text-muted-foreground",
            )}
          />
          <span className="truncate">{node.title}</span>
        </button>
      </li>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-3 border-b px-4 py-4">
        <h2 className="text-base font-semibold tracking-tight">Manual</h2>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Sök i manualen"
            className="h-9 pl-9"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Sök dokument"
            value={query}
          />
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <nav aria-label="Manualens dokumentträd" className="px-2 py-3">
          {visibleNodes.length > 0 ? (
            <ul>{visibleNodes.map((node) => renderNode(node, 0))}</ul>
          ) : (
            <p className="px-3 py-6 text-sm text-muted-foreground">
              Inga dokument matchar sökningen.
            </p>
          )}
        </nav>
      </ScrollArea>
    </div>
  );
}
