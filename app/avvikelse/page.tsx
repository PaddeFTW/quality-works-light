"use client";

import { useState } from "react";
import { AlertCircle, CalendarDays, CheckCircle2, Plus } from "lucide-react";

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

const deviations = [
  { title: "Bristande dokumentation vid överlämning", status: "Öppen", date: "19 aug 2026", severity: "Hög" },
  { title: "Försenad uppföljning av kundärende", status: "Pågår", date: "16 aug 2026", severity: "Medel" },
  { title: "Felaktig version av rutin användes", status: "Åtgärdad", date: "12 aug 2026", severity: "Låg" },
  { title: "Avvikelse i leveranskontroll", status: "Öppen", date: "08 aug 2026", severity: "Hög" },
  { title: "Saknad signering i kontrollista", status: "Pågår", date: "03 aug 2026", severity: "Medel" },
];

function statusVariant(status: string) {
  if (status === "Åtgärdad") return "secondary" as const;
  if (status === "Pågår") return "outline" as const;
  return "default" as const;
}

function severityClass(severity: string) {
  if (severity === "Hög") return "text-destructive";
  if (severity === "Medel") return "text-warning";
  return "text-success";
}

export default function AvvikelsePage() {
  const [open, setOpen] = useState(false);

  return (
    <DashboardLayout
      description="Följ upp, dokumentera och hantera avvikelser i verksamheten."
      navigation={navigation}
      title="Avvikelser"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus data-icon="inline-start" />
              Lämna avvikelse
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lämna avvikelse</DialogTitle>
              <DialogDescription>Beskriv händelsen så att den kan följas upp på rätt sätt.</DialogDescription>
            </DialogHeader>
            <form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); setOpen(false); }}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="titel">Titel</Label>
                <Input id="titel" placeholder="Skriv en kort titel" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="beskrivning">Beskrivning</Label>
                <Textarea id="beskrivning" placeholder="Beskriv vad som har hänt" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="kategori">Kategori</Label>
                  <Select defaultValue="process">
                    <SelectTrigger id="kategori"><SelectValue placeholder="Välj kategori" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="process">Process</SelectItem>
                      <SelectItem value="dokumentation">Dokumentation</SelectItem>
                      <SelectItem value="kund">Kund</SelectItem>
                      <SelectItem value="leverans">Leverans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="allvarlighetsgrad">Allvarlighetsgrad</Label>
                  <Select defaultValue="medel">
                    <SelectTrigger id="allvarlighetsgrad"><SelectValue placeholder="Välj nivå" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lag">Låg</SelectItem>
                      <SelectItem value="medel">Medel</SelectItem>
                      <SelectItem value="hog">Hög</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue="oppen">
                  <SelectTrigger id="status"><SelectValue placeholder="Välj status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oppen">Öppen</SelectItem>
                    <SelectItem value="pagar">Pågår</SelectItem>
                    <SelectItem value="atgardad">Åtgärdad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
                <Button type="submit">Skicka avvikelse</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-primary/10 p-3 text-primary"><AlertCircle className="size-5" /></div><div><p className="text-sm text-muted-foreground">Totalt antal</p><p className="text-2xl font-semibold">24</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-warning/10 p-3 text-warning"><CalendarDays className="size-5" /></div><div><p className="text-sm text-muted-foreground">Pågående</p><p className="text-2xl font-semibold">8</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-success/10 p-3 text-success"><CheckCircle2 className="size-5" /></div><div><p className="text-sm text-muted-foreground">Åtgärdade</p><p className="text-2xl font-semibold">16</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Senaste avvikelser</CardTitle>
          <CardDescription>En samlad överblick över rapporterade avvikelser.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Titel</TableHead><TableHead>Status</TableHead><TableHead>Datum</TableHead><TableHead>Allvarlighetsgrad</TableHead></TableRow></TableHeader>
              <TableBody>{deviations.map((deviation) => <TableRow key={deviation.title}><TableCell className="min-w-72 font-medium">{deviation.title}</TableCell><TableCell><Badge variant={statusVariant(deviation.status)}>{deviation.status}</Badge></TableCell><TableCell className="text-muted-foreground">{deviation.date}</TableCell><TableCell><span className={`font-medium ${severityClass(deviation.severity)}`}>{deviation.severity}</span></TableCell></TableRow>)}</TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
