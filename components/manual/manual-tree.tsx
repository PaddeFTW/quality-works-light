"use client";

import { useMemo, useState } from "react";
import { FileText, MoreHorizontal, Search } from "lucide-react";
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
  onDelete: (node: ManualNode) => void;
  onMove: (node: ManualNode) => void;
  onNewDocument: (parentId: string | null) => void;
  onNewFolder: (parentId: string | null) => void;
}

export function ManualTree({ nodes, selectedId, lastOpenedId, onSelect, onRename, onDelete, onMove, onNewDocument }: ManualTreeProps) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? nodes.filter((node) => node.title.toLowerCase().includes(normalized)) : nodes;
  }, [nodes, query]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar">
      <div className="flex flex-col gap-3 border-b px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Dokument</p>
            <h2 className="text-base font-semibold tracking-tight">Arbetsmanual</h2>
          </div>
          <span className="rounded-sm border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">A4</span>
        </div>
        <Button className="w-full" onClick={() => onNewDocument(null)} size="sm">
          Skapa 1.0
        </Button>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Hitta avsnitt" className="h-9 pl-9" onChange={(event) => setQuery(event.target.value)} placeholder="Hitta avsnitt…" value={query} />
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <nav aria-label="Manualens avsnitt" className="px-2 py-3">
          {filtered.length ? <ul>{filtered.map((node) => (
            <li key={node.id}>
              <div className={cn("group flex w-full items-center rounded-md pr-1 text-sm", node.id === selectedId ? "bg-primary/10 font-medium text-primary" : lastOpenedId === node.id ? "bg-accent/60 font-medium" : "text-muted-foreground hover:bg-accent")}>
                <button aria-current={node.id === selectedId ? "page" : undefined} className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left" onClick={() => onSelect(node)} type="button">
                  <FileText className={cn("size-4 shrink-0", node.id === selectedId ? "text-primary" : "text-muted-foreground")} />
                  <span className="truncate">{node.title}</span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button className="size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100" size="icon" variant="ghost"><MoreHorizontal /><span className="sr-only">Åtgärder för {node.title}</span></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onNewDocument(node.id)}>Nytt underavsnitt</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRename(node)}>Byt namn</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMove(node)}>Dölj</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(node)} variant="destructive">Ta bort</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}</ul> :             <div className="px-3 py-8 text-center text-sm"><p className="font-medium">Manualen är tom.</p><p className="mt-1 text-muted-foreground">Skapa första kapitlet. Numret låses vid skapande.</p></div>}
        </nav>
      </ScrollArea>
    </div>
  );
}
