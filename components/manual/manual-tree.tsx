"use client";

import { useMemo, useState, type KeyboardEvent, type MouseEvent } from "react";
import { ChevronRight, FileCheck, FileText, MoreHorizontal, PanelLeftClose, Search } from "lucide-react";
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
  publishedIds?: string[];
  onSelect: (node: ManualNode) => void;
  onRename: (node: ManualNode) => void;
  onHide: (node: ManualNode) => void;
  onNewDocument: (parentId: string | null) => void;
  onCollapse?: () => void;
}

function filterNodes(nodes: ManualNode[], query: string): ManualNode[] {
  if (!query) return nodes;
  return nodes.reduce<ManualNode[]>((result, node) => {
    const children = filterNodes(node.children ?? [], query);
    if (node.title.toLowerCase().includes(query) || children.length) result.push({ ...node, children });
    return result;
  }, []);
}

function flatten(nodes: ManualNode[], collapsed: string[], query: boolean): ManualNode[] {
  const list: ManualNode[] = [];
  const walk = (items: ManualNode[]) => {
    for (const node of items) {
      list.push(node);
      const open = query || !collapsed.includes(node.id);
      if (open && node.children?.length) walk(node.children);
    }
  };
  walk(nodes);
  return list;
}

export function ManualTree({
  nodes,
  selectedId,
  lastOpenedId,
  publishedIds = [],
  onSelect,
  onRename,
  onHide,
  onNewDocument,
  onCollapse,
}: ManualTreeProps) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [menuId, setMenuId] = useState<string | null>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleNodes = useMemo(() => filterNodes(nodes, normalizedQuery), [nodes, normalizedQuery]);
  const flat = useMemo(
    () => flatten(visibleNodes, collapsed, Boolean(normalizedQuery)).filter((node) => !hidden.includes(node.id)),
    [visibleNodes, collapsed, normalizedQuery, hidden],
  );

  function toggle(id: string) {
    setCollapsed((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = flat.findIndex((node) => node.id === selectedId);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = flat[Math.min(index + 1, flat.length - 1)];
      if (next) onSelect(next);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const prev = flat[Math.max(index - 1, 0)];
      if (prev) onSelect(prev);
    }
    const current = index >= 0 ? flat[index] : null;
    if (event.key === "ArrowRight" && current?.children?.length) {
      event.preventDefault();
      setCollapsed((list) => list.filter((id) => id !== current.id));
    }
    if (event.key === "ArrowLeft" && current) {
      event.preventDefault();
      if (current.children?.length && !collapsed.includes(current.id)) toggle(current.id);
    }
    if (event.key === "F2" && current) {
      event.preventDefault();
      onRename(current);
    }
    if (event.key === "Enter" && current) onSelect(current);
  }

  function renderNode(node: ManualNode, depth: number, path: number[]) {
    if (hidden.includes(node.id)) return null;
    const isOpen = normalizedQuery ? true : !collapsed.includes(node.id);
    const isSelected = node.id === selectedId;
    const hasChildren = (node.children?.length ?? 0) > 0;
    const number = path.length === 1 ? `${path[0]}.0` : path.join(".");
    return (
      <li key={node.id}>
        <div
          className={cn(
            "group flex w-full items-center border-l-2 pr-1 text-sm",
            isSelected
              ? "border-l-primary bg-primary/10 font-medium text-primary"
              : lastOpenedId === node.id
                ? "border-l-transparent bg-accent/60 text-foreground"
                : "border-l-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
          onContextMenu={(event: MouseEvent) => {
            event.preventDefault();
            onSelect(node);
            setMenuId(node.id);
          }}
          style={{ paddingLeft: `${depth * 0.85 + 0.2}rem` }}
        >
          {hasChildren ? (
            <button
              aria-expanded={isOpen}
              className="shrink-0 p-1"
              onClick={() => toggle(node.id)}
              type="button"
            >
              <ChevronRight className={cn("size-3.5 transition-transform", isOpen && "rotate-90")} />
            </button>
          ) : (
            <span className="size-5 shrink-0" aria-hidden="true" />
          )}
          <button
            aria-current={isSelected ? "page" : undefined}
            className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left"
            onClick={() => onSelect(node)}
            onDoubleClick={() => {
              if (hasChildren) toggle(node.id);
              else onSelect(node);
            }}
            type="button"
          >
            {publishedIds.includes(node.id) ? (
              <FileCheck className="size-4 shrink-0 text-emerald-600" />
            ) : (
              <FileText className="size-4 shrink-0" />
            )}
            <span className="truncate">
              <span className="mr-2 font-mono text-xs text-muted-foreground">{number}</span>
              {node.title}
            </span>
          </button>
          <DropdownMenu onOpenChange={(open) => setMenuId(open ? node.id : null)} open={menuId === node.id}>
            <DropdownMenuTrigger asChild>
              <Button className="size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100" size="icon" variant="ghost">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Åtgärder för {node.title}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onNewDocument(node.id)}>Nytt underavsnitt</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRename(node)}>Byt namn</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setHidden((current) => [...current, node.id]);
                  onHide(node);
                }}
              >
                Dölj
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {isOpen ? <ul>{(node.children ?? []).map((child, index) => renderNode(child, depth + 1, [...path, index + 1]))}</ul> : null}
      </li>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar" onKeyDown={onKeyDown} tabIndex={0}>
      <div className="flex flex-col gap-3 border-b px-4 py-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Pärm</p>
            <h2 className="text-base font-bold tracking-tight">Innehåll</h2>
          </div>
          {onCollapse ? (
            <Button aria-label="Dölj innehållet" onClick={onCollapse} size="icon" variant="ghost">
              <PanelLeftClose className="size-4" />
            </Button>
          ) : null}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Sök i manualen"
            className="h-9 pl-9"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Sök i manualen…"
            value={query}
          />
        </div>
        {nodes.length ? (
          <div className="flex gap-2">
            <Button onClick={() => onNewDocument(null)} size="sm" variant="outline">
              Nytt dokument
            </Button>
            <Button onClick={() => setCollapsed([])} size="sm" type="button" variant="ghost">
              Visa alla
            </Button>
            <Button
              onClick={() => {
                const ids: string[] = [];
                const walk = (list: ManualNode[]) => {
                  for (const node of list) {
                    if (node.children?.length) {
                      ids.push(node.id);
                      walk(node.children);
                    }
                  }
                };
                walk(nodes);
                setCollapsed(ids);
              }}
              size="sm"
              type="button"
              variant="ghost"
            >
              Fäll ihop
            </Button>
          </div>
        ) : null}
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <nav aria-label="Manualens dokumentträd" className="px-2 py-4">
          {visibleNodes.length ? (
            <ul>{visibleNodes.map((node, index) => renderNode(node, 0, [index + 1]))}</ul>
          ) : (
            <div className="flex flex-col gap-4 px-2 py-8 text-sm">
              <p className="leading-6 text-muted-foreground">
                Tom pärm. Första bladet blir 1.0. Namnet väljer du.
              </p>
              <Button onClick={() => onNewDocument(null)}>Skapa 1.0</Button>
            </div>
          )}
        </nav>
      </ScrollArea>
    </div>
  );
}

export type { ManualTreeProps };
