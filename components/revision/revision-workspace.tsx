"use client";

import { useEffect, useState } from "react";

import { useOrgSession } from "@/components/providers/org-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addExampleItems,
  createAudit,
  deleteAudit,
  deleteItem,
  loadAudits,
  revisionTableMessage,
  saveAudit,
  saveItem,
  type AuditItem,
  type AuditRecord,
} from "@/lib/revision/persist";

const SCORES = [
  { id: 1 as const, label: "1 Uppfyller" },
  { id: 2 as const, label: "2 Anmärkning" },
  { id: 3 as const, label: "3 Uppfyller inte" },
];

export function RevisionWorkspace() {
  const { session } = useOrgSession();
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [items, setItems] = useState<AuditItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canEdit = session?.role !== "viewer";
  const selected = audits.find((audit) => audit.id === selectedId) ?? null;
  const rows = items.filter((item) => item.auditId === selectedId);
  const openFindings = rows.filter((item) => item.score >= 2 && !item.closed);

  useEffect(() => {
    if (!session?.organizationId) return;
    void loadAudits(session.organizationId)
      .then((data) => {
        setAudits(data.audits);
        setItems(data.items);
        setSelectedId(data.audits[0]?.id ?? null);
        setError(null);
      })
      .catch((err) => setError(revisionTableMessage(err)));
  }, [session?.organizationId]);

  function patchAudit(next: Partial<AuditRecord>) {
    if (!selected) return;
    setAudits((current) => current.map((audit) => (audit.id === selected.id ? { ...audit, ...next } : audit)));
  }

  function patchItem(id: string, next: Partial<AuditItem>) {
    const current = items.find((item) => item.id === id);
    if (!current) return;
    const row = { ...current, ...next };
    setItems((list) => list.map((item) => (item.id === id ? row : item)));
    void saveItem(row).catch((err) => setError(revisionTableMessage(err)));
  }

  function printAudit() {
    if (!selected) return;
    const body = rows
      .map((item) => {
        const score = item.score === 0 ? "–" : String(item.score);
        const extra = item.score >= 2 ? `<br>${item.comment || "Kommentar saknas."} ${item.dueOn} ${item.closed ? "Åtgärdad" : "Öppen"}` : "";
        return `<tr><td>${item.clause} ${item.prompt}</td><td>${score}</td><td>${extra}</td></tr>`;
      })
      .join("");
    const popup = window.open("", "_blank", "noopener,noreferrer");
    if (!popup) return;
    popup.document.write(`<!doctype html><html><head><title>${selected.title}</title>
      <style>body{font-family:Inter,sans-serif;padding:32px;color:#111}table{width:100%;border-collapse:collapse}td{border-bottom:1px solid #ddd;padding:8px;vertical-align:top}</style>
      </head><body><h1>${selected.title}</h1><p>${selected.auditedOn} · ${selected.auditorName} · ${selected.standard}</p>
      <p>${openFindings.length} öppna fel.</p><p>${selected.note}</p><table>${body}</table></body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  return (
    <div className="grid min-h-[36rem] gap-4 lg:grid-cols-[18rem_1fr]">
      <aside className="flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-token-sm">
        {canEdit ? (
          <Button
            onClick={() => {
              if (!session?.organizationId) return;
              void createAudit(session.organizationId)
                .then((row) => {
                  setAudits((current) => [row, ...current]);
                  setSelectedId(row.id);
                })
                .catch((err) => setError(revisionTableMessage(err)));
            }}
            size="sm"
            type="button"
          >
            Ny revision
          </Button>
        ) : null}
        <ul className="flex flex-col gap-1">
          {audits.map((audit) => (
            <li key={audit.id}>
              <button
                className={
                  audit.id === selectedId
                    ? "w-full rounded-xl bg-primary px-3 py-2 text-left text-sm font-medium text-primary-foreground!"
                    : "w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-accent"
                }
                onClick={() => setSelectedId(audit.id)}
                type="button"
              >
                <span className="block">{audit.title}</span>
                <span className={audit.id === selectedId ? "text-xs text-primary-foreground/80" : "text-xs text-muted-foreground"}>
                  {audit.auditedOn}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {audits.length === 0 && !error ? <p className="px-1 text-sm text-muted-foreground">Ingen revision ännu.</p> : null}
      </aside>

      <section className="flex flex-col gap-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {!selected ? (
          <div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground shadow-token-sm">Välj en revision, eller skapa en ny.</div>
        ) : (
          <>
            <form
              className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-token-sm"
              onSubmit={(event) => {
                event.preventDefault();
                void saveAudit(selected).catch((err) => setError(revisionTableMessage(err)));
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{openFindings.length === 0 ? "Inga öppna fel" : `${openFindings.length} öppna fel`}</p>
                  <p className="text-sm text-muted-foreground">1 uppfyller. 2 är en anmärkning. 3 uppfyller inte. Varje 2 och 3 är en rapport.</p>
                </div>
                <Button onClick={printAudit} size="sm" type="button" variant="outline">
                  Skriv ut
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Namn</Label>
                  <Input id="title" onChange={(event) => patchAudit({ title: event.target.value })} value={selected.title} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="when">Datum</Label>
                  <Input id="when" onChange={(event) => patchAudit({ auditedOn: event.target.value })} type="date" value={selected.auditedOn} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="who">Revisor</Label>
                  <Input id="who" onChange={(event) => patchAudit({ auditorName: event.target.value })} value={selected.auditorName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="std">Standard</Label>
                  <select
                    className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                    id="std"
                    onChange={(event) => patchAudit({ standard: event.target.value })}
                    value={selected.standard}
                  >
                    <option>ISO 9001</option>
                    <option>ISO 14001</option>
                    <option>ISO 9001 och 14001</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Kommentar om revisionen</Label>
                <Textarea id="note" onChange={(event) => patchAudit({ note: event.target.value })} rows={2} value={selected.note} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={!canEdit} type="submit">
                  Spara
                </Button>
                {canEdit ? (
                  <Button
                    onClick={() => {
                      const id = selected.id;
                      void deleteAudit(id)
                        .then(() => {
                          setAudits((current) => current.filter((audit) => audit.id !== id));
                          setItems((current) => current.filter((item) => item.auditId !== id));
                          setSelectedId(audits.find((audit) => audit.id !== id)?.id ?? null);
                        })
                        .catch((err) => setError(revisionTableMessage(err)));
                    }}
                    type="button"
                    variant="outline"
                  >
                    Ta bort
                  </Button>
                ) : null}
              </div>
            </form>

            {rows.length === 0 && canEdit ? (
              <Button
                onClick={() => {
                  if (!session?.organizationId) return;
                  void addExampleItems(session.organizationId, selected.id)
                    .then(() => loadAudits(session.organizationId))
                    .then((data) => setItems(data.items))
                    .catch((err) => setError(revisionTableMessage(err)));
                }}
                type="button"
              >
                Lägg in kraven
              </Button>
            ) : null}

            <ol className="flex flex-col gap-3">
              {rows.map((item) => (
                <li className="rounded-2xl border bg-card p-4 shadow-token-sm" key={item.id}>
                  <p className="text-sm font-medium">
                    {item.clause} {item.prompt}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {SCORES.map((score) => (
                      <Button
                        disabled={!canEdit}
                        key={score.id}
                        onClick={() => patchItem(item.id, { score: score.id })}
                        size="sm"
                        type="button"
                        variant={item.score === score.id ? "default" : "outline"}
                      >
                        {score.label}
                      </Button>
                    ))}
                  </div>
                  {item.score >= 2 ? (
                    <div className="mt-3 grid gap-3 md:grid-cols-[1fr_11rem_auto]">
                      <Textarea
                        onChange={(event) => patchItem(item.id, { comment: event.target.value })}
                        placeholder="Vad är fel, och vad ska göras?"
                        rows={2}
                        value={item.comment}
                      />
                      <Input onChange={(event) => patchItem(item.id, { dueOn: event.target.value })} type="date" value={item.dueOn} />
                      <Button
                        onClick={() => patchItem(item.id, { closed: !item.closed })}
                        type="button"
                        variant={item.closed ? "default" : "outline"}
                      >
                        {item.closed ? "Åtgärdad" : "Öppen"}
                      </Button>
                    </div>
                  ) : null}
                  {canEdit ? (
                    <button
                      className="mt-3 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        void deleteItem(item.id)
                          .then(() => setItems((current) => current.filter((row) => row.id !== item.id)))
                          .catch((err) => setError(revisionTableMessage(err)));
                      }}
                      type="button"
                    >
                      Ta bort raden
                    </button>
                  ) : null}
                </li>
              ))}
            </ol>
          </>
        )}
      </section>
    </div>
  );
}
