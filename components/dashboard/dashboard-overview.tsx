"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { createClient } from "@/lib/supabase/client";

const metrics = [
  {
    label: "Öppna avvikelser",
    value: "—",
    detail: "Kopplas till data snart",
    icon: TriangleAlert,
    tone: "text-warning",
  },
  {
    label: "Dokument att kvittera",
    value: "—",
    detail: "Kopplas till Manual",
    icon: ClipboardCheck,
    tone: "text-primary",
  },
  {
    label: "Kommande aktiviteter",
    value: "—",
    detail: "Kopplas till Årshjul",
    icon: CalendarDays,
    tone: "text-success",
  },
  {
    label: "Genomsnittlig kundpoäng",
    value: "—",
    detail: "Kopplas till Kundmodul",
    icon: Star,
    tone: "text-primary",
  },
];

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

export function DashboardOverview() {
  const [greetingName, setGreetingName] = useState("");
  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
    setTodayLabel(
      new Date().toLocaleDateString("sv-SE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );

    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      const full =
        (user.user_metadata?.full_name as string | undefined) ||
        user.email?.split("@")[0] ||
        "där";
      setGreetingName(firstName(full));
    });
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium capitalize text-primary">{todayLabel}</p>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {greetingName ? `Hej ${greetingName}` : "Hej"}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Här är en överblick över vad som händer i verksamheten.
          </p>
        </div>
        <Button asChild>
          <Link href="/manual">
            <Plus data-icon="inline-start" />
            Öppna manual
          </Link>
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
                  <ArrowUpRight className="mb-1 size-4 text-muted-foreground" />
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
          <Button asChild variant="outline">
            <Link href="/manual">
              <FileText data-icon="inline-start" />
              Manual
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/avvikelse">
              <TriangleAlert data-icon="inline-start" />
              Lämna avvikelse
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/forslag">
              <Plus data-icon="inline-start" />
              Nytt förslag
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <CardTitle>Senaste aktivitet</CardTitle>
              <CardDescription>Visas när händelser sparas i databasen.</CardDescription>
            </div>
            <Button aria-label="Fler aktivitetsalternativ" size="icon" variant="ghost">
              <MoreHorizontal />
            </Button>
          </CardHeader>
          <CardContent>
            <p className="px-2 py-6 text-sm text-muted-foreground">
              Ingen aktivitet ännu. När du publicerar dokument eller registrerar avvikelser syns de här.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kommande 30 dagar</CardTitle>
            <CardDescription>Från Årshjul när data finns.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="px-2 py-4 text-sm text-muted-foreground">Inga planerade aktiviteter ännu.</p>
            <Button asChild className="mt-1 w-full" variant="outline">
              <Link href="/arshjul">Öppna årshjul</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
