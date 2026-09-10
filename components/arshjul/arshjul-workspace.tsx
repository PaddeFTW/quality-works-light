"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus } from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { navigation } from "@/components/layout/navigation";
import { useOrgSession } from "@/components/providers/org-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createYearActivity,
  formatSvDate,
  listYearActivities,
  missingTableMessage,
  updateYearActivity,
} from "@/lib/ops/persist";
import type { ActivityStatus, YearActivity } from "@/lib/ops/types";

const MONTHS = [
  "Januari", "Februari", "Mars", "April", "Maj", "Juni",
  "Juli", "Augusti", "September", "Oktober", "November", "December",
];

const KIND: Record<string, string> = {
  revision: "Intern revision",
  skyddsrond: "Skyddsrond",
  ledning: "Ledningens genomgång",
  utbildning: "Utbildning",
  other: "Övrigt",
};

const STATUS: Record<ActivityStatus, string> = {
  planned: "Planerad",
  done: "Genomförd",
  skipped: "Inställd",
};

export function ArshjulWorkspace() {
  const { session, loading } = useOrgSession();
  const year = new Date().getFullYear();
  const [items, setItems] = useState<YearActivity[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<YearActivity | null>(null);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("revision");
  const [plannedOn, setPlannedOn] = useState(`${year}-01-15`);
  const [ownerName, setOwnerName] = useState("");
  const canEdit = session?.role !== "viewer";

  async function reload() {
    if (!session?.organizationId) return;
    try {
      setItems(await listYearActivities(session.organizationId, year));
      setStatus(null);
    } catch (error) {
      setStatus(missingTableMessage(error));
    }
  }

  useEffect(() => {
    if (!loading) void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session?.organizationId]);

  const byMonth = useMemo(() => {
    return MONTHS.map((name, index) => ({
      name,
      items: items.filter((item) => new Date(item.plannedOn).getMonth() === index),
    }));
  }, [items]);

  const next = items.find((item) => item.status === "planned" && item.plannedOn >= new Date().toISOString().slice(0, 10));

  async function handleCreate() {
    if (!session?.organizationId || !title.trim() || !plannedOn) return;
    try {
      const row = await createYearActivity({
        organizationId: session.organizationId,
        title: title.trim(),
        kind,
        plannedOn,
        ownerName: ownerName.trim(),
      });
      setItems((current) => [...current, row].sort((a, b) => a.plannedOn.localeCompare(b.plannedOn)));
      setCreateOpen(false);
      setTitle("");
      setOwnerName("");
    } catch (error) {
      setStatus(missingTableMessage(error));
    }
  }

  async function handleUpdate() {
    if (!selected) return;
    try {
      await updateYearActivity(selected.id, {
        status: selected.status,
        notes: selected.notes,
        ownerName: selected.ownerName,
        plannedOn: selected.plannedOn,
        title: selected.title,
      });
      setItems((current) => current.map((item) => (item.id === selected.id ? selected : item)).sort((a, b) => a.plannedOn.localeCompare(b.plannedOn)));
      setSelected(null);
    } catch (error) {
      setStatus(missingTableMessage(error));
    }
  }

  return (
    <DashboardLayout
      description="Årets återkommande jobb: revision, skyddsrond, ledningens genomgång."
      navigation={navigation}
      title="Årshjul"
      actions={
        canEdit ? (
          <Button disabled={!session?.organizationId} onClick={() => setCreateOpen(true)}>
            <Plus data-icon="inline-start" />
            Ny aktivitet
          </Button>
        ) : null
      }
    >
      {status ? <p className="text-sm text-destructive">{status}</p> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-md bg-primary/10 p-3 text-primary">
              <CalendarDays className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Planerade i år</p>
              <p className="text-2xl font-semibold">{items.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Genomförda</p>
            <p className="text-2xl font-semibold">{items.filter((item) => item.status === "done").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Nästa</p>
            <p className="text-lg font-semibold">{next ? `${formatSvDate(next.plannedOn)} · ${next.title}` : "Inget planerat"}</p>
          </CardContent>
        </Card>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <p className="font-medium">Årshjulet är tomt</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Lägg in intern revision, skyddsrond och ledningens genomgång. Då syns de på startsidan.
            </p>
            {canEdit ? <Button onClick={() => setCreateOpen(true)}>Planera första aktiviteten</Button> : null}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {byMonth.map((month) => (
            <Card key={month.name}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{month.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {month.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Inget planerat</p>
                ) : (
                  month.items.map((item) => (
                    <button
                      className="flex w-full items-start justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm hover:bg-accent"
                      key={item.id}
                      onClick={() => setSelected(item)}
                      type="button"
                    >
                      <span>
                        <span className="block font-medium">{item.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatSvDate(item.plannedOn)} · {KIND[item.kind] ?? item.kind}
                        </span>
                      </span>
                      <Badge variant={item.status === "done" ? "secondary" : "outline"}>{STATUS[item.status]}</Badge>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog onOpenChange={setCreateOpen} open={createOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ny aktivitet</DialogTitle>
            <DialogDescription>Ett återkommande jobb under året.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="aktivitet-titel">Namn</Label>
              <Input id="aktivitet-titel" onChange={(event) => setTitle(event.target.value)} value={title} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Typ</Label>
                <Select onValueChange={setKind} value={kind}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(KIND).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="aktivitet-datum">Datum</Label>
                <Input id="aktivitet-datum" onChange={(event) => setPlannedOn(event.target.value)} type="date" value={plannedOn} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="aktivitet-ansvar">Ansvarig</Label>
              <Input id="aktivitet-ansvar" onChange={(event) => setOwnerName(event.target.value)} value={ownerName} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreateOpen(false)} variant="outline">Avbryt</Button>
            <Button disabled={!title.trim()} onClick={() => void handleCreate()}>Spara</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={(open) => !open && setSelected(null)} open={Boolean(selected)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.title ?? "Aktivitet"}</DialogTitle>
            <DialogDescription>{selected ? `${KIND[selected.kind] ?? selected.kind} · ${formatSvDate(selected.plannedOn)}` : ""}</DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select
                  disabled={!canEdit}
                  onValueChange={(value) => setSelected({ ...selected, status: value as ActivityStatus })}
                  value={selected.status}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planerad</SelectItem>
                    <SelectItem value="done">Genomförd</SelectItem>
                    <SelectItem value="skipped">Inställd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="aktivitet-anteckning">Anteckning</Label>
                <Input
                  disabled={!canEdit}
                  id="aktivitet-anteckning"
                  onChange={(event) => setSelected({ ...selected, notes: event.target.value })}
                  value={selected.notes}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={() => setSelected(null)} variant="outline">Stäng</Button>
            {canEdit ? <Button onClick={() => void handleUpdate()}>Spara</Button> : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
