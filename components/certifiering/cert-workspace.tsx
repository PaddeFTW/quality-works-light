"use client";

import { useEffect, useState } from "react";

import { useOrgSession } from "@/components/providers/org-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addExampleChecks,
  certTableMessage,
  createCheck,
  deleteCheck,
  loadChecks,
  saveCheck,
  type CertAnswer,
  type CertCheck,
} from "@/lib/certifiering/persist";

export function CertWorkspace() {
  const { session } = useOrgSession();
  const [checks, setChecks] = useState<CertCheck[]>([]);
  const [error, setError] = useState<string | null>(null);
  const canEdit = session?.role !== "viewer";
  const yesCount = checks.filter((check) => check.answer === "yes").length;
  const noCount = checks.filter((check) => check.answer === "no").length;

  useEffect(() => {
    if (!session?.organizationId) return;
    void loadChecks(session.organizationId)
      .then((rows) => {
        setChecks(rows);
        setError(null);
      })
      .catch((err) => setError(certTableMessage(err)));
  }, [session?.organizationId]);

  function update(id: string, next: Partial<CertCheck>) {
    const current = checks.find((check) => check.id === id);
    if (!current) return;
    const row = { ...current, ...next };
    setChecks((items) => items.map((check) => (check.id === id ? row : check)));
    void saveCheck(row).catch((err) => setError(certTableMessage(err)));
  }

  function printList() {
    const rows = checks
      .map((check, index) => {
        const answer = check.answer === "yes" ? "Ja" : check.answer === "no" ? "Nej" : "–";
        const date = check.answer === "no" && check.dueOn ? check.dueOn : "";
        return `<tr><td>${index + 1}. ${check.prompt}</td><td>${answer}</td><td>${date}</td></tr>`;
      })
      .join("");
    const popup = window.open("", "_blank", "noopener,noreferrer");
    if (!popup) return;
    popup.document.write(`<!doctype html><html><head><title>Inför certifiering</title>
      <style>body{font-family:Inter,sans-serif;padding:32px;color:#111}table{width:100%;border-collapse:collapse}td{border-bottom:1px solid #ddd;padding:8px;vertical-align:top}</style>
      </head><body><h1>Inför certifiering</h1><p>${yesCount} ja. ${noCount} nej.</p><table>${rows}</table></body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-token-sm">
        <div>
          <p className="font-semibold">
            {checks.length === 0 ? "Ingen checklista ännu" : `${yesCount} av ${checks.length} är ja`}
          </p>
          <p className="text-sm text-muted-foreground">
            {noCount > 0 ? `${noCount} saker är inte klara. Sätt ett datum på dem.` : "Svara ja eller nej. På nej sätter ni ett datum."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {checks.length > 0 ? (
            <Button onClick={printList} size="sm" type="button" variant="outline">
              Skriv ut
            </Button>
          ) : null}
          {canEdit && checks.length === 0 ? (
            <Button
              onClick={() => {
                if (!session?.organizationId) return;
                void addExampleChecks(session.organizationId)
                  .then(() => loadChecks(session.organizationId))
                  .then(setChecks)
                  .catch((err) => setError(certTableMessage(err)));
              }}
              type="button"
            >
              Lägg in checklistan
            </Button>
          ) : null}
        </div>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <ol className="flex flex-col gap-3">
        {checks.map((check, index) => (
          <li className="rounded-2xl border bg-card p-4 shadow-token-sm" key={check.id}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {index + 1}. {check.prompt}
                </p>
                {check.hint ? <p className="mt-1 text-sm text-muted-foreground">{check.hint}</p> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(["yes", "no"] as CertAnswer[]).map((answer) => (
                  <Button
                    disabled={!canEdit}
                    key={answer}
                    onClick={() => update(check.id, { answer })}
                    size="sm"
                    type="button"
                    variant={check.answer === answer ? "default" : "outline"}
                  >
                    {answer === "yes" ? "Ja" : "Nej"}
                  </Button>
                ))}
                {check.answer === "no" ? (
                  <Input
                    aria-label="Klart senast"
                    className="w-40"
                    onChange={(event) => update(check.id, { dueOn: event.target.value })}
                    type="date"
                    value={check.dueOn}
                  />
                ) : null}
              </div>
            </div>
            {canEdit ? (
              <button
                className="mt-3 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  void deleteCheck(check.id)
                    .then(() => setChecks((items) => items.filter((item) => item.id !== check.id)))
                    .catch((err) => setError(certTableMessage(err)));
                }}
                type="button"
              >
                Ta bort frågan
              </button>
            ) : null}
          </li>
        ))}
      </ol>

      {canEdit && checks.length > 0 ? (
        <Button
          onClick={() => {
            if (!session?.organizationId) return;
            void createCheck(session.organizationId, checks.length + 1)
              .then((row) => setChecks((items) => [...items, row]))
              .catch((err) => setError(certTableMessage(err)));
          }}
          type="button"
          variant="outline"
        >
          Ny fråga
        </Button>
      ) : null}
    </div>
  );
}
