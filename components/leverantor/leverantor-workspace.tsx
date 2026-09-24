"use client";

import { useEffect, useMemo, useState } from "react";

import { MiniBars } from "@/components/common/mini-bars";
import { useOrgSession } from "@/components/providers/org-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addExampleQuestions,
  createQuestion,
  createReview,
  createSupplier,
  deleteQuestion,
  deleteReview,
  deleteSupplier,
  loadSuppliers,
  reviewBand,
  reviewPercent,
  saveQuestion,
  saveReview,
  saveSupplier,
  supplierTableMessage,
  type SupplierItem,
  type SupplierQuestion,
  type SupplierReview,
  type SupplierStatus,
} from "@/lib/leverantor/persist";

const GRADES = [
  { id: 1, label: "Viktig leverantör" },
  { id: 2, label: "Vanlig leverantör" },
  { id: 3, label: "Ingen påverkan" },
] as const;

const STATUSES: { id: SupplierStatus; label: string }[] = [
  { id: "approved", label: "Godkänd" },
  { id: "improve", label: "Måste bli bättre" },
  { id: "only", label: "Enda valet" },
];

export function LeverantorWorkspace() {
  const { session } = useOrgSession();
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [questions, setQuestions] = useState<SupplierQuestion[]>([]);
  const [reviews, setReviews] = useState<SupplierReview[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const canEdit = session?.role !== "viewer";
  const selected = suppliers.find((supplier) => supplier.id === selectedId) ?? null;
  const supplierReviews = reviews.filter((review) => review.supplierId === selectedId);
  const review = supplierReviews.find((item) => item.id === reviewId) ?? supplierReviews[0] ?? null;

  useEffect(() => {
    if (!session?.organizationId) return;
    void loadSuppliers(session.organizationId)
      .then((data) => {
        setSuppliers(data.suppliers);
        setQuestions(data.questions);
        setReviews(data.reviews);
        setSelectedId(data.suppliers[0]?.id ?? null);
        setError(null);
      })
      .catch((err) => setError(supplierTableMessage(err)));
  }, [session?.organizationId]);

  const averages = useMemo(() => {
    return questions.map((question, index) => {
      const values = reviews.map((item) => item.scores[question.id]).filter((score): score is number => score >= 1 && score <= 6);
      const average = values.length ? values.reduce((sum, score) => sum + score, 0) / values.length : 0;
      return { label: String(index + 1), value: Math.round(average * 10) / 10 };
    });
  }, [questions, reviews]);

  function patchSupplier(next: Partial<SupplierItem>) {
    if (!selected) return;
    setSuppliers((current) => current.map((supplier) => (supplier.id === selected.id ? { ...supplier, ...next } : supplier)));
    setSaved(false);
  }

  function patchReview(next: Partial<SupplierReview>) {
    if (!review) return;
    setReviews((current) => current.map((item) => (item.id === review.id ? { ...item, ...next } : item)));
    setSaved(false);
  }

  async function addSupplier() {
    if (!session?.organizationId) return;
    try {
      const row = await createSupplier(session.organizationId, "Ny leverantör");
      setSuppliers((current) => [...current, row].sort((a, b) => a.company.localeCompare(b.company, "sv")));
      setSelectedId(row.id);
      setError(null);
    } catch (err) {
      setError(supplierTableMessage(err));
    }
  }

  async function addReview() {
    if (!session?.organizationId || !selected) return;
    try {
      const row = await createReview(session.organizationId, selected.id);
      setReviews((current) => [row, ...current]);
      setReviewId(row.id);
      setError(null);
    } catch (err) {
      setError(supplierTableMessage(err));
    }
  }

  function mailReview() {
    if (!selected || !review) return;
    const lines = questions.map((question, index) => {
      const score = review.scores[question.id];
      return `${index + 1}. ${question.prompt} — ${score ? `${score} av 6` : "inget svar"}`;
    });
    const percent = reviewPercent(review.scores);
    const body = [
      `Hej ${selected.contactName || selected.company},`,
      "",
      "Det här är vår bedömning av er som leverantör. Hör av er om ni vill prata om något.",
      "",
      ...lines,
      "",
      percent === null ? "" : `Snitt: ${percent}% ${reviewBand(percent)}`,
      review.comment ? `Kommentar: ${review.comment}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    window.location.href = `mailto:${selected.email}?subject=${encodeURIComponent("Vår bedömning av er som leverantör")}&body=${encodeURIComponent(body)}`;
  }

  function printReview() {
    if (!selected || !review) return;
    const percent = reviewPercent(review.scores);
    const rows = questions
      .map((question, index) => `<tr><td>${index + 1}. ${question.prompt}</td><td>${review.scores[question.id] ? `${review.scores[question.id]} av 6` : "–"}</td></tr>`)
      .join("");
    const popup = window.open("", "_blank", "noopener,noreferrer");
    if (!popup) return;
    popup.document.write(`<!doctype html><html><head><title>Bedömning ${selected.company}</title>
      <style>body{font-family:Inter,sans-serif;padding:32px;color:#111}table{width:100%;border-collapse:collapse}td{border-bottom:1px solid #ddd;padding:8px}h1{font-size:22px}</style>
      </head><body><h1>${selected.company}</h1>
      <p>Vi bedömde själva. ${review.reviewedOn}. ${review.assessorName}</p>
      <p>${percent === null ? "Inga poäng ännu." : `${percent}% · ${reviewBand(percent)}`}</p>
      <table>${rows}</table><p>${review.comment}</p></body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  const percent = review ? reviewPercent(review.scores) : null;

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border bg-card p-4 shadow-token-sm">
        <p className="text-sm font-semibold">Snitt på våra bedömningar</p>
        <p className="mt-1 text-sm text-muted-foreground">Varje stapel är en fråga. 6 är bäst. Det är ni som sätter poängen.</p>
        <div className="mt-3">
          <MiniBars empty="Inga bedömningar ännu." items={averages} />
        </div>
      </section>

      <div className="grid min-h-[36rem] gap-4 lg:grid-cols-[18rem_1fr]">
        <aside className="flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-token-sm">
          {canEdit ? (
            <Button onClick={() => void addSupplier()} size="sm" type="button">
              Ny leverantör
            </Button>
          ) : null}
          <ul className="flex flex-col gap-1">
            {suppliers.map((supplier) => (
              <li key={supplier.id}>
                <button
                  className={
                    supplier.id === selectedId
                      ? "w-full rounded-xl bg-primary px-3 py-2 text-left text-sm font-medium text-primary-foreground!"
                      : "w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-accent"
                  }
                  onClick={() => {
                    setSelectedId(supplier.id);
                    setReviewId(null);
                  }}
                  type="button"
                >
                  <span className="block">{supplier.company}</span>
                  <span className={supplier.id === selectedId ? "text-xs text-primary-foreground/80" : "text-xs text-muted-foreground"}>
                    {STATUSES.find((status) => status.id === supplier.status)?.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {suppliers.length === 0 && !error ? <p className="px-1 text-sm text-muted-foreground">Ingen leverantör ännu.</p> : null}
        </aside>

        <section className="flex flex-col gap-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {!selected ? (
            <div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground shadow-token-sm">Välj en leverantör till vänster.</div>
          ) : (
            <form
              className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-token-sm"
              onSubmit={(event) => {
                event.preventDefault();
                void saveSupplier(selected)
                  .then(() => {
                    setSaved(true);
                    setError(null);
                  })
                  .catch((err) => setError(supplierTableMessage(err)));
              }}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company">Företag</Label>
                  <Input id="company" onChange={(event) => patchSupplier({ company: event.target.value })} value={selected.company} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Leverantörsnummer</Label>
                  <Input id="number" onChange={(event) => patchSupplier({ supplierNumber: event.target.value })} value={selected.supplierNumber} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Kontaktperson</Label>
                  <Input id="contact" onChange={(event) => patchSupplier({ contactName: event.target.value })} value={selected.contactName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input id="phone" onChange={(event) => patchSupplier({ phone: event.target.value })} value={selected.phone} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-post</Label>
                  <Input id="email" onChange={(event) => patchSupplier({ email: event.target.value })} type="email" value={selected.email} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adress</Label>
                  <Input id="address" onChange={(event) => patchSupplier({ address: event.target.value })} value={selected.address} />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="grade">Hur viktig är leverantören</Label>
                  <select
                    className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                    id="grade"
                    onChange={(event) => patchSupplier({ grade: Number(event.target.value) as 1 | 2 | 3 })}
                    value={selected.grade}
                  >
                    {GRADES.map((grade) => (
                      <option key={grade.id} value={grade.id}>
                        {grade.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Får vi köpa av dem</Label>
                  <select
                    className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                    id="status"
                    onChange={(event) => patchSupplier({ status: event.target.value as SupplierStatus })}
                    value={selected.status}
                  >
                    {STATUSES.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Anteckning</Label>
                <Textarea id="note" onChange={(event) => patchSupplier({ note: event.target.value })} rows={2} value={selected.note} />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button disabled={!canEdit} type="submit">
                  Spara
                </Button>
                {saved ? <span className="text-sm text-muted-foreground">Sparat</span> : null}
                {canEdit ? (
                  <Button
                    onClick={() => {
                      const id = selected.id;
                      void deleteSupplier(id)
                        .then(() => {
                          const rest = suppliers.filter((supplier) => supplier.id !== id);
                          setSuppliers(rest);
                          setReviews((current) => current.filter((item) => item.supplierId !== id));
                          setSelectedId(rest[0]?.id ?? null);
                        })
                        .catch((err) => setError(supplierTableMessage(err)));
                    }}
                    type="button"
                    variant="outline"
                  >
                    Ta bort
                  </Button>
                ) : null}
              </div>
            </form>
          )}

          {selected ? (
            <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-token-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Vår bedömning</p>
                  <p className="text-sm text-muted-foreground">{percent === null ? "Inga poäng ännu." : `${percent}% · ${reviewBand(percent)}`}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canEdit ? (
                    <Button onClick={() => void addReview()} size="sm" type="button">
                      Ny bedömning
                    </Button>
                  ) : null}
                  <Button disabled={!review} onClick={printReview} size="sm" type="button" variant="outline">
                    Skriv ut
                  </Button>
                  <Button disabled={!review} onClick={mailReview} size="sm" type="button" variant="outline">
                    Mejla leverantören
                  </Button>
                </div>
              </div>

              {supplierReviews.length > 1 ? (
                <div className="flex flex-wrap gap-2">
                  {supplierReviews.map((item) => (
                    <Button key={item.id} onClick={() => setReviewId(item.id)} size="sm" type="button" variant={item.id === review?.id ? "default" : "outline"}>
                      {item.reviewedOn}
                    </Button>
                  ))}
                </div>
              ) : null}

              {!review ? (
                <p className="text-sm text-muted-foreground">Ingen bedömning ännu. Det är ni som sätter poängen, inte leverantören.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="when">Datum</Label>
                      <Input id="when" onChange={(event) => patchReview({ reviewedOn: event.target.value })} type="date" value={review.reviewedOn} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="who">Vem bedömde</Label>
                      <Input id="who" onChange={(event) => patchReview({ assessorName: event.target.value })} value={review.assessorName} />
                    </div>
                  </div>
                  {questions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Lägg in frågorna först. Exemplen går att ändra.</p>
                  ) : (
                    <ol className="flex flex-col gap-3">
                      {questions.map((question, index) => (
                        <li className="flex flex-col gap-2" key={question.id}>
                          <p className="text-sm">
                            {index + 1}. {question.prompt}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {[1, 2, 3, 4, 5, 6].map((score) => (
                              <button
                                className={
                                  review.scores[question.id] === score
                                    ? "size-9 rounded-lg bg-primary text-sm font-semibold text-primary-foreground!"
                                    : "size-9 rounded-lg border text-sm hover:bg-accent"
                                }
                                key={score}
                                onClick={() => patchReview({ scores: { ...review.scores, [question.id]: score } })}
                                type="button"
                              >
                                {score}
                              </button>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="comment">Kommentar</Label>
                    <Textarea id="comment" onChange={(event) => patchReview({ comment: event.target.value })} rows={3} value={review.comment} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={!canEdit}
                      onClick={() => {
                        void saveReview(review)
                          .then(() => {
                            setSaved(true);
                            setError(null);
                          })
                          .catch((err) => setError(supplierTableMessage(err)));
                      }}
                      type="button"
                    >
                      Spara bedömning
                    </Button>
                    {canEdit ? (
                      <Button
                        onClick={() => {
                          const id = review.id;
                          void deleteReview(id)
                            .then(() => {
                              setReviews((current) => current.filter((item) => item.id !== id));
                              setReviewId(null);
                            })
                            .catch((err) => setError(supplierTableMessage(err)));
                        }}
                        type="button"
                        variant="outline"
                      >
                        Ta bort bedömning
                      </Button>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div className="rounded-2xl border bg-card p-5 shadow-token-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Frågorna</p>
                <p className="text-sm text-muted-foreground">Samma frågor till alla leverantörer. 6 är alltid bäst.</p>
              </div>
              <Button onClick={() => setShowQuestions((open) => !open)} size="sm" type="button" variant="outline">
                {showQuestions ? "Dölj" : "Visa frågor"}
              </Button>
            </div>
            {showQuestions ? (
              <div className="mt-4 flex flex-col gap-3">
                {questions.length === 0 && canEdit ? (
                  <Button
                    onClick={() => {
                      if (!session?.organizationId) return;
                      void addExampleQuestions(session.organizationId)
                        .then(() => loadSuppliers(session.organizationId))
                        .then((data) => setQuestions(data.questions))
                        .catch((err) => setError(supplierTableMessage(err)));
                    }}
                    type="button"
                  >
                    Lägg in exempelfrågor
                  </Button>
                ) : null}
                {questions.map((question) => (
                  <div className="grid gap-2 md:grid-cols-[1fr_auto]" key={question.id}>
                    <Input
                      onBlur={(event) => void saveQuestion({ ...question, prompt: event.target.value })}
                      onChange={(event) => {
                        const next = { ...question, prompt: event.target.value };
                        setQuestions((current) => current.map((item) => (item.id === question.id ? next : item)));
                      }}
                      value={question.prompt}
                    />
                    {canEdit ? (
                      <Button
                        onClick={() => {
                          void deleteQuestion(question.id).then(() => setQuestions((current) => current.filter((item) => item.id !== question.id)));
                        }}
                        type="button"
                        variant="outline"
                      >
                        Ta bort
                      </Button>
                    ) : null}
                  </div>
                ))}
                {canEdit && questions.length > 0 ? (
                  <Button
                    onClick={() => {
                      if (!session?.organizationId) return;
                      void createQuestion(session.organizationId, questions.length + 1).then((row) => setQuestions((current) => [...current, row]));
                    }}
                    type="button"
                    variant="outline"
                  >
                    Ny fråga
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
