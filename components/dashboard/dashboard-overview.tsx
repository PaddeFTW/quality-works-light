"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ClipboardCheck,
  FileText,
  Lightbulb,
  Plus,
  TriangleAlert,
  UserPlus,
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
import { useOrgSession } from "@/components/providers/org-provider";
import { caseNumber, formatSvDate, loadOpsStats, missingTableMessage } from "@/lib/ops/persist";
import { loadMyOpenReferrals } from "@/lib/manual/cloud";
import type { OpsStats } from "@/lib/ops/types";
import type { ReviewRequest } from "@/types/domain";

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

const emptyStats: OpsStats = {
  openDeviations: 0,
  openSuggestions: 0,
  upcomingActivities: [],
  recentDeviations: [],
};

export function DashboardOverview() {
  const { session, loading } = useOrgSession();
  const [todayLabel, setTodayLabel] = useState("");
  const [stats, setStats] = useState<OpsStats>(emptyStats);
  const [referrals, setReferrals] = useState<(ReviewRequest & { documentTitle?: string })[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setTodayLabel(
      new Date().toLocaleDateString("sv-SE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );
  }, []);

  useEffect(() => {
    if (loading || !session?.organizationId) return;
    void loadOpsStats(session.organizationId)
      .then((next) => {
        setStats(next);
        setStatus(null);
      })
      .catch((error) => setStatus(missingTableMessage(error)));
  }, [loading, session?.organizationId]);

  useEffect(() => {
    if (loading || !session?.userId) return;
    void loadMyOpenReferrals(session.userId).then(setReferrals).catch(() => setReferrals([]));
  }, [loading, session?.userId]);

  const greetingName = session?.fullName ? firstName(session.fullName) : "";

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium capitalize text-primary">{todayLabel}</p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {greetingName ? `Hej ${greetingName}` : "Hej"}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Det som behöver göras i ledningssystemet, idag.
          </p>
        </div>
        <Button asChild>
          <Link href="/manual" rel="noopener noreferrer" target="_blank">
            <Plus data-icon="inline-start" />
            Öppna manual
          </Link>
        </Button>
      </section>

      {status ? <p className="text-sm text-destructive">{status}</p> : null}

      {referrals.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Remiss att svara på</CardTitle>
            <CardDescription>Läs utkastet och säg om det stämmer.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {referrals.map((item) => (
                <li key={item.id}>
                  <Link
                    className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-accent"
                    href={`/manual?blad=${item.documentId}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="min-w-0">
                      <span className="font-medium">{item.documentTitle}</span>
                      {item.dueAt ? (
                        <span className="ml-2 text-xs text-muted-foreground">senast {item.dueAt}</span>
                      ) : null}
                    </span>
                    <Badge>Öppen</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <section aria-label="Börja här" className="grid gap-4 md:grid-cols-3">
        <StartStep
          href="/manual"
          newTab
          step="1"
          text="Öppna boken. Skapa 1.0. Skriv hur ni faktiskt gör."
          title="Manualen"
        />
        <StartStep
          href="/installningar"
          step="2"
          text="Skicka mejl till en kollega. Hen klickar och går med."
          title="Bjud in"
        />
        <StartStep
          href="/arshjul"
          step="3"
          text="Lägg intern revision i kalendern. Den syns här på Start."
          title="Årshjulet"
        />
      </section>

      <section aria-label="Nyckeltal" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric href="/avvikelse" icon={TriangleAlert} label="Öppna avvikelser" value={String(stats.openDeviations)} />
        <Metric href="/forslag" icon={Lightbulb} label="Förslag att ta ställning till" value={String(stats.openSuggestions)} />
        <Metric href="/arshjul" icon={CalendarDays} label="Aktiviteter 30 dagar" value={String(stats.upcomingActivities.length)} />
        <Metric href="/manual" icon={ClipboardCheck} label="Manual" value="Öppna" />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-base font-semibold">Snabbåtgärder</h3>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/manual" rel="noopener noreferrer" target="_blank">
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
          <Button asChild variant="outline">
            <Link href="/installningar">
              <UserPlus data-icon="inline-start" />
              Bjud in kollega
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Senaste avvikelser</CardTitle>
            <CardDescription>Det som nyligen lämnats in.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentDeviations.length === 0 ? (
              <p className="px-2 py-6 text-sm text-muted-foreground">
                Inga avvikelser ännu. När någon lämnar en syns den här.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {stats.recentDeviations.map((item) => (
                  <li key={item.id}>
                    <Link className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-accent" href="/avvikelse">
                      <span className="min-w-0">
                        <span className="mr-2 font-mono text-xs text-muted-foreground">{caseNumber("A", item.number)}</span>
                        <span className="font-medium">{item.title}</span>
                      </span>
                      <Badge variant={item.status === "closed" ? "secondary" : "outline"}>
                        {item.status === "closed" ? "Stängd" : item.status === "in_progress" ? "Pågår" : "Öppen"}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kommande 30 dagar</CardTitle>
            <CardDescription>Från årshjulet.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {stats.upcomingActivities.length === 0 ? (
              <p className="px-2 py-4 text-sm text-muted-foreground">Inga planerade aktiviteter ännu.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {stats.upcomingActivities.map((item) => (
                  <li className="flex items-center justify-between gap-3 text-sm" key={item.id}>
                    <span className="font-medium">{item.title}</span>
                    <span className="text-muted-foreground">{formatSvDate(item.plannedOn)}</span>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild className="mt-2 w-full" variant="outline">
              <Link href="/arshjul">Öppna årshjul</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Metric({
  href,
  icon: Icon,
  label,
  value,
}: {
  href: string;
  icon: typeof TriangleAlert;
  label: string;
  value: string;
}) {
  return (
    <Link href={href} rel={href.startsWith("/manual") ? "noopener noreferrer" : undefined} target={href.startsWith("/manual") ? "_blank" : undefined}>
      <Card className="h-full shadow-token-md transition-token hover:-translate-y-1 hover:shadow-token-lg">
        <CardContent className="flex flex-col gap-5 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <Icon className="size-5 text-primary" />
          </div>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function StartStep({
  href,
  title,
  text,
  step,
  newTab,
}: {
  href: string;
  title: string;
  text: string;
  step: string;
  newTab?: boolean;
}) {
  return (
    <Link href={href} rel={newTab ? "noopener noreferrer" : undefined} target={newTab ? "_blank" : undefined}>
      <Card className="h-full bg-gradient-to-br from-card to-accent/40 shadow-token-md transition-token hover:-translate-y-1 hover:shadow-token-lg">
        <CardContent className="flex flex-col gap-3 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Steg {step}</p>
          <p className="text-lg font-bold">{title}</p>
          <p className="text-sm leading-6 text-muted-foreground">{text}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
