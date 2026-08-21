"use client";

import { useMemo, useState } from "react";
import {
  ClipboardCheck,
  FileWarning,
  FlaskConical,
  ListChecks,
  Plus,
  Search,
  Shield,
  TreePine,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { navigation } from "@/components/layout/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type ControlType =
  | "Egenkontroll"
  | "Kontrollplan"
  | "Riskbedömning"
  | "Skyddsrond"
  | "Miljörond"
  | "Säkerhetsdatablad";

type ControlStatus = "Planerad" | "Genomförd" | "Avvikelse" | "Arkiverad";

interface ControlItem {
  id: string;
  title: string;
  type: ControlType;
  area: string;
  responsible: string;
  date: string;
  status: ControlStatus;
  note?: string;
}

const typeMeta: Record<
  ControlType,
  { description: string; icon: React.ReactNode }
> = {
  Egenkontroll: {
    description: "Kontrollpunkter under arbete – godkänd / ej godkänd / ej tillämplig.",
    icon: <ListChecks className="size-4 text-primary" />,
  },
  Kontrollplan: {
    description: "Planerade kontroller i projekt eller process över tid.",
    icon: <ClipboardCheck className="size-4 text-primary" />,
  },
  Riskbedömning: {
    description: "Identifiera risker, bedöma allvar och besluta åtgärder.",
    icon: <FileWarning className="size-4 text-primary" />,
  },
  Skyddsrond: {
    description: "Arbetsmiljörond med observationer och uppföljning.",
    icon: <Shield className="size-4 text-primary" />,
  },
  Miljörond: {
    description: "Miljökontroll på plats – avfall, kemikalier, spill m.m.",
    icon: <TreePine className="size-4 text-primary" />,
  },
  Säkerhetsdatablad: {
    description: "Register över kemikalier och tillhörande SDB.",
    icon: <FlaskConical className="size-4 text-primary" />,
  },
};

const initialItems: ControlItem[] = [
  {
    id: "1",
    title: "Egenkontroll – underlag badrum lägenhet 3",
    type: "Egenkontroll",
    area: "Bygg / våtrum",
    responsible: "Arbetsledare",
    date: "2026-08-18",
    status: "Genomförd",
  },
  {
    id: "2",
    title: "Kontrollplan – stomkomplettering etapp 2",
    type: "Kontrollplan",
    area: "Projekt",
    responsible: "Projektledare",
    date: "2026-08-01",
    status: "Planerad",
  },
  {
    id: "3",
    title: "Riskbedömning – arbete på höjd",
    type: "Riskbedömning",
    area: "Arbetsmiljö",
    responsible: "Skyddsombud",
    date: "2026-07-22",
    status: "Genomförd",
    note: "Fallskydd kompletterat",
  },
  {
    id: "4",
    title: "Skyddsrond Q3 – verkstad",
    type: "Skyddsrond",
    area: "Arbetsmiljö",
    responsible: "Skyddsombud",
    date: "2026-09-15",
    status: "Planerad",
  },
  {
    id: "5",
    title: "Miljörond – kemikalieförråd",
    type: "Miljörond",
    area: "Miljö",
    responsible: "Miljöansvarig",
    date: "2026-08-05",
    status: "Avvikelse",
    note: "Märkning saknas på 2 behållare",
  },
  {
    id: "6",
    title: "SDB – aceton och limprodukter",
    type: "Säkerhetsdatablad",
    area: "Kemikalier",
    responsible: "Miljöansvarig",
    date: "2026-06-12",
    status: "Genomförd",
  },
];

function statusVariant(status: ControlStatus) {
  if (status === "Genomförd") return "secondary" as const;
  if (status === "Avvikelse") return "destructive" as const;
  if (status === "Arkiverad") return "outline" as const;
  return "default" as const;
}

export default function KontrollerPage() {
  const [items, setItems] = useState(initialItems);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("alla");

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.area.toLowerCase().includes(q) ||
        item.responsible.toLowerCase().includes(q);
      const matchesType = typeFilter === "alla" || item.type === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [items, query, typeFilter]);

  const counts = useMemo(() => {
    const map = {} as Record<ControlType, number>;
    (Object.keys(typeMeta) as ControlType[]).forEach((t) => {
      map[t] = items.filter((i) => i.type === t).length;
    });
    return map;
  }, [items]);

  return (
    <DashboardLayout
      description="Egenkontroll, kontrollplan, riskbedömning, skydds- och miljörond samt säkerhetsdatablad."
      navigation={navigation}
      title="Kontroller"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus data-icon="inline-start" />
              Ny kontroll
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Ny kontroll</DialogTitle>
              <DialogDescription>
                Registrera en kontrollaktivitet. Full checklista och export byggs ut i nästa steg.
              </DialogDescription>
            </DialogHeader>
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const fd = new FormData(form);
                const item: ControlItem = {
                  id: String(Date.now()),
                  title: String(fd.get("title") || ""),
                  type: String(fd.get("type") || "Egenkontroll") as ControlType,
                  area: String(fd.get("area") || ""),
                  responsible: String(fd.get("responsible") || ""),
                  date: String(fd.get("date") || ""),
                  status: String(fd.get("status") || "Planerad") as ControlStatus,
                  note: String(fd.get("note") || "") || undefined,
                };
                setItems((prev) => [item, ...prev]);
                setOpen(false);
                form.reset();
              }}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Titel</Label>
                <Input id="title" name="title" placeholder="Vad kontrolleras?" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label>Typ</Label>
                  <Select name="type" defaultValue="Egenkontroll">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(typeMeta) as ControlType[]).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Status</Label>
                  <Select name="status" defaultValue="Planerad">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planerad">Planerad</SelectItem>
                      <SelectItem value="Genomförd">Genomförd</SelectItem>
                      <SelectItem value="Avvikelse">Avvikelse</SelectItem>
                      <SelectItem value="Arkiverad">Arkiverad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="area">Område / plats</Label>
                  <Input id="area" name="area" placeholder="t.ex. Verkstad" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="responsible">Ansvarig</Label>
                  <Input id="responsible" name="responsible" placeholder="Roll eller namn" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="date">Datum</Label>
                <Input id="date" name="date" type="date" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="note">Anteckning</Label>
                <Textarea id="note" name="note" placeholder="Valfritt" />
              </div>
              <DialogFooter>
                <Button type="submit">Spara</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(typeMeta) as ControlType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTypeFilter(typeFilter === type ? "alla" : type)}
            className="text-left"
          >
            <Card
              className={
                typeFilter === type
                  ? "border-primary ring-1 ring-primary/30"
                  : "transition-colors hover:border-primary/40"
              }
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  {typeMeta[type].icon}
                  {type}
                </CardTitle>
                <CardDescription className="text-xs">{typeMeta[type].description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{counts[type]}</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Sök titel, område eller ansvarig…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Typ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alla">Alla typer</SelectItem>
              {(Object.keys(typeMeta) as ControlType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kontroll</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Ansvarig</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.area}</div>
                    {item.note ? (
                      <div className="mt-1 text-xs text-muted-foreground">{item.note}</div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.type}</Badge>
                  </TableCell>
                  <TableCell>{item.responsible}</TableCell>
                  <TableCell>{item.date || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Inga kontroller matchar filtret.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
