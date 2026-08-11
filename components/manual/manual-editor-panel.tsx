"use client";

import { Check, Paperclip, Save, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ManualEditorPanelProps {
  documentTitle: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onPublish: () => void;
  saved: boolean;
  attachments: number;
  onAddAttachment: () => void;
}

export function ManualEditorPanel({
  documentTitle,
  value,
  onChange,
  onSave,
  onPublish,
  saved,
  attachments,
  onAddAttachment,
}: ManualEditorPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-4 py-2.5">
        <Button onClick={onSave} size="sm" variant="outline">
          {saved ? <Check /> : <Save />}
          {saved ? "Sparat" : "Spara"}
        </Button>
        <Button onClick={onPublish} size="sm">
          <Upload />
          Publicera
        </Button>
        <Button onClick={onAddAttachment} size="sm" variant="ghost">
          <Paperclip />
          Bilagor
          {attachments > 0 ? (
            <Badge className="ml-1" variant="secondary">
              {attachments}
            </Badge>
          ) : null}
        </Button>
        <p className="ml-auto text-xs text-muted-foreground">
          Redigerar: <span className="font-medium text-foreground">{documentTitle}</span>
        </p>
      </div>
      <div className="min-h-0 flex-1 p-4">
        <Textarea
          aria-label={`Arbetsmanual för ${documentTitle}`}
          className="h-full min-h-[28rem] resize-none rounded-lg leading-7"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
      </div>
    </div>
  );
}
