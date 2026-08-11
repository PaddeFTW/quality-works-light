"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileText,
  ImageIcon,
  LockKeyhole,
  Pencil,
  Search,
  Settings2,
  Sparkles,
  Upload,
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const sections = [
  { id: "intro", title: "Introduktion", pages: ["Välkommen"] },
  {
    id: "quality",
    title: "Kvalitetsarbete",
    pages: ["Kvalitetspolicy", "Mål och uppföljning"],
  },
  {
    id: "routines",
    title: "Rutiner",
    pages: ["Avvikelsehantering", "Dokumentstyrning"],
  },
  { id: "roles", title: "Roller och ansvar", pages: ["Ansvarsfördelning"] },
  { id: "support", title: "Support", pages: ["Vanliga frågor"] },
];

const originalCopy = `Vårt kvalitetsarbete bygger på tydliga mål, engagerade medarbetare och ett systematiskt arbetssätt. Den här manualen beskriver hur vi tillsammans skapar en trygg och lärande verksamhet.

Vi följer upp våra resultat, tar hand om avvikelser och delar kunskap mellan team. När vi gör våra arbetssätt synliga blir det enklare att göra rätt – varje dag.`;

export function ManualWorkspace() {
  const [selectedPage, setSelectedPage] = useState("Välkommen");
  const [activeTab, setActiveTab] = useState("settings");
  const [expanded, setExpanded] = useState<string[]>(sections.map((section) => section.id));
  const [published, setPublished] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [settings, setSettings] = useState({
    title: "Kvalitetsmanual",
    issuer: "Kvalitetsansvarig",
    reviewer: "",
    approver: "",
    headerText: "",
    footerText: "",
  });
  const [draft, setDraft] = useState(originalCopy);
  const [query, setQuery] = useState("");

  const filteredSections = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return sections;
    return sections
      .map((section) => ({
        ...section,
        pages: section.pages.filter((page) => page.toLowerCase().includes(normalizedQuery) || section.title.toLowerCase().includes(normalizedQuery)),
      }))
      .filter((section) => section.pages.length > 0);
  }, [query]);

  function toggleSection(id: string) {
    setExpanded((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col gap-6">
      <header className="flex flex-col gap-5 border-b pb-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-primary/12 p-3 text-primary">
            <BookOpen className="size-6" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-primary">Manual</p>
              <Badge variant="success">Aktiv</Badge>
              <Badge variant="secondary">Senast ändrad idag</Badge>
            </div>
            <h1 className="text-balance text-3xl font-semibold tracking-tight">{settings.title}</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">En samlad guide till våra arbetssätt, roller och kvalitetsmål.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline"><CircleHelp data-icon="inline-start" /> Hjälp</Button>
          <Button onClick={() => setPublished(true)}><Upload data-icon="inline-start" /> Publicera</Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-token-xs">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Sök i manualen" className="pl-9" onChange={(event) => setQuery(event.target.value)} placeholder="Sök i manualen" value={query} />
          </div>
          <Separator />
          <nav aria-label="Manualens innehåll" className="flex flex-col gap-1">
            {filteredSections.map((section) => {
              const isExpanded = expanded.includes(section.id);
              return (
                <div key={section.id}>
                  <button className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm font-semibold transition-token hover:bg-accent" onClick={() => toggleSection(section.id)} type="button">
                    <span className="flex items-center gap-2"><ChevronDown className={isExpanded ? "size-4" : "size-4 -rotate-90"} />{section.title}</span>
                    <span className="text-xs text-muted-foreground">{section.pages.length}</span>
                  </button>
                  {isExpanded ? <div className="ml-4 flex flex-col gap-1 border-l pl-2">
                    {section.pages.map((page) => <button className={`rounded-md px-3 py-2 text-left text-sm transition-token ${selectedPage === page ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`} key={page} onClick={() => setSelectedPage(page)} type="button">{page}</button>)}
                  </div> : null}
                </div>
              );
            })}
          </nav>
          <div className="mt-auto rounded-xl bg-muted/60 p-3 text-xs leading-5 text-muted-foreground"><p className="font-medium text-foreground">Tips</p><p>Välj ett avsnitt för att läsa mer eller redigera innehållet.</p></div>
        </aside>

        <main className="min-w-0 rounded-2xl border bg-card shadow-token-sm">
          <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div><div className="flex items-center gap-2 text-sm text-muted-foreground"><span>Manual</span><ChevronRight className="size-4" /><span>{selectedPage}</span></div><h2 className="mt-2 text-2xl font-semibold">{selectedPage}</h2></div>
            <Button variant="outline" size="sm"><Pencil data-icon="inline-start" /> Redigera</Button>
          </div>
          <Tabs className="p-5 sm:p-6" onValueChange={setActiveTab} value={activeTab}>
            <TabsList><TabsTrigger value="settings"><Settings2 data-icon="inline-start" /> Grundinställningar</TabsTrigger><TabsTrigger value="original">Original</TabsTrigger><TabsTrigger value="work">Arbetsmanual</TabsTrigger></TabsList>
            <TabsContent className="mt-6" value="original">
              {published ? <Card className="border-primary/20 bg-primary/[0.03]"><CardHeader><div className="flex items-center gap-2"><Sparkles className="size-5 text-primary" /><CardTitle>Publicerad version</CardTitle><Badge>Original</Badge></div><CardDescription>Det här är den senaste publicerade versionen av sidan.</CardDescription></CardHeader><CardContent><div className="whitespace-pre-line text-sm leading-7 text-foreground">{originalCopy}</div></CardContent></Card> : <Card className="border-dashed shadow-none"><CardContent className="flex min-h-72 flex-col items-center justify-center gap-3 text-center"><div className="rounded-full bg-muted p-3"><LockKeyhole className="size-5 text-muted-foreground" /></div><h3 className="text-lg font-semibold">Originalet är inte publicerat än</h3><p className="max-w-md text-sm leading-6 text-muted-foreground">Publicera manualen för att göra originalversionen tillgänglig för alla medarbetare.</p><Button onClick={() => setPublished(true)}>Publicera manual</Button></CardContent></Card>}
            </TabsContent>
            <TabsContent className="mt-6" value="work"><Card><CardHeader><CardTitle>Arbetsmanual</CardTitle><CardDescription>Anpassa innehållet så att det passar vår verksamhet.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4"><Textarea className="min-h-72 leading-7" onChange={(event) => setDraft(event.target.value)} value={draft} /><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">Ändringar sparas automatiskt i den här vyn.</p><Button onClick={() => setAcknowledged(true)}>{acknowledged ? <Check data-icon="inline-start" /> : null}{acknowledged ? "Sparad" : "Spara ändringar"}</Button></div></CardContent></Card></TabsContent>
            <TabsContent className="mt-6" value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Grundinställningar</CardTitle>
                  <CardDescription>Hantera manualens grundläggande information.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    Manualens namn
                    <Input onChange={(event) => setSettings({ ...settings, title: event.target.value })} value={settings.title} />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    Utfärdare
                    <Input onChange={(event) => setSettings({ ...settings, issuer: event.target.value })} value={settings.issuer} />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    Granskare
                    <Input onChange={(event) => setSettings({ ...settings, reviewer: event.target.value })} value={settings.reviewer} />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    Godkännare
                    <Input onChange={(event) => setSettings({ ...settings, approver: event.target.value })} value={settings.approver} />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">
                    Logotyp
                    <div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <ImageIcon className="size-5" />
                      </div>
                      <div className="flex flex-1 flex-col gap-1">
                        <p className="text-xs text-muted-foreground">Ingen logotyp har laddats upp än.</p>
                        <Button size="sm" variant="outline"><Upload data-icon="inline-start" /> Ladda upp logotyp</Button>
                      </div>
                    </div>
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    Header-text
                    <Input onChange={(event) => setSettings({ ...settings, headerText: event.target.value })} placeholder="Text som visas i sidhuvudet" value={settings.headerText} />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    Footer-text
                    <Input onChange={(event) => setSettings({ ...settings, footerText: event.target.value })} placeholder="Text som visas i sidfoten" value={settings.footerText} />
                  </label>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
