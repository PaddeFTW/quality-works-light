"use client";

import { useEffect, useMemo, useState } from "react";
import { Lightbulb, Plus } from "lucide-react";

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
  createSuggestion,
  formatSvDate,
  listSuggestions,
  missingTableMessage,
  updateSuggestion,
} from "@/lib/ops/persist";
import type { Suggestion, SuggestionStatus } from "@/lib/ops/types";

const STATUS: Record<SuggestionStatus, string> = {
  new: "Ny",
  reviewing: "Tas vidare",
  done: "Genomförd",
  rejected: "Avslagen",
};

export function SuggestionWorkspace() {
  const { session, loading } = useOrgSession();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const canManage = session?.role !== "viewer";

  async function reload() {
    if (!session?.organizationId) return;
    try {
      setItems(await listSuggestions(session.organizationId));
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
      open: items.filter((item) => item.status === "new" || item.status === "reviewing").length,
      done: items.filter((item) => item.status === "done").length,
    }),
    [items],
  );

  async function handleCreate() {
    if (!session?.organizationId || !title.trim()) return;
    try {
      const row = await createSuggestion({
        organizationId: session.organizationId,
        userId: session.userId,
        title: title.trim(),
        description: description.trim(),
      });
      setItems((current) => [row, ...current]);
      setCreateOpen(false);
      setTitle("");
      setDescription("");
    } catch (error) {
      setStatus(missingTableMessage(error));
    }
  }

  async function handleUpdate() {
    if (!selected) return;
    try {
      await updateSuggestion(selected.id, selected.status);
      setItems((current) => current.map((item) => (item.id === selected.id ? selected : item)));
      setSelected(null);
    } catch (error) {
      setStatus(missingTableMessage(error));
    }
  }

  return (
    <DashboardLayout
      description="En idé som gör arbetet bättre. Alla kan lämna. Admin tar vidare eller avslår."
      navigation={navigation}
      title="Förbättringsförslag"
      actions={
        <Button disabled={!session?.organizationId} onClick={() => setCreateOpen(true)}>
          <Plus data-icon="inline-start" />
          Lämna förslag
        </Button>
      }
    >
      {status ? <p className="text-sm text-destructive">{status}</p> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-md bg-primary/10 p-3 text-primary">
              <Lightbulb className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Totalt</p>
              <p className="text-2xl font-semibold">{counts.all}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Att ta ställning till</p>
            <p className="text-2xl font-semibold">{counts.open}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Genomförda</p>
            <p className="text-2xl font-semibold">{counts.done}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <p className="font-medium">Inga förslag ännu</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Skriv en mening om vad som kan bli bättre. Ni tar vidare det som är värt att göra.
              </p>
              <Button onClick={() => setCreateOpen(true)}>Lämna förslag</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nr</TableHead>
                  <TableHead>Titel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Datum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow className="cursor-pointer" key={item.id} onClick={() => setSelected(item)}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{caseNumber("F", item.number)}</TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === "done" ? "secondary" : item.status === "rejected" ? "outline" : "default"}>
                        {STATUS[item.status]}
                      </Badge>
                    </TableCell>
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
            <DialogTitle>Lämna förslag</DialogTitle>
            <DialogDescription>Beskriv idén så att någon kan ta den vidare.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="forslag-titel">Titel</Label>
              <Input id="forslag-titel" onChange={(event) => setTitle(event.target.value)} value={title} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="forslag-text">Förslag</Label>
              <Textarea id="forslag-text" onChange={(event) => setDescription(event.target.value)} value={description} />
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
            <DialogTitle>{selected ? `${caseNumber("F", selected.number)} ${selected.title}` : "Förslag"}</DialogTitle>
            <DialogDescription>{selected?.description || "Ingen beskrivning."}</DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select
                disabled={!canManage}
                onValueChange={(value) => setSelected({ ...selected, status: value as SuggestionStatus })}
                value={selected.status}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Ny</SelectItem>
                  <SelectItem value="reviewing">Tas vidare</SelectItem>
                  <SelectItem value="done">Genomförd</SelectItem>
                  <SelectItem value="rejected">Avslagen</SelectItem>
                </SelectContent>
              </Select>
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
