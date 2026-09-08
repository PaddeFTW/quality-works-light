"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { navigation } from "@/components/layout/navigation";
import { useOrgSession } from "@/components/providers/org-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  caseNumber,
  createDeviation,
  formatSvDate,
  listDeviations,
  missingTableMessage,
  updateDeviation,
} from "@/lib/ops/persist";
import type { Deviation, DeviationStatus, Severity } from "@/lib/ops/types";

const STATUS: Record<DeviationStatus, string> = {
  open: "Öppen",
  in_progress: "Pågår",
  closed: "Stängd",
};

const SEVERITY: Record<Severity, string> = {
  low: "Låg",
  medium: "Medel",
  high: "Hög",
};

export function DeviationWorkspace() {
  const { session, loading } = useOrgSession();
  const [items, setItems] = useState<Deviation[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Deviation | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("kvalitet");
  const [severity, setSeverity] = useState<Severity>("medium");
  const canManage = session?.role !== "viewer";

  async function reload() {
    if (!session?.organizationId) return;
    try {
      setItems(await listDeviations(session.organizationId));
      setStatus(null);
    } catch (error) {
      setStatus(missingTableMessage(error));
    }
  }

  useEffect(() => {
    if (!loading) void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session?.organizationId]);

  const counts = useMemo(
    () => ({
      all: items.length,
      open: items.filter((item) => item.status === "open").length,
      ongoing: items.filter((item) => item.status === "in_progress").length,
    }),
    [items],
  );

  async function handleCreate() {
    if (!session?.organizationId || !title.trim()) return;
    try {
      const row = await createDeviation({
        organizationId: session.organizationId,
        userId: session.userId,
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
      });
      setItems((current) => [row, ...current]);
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      setCategory("kvalitet");
      setSeverity("medium");
    } catch (error) {
      setStatus(missingTableMessage(error));
    }
  }

  async function handleUpdate() {
    if (!selected) return;
    try {
      await updateDeviation(selected.id, {
        status: selected.status,
        action: selected.action,
        ownerName: selected.ownerName,
        dueDate: selected.dueDate,
      });
      setItems((current) => current.map((item) => (item.id === selected.id ? selected : item)));
      setSelected(null);
    } catch (error) {
      setStatus(missingTableMessage(error));
    }
  }

  return (
    <DashboardLayout
      description="En avvikelse är skillnaden mellan ska och är. Samma rutin för kvalitet, miljö och arbetsmiljö."
      navigation={navigation}
      title="Avvikelser"
      actions={
        <Button disabled={!session?.organizationId} onClick={() => setCreateOpen(true)}>
          <Plus data-icon="inline-start" />
          Lämna avvikelse
        </Button>
      }
    >
      {status ? <p className="text-sm text-destructive">{status}</p> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-md bg-primary/10 p-3 text-primary">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Totalt</p>
              <p className="text-2xl font-semibold">{counts.all}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Öppna</p>
            <p className="text-2xl font-semibold">{counts.open}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Pågår</p>
            <p className="text-2xl font-semibold">{counts.ongoing}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <p className="font-medium">Inga avvikelser ännu</p>
              <p className="max-w-md text-sm text-muted-foreground">
                När något inte stämmer: skriv vad som hänt. Ni följer upp och stänger när det är åtgärdat.
              </p>
              <Button onClick={() => setCreateOpen(true)}>Lämna avvikelse</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nr</TableHead>
                  <TableHead>Titel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Allvar</TableHead>
                  <TableHead>Datum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow className="cursor-pointer" key={item.id} onClick={() => setSelected(item)}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{caseNumber("A", item.number)}</TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === "closed" ? "secondary" : item.status === "in_progress" ? "outline" : "default"}>
                        {STATUS[item.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{SEVERITY[item.severity]}</TableCell>
                    <TableCell className="text-muted-foreground">{formatSvDate(item.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog onOpenChange={setCreateOpen} open={createOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lämna avvikelse</DialogTitle>
            <DialogDescription>Beskriv vad som hänt så att någon kan ta det vidare.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="avvikelse-titel">Titel</Label>
              <Input id="avvikelse-titel" onChange={(event) => setTitle(event.target.value)} value={title} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="avvikelse-text">Vad hände?</Label>
              <Textarea id="avvikelse-text" onChange={(event) => setDescription(event.target.value)} value={description} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Kategori</Label>
                <Select onValueChange={setCategory} value={category}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kvalitet">Kvalitet</SelectItem>
                    <SelectItem value="miljo">Miljö</SelectItem>
                    <SelectItem value="arbetsmiljo">Arbetsmiljö</SelectItem>
                    <SelectItem value="kund">Kund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Allvar</Label>
                <Select onValueChange={(value) => setSeverity(value as Severity)} value={severity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Låg</SelectItem>
                    <SelectItem value="medium">Medel</SelectItem>
                    <SelectItem value="high">Hög</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreateOpen(false)} variant="outline">Avbryt</Button>
            <Button disabled={!title.trim()} onClick={() => void handleCreate()}>Skicka</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={(open) => !open && setSelected(null)} open={Boolean(selected)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected ? `${caseNumber("A", selected.number)} ${selected.title}` : "Avvikelse"}</DialogTitle>
            <DialogDescription>{selected?.description || "Ingen beskrivning."}</DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select
                  disabled={!canManage}
                  onValueChange={(value) => setSelected({ ...selected, status: value as DeviationStatus })}
                  value={selected.status}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Öppen</SelectItem>
                    <SelectItem value="in_progress">Pågår</SelectItem>
                    <SelectItem value="closed">Stängd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="avvikelse-atgard">Åtgärd</Label>
                <Textarea
                  disabled={!canManage}
                  id="avvikelse-atgard"
                  onChange={(event) => setSelected({ ...selected, action: event.target.value })}
                  value={selected.action}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="avvikelse-ansvar">Ansvarig</Label>
                  <Input
                    disabled={!canManage}
                    id="avvikelse-ansvar"
                    onChange={(event) => setSelected({ ...selected, ownerName: event.target.value })}
                    value={selected.ownerName}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="avvikelse-datum">Klart senast</Label>
                  <Input
                    disabled={!canManage}
                    id="avvikelse-datum"
                    onChange={(event) => setSelected({ ...selected, dueDate: event.target.value || null })}
                    type="date"
                    value={selected.dueDate ?? ""}
                  />
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={() => setSelected(null)} variant="outline">Stäng</Button>
            {canManage ? <Button onClick={() => void handleUpdate()}>Spara</Button> : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
