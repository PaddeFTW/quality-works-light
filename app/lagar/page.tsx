"use client";

import { useMemo, useState } from "react";
import { Plus, Scale, Search } from "lucide-react";

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

type Area = "Kvalitet" | "Miljö" | "Arbetsmiljö" | "Övrigt";
type Compliance = "Uppfylld" | "Delvis" | "Ej kontrollerad" | "Ej tillämplig";

interface LawItem {
  id: string;
  name: string;
  area: Area;
  authority: string;
  responsible: string;
  lastReviewed: string;
  nextReview: string;
  compliance: Compliance;
  note?: string;
}

const initialLaws: LawItem[] = [
  {
    id: "1",
    name: "Arbetsmiljölagen (1977:1160)",
    area: "Arbetsmiljö",
    authority: "Arbetsmiljöverket",
    responsible: "Skyddsombud",
    lastReviewed: "2026-03-15",
    nextReview: "2027-03-15",
    compliance: "Uppfylld",
  },
  {
    id: "2",
    name: "AFS 2023:1 Systematiskt arbetsmiljöarbete",
    area: "Arbetsmiljö",
    authority: "Arbetsmiljöverket",
    responsible: "VD",
    lastReviewed: "2026-02-01",
    nextReview: "2027-02-01",
    compliance: "Delvis",
    note: "Skyddsrond saknas för Q3",
  },
  {
    id: "3",
    name: "Miljöbalken (1998:808)",
    area: "Miljö",
    authority: "Naturvårdsverket",
    responsible: "Miljöansvarig",
    lastReviewed: "2026-01-20",
    nextReview: "2027-01-20",
    compliance: "Uppfylld",
  },
  {
    id: "4",
    name: "Avfallsförordningen (2020:614)",
    area: "Miljö",
    authority: "Naturvårdsverket",
    responsible: "Miljöansvarig",
    lastReviewed: "2025-11-10",
    nextReview: "2026-11-10",
    compliance: "Ej kontrollerad",
  },
  {
    id: "5",
    name: "Produktsäkerhetslagen (2004:451)",
    area: "Kvalitet",
    authority: "Konsumentverket",
    responsible: "Kvalitetsansvarig",
    lastReviewed: "2026-04-01",
    nextReview: "2027-04-01",
    compliance: "Uppfylld",
  },
  {
    id: "6",
    name: "GDPR / Dataskyddsförordningen",
    area: "Övrigt",
    authority: "IMY",
    responsible: "VD",
    lastReviewed: "2026-05-12",
    nextReview: "2027-05-12",
    compliance: "Delvis",
  },
];

function complianceVariant(status: Compliance) {
  if (status === "Uppfylld") return "secondary" as const;
  if (status === "Delvis") return "outline" as const;
  if (status === "Ej tillämplig") return "outline" as const;
  return "default" as const;
}

