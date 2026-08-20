import { CalendarDays, CheckCircle2, Clock3, Plus, Repeat2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const activities = [
  { month: "Januari", date: "15 jan", name: "Årlig verksamhetsplanering", type: "Planering", tone: "primary" },
  { month: "Februari", date: "08 feb", name: "Uppföljning av rutiner", type: "Uppföljning", tone: "secondary" },
  { month: "Mars", date: "21 mar", name: "Vårens kvalitetsgenomgång", type: "Kvalitet", tone: "accent" },
  { month: "April", date: "04 apr", name: "Medarbetarsamtal", type: "Personal", tone: "secondary" },
  { month: "Maj", date: "16 maj", name: "Intern revision", type: "Revision", tone: "primary" },
  { month: "Juni", date: "12 jun", name: "Halvårsavstämning", type: "Uppföljning", tone: "accent" },
  { month: "Augusti", date: "19 aug", name: "Höstens planeringsdag", type: "Planering", tone: "primary" },
  { month: "September", date: "07 sep", name: "Kompetensinventering", type: "Personal", tone: "secondary" },
  { month: "Oktober", date: "23 okt", name: "Höstens kvalitetsgenomgång", type: "Kvalitet", tone: "accent" },
  { month: "November", date: "11 nov", name: "Ledningsgenomgång", type: "Ledning", tone: "primary" },
  { month: "December", date: "05 dec", name: "Årets sammanfattning", type: "Uppföljning", tone: "secondary" },
];

const monthNames = [
  "Januari",
  "Februari",
  "Mars",
  "April",
  "Maj",
  "Juni",
  "Juli",
  "Augusti",
  "September",
  "Oktober",
  "November",
  "December",
];

export function ArshjulOverview() {
  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-3" aria-label="Sammanfattning">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-primary/10 p-3 text-primary"><Repeat2 className="size-5" /></div>
            <div><p className="text-sm text-muted-foreground">Återkommande aktiviteter</p><p className="mt-1 text-2xl font-semibold">11</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-accent p-3 text-accent-foreground"><CheckCircle2 className="size-5" /></div>
            <div><p className="text-sm text-muted-foreground">Genomförda i år</p><p className="mt-1 text-2xl font-semibold">4</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-secondary p-3 text-secondary-foreground"><Clock3 className="size-5" /></div>
            <div><p className="text-sm text-muted-foreground">Nästa aktivitet</p><p className="mt-1 text-2xl font-semibold">08 feb</p></div>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><CalendarDays className="size-5" /></div>
                <div><CardTitle>Årshjul 2026</CardTitle><CardDescription className="mt-1">En samlad överblick över årets återkommande aktiviteter.</CardDescription></div>
              </div>
              <Badge variant="secondary">2026</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {activities.map((activity) => (
                <div className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-accent/40" key={activity.name}>
                  <div className="w-24 shrink-0"><p className="text-sm font-medium">{activity.month}</p><p className="mt-0.5 text-xs text-muted-foreground">{activity.date}</p></div>
                  <div className="size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{activity.name}</p>
                  <Badge variant={activity.tone === "primary" ? "default" : "secondary"}>{activity.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader><CardTitle className="text-base">Årets månader</CardTitle><CardDescription>Snabb överblick per månad.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {monthNames.map((month) => {
              const activity = activities.find((item) => item.month === month);
              return <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-xs" key={month}><span>{month.slice(0, 3)}</span><span className={activity ? "font-semibold text-primary" : "text-muted-foreground"}>{activity ? "1" : "–"}</span></div>;
            })}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button size="lg"><Plus data-icon="inline-start" />Ny aktivitet</Button>
      </div>
    </div>
  );
}

export default ArshjulOverview;
