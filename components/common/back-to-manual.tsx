"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadTree } from "@/lib/manual/storage";
import { findNode } from "@/lib/manual/tree-ops";

const LAST_OPENED_KEY = "qw.manual.lastOpened";

export function BackToManual() {
  const [documentName, setDocumentName] = useState("Manualen");

  useEffect(() => {
    const id = window.localStorage.getItem(LAST_OPENED_KEY);
    if (!id) return;
    const node = findNode(loadTree(), id);
    if (node?.kind === "document") setDocumentName(node.title);
  }, []);

  return (
    <Button asChild size="sm" variant="ghost">
      <Link href="/manual">
        <ChevronLeft data-icon="inline-start" />
        Tillbaka till {documentName}
      </Link>
    </Button>
  );
}
