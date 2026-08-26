"use client";

import { useMemo, useState } from "react";
import {
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Search,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ManualNode } from "@/components/manual/manual-data";

interface ManualTreeProps {
  nodes: ManualNode[];
  selectedId: string | null;
  onSelect: (node: ManualNode) => void;
  onRename: (node: ManualNode) => void;
  onDelete: (node: ManualNode) => void;
  onMove: (node: ManualNode) => void;
  onNewDocument: (parentId: string | null) => void;
  onNewFolder: (parentId: string | null) => void;
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

export function ManualTree({
  nodes,
  selectedId,
  onSelect,
  onRename,
  onDelete,
  onMove,
  onNewDocument,
  onNewFolder,
}: ManualTreeProps) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<string[]>([]);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleNodes = useMemo(
    () => filterNodes(nodes, normalizedQuery),
    [nodes, normalizedQuery],
  );

  function toggleFolder(id: string) {
    setCollapsed((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function renderNode(node: ManualNode, depth: number) {
    const isFolder = node.kind === "folder";
    const isOpen = normalizedQuery ? true : !collapsed.includes(node.id);
    const isSelected = node.id === selectedId;

    return (
      <li key={node.id}>
        <div
          className={cn(
            "group flex w-full items-center rounded-md pr-1 text-sm transition-token",
            isSelected
              ? "bg-primary/10 font-medium text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
          style={{ paddingLeft: `${depth * 0.75 + 0.25}rem` }}
        >
          {isFolder ? (
            <button
              aria-expanded={isOpen}
              className="shrink-0 p-1"
              onClick={() => toggleFolder(node.id)}
              type="button"
            >
              <ChevronRight
                className={cn(
                  "size-3.5 text-muted-foreground transition-transform",
                  isOpen && "rotate-90",
                )}
              />
            </button>
          ) : (
            <span className="size-5 shrink-0" aria-hidden="true" />
          )}
          <button
            aria-current={isSelected ? "page" : undefined}
            className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left"
            onClick={() => onSelect(node)}
            type="button"
          >
            {isFolder ? (
              isOpen ? (
                <FolderOpen className="size-4 shrink-0 text-primary" />
              ) : (
                <Folder className="size-4 shrink-0 text-muted-foreground" />
              )
            ) : (
              <FileText
                className={cn(
                  "size-4 shrink-0",
                  isSelected ? "text-primary" : "text-muted-foreground",
                )}
              />
            )}
            <span className="truncate">{node.title}</span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                size="icon"
                variant="ghost"
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Åtgärder för {node.title}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isFolder ? (
                <>
                  <DropdownMenuItem onClick={() => onNewDocument(node.id)}>
                    Nytt dokument här
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNewFolder(node.id)}>
                    Ny mapp här
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              ) : null}
              <DropdownMenuItem onClick={() => onRename(node)}>Byt namn</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMove(node)}>Flytta</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(node)} variant="destructive">
                Ta bort
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {isFolder && isOpen ? (
          <ul>{(node.children ?? []).map((child) => renderNode(child, depth + 1))}</ul>
        ) : null}
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
