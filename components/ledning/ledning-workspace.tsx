"use client";

import { useEffect, useState } from "react";

import { useOrgSession } from "@/components/providers/org-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AGENDA,
  createDecision,
  createReview,
  deleteDecision,
  deleteReview,
  factLine,
  loadFacts,
  loadReviews,
  reviewTableMessage,
  saveDecision,
  saveNote,
  saveReview,
  type ReviewDecision,
  type ReviewFacts,
  type ReviewMeeting,
} from "@/lib/ledning/persist";

const EMPTY_FACTS: ReviewFacts = {
  goals: null,
  goalsDone: null,
  goalsLate: null,
  deviationsOpen: null,
  suggestionsOpen: null,
  customers: null,
  customerReviews: null,
  suppliers: null,
  suppliersWeak: null,
  findings: null,
  laws: null,
  lawsOk: null,
  jobsLeft: null,
  certYes: null,
  certAll: null,
  aspects: null,
  people: null,
};

export function LedningWorkspace() {
  const { session } = useOrgSession();
  const [reviews, setReviews] = useState<ReviewMeeting[]>([]);
  const [notes, setNotes] = useState<{ reviewId: string; point: string; body: string }[]>([]);
  const [decisions, setDecisions] = useState<ReviewDecision[]>([]);
  const [facts, setFacts] = useState<ReviewFacts>(EMPTY_FACTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canEdit = session?.role !== "viewer";
  const selected = reviews.find((review) => review.id === selectedId) ?? null;
  const meetingDecisions = decisions.filter((item) => item.reviewId === selectedId);

  useEffect(() => {
    if (!session?.organizationId) return;
    const organizationId = session.organizationId;
    void loadReviews(organizationId)
      .then((data) => {
        setReviews(data.reviews);
        setNotes(data.notes);
        setDecisions(data.decisions);
        setSelectedId(data.reviews[0]?.id ?? null);
        setError(null);
      })
      .catch((err) => setError(reviewTableMessage(err)));
    void loadFacts(organizationId).then(setFacts).catch(() => setFacts(EMPTY_FACTS));
  }, [session?.organizationId]);

  function patch(next: Partial<ReviewMeeting>) {
    if (!selected) return;
    setReviews((current) => current.map((review) => (review.id === selected.id ? { ...review, ...next } : review)));
  }

  function noteBody(point: string) {
    return notes.find((item) => item.reviewId === selectedId && item.point === point)?.body ?? "";
  }

  function editDecision(id: string, next: Partial<ReviewDecision>, save = false) {
    setDecisions((current) => {
      const updated = current.map((item) => (item.id === id ? { ...item, ...next } : item));
      const row = updated.find((item) => item.id === id);
      if (save && row) void saveDecision(row).catch((err) => setError(reviewTableMessage(err)));
      return updated;
    });
  }

  function printMeeting() {
    if (!selected) return;
    const points = AGENDA.map(
      (point) => `<h2>${point.title}</h2><p>${factLine(point.id, facts)}</p><p>${noteBody(point.id) || "–"}</p>`,
    ).join("");
    const decided = meetingDecisions
      .map((item) => `<li>${item.done ? "Klart" : "Öppet"}: ${item.body} ${item.ownerName} ${item.dueOn}</li>`)
      .join("");
    const verdict = selected.verdict === "ok" ? "Systemet räcker." : selected.verdict === "change" ? "Systemet behöver ändras." : "Inget beslut om systemet ännu.";
    const popup = window.open("", "_blank", "noopener,noreferrer");
    if (!popup) return;
    popup.document.write(`<!doctype html><html><head><title>Ledningens genomgång</title>
      <style>body{font-family:Inter,sans-serif;padding:32px;color:#111}h2{font-size:16px;margin:20px 0 4px}</style>
      </head><body><h1>Ledningens genomgång ${selected.heldOn}</h1>
      <p>Ordförande: ${selected.chairName}. Sekreterare: ${selected.secretaryName}.</p>
      <p>Närvarande: ${selected.attendees}</p><p>${verdict}</p>${points}<h2>Beslut</h2><ul>${decided}</ul>
      <p>Nästa möte: ${selected.nextOn || "inte satt"}</p></body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  return (
    <div className="grid min-h-[36rem] gap-4 lg:grid-cols-[16rem_1fr]">
      <aside className="flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-token-sm">
        {canEdit ? (
          <Button
            onClick={() => {
              if (!session?.organizationId) return;
              void createReview(session.organizationId)
                .then((row) => {
                  setReviews((current) => [row, ...current]);
                  setSelectedId(row.id);
                })
                .catch((err) => setError(reviewTableMessage(err)));
            }}
            size="sm"
            type="button"
          >
            Nytt möte
          </Button>
        ) : null}
        <ul className="flex flex-col gap-1">
          {reviews.map((review) => (
            <li key={review.id}>
              <button
                className={
                  review.id === selectedId
                    ? "w-full rounded-xl bg-primary px-3 py-2 text-left text-sm font-medium text-primary-foreground!"
                    : "w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-accent"
                }
                onClick={() => setSelectedId(review.id)}
                type="button"
              >
                {review.heldOn}
              </button>
            </li>
          ))}
        </ul>
        {reviews.length === 0 && !error ? <p className="px-1 text-sm text-muted-foreground">Inget möte ännu. Ett möte per år räcker.</p> : null}
      </aside>

      <section className="flex flex-col gap-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {!selected ? (
          <div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground shadow-token-sm">Skapa mötet. Siffrorna hämtas från de andra sidorna.</div>
        ) : (
          <>
            <form
              className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-token-sm"
              onSubmit={(event) => {
                event.preventDefault();
                void saveReview(selected).catch((err) => setError(reviewTableMessage(err)));
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold">Protokollet</p>
                <Button onClick={printMeeting} size="sm" type="button" variant="outline">
                  Skriv ut
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="when">Datum</Label>
                  <Input id="when" onChange={(event) => patch({ heldOn: event.target.value })} type="date" value={selected.heldOn} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next">Nästa möte</Label>
                  <Input id="next" onChange={(event) => patch({ nextOn: event.target.value })} type="date" value={selected.nextOn} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chair">Ordförande</Label>
                  <Input id="chair" onChange={(event) => patch({ chairName: event.target.value })} value={selected.chairName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sec">Sekreterare</Label>
                  <Input id="sec" onChange={(event) => patch({ secretaryName: event.target.value })} value={selected.secretaryName} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="who">Närvarande</Label>
                <Input id="who" onChange={(event) => patch({ attendees: event.target.value })} value={selected.attendees} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="verdict">Beslut om systemet</Label>
                <select
                  className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                  id="verdict"
                  onChange={(event) => patch({ verdict: event.target.value as ReviewMeeting["verdict"] })}
                  value={selected.verdict}
                >
                  <option value="">Inte bestämt</option>
                  <option value="ok">Systemet räcker</option>
                  <option value="change">Systemet behöver ändras</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={!canEdit} type="submit">
                  Spara
                </Button>
                {canEdit ? (
                  <Button
                    onClick={() => {
                      const id = selected.id;
                      void deleteReview(id)
                        .then(() => {
                          const rest = reviews.filter((review) => review.id !== id);
                          setReviews(rest);
                          setNotes((current) => current.filter((item) => item.reviewId !== id));
                          setDecisions((current) => current.filter((item) => item.reviewId !== id));
                          setSelectedId(rest[0]?.id ?? null);
                        })
                        .catch((err) => setError(reviewTableMessage(err)));
                    }}
                    type="button"
                    variant="outline"
                  >
                    Ta bort
                  </Button>
                ) : null}
              </div>
            </form>

            {AGENDA.map((point) => (
              <section className="rounded-2xl border bg-card p-4 shadow-token-sm" key={point.id}>
                <p className="font-semibold">{point.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{factLine(point.id, facts)}</p>
                <Textarea
                  className="mt-3"
                  onBlur={(event) => {
                    if (!session?.organizationId || !selected) return;
                    const body = event.target.value;
                    setNotes((current) => {
                      const rest = current.filter((item) => !(item.reviewId === selected.id && item.point === point.id));
                      return [...rest, { reviewId: selected.id, point: point.id, body }];
                    });
                    void saveNote(session.organizationId, selected.id, point.id, body).catch((err) => setError(reviewTableMessage(err)));
                  }}
                  onChange={(event) => {
                    const body = event.target.value;
                    setNotes((current) => {
                      const rest = current.filter((item) => !(item.reviewId === selected.id && item.point === point.id));
                      return [...rest, { reviewId: selected.id, point: point.id, body }];
                    });
                  }}
                  placeholder="Vad sa ni?"
                  rows={2}
                  value={noteBody(point.id)}
                />
              </section>
            ))}

            <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-token-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold">Beslut</p>
                {canEdit ? (
                  <Button
                    onClick={() => {
                      if (!session?.organizationId) return;
                      void createDecision(session.organizationId, selected.id)
                        .then((row) => setDecisions((current) => [...current, row]))
                        .catch((err) => setError(reviewTableMessage(err)));
                    }}
                    size="sm"
                    type="button"
                  >
                    Nytt beslut
                  </Button>
                ) : null}
              </div>
              {meetingDecisions.length === 0 ? <p className="text-sm text-muted-foreground">Inget beslut ännu.</p> : null}
              {meetingDecisions.map((decision) => (
                <div className="grid gap-2 md:grid-cols-[1fr_10rem_10rem_auto]" key={decision.id}>
                  <Input
                    onBlur={(event) => editDecision(decision.id, { body: event.target.value }, true)}
                    onChange={(event) => editDecision(decision.id, { body: event.target.value })}
                    value={decision.body}
                  />
                  <Input
                    onBlur={(event) => editDecision(decision.id, { ownerName: event.target.value }, true)}
                    onChange={(event) => editDecision(decision.id, { ownerName: event.target.value })}
                    placeholder="Vem"
                    value={decision.ownerName}
                  />
                  <Input
                    onBlur={(event) => editDecision(decision.id, { dueOn: event.target.value }, true)}
                    onChange={(event) => editDecision(decision.id, { dueOn: event.target.value })}
                    type="date"
                    value={decision.dueOn}
                  />
                  <Button
                    onClick={() => editDecision(decision.id, { done: !decision.done }, true)}
                    type="button"
                    variant={decision.done ? "default" : "outline"}
                  >
                    {decision.done ? "Klart" : "Öppet"}
                  </Button>
                  {canEdit ? (
                    <button
                      className="text-left text-xs text-muted-foreground hover:text-foreground md:col-span-4"
                      onClick={() => {
                        void deleteDecision(decision.id)
                          .then(() => setDecisions((current) => current.filter((item) => item.id !== decision.id)))
                          .catch((err) => setError(reviewTableMessage(err)));
                      }}
                      type="button"
                    >
                      Ta bort beslutet
                    </button>
                  ) : null}
                </div>
              ))}
            </section>
          </>
        )}
      </section>
    </div>
  );
}
