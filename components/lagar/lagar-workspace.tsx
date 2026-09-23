"use client";

import { useEffect, useMemo, useState } from "react";

import { useOrgSession } from "@/components/providers/org-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  LAW_AREAS,
  STARTER_LAWS,
  createLaw,
  deleteLaw,
  fileUrl,
  lawTableMessage,
  loadLaws,
  removeLawFile,
  saveLaw,
  uploadLawFile,
  type LawArea,
  type LawItem,
  type LawStatus,
} from "@/lib/lagar/persist";

const STATUS: { id: LawStatus; label: string }[] = [
  { id: "open", label: "Inte bedömd" },
  { id: "partial", label: "Delvis" },
  { id: "ok", label: "Vi följer den" },
  { id: "skip", label: "Gäller inte oss" },
];

export function LagarWorkspace() {
  const { session } = useOrgSession();
  const [laws, setLaws] = useState<LawItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const canEdit = session?.role !== "viewer";
  const selected = laws.find((law) => law.id === selectedId) ?? null;

  useEffect(() => {
    if (!session?.organizationId) return;
    void loadLaws(session.organizationId)
      .then((rows) => {
        setLaws(rows);
        setSelectedId(rows[0]?.id ?? null);
        setError(null);
      })
      .catch((err) => setError(lawTableMessage(err)));
  }, [session?.organizationId]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? laws.filter((law) => law.name.toLowerCase().includes(q)) : laws;
  }, [laws, query]);

  function patch(next: Partial<LawItem>) {
    if (!selected) return;
    setLaws((current) => current.map((law) => (law.id === selected.id ? { ...law, ...next } : law)));
    setSaved(false);
  }

  async function persist(law: LawItem) {
    try {
      await saveLaw(law);
      setSaved(true);
      setError(null);
    } catch (err) {
      setError(lawTableMessage(err));
    }
  }

  async function add(name = "Ny lag", area: LawArea = "Övrigt", lawUrl = "") {
    if (!session?.organizationId) return;
    try {
      const row = await createLaw(session.organizationId, name, area, lawUrl);
      setLaws((current) => [...current, row].sort((a, b) => a.name.localeCompare(b.name, "sv")));
      setSelectedId(row.id);
      setError(null);
    } catch (err) {
      setError(lawTableMessage(err));
    }
  }

  return (
    <div className="grid min-h-[36rem] gap-4 lg:grid-cols-[18rem_1fr]">
      <aside className="flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-token-sm" data-tour="laglista">
        <Input aria-label="Sök lag" onChange={(event) => setQuery(event.target.value)} placeholder="Sök lag…" value={query} />
        {canEdit ? (
          <Button onClick={() => void add()} size="sm" type="button">
            Ny lag
          </Button>
        ) : null}
        <nav aria-label="Laglista" className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto">
          {LAW_AREAS.map((area) => {
            const rows = visible.filter((law) => law.area === area);
            if (!rows.length) return null;
            return (
              <div key={area}>
                <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{area}</p>
                <ul className="mt-1 flex flex-col gap-1">
                  {rows.map((law) => (
                    <li key={law.id}>
                      <button
                        className={
                          law.id === selectedId
                            ? "w-full rounded-xl bg-primary px-3 py-2 text-left text-sm font-medium text-primary-foreground!"
                            : "w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-accent"
                        }
                        onClick={() => setSelectedId(law.id)}
                        type="button"
                      >
                        {law.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {laws.length === 0 && !error ? (
            <div className="flex flex-col gap-2 px-1 text-sm text-muted-foreground">
              <p>Ingen lag ännu. Börja med en av de här, eller klicka Ny lag.</p>
              {STARTER_LAWS.map((item) => (
                <Button key={item.name} onClick={() => void add(item.name, item.area, item.lawUrl)} size="sm" type="button" variant="outline">
                  {item.name}
                </Button>
              ))}
            </div>
          ) : null}
        </nav>
      </aside>

      <section className="rounded-2xl border bg-card p-5 shadow-token-sm" data-tour="lagform">
        {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
        {!selected ? (
          <p className="text-sm text-muted-foreground">Välj en lag till vänster.</p>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void persist(selected);
            }}
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="law-name">Lagnamn</Label>
                <Input id="law-name" onChange={(event) => patch({ name: event.target.value })} value={selected.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="law-area">Område</Label>
                <select
                  className="h-10 rounded-xl border bg-background px-3 text-sm"
                  id="law-area"
                  onChange={(event) => patch({ area: event.target.value as LawArea })}
                  value={selected.area}
                >
                  {LAW_AREAS.map((area) => (
                    <option key={area}>{area}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="law-status">Hur vi följer lagen</Label>
              <select
                className="h-10 rounded-xl border bg-background px-3 text-sm"
                id="law-status"
                onChange={(event) => patch({ status: event.target.value as LawStatus })}
                value={selected.status}
              >
                {STATUS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="law-desc">Beskrivning</Label>
              <p className="text-xs text-muted-foreground">Vad lagen handlar om, med era egna ord.</p>
              <Textarea id="law-desc" onChange={(event) => patch({ description: event.target.value })} rows={3} value={selected.description} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="law-impact">Hur lagen påverkar oss</Label>
              <Textarea id="law-impact" onChange={(event) => patch({ impact: event.target.value })} rows={3} value={selected.impact} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="law-follow">Hur vi följer den</Label>
              <p className="text-xs text-muted-foreground">Vad ni redan gör. Till exempel skyddsrond, eller en rutin i manualen.</p>
              <Textarea id="law-follow" onChange={(event) => patch({ complianceText: event.target.value })} rows={3} value={selected.complianceText} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="law-url">Länk till lagen</Label>
                <Input id="law-url" onChange={(event) => patch({ lawUrl: event.target.value })} placeholder="https://" value={selected.lawUrl} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="law-update">Länk till uppdateringar</Label>
                <Input id="law-update" onChange={(event) => patch({ updateUrl: event.target.value })} placeholder="https://" value={selected.updateUrl} />
              </div>
            </div>
            {(selected.lawUrl || selected.updateUrl) && (
              <p className="text-sm">
                {selected.lawUrl ? (
                  <a className="mr-4 underline" href={selected.lawUrl} rel="noreferrer" target="_blank">
                    Öppna lagen
                  </a>
                ) : null}
                {selected.updateUrl ? (
                  <a className="underline" href={selected.updateUrl} rel="noreferrer" target="_blank">
                    Öppna uppdateringar
                  </a>
                ) : null}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="law-file">Filer</Label>
              <Input
                disabled={!canEdit}
                id="law-file"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file || !session?.organizationId || !selected) return;
                  void uploadLawFile(session.organizationId, selected.id, file)
                    .then((row) => patch({ files: [...selected.files, row] }))
                    .catch((err) => setError(lawTableMessage(err)));
                }}
                type="file"
              />
              <ul className="flex flex-col gap-1">
                {selected.files.map((file) => (
                  <li className="flex items-center justify-between gap-2 text-sm" key={file.id}>
                    <button
                      className="truncate underline"
                      onClick={() => {
                        void fileUrl(file.path)
                          .then((url) => window.open(url, "_blank", "noopener"))
                          .catch((err) => setError(lawTableMessage(err)));
                      }}
                      type="button"
                    >
                      {file.name}
                    </button>
                    {canEdit ? (
                      <button
                        className="text-xs text-muted-foreground underline"
                        onClick={() => {
                          void removeLawFile(file)
                            .then(() => patch({ files: selected.files.filter((item) => item.id !== file.id) }))
                            .catch((err) => setError(lawTableMessage(err)));
                        }}
                        type="button"
                      >
                        Ta bort
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={!canEdit} type="submit">
                Spara
              </Button>
              {saved ? <span className="text-sm text-muted-foreground">Sparat</span> : null}
              {canEdit ? (
                <Button
                  onClick={() => {
                    const id = selected.id;
                    void deleteLaw(id)
                      .then(() => {
                        const rest = laws.filter((law) => law.id !== id);
                        setLaws(rest);
                        setSelectedId(rest[0]?.id ?? null);
                      })
                      .catch((err) => setError(lawTableMessage(err)));
                  }}
                  type="button"
                  variant="outline"
                >
                  Ta bort lagen
                </Button>
              ) : null}
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
