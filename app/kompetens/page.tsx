"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ModuleShell } from "@/components/common/module-shell";
import { useOrgSession } from "@/components/providers/org-provider";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL } from "@/lib/features";
import { loadOrgMembers, type OrgMember } from "@/lib/org/members";

export default function KompetensPage() {
  const { session } = useOrgSession();
  const [people, setPeople] = useState<OrgMember[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.organizationId) return;
    void loadOrgMembers(session.organizationId)
      .then(setPeople)
      .catch((err) => setError(err instanceof Error ? err.message : "Kunde inte läsa personalen"));
  }, [session?.organizationId]);

  return (
    <ModuleShell
      description="Personerna i företaget. Roller och inbjudan sköts under Inställningar."
      title="Personal"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        {session?.role === "admin" ? (
          <Button asChild className="self-start">
            <Link href="/installningar">Bjud in eller ändra roll</Link>
          </Button>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <ul className="flex flex-col gap-3">
          {people.map((person) => (
            <li className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-token-sm" key={person.userId}>
              <div className="min-w-0">
                <p className="truncate font-semibold">{person.name}</p>
                {person.email ? <p className="truncate text-sm text-muted-foreground">{person.email}</p> : null}
              </div>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                {ROLE_LABEL[person.role]}
              </span>
            </li>
          ))}
          {people.length === 0 && !error ? (
            <li className="text-sm text-muted-foreground">Ingen personal inlagd ännu.</li>
          ) : null}
        </ul>
      </div>
    </ModuleShell>
  );
}
