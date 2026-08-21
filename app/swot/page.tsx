"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { navigation } from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type QuadrantKey = "styrkor" | "svagheter" | "mojligheter" | "hot";

const initialData: Record<QuadrantKey, string[]> = {
  styrkor: ["Engagerad personal", "Nära kundrelationer"],
  svagheter: ["Begränsad dokumentation", "Otydliga rutiner vid frånvaro"],
  mojligheter: ["Digitalisera egenkontroller", "Nya upphandlingskrav gynnar ISO"],
  hot: ["Kompetensbrist vid expansion", "Ökade lagkrav"],
};

const labels: Record<QuadrantKey, { title: string; hint: string }> = {
  styrkor: { title: "Styrkor", hint: "Vad gör ni bra internt?" },
  svagheter: { title: "Svagheter", hint: "Vad behöver förbättras internt?" },
  mojligheter: { title: "Möjligheter", hint: "Vad kan ni ta tillvara externt?" },
  hot: { title: "Hot", hint: "Vilka yttre risker finns?" },
};

export default function SwotPage() {
  const [data, setData] = useState(initialData);
  const [drafts, setDrafts] = useState<Record<QuadrantKey, string>>({
    styrkor: "",
    svagheter: "",
    mojligheter: "",
    hot: "",
  });

  function addItem(key: QuadrantKey) {
    const value = drafts[key].trim();
    if (!value) return;
    setData((prev) => ({ ...prev, [key]: [...prev[key], value] }));
    setDrafts((prev) => ({ ...prev, [key]: "" }));
  }

  return (
    <DashboardLayout
      description="Använd SWOT tidigt för att synliggöra risker och möjligheter innan ni sätter kvalitets-, miljö- och arbetsmiljömål."
      navigation={navigation}
      title="SWOT-analys"
    >
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Så använder ni SWOT</CardTitle>
          <CardDescription>
            Gör analysen i grupp. Resultatet blir underlag till mål i Quality Works Light och
            kan länkas från relevanta avsnitt i Manualen vid intern revision.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(labels) as QuadrantKey[]).map((key) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle>{labels[key].title}</CardTitle>
              <CardDescription>{labels[key].hint}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2">
                {data[key].map((item) => (
                  <li
                    key={item}
                    className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Input
                  value={drafts[key]}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  placeholder={`Lägg till ${labels[key].title.toLowerCase()}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem(key);
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={() => addItem(key)}>
                  <Plus className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
