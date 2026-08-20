"use client";

import { useState } from "react";
import { CheckCircle2, Clock3, Lightbulb, Plus } from "lucide-react";

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const suggestions = [
  { title: "Digitalisera checklistor för egenkontroll", status: "Ny", date: "19 aug 2026" },
  { title: "Inför gemensam mall för kundåterkoppling", status: "Pågår", date: "15 aug 2026" },
  { title: "Samla förbättringsidéer vid månadsmöten", status: "Genomförd", date: "09 aug 2026" },
  { title: "Förenkla introduktionen för nya medarbetare", status: "Ny", date: "04 aug 2026" },
  { title: "Tydligare ansvar för uppdatering av rutiner", status: "Pågår", date: "29 jul 2026" },
];

function statusVariant(status: string) {
  if (status === "Genomförd") return "secondary" as const;
  if (status === "Pågår") return "outline" as const;
  return "default" as const;
}

export default function ForslagPage() {
  const [open, setOpen] = useState(false);

  return (
    <DashboardLayout
      description="Samla, prioritera och följ upp idéer som utvecklar verksamheten."
      navigation={navigation}
      title="Förbättringsförslag"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus data-icon="inline-start" />
              Lämna förslag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lämna förslag</DialogTitle>
              <DialogDescription>Beskriv din idé så att den kan tas vidare på bästa sätt.</DialogDescription>
            </DialogHeader>
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                setOpen(false);
              }}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="titel">Titel</Label>
                <Input id="titel" placeholder="Skriv en kort titel" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="beskrivning">Beskrivning</Label>
                <Textarea id="beskrivning" placeholder="Beskriv ditt förbättringsförslag" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="kategori">Kategori</Label>
                <Select defaultValue="process">
                  <SelectTrigger id="kategori"><SelectValue placeholder="Välj kategori" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="process">Process</SelectItem>
                    <SelectItem value="dokumentation">Dokumentation</SelectItem>
                    <SelectItem value="arbetsmiljo">Arbetsmiljö</SelectItem>
                    <SelectItem value="kund">Kund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue="ny">
                  <SelectTrigger id="status"><SelectValue placeholder="Välj status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ny">Ny</SelectItem>
                    <SelectItem value="pagar">Pågår</SelectItem>
                    <SelectItem value="genomford">Genomförd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
                <Button type="submit">Skicka förslag</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-primary/10 p-3 text-primary"><Lightbulb className="size-5" /></div><div><p className="text-sm text-muted-foreground">Totalt antal</p><p className="text-2xl font-semibold">18</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-warning/10 p-3 text-warning"><Clock3 className="size-5" /></div><div><p className="text-sm text-muted-foreground">Pågående</p><p className="text-2xl font-semibold">6</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-success/10 p-3 text-success"><CheckCircle2 className="size-5" /></div><div><p className="text-sm text-muted-foreground">Genomförda</p><p className="text-2xl font-semibold">9</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Senaste förslag</CardTitle>
          <CardDescription>En samlad överblick över rapporterade förbättringsförslag.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Titel</TableHead><TableHead>Status</TableHead><TableHead>Datum</TableHead></TableRow></TableHeader>
              <TableBody>{suggestions.map((suggestion) => <TableRow key={suggestion.title}><TableCell className="min-w-72 font-medium">{suggestion.title}</TableCell><TableCell><Badge variant={statusVariant(suggestion.status)}>{suggestion.status}</Badge></TableCell><TableCell className="text-muted-foreground">{suggestion.date}</TableCell></TableRow>)}</TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
