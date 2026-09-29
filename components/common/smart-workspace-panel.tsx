"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw, Sparkles, WandSparkles, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createDemoProposal } from "@/lib/workspace/demo-mapper";
import type { WorkspaceAppContract, WorkspaceContext } from "@/lib/workspace/context";
import type { Proposal, ProposalChange } from "@/lib/workspace/proposal";

const sourceLabels = { user_input: "Din text", existing_data: "Befintligt", ai_interpretation: "Tolkning", knowledge: "Kunskap" };
const customerExamples = [
  "Kunden är ABC Bygg. Anna är kontaktperson.",
  "De gav 4 av 5 på leveransen.",
  "Följ upp i oktober.",
];

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Inte ifyllt";
  if (typeof value === "boolean") return value ? "Ja" : "Nej";
  return String(value);
}

function fieldValue(context: WorkspaceContext, id: string) {
  return context.fields.find((field) => field.id === id)?.value ?? "";
}

export function SmartWorkspacePanel({ contract }: { contract: WorkspaceAppContract | null }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [undoValues, setUndoValues] = useState<{ company: unknown; contact: unknown; note: unknown } | null>(null);

  const context = contract?.getContext() ?? null;
  const isCustomer = context?.module_id === "kund";
  const live = useMemo(() => {
    if (!isCustomer || !context?.record_id || !input.trim()) return null;
    return createDemoProposal(input, context);
  }, [context, input, isCustomer]);
  const liveWarnings = live?.warnings.filter((warning) => live.changes.some((change) => change.field_id === warning.field_id)) ?? [];

  const createProposal = () => {
    if (!context) return;
    const next = createDemoProposal(input, context);
    setProposal(next);
    setSelected(next.changes.map((change) => change.field_id));
    setMessage(null);
  };

  const apply = async () => {
    if (!proposal || !contract || !context?.record_id || !context.permissions.canApplyWorkspace) return;
    const changes = proposal.changes.filter((change) => selected.includes(change.field_id) && !change.blocked);
    const result = await contract.applyFieldUpdates({ record_id: context.record_id, proposal_id: proposal.proposal_id, changes: changes.map((change) => ({ field_id: change.field_id, new_value: change.new_value })) });
    if (result.ok) {
      setProposal({ ...proposal, status: "applied" });
      setMessage(`${result.applied_field_ids.length} fält uppdaterades.`);
    } else setMessage(result.error ?? "Förslaget kunde inte appliceras.");
  };

  const undo = async () => {
    if (!proposal || !contract || !context?.record_id) return;
    const changes = proposal.changes.filter((change) => selected.includes(change.field_id));
    const result = await contract.applyFieldUpdates({ record_id: context.record_id, proposal_id: proposal.proposal_id, changes: changes.map((change) => ({ field_id: change.field_id, new_value: change.old_value })) });
    if (result.ok) {
      setProposal({ ...proposal, status: "undone" });
      setMessage("Förslaget ångrades.");
    }
  };

  const addExample = (example: string) => {
    setInput((current) => (current.trim() ? `${current.trim()} ${example}` : example));
    setMessage(null);
  };

  const useSuggestion = async (changes: ProposalChange[]) => {
    if (!contract || !context?.record_id || !live || !context.permissions.canApplyWorkspace) return;
    setUndoValues({
      company: fieldValue(context, "company_name"),
      contact: fieldValue(context, "contact_person"),
      note: fieldValue(context, "note"),
    });
    const result = await contract.applyFieldUpdates({
      record_id: context.record_id,
      proposal_id: live.proposal_id,
      changes: changes.map((change) => ({ field_id: change.field_id, new_value: change.new_value })),
    });
    setMessage(result.ok ? "Fälten fylldes. Tryck Spara i kunden när du vill behålla det." : result.error ?? "Förslaget kunde inte användas.");
  };

  const undoSuggestion = async () => {
    if (!contract || !context?.record_id || !undoValues || !live) return;
    const result = await contract.applyFieldUpdates({
      record_id: context.record_id,
      proposal_id: live.proposal_id,
      changes: [
        { field_id: "company_name", new_value: undoValues.company ?? "" },
        { field_id: "contact_person", new_value: undoValues.contact ?? "" },
        { field_id: "note", new_value: undoValues.note ?? "" },
      ],
    });
    if (result.ok) {
      setUndoValues(null);
      setMessage("Förslaget ångrades.");
    }
  };

  return (
    <>
      <Button className="fixed bottom-5 right-5 z-50 rounded-full px-5 shadow-lg" onClick={() => setOpen(true)}>
        <WandSparkles data-icon="inline-start" />
        Smart arbetsyta
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><Sparkles /></div>
              <div>
                <DialogTitle>Smart arbetsyta</DialogTitle>
                <DialogDescription>Beskriv vad du vill fylla i. Du granskar alltid förslaget innan något ändras.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {isCustomer ? (
            !context?.record_id ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">Välj vilken kund texten ska fylla i.</p>
                <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                  {(contract?.records ?? []).map((record) => (
                    <Button key={record.id} variant="outline" className="justify-start" onClick={() => contract?.selectRecord?.(record.id)}>
                      {record.label}
                    </Button>
                  ))}
                  {(contract?.records ?? []).length === 0 && <p className="text-sm text-muted-foreground">Ingen kund ännu.</p>}
                </div>
                <Button onClick={() => void contract?.createRecord?.()}>Ny kund</Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <Textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Skriv kundens företagsnamn, kontaktpersonens namn, betyg och om ni ska följa upp."
                  rows={5}
                />
                <div className="flex flex-col gap-2">
                  {customerExamples.map((example) => (
                    <Button key={example} variant="outline" className="h-auto justify-start whitespace-normal text-left" onClick={() => addExample(example)}>
                      {example}
                    </Button>
                  ))}
                </div>
                {live && live.changes.length > 0 && (
                  <div className="flex flex-col gap-3 rounded-lg border p-3">
                    <p className="font-medium">Förslag</p>
                    {live.changes.map((change) => (
                      <div key={change.field_id} className="text-sm">
                        <p className="text-muted-foreground">{change.label}</p>
                        <p className="font-medium">{formatValue(change.new_value)}</p>
                      </div>
                    ))}
                    {liveWarnings.length > 0 && (
                      <div className="rounded-lg border border-amber-300/60 bg-amber-50/70 p-3 text-sm text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
                        {liveWarnings.map((warning) => <p key={warning.id}>{warning.message}</p>)}
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button onClick={() => void useSuggestion(live.changes)} disabled={!context.permissions.canApplyWorkspace}>Använd förslaget</Button>
                    </div>
                  </div>
                )}
                {undoValues && <div className="flex justify-end"><Button variant="outline" onClick={() => void undoSuggestion()}><RotateCcw data-icon="inline-start" />Ångra</Button></div>}
                {message && <p className="text-sm text-muted-foreground">{message}</p>}
              </div>
            )
          ) : !context ? (
            <p className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">Ingen modul är öppen. Öppna en modul för att fylla i dess riktiga fält.</p>
          ) : !proposal || proposal.status === "undone" ? (
            <div className="flex flex-col gap-4">
              <Textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Beskriv det som ska fyllas i." rows={5} />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">Demo-mappning · ingen automatisk skrivning</p>
                <Button onClick={createProposal} disabled={!input.trim()}>Skapa förslag</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div><p className="font-medium">Granska förslag</p><p className="text-sm text-muted-foreground">{proposal.changes.length} möjliga ändringar</p></div>
                <Badge variant={proposal.status === "applied" ? "success" : "secondary"}>{proposal.status === "applied" ? "Applicerat" : "Utkast"}</Badge>
              </div>
              {proposal.changes.length > 0 && <div className="flex flex-col gap-2">
                {proposal.changes.map((change) => {
                  const checked = selected.includes(change.field_id);
                  return <Card key={change.field_id} className={checked ? "border-primary/40" : "opacity-60"}>
                    <CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><label className="flex cursor-pointer items-start gap-3"><input aria-label={`Välj ${change.label}`} checked={checked} className="mt-1 size-4 accent-primary" onChange={() => setSelected((items) => checked ? items.filter((id) => id !== change.field_id) : [...items, change.field_id])} type="checkbox" /><span><CardTitle className="text-sm">{change.label}</CardTitle><CardDescription>{change.reason}</CardDescription></span></label><Badge variant="outline">{sourceLabels[proposal.sources.find((source) => source.id === change.source_ref)?.level ?? "user_input"]}</Badge></div></CardHeader>
                    <CardContent className="grid gap-2 text-sm sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">Före</p><p className="rounded-md bg-muted px-3 py-2">{formatValue(change.old_value)}</p></div><div><p className="text-xs text-muted-foreground">Efter</p><p className="rounded-md bg-primary/10 px-3 py-2 font-medium">{formatValue(change.new_value)}</p></div></CardContent>
                  </Card>;
                })}
              </div>}
              {proposal.warnings.filter((warning) => proposal.changes.some((change) => change.field_id === warning.field_id)).length > 0 && <div className="flex flex-col gap-2 rounded-lg border border-amber-300/60 bg-amber-50/70 p-3 text-sm text-amber-950 dark:bg-amber-950/20 dark:text-amber-100"><p className="font-medium">Kontrollera innan du godkänner</p>{proposal.warnings.filter((warning) => proposal.changes.some((change) => change.field_id === warning.field_id)).map((warning) => <p key={warning.id}>{warning.message}</p>)}</div>}
              {message && <p className="text-sm text-muted-foreground">{message}</p>}
            </div>
          )}
          {!isCustomer && (
            <DialogFooter>
              {proposal && proposal.status === "applied" ? <Button variant="outline" onClick={undo}><RotateCcw data-icon="inline-start" />Ångra</Button> : proposal && proposal.status === "draft" && proposal.changes.length > 0 ? <><Button variant="ghost" onClick={() => { setProposal({ ...proposal, status: "rejected" }); setMessage("Förslaget avvisades."); }}><X data-icon="inline-start" />Avvisa</Button><Button onClick={apply} disabled={!selected.length || !context?.record_id}><Check data-icon="inline-start" />Godkänn valda</Button></> : null}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
