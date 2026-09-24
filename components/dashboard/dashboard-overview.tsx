"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarRange, FileText, Lightbulb, Plus, ShieldCheck, TriangleAlert } from "lucide-react";

import { MiniBars } from "@/components/common/mini-bars";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrgSession } from "@/components/providers/org-provider";
import { readLastOpenedId } from "@/components/manual/manual-boot";
import { createClient } from "@/lib/supabase/client";
import { caseNumber, createYearActivity, formatSvDate, loadOpsStats, missingTableMessage } from "@/lib/ops/persist";
import { laterThisYear, YEAR_PRESETS } from "@/lib/ops/year-presets";
import { loadMyOpenReferrals } from "@/lib/manual/cloud";
import { loadCompetence } from "@/lib/kompetens/persist";
import type { OpsStats } from "@/lib/ops/types";
import type { ReviewRequest } from "@/types/domain";

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

function readableTitle(title: string) {
  const text = title.trim();
  if (!text || /^\d+$/.test(text) || /^[0-9a-f-]{16,}$/i.test(text)) return "Namnlöst blad";
  return text;
}

function whenLabel(date: string, todayKey: string) {
  if (!todayKey) return formatSvDate(date);
  const days = Math.round((new Date(date).getTime() - new Date(todayKey).getTime()) / 86400000);
  if (Number.isNaN(days)) return formatSvDate(date);
  if (days < -1) return `Försenad ${Math.abs(days)} dagar`;
  if (days === -1) return "Försenad sedan i går";
  if (days === 0) return "I dag";
  if (days === 1) return "I morgon";
  return formatSvDate(date);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

const emptyStats: OpsStats = {
  openDeviations: 0,
  openSuggestions: 0,
  upcomingActivities: [],
  overdueActivities: [],
  recentDeviations: [],
  yearTotal: 0,
  yearDone: 0,
  monthCounts: Array.from({ length: 12 }, () => 0),
};

interface LastOpened {
  id: string;
  title: string;
}

export function DashboardOverview() {
  const { session, loading } = useOrgSession();
  const [todayLabel, setTodayLabel] = useState("");
  const [stats, setStats] = useState<OpsStats>(emptyStats);
  const [referrals, setReferrals] = useState<(ReviewRequest & { documentTitle?: string })[]>([]);
  const [lastOpened, setLastOpened] = useState<LastOpened | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [todayKey, setTodayKey] = useState("");
  const [training, setTraining] = useState<{ waiting: number; known: number } | null>(null);

  useEffect(() => {
    setTodayLabel(
      new Date().toLocaleDateString("sv-SE", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    );
    setTodayKey(new Date().toISOString().slice(0, 10));
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

  useEffect(() => {
    const id = readLastOpenedId();
    if (!id) {
      setLastOpened(null);
      return;
    }
    const supabase = createClient();
    void supabase
      .from("manual_documents")
      .select("id, title")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.id) setLastOpened({ id: String(data.id), title: readableTitle(String(data.title || "")) });
        else setLastOpened(null);
      });
  }, [session?.organizationId]);

  useEffect(() => {
    if (loading || !session?.organizationId) return;
    void loadCompetence(session.organizationId)
      .then((data) => {
        const waiting = data.levels.filter((cell) => cell.level === "missing" || cell.level === "training").length;
        const known = data.levels.filter((cell) => cell.level === "ok").length;
        setTraining(waiting + known > 0 ? { waiting, known } : null);
      })
      .catch(() => setTraining(null));
  }, [loading, session?.organizationId]);

  const greetingName = session?.fullName ? firstName(session.fullName) : "";

  async function addPreset(preset: (typeof YEAR_PRESETS)[number]) {
    if (!session?.organizationId) return;
    try {
      await createYearActivity({
        organizationId: session.organizationId,
        title: preset.title,
        kind: preset.kind,
        plannedOn: laterThisYear(preset.weeks),
        ownerName: session.fullName || "",
      });
      setStats(await loadOpsStats(session.organizationId));
      setStatus(null);
    } catch (error) {
      setStatus(missingTableMessage(error));
    }
  }

  const next = useMemo(() => {
    if (referrals[0]) {
      return {
        title: "Svara på remiss",
        body: referrals[0].documentTitle || "Ett blad väntar på ditt svar.",
        href: `/manual?blad=${referrals[0].documentId}`,
        cta: "Öppna bladet",
        newTab: false,
      };
    }
    if (stats.openDeviations > 0) {
      return {
        title: `${stats.openDeviations} avvikelse${stats.openDeviations === 1 ? "" : "r"} att ta om hand`,
        body: "Något stämmer inte. Skriv vad som hänt och vad ni gör.",
        href: "/avvikelse",
        cta: "Öppna nästa jobb",
        newTab: false,
      };
    }
    if (stats.overdueActivities[0]) {
      return {
        title: "Försenat i årshjulet",
        body: stats.overdueActivities[0].title,
        href: "/arshjul",
        cta: "Öppna nästa jobb",
        newTab: false,
      };
    }
    if (lastOpened) {
      return {
        title: "Fortsätt där du slutade",
        body: lastOpened.title,
        href: `/manual?blad=${lastOpened.id}`,
        cta: "Öppna bladet",
        newTab: false,
      };
    }
    if (stats.upcomingActivities.length === 0) {
      return {
        title: "Lägg intern revision",
        body: "Ett klick. Då syns datumet här när det närmar sig.",
        href: "/arshjul",
        cta: "Öppna nästa jobb",
        newTab: false,
      };
    }
    return {
      title: "Allt lugnt just nu",
      body: "Inget som jagar er i dag. Öppna boken om du vill skriva.",
      href: "/manual",
      cta: "Öppna boken",
      newTab: false,
    };
  }, [referrals, stats, lastOpened]);

  const tasks = [
    ...referrals.map((item) => ({
      id: `remiss-${item.documentId}`,
      title: "Svara på remiss",
      meta: readableTitle(item.documentTitle || ""),
      href: `/manual?blad=${item.documentId}`,
      newTab: false,
      when: "Väntar på dig",
      tone: "warning" as const,
    })),
    ...stats.overdueActivities.map((item) => ({
      id: item.id,
      title: item.title,
      meta: "Årshjulet",
      href: "/arshjul",
      newTab: false,
      when: whenLabel(item.plannedOn, todayKey),
      tone: "destructive" as const,
    })),
    ...stats.upcomingActivities
      .filter((item) => !stats.overdueActivities.some((late) => late.id === item.id))
      .map((item) => ({
        id: item.id,
        title: item.title,
        meta: "Årshjulet",
        href: "/arshjul",
        newTab: false,
        when: whenLabel(item.plannedOn, todayKey),
        tone: "secondary" as const,
      })),
  ].slice(0, 5);

  const late = stats.overdueActivities.length;
  const soon = stats.upcomingActivities.length;
  const pulse = [
    late === 1 ? "1 jobb är försenat" : late > 1 ? `${late} jobb är försenade` : "Inget jobb är försenat",
    soon === 1 ? "1 jobb inom 30 dagar" : soon > 1 ? `${soon} jobb inom 30 dagar` : "Inget jobb inom 30 dagar",
    stats.openDeviations === 0
      ? "Inga öppna avvikelser"
      : stats.openDeviations === 1
        ? "1 öppen avvikelse"
        : `${stats.openDeviations} öppna avvikelser`,
  ].join(". ") + ".";
  const monthIndex = todayKey ? Number(todayKey.slice(5, 7)) - 1 : -1;
  const yearLeft = Math.max(0, stats.yearTotal - stats.yearDone);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium capitalize text-primary">
            {greetingName ? `Hej ${greetingName}` : "Hej"}
            {todayLabel ? ` · ${todayLabel}` : ""}
          </p>
          <h1 className="text-2xl font-bold tracking-tight" data-tour="idag">
            Att göra idag
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{pulse}</p>
        </div>
        <Button asChild>
          <Link data-tour="oppen-manual" href={next.href} rel={next.newTab ? "noopener noreferrer" : undefined} target={next.newTab ? "_blank" : undefined}>
            {next.cta}
          </Link>
        </Button>
      </section>

      {status ? <p className="text-sm text-destructive">{status}</p> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Link className="rounded-2xl border bg-card p-4 shadow-token-sm" href="/arshjul">
          <ShieldCheck className="size-4 text-primary" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Läget</p>
          <p className="mt-2 text-2xl font-bold">{late > 0 ? late : "Ok"}</p>
          <Badge className="mt-2" variant={late > 0 ? "destructive" : soon > 0 ? "warning" : "success"}>
            {late > 0 ? "Försenat" : soon > 0 ? "På gång" : "Enligt plan"}
          </Badge>
        </Link>
        <Link className="rounded-2xl border bg-card p-4 shadow-token-sm" href="/arshjul">
          <CalendarRange className="size-4 text-primary" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Årshjul i år</p>
          <p className="mt-2 text-2xl font-bold">
            {stats.yearDone}/{stats.yearTotal || 0}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{stats.yearTotal ? `${yearLeft} kvar` : "Inget inlagt"}</p>
        </Link>
        <Link className="rounded-2xl border bg-card p-4 shadow-token-sm" href="/avvikelse">
          <TriangleAlert className="size-4 text-primary" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Avvikelser</p>
          <p className="mt-2 text-2xl font-bold">{stats.openDeviations}</p>
          <Badge className="mt-2" variant={stats.openDeviations > 0 ? "warning" : "success"}>
            {stats.openDeviations > 0 ? "Öppna" : "Inga öppna"}
          </Badge>
        </Link>
        <Link className="rounded-2xl border bg-card p-4 shadow-token-sm" href="/forslag">
          <Lightbulb className="size-4 text-primary" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Förslag</p>
          <p className="mt-2 text-2xl font-bold">{stats.openSuggestions}</p>
          <p className="mt-2 text-sm text-muted-foreground">{stats.openSuggestions ? "Väntar på svar" : "Inget nytt"}</p>
        </Link>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Att göra</CardTitle>
          <CardDescription>Bara det som är försenat eller nära. Samma jobb visas en gång.</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inget att göra just nu. När ett jobb blir dags syns det här.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {tasks.map((task) => (
                <li key={task.id}>
                  <Link
                    className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-accent"
                    href={task.href}
                    rel={task.newTab ? "noopener noreferrer" : undefined}
                    target={task.newTab ? "_blank" : undefined}
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold">{task.title}</span>
                      <span className="block text-xs text-muted-foreground">{task.meta}</span>
                    </span>
                    <span className="text-sm font-semibold">Öppna</span>
                    <Badge variant={task.tone}>{task.when}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Året</CardTitle>
          <CardDescription>Stapeln visar hur många jobb som ligger varje månad.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <MiniBars
            empty="Årshjulet är tomt. Lägg in årets jobb."
            items={MONTHS.map((name, index) => ({ label: name, value: stats.monthCounts[index] ?? 0, current: index === monthIndex }))}
          />
          {stats.yearTotal === 0 ? (
            <div className="flex flex-wrap gap-2">
              {YEAR_PRESETS.map((preset) => (
                <Button key={preset.kind} onClick={() => void addPreset(preset)} size="sm" type="button" variant="outline">
                  {preset.title}
                </Button>
              ))}
            </div>
          ) : null}
          <Button asChild className="w-full sm:w-auto" variant="outline">
            <Link href="/arshjul">Öppna årshjul</Link>
          </Button>
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fortsätt där du slutade</CardTitle>
            <CardDescription>Senaste bladet i boken.</CardDescription>
          </CardHeader>
          <CardContent>
            {lastOpened ? (
              <Link
                className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-accent"
                href={`/manual?blad=${lastOpened.id}`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <FileText className="size-4 text-primary" />
                  {lastOpened.title}
                </span>
                <span className="text-sm font-semibold text-primary">Öppna</span>
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">Inget blad öppnat än. Skapa 1.0 i Manualen.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avvikelser</CardTitle>
            <CardDescription>{stats.openDeviations === 0 ? "Inga öppna. Det är bra." : "Det som nyligen lämnats in."}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {stats.recentDeviations.length === 0 ? (
              <Button asChild size="sm" variant="outline">
                <Link href="/avvikelse">Lämna avvikelse</Link>
              </Button>
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
      </section>

      {training ? (
        <Link className="rounded-2xl border bg-card px-4 py-3 text-sm shadow-token-sm" href="/kompetens">
          Kompetens: {training.known} kan · {training.waiting} ska lära sig
        </Link>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/manual">
            <FileText data-icon="inline-start" />
            Öppna boken
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/avvikelse">
            <TriangleAlert data-icon="inline-start" />
            Lämna avvikelse
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/forslag">
            <Plus data-icon="inline-start" />
            Nytt förslag
          </Link>
        </Button>
      </div>
    </div>
  );
}
