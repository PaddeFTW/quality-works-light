"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FileText,
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
import { readLastOpenedId } from "@/components/manual/manual-boot";
import { createClient } from "@/lib/supabase/client";
import { caseNumber, createYearActivity, formatSvDate, loadOpsStats, missingTableMessage } from "@/lib/ops/persist";
import { laterThisYear, YEAR_PRESETS } from "@/lib/ops/year-presets";
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
  overdueActivities: [],
  recentDeviations: [],
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

  useEffect(() => {
    setTodayLabel(
      new Date().toLocaleDateString("sv-SE", {
        weekday: "long",
        day: "numeric",
        month: "long",
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
        if (data?.id) setLastOpened({ id: String(data.id), title: String(data.title || "Blad") });
        else setLastOpened(null);
      });
  }, [session?.organizationId]);

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
        newTab: true,
      };
    }
    if (stats.openDeviations > 0) {
      return {
        title: `${stats.openDeviations} avvikelse${stats.openDeviations === 1 ? "" : "r"} att ta om hand`,
        body: "Något stämmer inte. Skriv vad som hänt och vad ni gör.",
        href: "/avvikelse",
        cta: "Öppna avvikelser",
        newTab: false,
      };
    }
    if (stats.overdueActivities[0]) {
      return {
        title: "Försenat i årshjulet",
        body: stats.overdueActivities[0].title,
        href: "/arshjul",
        cta: "Öppna årshjul",
        newTab: false,
      };
    }
    if (lastOpened) {
      return {
        title: "Fortsätt där du slutade",
        body: lastOpened.title,
        href: `/manual?blad=${lastOpened.id}`,
        cta: "Öppna bladet",
        newTab: true,
      };
    }
    if (stats.upcomingActivities.length === 0) {
      return {
        title: "Lägg intern revision",
        body: "Ett klick. Då syns datumet här när det närmar sig.",
        href: "/arshjul",
        cta: "Öppna årshjul",
        newTab: false,
      };
    }
    return {
      title: "Allt lugnt just nu",
      body: "Inget som jagar er i dag. Öppna boken om du vill skriva.",
      href: "/manual",
      cta: "Öppna manualen",
      newTab: true,
    };
  }, [referrals, stats, lastOpened]);

  const jobs = [
    stats.openDeviations > 0
      ? { href: "/avvikelse", label: "Avvikelser att ta om hand", value: String(stats.openDeviations), tone: "danger" as const }
      : null,
    referrals.length > 0
      ? { href: `/manual?blad=${referrals[0].documentId}`, label: "Remiss att svara på", value: String(referrals.length), tone: "warn" as const, newTab: true }
      : null,
    stats.overdueActivities.length > 0
      ? { href: "/arshjul", label: "Försenade jobb", value: String(stats.overdueActivities.length), tone: "danger" as const }
      : null,
    stats.upcomingActivities.length > 0
      ? { href: "/arshjul", label: "Jobb inom 30 dagar", value: String(stats.upcomingActivities.length), tone: "info" as const }
      : null,
  ].filter((item) => item !== null);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium capitalize text-primary">
            {greetingName ? `Hej ${greetingName}` : "Hej"}
            {todayLabel ? ` · ${todayLabel}` : ""}
          </p>
          <h1 className="text-2xl font-bold tracking-tight" data-tour="idag">Att göra idag</h1>
        </div>
        <Button asChild>
          <Link data-tour="oppen-manual" href={next.href} rel={next.newTab ? "noopener noreferrer" : undefined} target={next.newTab ? "_blank" : undefined}>
            {next.cta}
          </Link>
        </Button>
      </section>

      {status ? <p className="text-sm text-destructive">{status}</p> : null}

      <Card className="border-primary/25 bg-gradient-to-br from-secondary to-card shadow-token-md">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Nästa steg</p>
            <p className="mt-1 text-lg font-bold">{next.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{next.body}</p>
          </div>
          <Button asChild>
            <Link href={next.href} rel={next.newTab ? "noopener noreferrer" : undefined} target={next.newTab ? "_blank" : undefined}>
              {next.cta}
            </Link>
          </Button>
        </CardContent>
      </Card>

      {jobs.length > 0 ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {jobs.map((job) => (
            <li key={job.label}>
              <Link
                className="flex items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 shadow-token-sm transition-token hover:-translate-y-0.5 hover:shadow-token-md"
                href={job.href}
                rel={job.newTab ? "noopener noreferrer" : undefined}
                target={job.newTab ? "_blank" : undefined}
              >
                <span className="font-semibold">{job.label}</span>
                <Badge variant={job.tone === "danger" ? "destructive" : "secondary"}>{job.value}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Inget som måste göras just nu. Noll avvikelser är bra.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/manual" rel="noopener noreferrer" target="_blank">
            <FileText data-icon="inline-start" />
            Manual
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
        <Button asChild data-tour="bjud-in" size="sm" variant="outline">
          <Link href="/installningar">
            <UserPlus data-icon="inline-start" />
            Bjud in
          </Link>
        </Button>
      </div>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Senast i boken</CardTitle>
            <CardDescription>Fortsätt där du slutade.</CardDescription>
          </CardHeader>
          <CardContent>
            {lastOpened ? (
              <Link
                className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-accent"
                href={`/manual?blad=${lastOpened.id}`}
                rel="noopener noreferrer"
                target="_blank"
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
            <CardTitle>Kommande 30 dagar</CardTitle>
            <CardDescription>Från årshjulet.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {stats.overdueActivities.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {stats.overdueActivities.map((item) => (
                  <li className="flex items-center justify-between gap-3 text-sm" key={item.id}>
                    <span className="font-medium">{item.title}</span>
                    <Badge variant="destructive">Försenad</Badge>
                  </li>
                ))}
              </ul>
            ) : null}
            {stats.upcomingActivities.length === 0 && stats.overdueActivities.length === 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">Inget inlagt. Ett klick räcker:</p>
                {YEAR_PRESETS.map((preset) => (
                  <Button key={preset.kind} onClick={() => void addPreset(preset)} type="button" variant="outline">
                    {preset.title}
                  </Button>
                ))}
              </div>
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

      <Card>
        <CardHeader>
          <CardTitle>Avvikelser</CardTitle>
          <CardDescription>Det som nyligen lämnats in.</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentDeviations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga avvikelser. Det är bra.</p>
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
    </div>
  );
}