export default function LagarPage() {
  const [laws, setLaws] = useState(initialLaws);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState<string>("alla");

  const filtered = useMemo(() => {
    return laws.filter((law) => {
      const matchesQuery =
        !query ||
        law.name.toLowerCase().includes(query.toLowerCase()) ||
        law.authority.toLowerCase().includes(query.toLowerCase()) ||
        law.responsible.toLowerCase().includes(query.toLowerCase());
      const matchesArea = areaFilter === "alla" || law.area === areaFilter;
      return matchesQuery && matchesArea;
    });
  }, [laws, query, areaFilter]);

  const stats = useMemo(() => {
    return {
      total: laws.length,
      ok: laws.filter((l) => l.compliance === "Uppfylld").length,
      partial: laws.filter((l) => l.compliance === "Delvis").length,
      unchecked: laws.filter((l) => l.compliance === "Ej kontrollerad").length,
    };
  }, [laws]);

  return (
    <DashboardLayout
      description="Laglista och lagefterlevnadskontroll för kvalitet, miljö, arbetsmiljö och andra krav."
      navigation={navigation}
      title="Lagar och bindande krav"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus data-icon="inline-start" />
              Lägg till krav
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nytt lagkrav</DialogTitle>
              <DialogDescription>
                Registrera lag, föreskrift eller annat bindande krav som verksamheten omfattas av.
              </DialogDescription>
            </DialogHeader>
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const fd = new FormData(form);
                const item: LawItem = {
                  id: String(Date.now()),
                  name: String(fd.get("name") || ""),
                  area: (String(fd.get("area") || "Övrigt") as Area),
                  authority: String(fd.get("authority") || ""),
                  responsible: String(fd.get("responsible") || ""),
                  lastReviewed: String(fd.get("lastReviewed") || ""),
                  nextReview: String(fd.get("nextReview") || ""),
                  compliance: (String(fd.get("compliance") || "Ej kontrollerad") as Compliance),
                  note: String(fd.get("note") || "") || undefined,
                };
                setLaws((prev) => [item, ...prev]);
                setOpen(false);
                form.reset();
              }}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Namn / benämning</Label>
                <Input id="name" name="name" placeholder="t.ex. Arbetsmiljölagen" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label>Område</Label>
                  <Select name="area" defaultValue="Arbetsmiljö">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kvalitet">Kvalitet</SelectItem>
                      <SelectItem value="Miljö">Miljö</SelectItem>
                      <SelectItem value="Arbetsmiljö">Arbetsmiljö</SelectItem>
                      <SelectItem value="Övrigt">Övrigt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Efterlevnad</Label>
                  <Select name="compliance" defaultValue="Ej kontrollerad">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Uppfylld">Uppfylld</SelectItem>
                      <SelectItem value="Delvis">Delvis</SelectItem>
                      <SelectItem value="Ej kontrollerad">Ej kontrollerad</SelectItem>
                      <SelectItem value="Ej tillämplig">Ej tillämplig</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="authority">Myndighet</Label>
                  <Input id="authority" name="authority" placeholder="t.ex. Arbetsmiljöverket" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="responsible">Ansvarig</Label>
                  <Input id="responsible" name="responsible" placeholder="Roll eller namn" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="lastReviewed">Senast granskad</Label>
                  <Input id="lastReviewed" name="lastReviewed" type="date" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="nextReview">Nästa granskning</Label>
                  <Input id="nextReview" name="nextReview" type="date" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="note">Anteckning</Label>
                <Textarea id="note" name="note" placeholder="Valfri notering" />
              </div>
              <DialogFooter>
                <Button type="submit">Spara i laglistan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Totalt i listan</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Uppfyllda</CardDescription>
            <CardTitle className="text-2xl">{stats.ok}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Delvis</CardDescription>
            <CardTitle className="text-2xl">{stats.partial}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ej kontrollerade</CardDescription>
            <CardTitle className="text-2xl">{stats.unchecked}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="size-4 text-primary" />
            Lagefterlevnad
          </CardTitle>
          <CardDescription>
            Lista krav, utse ansvarig och planera granskning. Resultatet kan kopplas till Manualen
            och Årshjulet vid revision.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Sök lag, myndighet eller ansvarig…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Område" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alla">Alla områden</SelectItem>
              <SelectItem value="Kvalitet">Kvalitet</SelectItem>
              <SelectItem value="Miljö">Miljö</SelectItem>
              <SelectItem value="Arbetsmiljö">Arbetsmiljö</SelectItem>
              <SelectItem value="Övrigt">Övrigt</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Krav</TableHead>
                <TableHead>Område</TableHead>
                <TableHead>Ansvarig</TableHead>
                <TableHead>Nästa granskning</TableHead>
                <TableHead>Efterlevnad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((law) => (
                <TableRow key={law.id}>
                  <TableCell>
                    <div className="font-medium">{law.name}</div>
                    <div className="text-xs text-muted-foreground">{law.authority}</div>
                    {law.note ? (
                      <div className="mt-1 text-xs text-muted-foreground">{law.note}</div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{law.area}</Badge>
                  </TableCell>
                  <TableCell>{law.responsible}</TableCell>
                  <TableCell>{law.nextReview || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={complianceVariant(law.compliance)}>{law.compliance}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Inga krav matchar filtret.
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
