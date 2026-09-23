"use client";

import { useEffect, useMemo, useState } from "react";
import { Droplets, Factory, Leaf, Trash2, Truck, Zap } from "lucide-react";

import { MiniBars } from "@/components/common/mini-bars";
import { useOrgSession } from "@/components/providers/org-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ASPECT_AREAS,
  STARTER_ASPECTS,
  aspectTableMessage,
  createAspect,
  deleteAspect,
  loadAspects,
  saveAspect,
  scoreLabel,
  type AspectArea,
  type AspectItem,
} from "@/lib/miljo/persist";

const AREA_ICON = {
  Avfall: Trash2,
  Energi: Zap,
  Utsläpp: Factory,
  Kemikalier: Leaf,
  Transporter: Truck,
  Vatten: Droplets,
} as const;

export function MiljoWorkspace() {
  const { session } = useOrgSession();
  const [items, setItems] = useState<AspectItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const canEdit = session?.role !== "viewer";
  const selected = items.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    if (!session?.organizationId) return;
    void loadAspects(session.organizationId)
      .then((rows) => {
        setItems(rows);
        setSelectedId(rows[0]?.id ?? null);
      })
      .catch((err) => setError(aspectTableMessage(err)));
  }, [session?.organizationId]);

  const high = items.filter((item) => item.score >= 4).length;
  const mid = items.filter((item) => item.score === 3).length;
  const low = items.filter((item) => item.score <= 2).length;
  const bars = useMemo(
    () => ASPECT_AREAS.map((area) => ({ label: area.slice(0, 3), value: items.filter((item) => item.area === area).length })),
    [items],
  );

  function patch(next: Partial<AspectItem>) {
    if (!selected) return;
    setItems((current) => current.map((item) => (item.id === selected.id ? { ...item, ...next } : item)));
    setSaved(false);
  }

  async function add(name = "Ny aspekt", area: AspectArea = "Avfall") {
    if (!session?.organizationId) return;
    try {
      const row = await createAspect(session.organizationId, name, area);
      setItems((current) => [...current, row].sort((a, b) => a.name.localeCompare(b.name, "sv")));
      setSelectedId(row.id);
      setError(null);
    } catch (err) {
      setError(aspectTableMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="grid gap-3 lg:grid-cols-[1fr_16rem]">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Leaf className="size-4 text-primary" />
                Betydande
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{high}</p>
              <p className="text-xs text-muted-foreground">Poäng 4 eller 5</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Medel</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{mid}</p>
              <p className="text-xs text-muted-foreground">Poäng 3</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Liten</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{low}</p>
              <p className="text-xs text-muted-foreground">Poäng 1 eller 2</p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Per område</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBars empty="Grafen kommer när du lagt in en aspekt." items={bars} />
          </CardContent>
        </Card>
      </section>

      <div className="grid min-h-[28rem] gap-4 lg:grid-cols-[18rem_1fr]">
        <aside className="flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-token-sm" data-tour="miljolista">
          {canEdit ? (
            <Button onClick={() => void add()} size="sm" type="button">
              Ny aspekt
            </Button>
          ) : null}
          {items.length === 0 && !error ? (
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>Inget inlagt. Börja med ett av de här, eller klicka Ny aspekt.</p>
              {STARTER_ASPECTS.map((item) => (
                <Button key={item.name} onClick={() => void add(item.name, item.area)} size="sm" type="button" variant="outline">
                  {item.name}
                </Button>
              ))}
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {items.map((item) => {
                const Icon = AREA_ICON[item.area];
                const active = item.id === selectedId;
                return (
                  <li key={item.id}>
                    <button
                      className={
                        active
                          ? "flex w-full items-center gap-2 rounded-xl bg-primary px-3 py-2 text-left text-sm font-medium text-primary-foreground!"
                          : "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-accent"
                      }
                      onClick={() => setSelectedId(item.id)}
                      type="button"
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{item.name}</span>
                      <Badge variant={item.score >= 4 ? "destructive" : item.score === 3 ? "warning" : "secondary"}>{item.score}</Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className="rounded-2xl border bg-card p-5 shadow-token-sm" data-tour="miljoform">
          {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
          {!selected ? (
            <p className="text-sm text-muted-foreground">Välj en aspekt till vänster.</p>
          ) : (
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                void saveAspect(selected)
                  .then(() => {
                    setSaved(true);
                    setError(null);
                  })
                  .catch((err) => setError(aspectTableMessage(err)));
              }}
            >
              <div className="grid gap-3 md:grid-cols-[1fr_11rem]">
                <div className="space-y-2">
                  <Label htmlFor="aspect-name">Aspekt</Label>
                  <Input id="aspect-name" onChange={(event) => patch({ name: event.target.value })} value={selected.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aspect-area">Område</Label>
                  <select
                    className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                    id="aspect-area"
                    onChange={(event) => patch({ area: event.target.value as AspectArea })}
                    value={selected.area}
                  >
                    {ASPECT_AREAS.map((area) => (
                      <option key={area}>{area}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="aspect-score">Hur stor påverkan, 1 till 5</Label>
                <Input
                  id="aspect-score"
                  max={5}
                  min={1}
                  onChange={(event) => patch({ score: Number(event.target.value) })}
                  type="number"
                  value={selected.score}
                />
                <p className="text-xs text-muted-foreground">{scoreLabel(selected.score)}. 5 är störst.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="aspect-happens">Hur det uppstår hos er</Label>
                <Textarea id="aspect-happens" onChange={(event) => patch({ happens: event.target.value })} rows={3} value={selected.happens} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aspect-action">Vad ni gör åt det</Label>
                <Textarea id="aspect-action" onChange={(event) => patch({ action: event.target.value })} rows={3} value={selected.action} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aspect-owner">Vem håller i det</Label>
                <Input id="aspect-owner" onChange={(event) => patch({ ownerName: event.target.value })} value={selected.ownerName} />
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
                      void deleteAspect(id)
                        .then(() => {
                          const rest = items.filter((item) => item.id !== id);
                          setItems(rest);
                          setSelectedId(rest[0]?.id ?? null);
                        })
                        .catch((err) => setError(aspectTableMessage(err)));
                    }}
                    type="button"
                    variant="outline"
                  >
                    Ta bort
                  </Button>
                ) : null}
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
