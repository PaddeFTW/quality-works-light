"use client";

import { useEffect, useMemo, useState } from "react";

import { useOrgSession } from "@/components/providers/org-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  GOAL_AREAS,
  STARTER_GOALS,
  createGoal,
  deleteGoal,
  goalTableMessage,
  loadGoals,
  saveGoal,
  type GoalArea,
  type GoalItem,
  type GoalStatus,
} from "@/lib/mal/persist";

const STATUS: { id: GoalStatus; label: string }[] = [
  { id: "plan", label: "Planerat" },
  { id: "going", label: "Pågår" },
  { id: "late", label: "Efter" },
  { id: "done", label: "Klart" },
];

export function MalWorkspace() {
  const { session } = useOrgSession();
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const canEdit = session?.role !== "viewer";
  const selected = goals.find((goal) => goal.id === selectedId) ?? null;

  useEffect(() => {
    if (!session?.organizationId) return;
    void loadGoals(session.organizationId)
      .then((rows) => {
        setGoals(rows);
        setSelectedId(rows[0]?.id ?? null);
        setError(null);
      })
      .catch((err) => setError(goalTableMessage(err)));
  }, [session?.organizationId]);

  const grouped = useMemo(() => GOAL_AREAS.map((area) => ({ area, rows: goals.filter((goal) => goal.area === area) })), [goals]);

  function patch(next: Partial<GoalItem>) {
    if (!selected) return;
    setGoals((current) => current.map((goal) => (goal.id === selected.id ? { ...goal, ...next } : goal)));
    setSaved(false);
  }

  async function add(name = "Nytt mål", area: GoalArea = "Kvalitet") {
    if (!session?.organizationId) return;
    try {
      const row = await createGoal(session.organizationId, name, area);
      setGoals((current) => [...current, row].sort((a, b) => a.name.localeCompare(b.name, "sv")));
      setSelectedId(row.id);
      setError(null);
    } catch (err) {
      setError(goalTableMessage(err));
    }
  }

  return (
    <div className="grid min-h-[36rem] gap-4 lg:grid-cols-[18rem_1fr]">
      <aside className="flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-token-sm" data-tour="mallista">
        {canEdit ? (
          <Button onClick={() => void add()} size="sm" type="button">
            Nytt mål
          </Button>
        ) : null}
        <nav aria-label="Mål" className="flex flex-col gap-4">
          {grouped.map(({ area, rows }) =>
            rows.length ? (
              <div key={area}>
                <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{area}</p>
                <ul className="mt-1 flex flex-col gap-1">
                  {rows.map((goal) => (
                    <li key={goal.id}>
                      <button
                        className={
                          goal.id === selectedId
                            ? "w-full rounded-xl bg-primary px-3 py-2 text-left text-sm font-medium text-primary-foreground!"
                            : "w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-accent"
                        }
                        onClick={() => setSelectedId(goal.id)}
                        type="button"
                      >
                        {goal.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
          {goals.length === 0 && !error ? (
            <div className="flex flex-col gap-2 px-1 text-sm text-muted-foreground">
              <p>Inget mål ännu. Börja med ett av de här, eller klicka Nytt mål.</p>
              {STARTER_GOALS.map((item) => (
                <Button key={item.name} onClick={() => void add(item.name, item.area)} size="sm" type="button" variant="outline">
                  {item.name}
                </Button>
              ))}
            </div>
          ) : null}
        </nav>
      </aside>

      <section className="rounded-2xl border bg-card p-5 shadow-token-sm" data-tour="malform">
        {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
        {!selected ? (
          <p className="text-sm text-muted-foreground">Välj ett mål till vänster.</p>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void saveGoal(selected)
                .then(() => {
                  setSaved(true);
                  setError(null);
                })
                .catch((err) => setError(goalTableMessage(err)));
            }}
          >
            <div className="grid gap-3 md:grid-cols-[1fr_11rem]">
              <div className="space-y-2">
                <Label htmlFor="goal-name">Mål</Label>
                <Input id="goal-name" onChange={(event) => patch({ name: event.target.value })} value={selected.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-area">Område</Label>
                <select
                  className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                  id="goal-area"
                  onChange={(event) => patch({ area: event.target.value as GoalArea })}
                  value={selected.area}
                >
                  {GOAL_AREAS.map((area) => (
                    <option key={area}>{area}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-status">Läge</Label>
              <select
                className="h-10 rounded-xl border bg-background px-3 text-sm"
                id="goal-status"
                onChange={(event) => patch({ status: event.target.value as GoalStatus })}
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
              <Label htmlFor="goal-measure">Hur vi ser om vi lyckas</Label>
              <Textarea id="goal-measure" onChange={(event) => patch({ measure: event.target.value })} rows={3} value={selected.measure} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="goal-target">Siffra eller gräns</Label>
                <Input id="goal-target" onChange={(event) => patch({ targetText: event.target.value })} placeholder="Till exempel under 5 reklamationer" value={selected.targetText} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-due">Klart senast</Label>
                <Input id="goal-due" onChange={(event) => patch({ dueOn: event.target.value })} type="date" value={selected.dueOn} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-owner">Vem håller i det</Label>
              <Input id="goal-owner" onChange={(event) => patch({ ownerName: event.target.value })} value={selected.ownerName} />
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
                    void deleteGoal(id)
                      .then(() => {
                        const rest = goals.filter((goal) => goal.id !== id);
                        setGoals(rest);
                        setSelectedId(rest[0]?.id ?? null);
                      })
                      .catch((err) => setError(goalTableMessage(err)));
                  }}
                  type="button"
                  variant="outline"
                >
                  Ta bort målet
                </Button>
              ) : null}
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
