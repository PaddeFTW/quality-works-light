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
  createCustomer,
  createQuestion,
  createReview,
  customerTableMessage,
  deleteCustomer,
  deleteQuestion,
  deleteReview,
  loadCustomers,
  reviewBand,
  reviewPercent,
  saveCustomer,
  saveQuestion,
  saveReview,
  type CustomerItem,
  type CustomerQuestion,
  type CustomerReview,
  type QuestionArea,
  type ReviewFilledBy,
} from "@/lib/kund/persist";

const GRADES = [
  { id: 1, label: "Viktig kund" },
  { id: 2, label: "Vanlig kund" },
  { id: 3, label: "Liten påverkan" },
] as const;

const AREAS: QuestionArea[] = ["Kvalitet", "Miljö", "Arbetsmiljö"];

export function KundWorkspace() {
  const { session } = useOrgSession();
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [questions, setQuestions] = useState<CustomerQuestion[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const canEdit = session?.role !== "viewer";
  const selected = customers.find((customer) => customer.id === selectedId) ?? null;
  const customerReviews = reviews.filter((review) => review.customerId === selectedId);
  const review = customerReviews.find((item) => item.id === reviewId) ?? customerReviews[0] ?? null;

  useEffect(() => {
    if (!session?.organizationId) return;
    void loadCustomers(session.organizationId)
      .then((data) => {
        setCustomers(data.customers);
        setQuestions(data.questions);
        setReviews(data.reviews);
        setSelectedId(data.customers[0]?.id ?? null);
        setError(null);
      })
      .catch((err) => setError(customerTableMessage(err)));
  }, [session?.organizationId]);

  const averages = useMemo(() => {
    return questions.map((question, index) => {
      const values = reviews
        .map((item) => item.scores[question.id])
        .filter((score): score is number => score >= 1 && score <= 6);
      const average = values.length ? values.reduce((sum, score) => sum + score, 0) / values.length : 0;
      return { label: String(index + 1), value: Math.round(average * 10) / 10 };
    });
  }, [questions, reviews]);

  function patchCustomer(next: Partial<CustomerItem>) {
    if (!selected) return;
    setCustomers((current) => current.map((customer) => (customer.id === selected.id ? { ...customer, ...next } : customer)));
    setSaved(false);
  }

  function patchReview(next: Partial<CustomerReview>) {
    if (!review) return;
    setReviews((current) => current.map((item) => (item.id === review.id ? { ...item, ...next } : item)));
    setSaved(false);
  }

  async function addCustomer() {
    if (!session?.organizationId) return;
    try {
      const row = await createCustomer(session.organizationId, "Ny kund");
      setCustomers((current) => [...current, row].sort((a, b) => a.company.localeCompare(b.company, "sv")));
      setSelectedId(row.id);
      setError(null);
    } catch (err) {
      setError(customerTableMessage(err));
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
      setError(customerTableMessage(err));
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
      "Det här är vad vi tror att ni tycker om oss. Svara gärna om något inte stämmer.",
      "",
      ...lines,
      "",
      percent === null ? "" : `Snitt: ${percent}% ${reviewBand(percent)}`,
      review.comment ? `Kommentar: ${review.comment}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    window.location.href = `mailto:${selected.email}?subject=${encodeURIComponent("Stämmer det här med hur ni ser på oss?")}&body=${encodeURIComponent(body)}`;
  }

  function printReview() {
    if (!selected || !review) return;
    const percent = reviewPercent(review.scores);
    const rows = questions
      .map((question, index) => {
        const score = review.scores[question.id];
        return `<tr><td>${index + 1}. ${question.prompt}</td><td>${score ? `${score} av 6` : "–"}</td></tr>`;
      })
      .join("");
    const popup = window.open("", "_blank", "noopener,noreferrer");
    if (!popup) return;
    popup.document.write(`<!doctype html><html><head><title>Omdöme ${selected.company}</title>
      <style>body{font-family:Inter,sans-serif;padding:32px;color:#111}table{width:100%;border-collapse:collapse}td{border-bottom:1px solid #ddd;padding:8px}h1{font-size:22px}</style>
      </head><body><h1>${selected.company}</h1>
      <p>${review.filledBy === "oss" ? "Vi svarade åt kunden." : "Kunden svarade."} ${review.reviewedOn}</p>
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
        <p className="text-sm font-semibold">Snitt på alla omdömen</p>
        <p className="mt-1 text-sm text-muted-foreground">Varje stapel är en fråga. 6 är bäst.</p>
        <div className="mt-3">
          <MiniBars empty="Inga omdömen ännu. Lägg till en kund och fyll i poängen." items={averages} />
        </div>
      </section>

      <div className="grid min-h-[36rem] gap-4 lg:grid-cols-[18rem_1fr]">
        <aside className="flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-token-sm">
          {canEdit ? (
            <Button onClick={() => void addCustomer()} size="sm" type="button">
              Ny kund
            </Button>
          ) : null}
          <ul className="flex flex-col gap-1">
            {customers.map((customer) => (
              <li key={customer.id}>
                <button
                  className={
                    customer.id === selectedId
                      ? "w-full rounded-xl bg-primary px-3 py-2 text-left text-sm font-medium text-primary-foreground!"
                      : "w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-accent"
                  }
                  onClick={() => {
                    setSelectedId(customer.id);
                    setReviewId(null);
                  }}
                  type="button"
                >
                  <span className="block">{customer.company}</span>
                  <span className={customer.id === selectedId ? "text-xs text-primary-foreground/80" : "text-xs text-muted-foreground"}>
                    {GRADES.find((grade) => grade.id === customer.grade)?.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {customers.length === 0 && !error ? (
            <p className="px-1 text-sm text-muted-foreground">Ingen kund ännu. Lägg till den första.</p>
          ) : null}
        </aside>

        <section className="flex flex-col gap-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {!selected ? (
            <div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground shadow-token-sm">Välj en kund till vänster.</div>
          ) : (
            <form
              className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-token-sm"
              onSubmit={(event) => {
                event.preventDefault();
                void saveCustomer(selected)
                  .then(() => {
                    setSaved(true);
                    setError(null);
                  })
                  .catch((err) => setError(customerTableMessage(err)));
              }}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company">Företag</Label>
                  <Input id="company" onChange={(event) => patchCustomer({ company: event.target.value })} value={selected.company} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Kundnummer</Label>
                  <Input id="number" onChange={(event) => patchCustomer({ customerNumber: event.target.value })} value={selected.customerNumber} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Kontaktperson hos kunden</Label>
                  <Input id="contact" onChange={(event) => patchCustomer({ contactName: event.target.value })} value={selected.contactName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ours">Vår kontakt</Label>
                  <Input id="ours" onChange={(event) => patchCustomer({ ourContact: event.target.value })} value={selected.ourContact} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-post</Label>
                  <Input id="email" onChange={(event) => patchCustomer({ email: event.target.value })} type="email" value={selected.email} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input id="phone" onChange={(event) => patchCustomer({ phone: event.target.value })} value={selected.phone} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Hur viktig är kunden</Label>
                <select
                  className="h-10 rounded-xl border bg-background px-3 text-sm"
                  id="grade"
                  onChange={(event) => patchCustomer({ grade: Number(event.target.value) as 1 | 2 | 3 })}
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
                <Label htmlFor="note">Anteckning</Label>
                <Textarea id="note" onChange={(event) => patchCustomer({ note: event.target.value })} rows={2} value={selected.note} />
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
                      void deleteCustomer(id)
                        .then(() => {
                          const rest = customers.filter((customer) => customer.id !== id);
                          setCustomers(rest);
                          setReviews((current) => current.filter((item) => item.customerId !== id));
                          setSelectedId(rest[0]?.id ?? null);
                        })
                        .catch((err) => setError(customerTableMessage(err)));
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
                  <p className="font-semibold">Omdöme</p>
                  <p className="text-sm text-muted-foreground">
                    {percent === null ? "Inga poäng ännu." : `${percent}% · ${reviewBand(percent)}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canEdit ? (
                    <Button onClick={() => void addReview()} size="sm" type="button">
                      Nytt omdöme
                    </Button>
                  ) : null}
                  <Button disabled={!review} onClick={printReview} size="sm" type="button" variant="outline">
                    Skriv ut
                  </Button>
                  <Button disabled={!review} onClick={mailReview} size="sm" type="button" variant="outline">
                    Mejla kunden
                  </Button>
                </div>
              </div>

              {customerReviews.length > 1 ? (
                <div className="flex flex-wrap gap-2">
                  {customerReviews.map((item) => (
                    <Button
                      key={item.id}
                      onClick={() => setReviewId(item.id)}
                      size="sm"
                      type="button"
                      variant={item.id === review?.id ? "default" : "outline"}
                    >
                      {item.reviewedOn}
                    </Button>
                  ))}
                </div>
              ) : null}

              {!review ? (
                <p className="text-sm text-muted-foreground">
                  Inget omdöme ännu. Fyll i poängen själva om kunden inte hinner svara. Skriv att det är vad ni tror.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="when">Datum</Label>
                      <Input id="when" onChange={(event) => patchReview({ reviewedOn: event.target.value })} type="date" value={review.reviewedOn} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="who">Vem svarade</Label>
                      <select
                        className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                        id="who"
                        onChange={(event) => patchReview({ filledBy: event.target.value as ReviewFilledBy })}
                        value={review.filledBy}
                      >
                        <option value="oss">Vi svarade åt kunden</option>
                        <option value="kund">Kunden svarade</option>
                      </select>
                    </div>
                  </div>
                  {questions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Lägg in frågorna först. De nio exemplen går att ändra.</p>
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
                          .catch((err) => setError(customerTableMessage(err)));
                      }}
                      type="button"
                    >
                      Spara omdöme
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
                            .catch((err) => setError(customerTableMessage(err)));
                        }}
                        type="button"
                        variant="outline"
                      >
                        Ta bort omdöme
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
                <p className="text-sm text-muted-foreground">Samma frågor till alla kunder. Byt texten så den passar er.</p>
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
                        .then(() => loadCustomers(session.organizationId))
                        .then((data) => setQuestions(data.questions))
                        .catch((err) => setError(customerTableMessage(err)));
                    }}
                    type="button"
                  >
                    Lägg in 9 exempelfrågor
                  </Button>
                ) : null}
                {questions.map((question) => (
                  <div className="grid gap-2 md:grid-cols-[9rem_1fr_auto]" key={question.id}>
                    <select
                      className="h-10 rounded-xl border bg-background px-3 text-sm"
                      onChange={(event) => {
                        const next = { ...question, area: event.target.value as QuestionArea };
                        setQuestions((current) => current.map((item) => (item.id === question.id ? next : item)));
                        void saveQuestion(next);
                      }}
                      value={question.area}
                    >
                      {AREAS.map((area) => (
                        <option key={area}>{area}</option>
                      ))}
                    </select>
                    <Input
                      onChange={(event) => {
                        const next = { ...question, prompt: event.target.value };
                        setQuestions((current) => current.map((item) => (item.id === question.id ? next : item)));
                      }}
                      onBlur={(event) => void saveQuestion({ ...question, prompt: event.target.value })}
                      value={question.prompt}
                    />
                    {canEdit ? (
                      <Button
                        onClick={() => {
                          void deleteQuestion(question.id).then(() =>
                            setQuestions((current) => current.filter((item) => item.id !== question.id)),
                          );
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
                      void createQuestion(session.organizationId, questions.length + 1).then((row) =>
                        setQuestions((current) => [...current, row]),
                      );
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
