"use client";

import { useRef, useState } from "react";
import { Check, ClipboardPaste, Paperclip, RotateCcw, Sparkles, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { analyzeModuleText, type FillAnalysis, type FillExtra, type FillHit } from "@/lib/workspace/fill-assistant";
import type { WorkspaceAppContract, WorkspaceContext } from "@/lib/workspace/context";

const moduleNames: Record<string, string> = {
  kund: "Kunder",
  leverantor: "Leverantörer",
  avvikelse: "Avvikelse",
  forslag: "Förslag",
};

function moduleLabel(context: WorkspaceContext | null) {
  if (!context?.module_id) return "den här modulen";
  return moduleNames[context.module_id] ?? "den här modulen";
}

export function SmartWorkspacePanel({ contract }: { contract: WorkspaceAppContract | null }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [analysis, setAnalysis] = useState<FillAnalysis | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [undoValues, setUndoValues] = useState<Record<string, unknown> | null>(null);

  const context = contract?.getContext() ?? null;
  const writable = context?.fields.filter((field) => field.ai_writable) ?? [];
  const canFill = Boolean(context?.record_id && context.permissions.canApplyWorkspace);

  const toggle = (id: string) => {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const analyze = () => {
    if (!context?.record_id || writable.length === 0) return;
    const next = analyzeModuleText(input, context.fields);
    setAnalysis(next);
    setPicked(next.hits.map((hit) => hit.field_id));
    setMessage(null);
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) setInput(text);
      setMessage(text.trim() ? null : "Urklipp var tomt.");
    } catch {
      setMessage("Klistra in texten i rutan. Webbläsaren blockerade urklipp.");
    }
  };

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    const readable = file.type.startsWith("text/") || /\.(txt|md|csv)$/i.test(file.name);
    if (!readable) {
      setMessage("Den här filen kan jag inte läsa ännu. Klistra in texten i rutan.");
      return;
    }
    setInput(await file.text());
    setMessage(null);
  };

  const fill = async () => {
    if (!contract || !context?.record_id || !analysis || !canFill) return;
    const hits = analysis.hits.filter((hit) => picked.includes(hit.field_id));
    const extras = analysis.extras.filter((extra) => picked.includes(extra.id));
    if (hits.length === 0 && extras.length === 0) return;
    const before = Object.fromEntries(context.fields.map((field) => [field.id, field.value ?? ""]));
    const changes = hits.map((hit) => ({ field_id: hit.field_id, new_value: hit.value }));
    if (extras.length > 0) {
      const noteHit = changes.find((change) => change.field_id === "note");
      const base = String(noteHit?.new_value ?? before.note ?? "");
      const extraText = extras.map((extra) => `${extra.label}: ${extra.value}`).join("\n");
      const note = [base.trim(), extraText].filter(Boolean).join("\n");
      if (noteHit) noteHit.new_value = note;
      else changes.push({ field_id: "note", new_value: note });
    }
    const result = await contract.applyFieldUpdates({ record_id: context.record_id, proposal_id: `fill_${Date.now()}`, changes });
    if (result.ok) {
      setUndoValues(before);
      setMessage("Fälten fylldes. Tryck Spara i formuläret när du vill behålla det.");
    } else setMessage(result.error ?? "Förslaget kunde inte fyllas i.");
  };

  const undo = async () => {
    if (!contract || !context?.record_id || !undoValues) return;
    const changes = Object.entries(undoValues).map(([field_id, new_value]) => ({ field_id, new_value }));
    const result = await contract.applyFieldUpdates({ record_id: context.record_id, proposal_id: `undo_${Date.now()}`, changes });
    if (result.ok) {
      setUndoValues(null);
      setMessage("Förslaget ångrades.");
    }
  };

  const total = (analysis?.hits.length ?? 0) + (analysis?.missing.length ?? 0);

  return (
    <>
      <Button className="fixed bottom-5 right-5 z-50 rounded-full px-5 shadow-lg" onClick={() => setOpen(true)}>
        <WandSparkles data-icon="inline-start" />
        Modulassistent
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><Sparkles /></div>
              <div>
                <DialogTitle>Modulassistent</DialogTitle>
                <DialogDescription>Jag läser bara formuläret i {moduleLabel(context)}. Ingenting skrivs förrän du godkänner.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {!context ? (
            <p className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">Öppna en modul först. Då kan jag fylla i just det formuläret.</p>
          ) : !context.record_id ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">Välj vilken post texten ska fylla i.</p>
              <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                {(contract?.records ?? []).map((record) => (
                  <Button key={record.id} className="justify-start" onClick={() => contract?.selectRecord?.(record.id)} variant="outline">
                    {record.label}
                  </Button>
                ))}
                {(contract?.records ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Ingen post ännu.</p> : null}
              </div>
              {contract?.createRecord ? <Button onClick={() => void contract.createRecord?.()}>Ny kund</Button> : null}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium">Vad vill du lägga in?</p>
              <Textarea
                onChange={(event) => {
                  setInput(event.target.value);
                  setAnalysis(null);
                }}
                placeholder="Klistra in text, anteckningar, mejl eller annan information..."
                rows={5}
                value={input}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => fileRef.current?.click()} type="button" variant="outline">
                    <Paperclip data-icon="inline-start" />
                    Lägg till bilaga
                  </Button>
                  <Button onClick={() => void paste()} type="button" variant="outline">
                    <ClipboardPaste data-icon="inline-start" />
                    Klistra in
                  </Button>
                  <input
                    accept=".txt,.md,.csv,text/plain"
                    className="hidden"
                    onChange={(event) => {
                      void readFile(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                    ref={fileRef}
                    type="file"
                  />
                </div>
                <Button disabled={!input.trim() || writable.length === 0} onClick={analyze} type="button">
                  Analysera
                </Button>
              </div>

              {analysis ? (
                <div className="flex flex-col gap-3 rounded-lg border p-3">
                  <p className="font-medium">Jag kunde fylla i {analysis.hits.length} av {total} fält.</p>
                  {analysis.hits.map((hit) => (
                    <SuggestionRow checked={picked.includes(hit.field_id)} hit={hit} key={hit.field_id} onToggle={() => toggle(hit.field_id)} />
                  ))}
                  {analysis.missing.map((miss) => (
                    <p className="text-sm text-muted-foreground" key={miss.field_id}>? {miss.label}. Hittades inte i underlaget.</p>
                  ))}
                  {analysis.extras.length > 0 ? (
                    <div className="flex flex-col gap-2 border-t pt-3">
                      <p className="text-sm font-medium">Hittades i texten, men det finns inget eget fält.</p>
                      {analysis.extras.map((extra) => (
                        <ExtraRow checked={picked.includes(extra.id)} extra={extra} key={extra.id} onToggle={() => toggle(extra.id)} />
                      ))}
                      <p className="text-xs text-muted-foreground">Kryssar du i dem hamnar de i anteckningen. De blir inte nya fält.</p>
                    </div>
                  ) : null}
                  <div className="flex justify-end gap-2">
                    {undoValues ? (
                      <Button onClick={() => void undo()} type="button" variant="outline">
                        <RotateCcw data-icon="inline-start" />
                        Ångra
                      </Button>
                    ) : null}
                    <Button disabled={!canFill || picked.length === 0} onClick={() => void fill()} type="button">
                      <Check data-icon="inline-start" />
                      Fyll i föreslagna uppgifter
                    </Button>
                  </div>
                </div>
              ) : null}
              {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function SuggestionRow({ hit, checked, onToggle }: { hit: FillHit; checked: boolean; onToggle: () => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <input checked={checked} className="mt-1 size-4 accent-primary" onChange={onToggle} type="checkbox" />
      <span>
        <span className="font-medium">{hit.label}</span>
        <span className="mt-0.5 block">{hit.value}</span>
      </span>
    </label>
  );
}

function ExtraRow({ extra, checked, onToggle }: { extra: FillExtra; checked: boolean; onToggle: () => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <input checked={checked} className="mt-1 size-4 accent-primary" onChange={onToggle} type="checkbox" />
      <span>
        <span className="font-medium">{extra.label}</span>
        <span className="mt-0.5 block text-muted-foreground">{extra.value}</span>
      </span>
    </label>
  );
}
