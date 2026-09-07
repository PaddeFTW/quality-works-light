"use client";

import { useMemo, useState } from "react";
import { ChevronRight, FileText, Folder, FolderOpen, MoreHorizontal, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ManualNode } from "@/components/manual/manual-data";

interface ManualTreeProps {
  nodes: ManualNode[];
  selectedId: string | null;
  lastOpenedId?: string | null;
  onSelect: (node: ManualNode) => void;
  onRename: (node: ManualNode) => void;
  onHide: (node: ManualNode) => void;
  onNewDocument: (parentId: string | null) => void;
}

function filterNodes(nodes: ManualNode[], query: string): ManualNode[] {
  if (!query) return nodes;
  return nodes.reduce<ManualNode[]>((result, node) => {
    const children = filterNodes(node.children ?? [], query);
    if (node.title.toLowerCase().includes(query) || children.length) result.push({ ...node, children });
    return result;
  }, []);
}

export function ManualTree({ nodes, selectedId, lastOpenedId, onSelect, onRename, onHide, onNewDocument }: ManualTreeProps) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleNodes = useMemo(() => filterNodes(nodes, normalizedQuery), [nodes, normalizedQuery]);

  function renderNode(node: ManualNode, depth: number, path: number[]) {
    if (hidden.includes(node.id)) return null;
    const isFolder = node.kind === "folder";
    const isOpen = normalizedQuery ? true : !collapsed.includes(node.id);
    const isSelected = node.id === selectedId;
    const number = `${path.join(".")}.0`;
    return (
      <li key={node.id}>
        <div className={cn("group flex w-full items-center rounded-md pr-1 text-sm", isSelected ? "bg-primary/10 font-medium text-primary" : lastOpenedId === node.id ? "bg-accent/60 text-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")} style={{ paddingLeft: `${depth * 0.75 + 0.25}rem` }}>
          {isFolder ? <button aria-expanded={isOpen} className="shrink-0 p-1" onClick={() => setCollapsed((current) => current.includes(node.id) ? current.filter((id) => id !== node.id) : [...current, node.id])} type="button"><ChevronRight className={cn("size-3.5 transition-transform", isOpen && "rotate-90")} /></button> : <span className="size-5 shrink-0" aria-hidden="true" />}
          <button aria-current={isSelected ? "page" : undefined} className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left" onClick={() => onSelect(node)} type="button">
            {isFolder ? (isOpen ? <FolderOpen className="size-4 shrink-0 text-primary" /> : <Folder className="size-4 shrink-0" />) : <FileText className="size-4 shrink-0" />}
            <span className="truncate"><span className="mr-2 font-mono text-xs text-muted-foreground">{number}</span>{node.title}</span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button className="size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100" size="icon" variant="ghost"><MoreHorizontal className="size-4" /><span className="sr-only">Åtgärder för {node.title}</span></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onNewDocument(node.id)}>Skapa underavsnitt</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRename(node)}>Byt namn</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setHidden((current) => [...current, node.id]); onHide(node); }}>Dölj</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {isFolder && isOpen ? <ul>{(node.children ?? []).map((child, index) => renderNode(child, depth + 1, [...path, index + 1]))}</ul> : null}
      </li>
    );
  }

  return <div className="flex h-full min-h-0 flex-col bg-sidebar">
    <div className="flex flex-col gap-3 border-b px-4 py-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Dokument</p><h2 className="text-base font-semibold tracking-tight">Arbetsmanual</h2></div><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Sök i manualen" className="h-9 pl-9" onChange={(event) => setQuery(event.target.value)} placeholder="Sök dokument" value={query} /></div></div>
    <ScrollArea className="min-h-0 flex-1"><nav aria-label="Manualens dokumentträd" className="px-2 py-4">{visibleNodes.length ? <ul>{visibleNodes.map((node, index) => renderNode(node, 0, [index + 1]))}</ul> : <p className="px-3 py-6 text-sm text-muted-foreground">Manualen är tom.</p>}</nav></ScrollArea>
  </div>;
}

export type { ManualTreeProps };
