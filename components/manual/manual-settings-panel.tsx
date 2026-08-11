"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Check, ImageUp, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export interface ManualSettings {
  name: string;
  issuer: string;
  reviewer: string;
  approver: string;
  logo: string;
  headerText: string;
  footerText: string;
}

interface ManualSettingsPanelProps {
  settings: ManualSettings;
  onChange: (settings: ManualSettings) => void;
}

const fields: Array<{ key: keyof ManualSettings; label: string }> = [
  { key: "name", label: "Manualens namn" },
  { key: "issuer", label: "Utfärdare" },
  { key: "reviewer", label: "Granskare" },
  { key: "approver", label: "Godkännare" },
];

export function ManualSettingsPanel({
  settings,
  onChange,
}: ManualSettingsPanelProps) {
  const [saved, setSaved] = useState(false);

  function update(key: keyof ManualSettings, value: string) {
    onChange({ ...settings, [key]: value });
    setSaved(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
  }

  return (
    <form
      className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-6"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold tracking-tight">
          Grundinställningar
        </h3>
        <p className="text-sm leading-6 text-muted-foreground">
          Uppgifterna används på försättsblad, sidhuvud och sidfot när manualen
          publiceras.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => (
          <div className="flex flex-col gap-2" key={field.key}>
            <label
              className="text-sm font-medium"
              htmlFor={`manual-${field.key}`}
            >
              {field.label}
            </label>
            <Input
              id={`manual-${field.key}`}
              onChange={(event) => update(field.key, event.target.value)}
              value={settings[field.key]}
            />
          </div>
        ))}
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Logotyp</span>
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed bg-muted/30 p-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border bg-card text-muted-foreground">
            <ImageUp className="size-5" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-sm font-medium">
              {settings.logo || "Ingen logotyp vald"}
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              PNG eller SVG, minst 240 px bred.
            </p>
          </div>
          <Button
            className="ml-auto"
            onClick={() => update("logo", "logotyp.svg")}
            type="button"
            variant="outline"
          >
            Välj fil
          </Button>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="manual-header">
            Header-text
          </label>
          <Input
            id="manual-header"
            onChange={(event) => update("headerText", event.target.value)}
            value={settings.headerText}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="manual-footer">
            Footer-text
          </label>
          <Textarea
            className="min-h-20 leading-6"
            id="manual-footer"
            onChange={(event) => update("footerText", event.target.value)}
            value={settings.footerText}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit">
          {saved ? <Check /> : <Save />}
          {saved ? "Sparat" : "Spara grundinställningar"}
        </Button>
        {saved ? (
          <p className="text-sm text-muted-foreground">
            Grundinställningarna är sparade.
          </p>
        ) : null}
      </div>
    </form>
  );
}
