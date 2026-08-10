"use client";

import {
  ArrowUpRight,
  CalendarDays,
  ClipboardCheck,
  FileText,
  MoreHorizontal,
  Plus,
  Star,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const metrics = [
  {
    label: "Öppna avvikelser",
    value: "12",
    detail: "+2 sedan förra veckan",
    icon: TriangleAlert,
    tone: "text-warning",
  },
  {
    label: "Dokument att kvittera",
    value: "8",
    detail: "3 nya idag",
    icon: ClipboardCheck,
    tone: "text-primary",
  },
  {
    label: "Kommande aktiviteter",
    value: "24",
    detail: "Nästa: om 2 dagar",
    icon: CalendarDays,
    tone: "text-success",
  },
  {
    label: "Genomsnittlig kundpoäng",
    value: "4,6",
    detail: "+0,3 från förra månaden",
    icon: Star,
    tone: "text-primary",
  },
];

const activities = [
  { title: "Ny avvikelse registrerad", description: "Produktion · Linje 2", time: "För 12 min sedan", status: "Ny" },
  { title: "Rutin uppdaterad", description: "Säkerhetsrutin 04", time: "För 1 timme sedan", status: "Klar" },
  { title: "Dokument kvitterat", description: "Anna Lindberg · Kvalitetspolicy", time: "Igår, 16:24", status: "Klar" },
  { title: "Kundfeedback mottagen", description: "Nordic Manufacturing AB", time: "Igår, 14:08", status: "Ny" },
];

const upcoming = [
  { date: "18", month: "JUN", title: "Ledningsgenomgång", detail: "09:00 · Konferensrum A", tone: "bg-primary/10 text-primary" },
  { date: "20", month: "JUN", title: "Intern revision", detail: "Hela dagen · Kvalitet", tone: "bg-accent text-accent-foreground" },
  { date: "24", month: "JUN", title: "Kundmöte", detail: "13:30 · Digitalt", tone: "bg-secondary text-secondary-foreground" },
];

export function DashboardOverview() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-primary">Tisdag 17 juni 2025</p>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Hej Anna</h2>
          <p className="text-sm leading-6 text-muted-foreground">Här är en överblick över vad som händer i verksamheten.</p>
        </div>
        <Button>
          <Plus data-icon="inline-start" />
          Skapa nytt
        </Button>
      </section>

      <section aria-label="Nyckeltal" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="shadow-sm transition-token hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="flex flex-col gap-5 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">{metric.label}</span>
                  <Icon className={`size-5 ${metric.tone}`} />
                </div>
                <div className="flex items-end justify-between gap-3">
                  <p className="text-3xl font-semibold tracking-tight">{metric.value}</p>
                  <ArrowUpRight className="mb-1 size-4 text-success" />
                </div>
                <p className="text-xs text-muted-foreground">{metric.detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-base font-semibold">Snabbåtgärder</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline"><FileText data-icon="inline-start" />Manual</Button>
          <Button variant="outline"><TriangleAlert data-icon="inline-start" />Lämna avvikelse</Button>
          <Button variant="outline"><Plus data-icon="inline-start" />Nytt förslag</Button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <CardTitle>Senaste aktivitet</CardTitle>
              <CardDescription>Det senaste som har hänt i verksamheten.</CardDescription>
            </div>
            <Button aria-label="Fler aktivitetsalternativ" size="icon" variant="ghost"><MoreHorizontal /></Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {activities.map((activity, index) => (
              <div key={activity.title}>
                <div className="flex items-start gap-3 rounded-lg px-2 py-3 transition-token hover:bg-muted/60">
                  <div className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <Badge variant={activity.status === "Ny" ? "default" : "secondary"}>{activity.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{activity.time}</span>
                </div>
                {index < activities.length - 1 ? <Separator /> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kommande 30 dagar</CardTitle>
            <CardDescription>Planerade aktiviteter och möten.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {upcoming.map((item) => (
              <div className="flex items-center gap-3 rounded-lg p-2 transition-token hover:bg-muted/60" key={item.title}>
                <div className={`flex size-11 shrink-0 flex-col items-center justify-center rounded-lg ${item.tone}`}>
                  <span className="text-base font-semibold leading-none">{item.date}</span>
                  <span className="mt-1 text-[10px] font-semibold tracking-wider">{item.month}</span>
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ))}
            <Button className="mt-3 w-full" variant="outline">Visa kalender</Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
