"use client";

import { useState } from "react";
import { Plus, Target } from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { navigation } from "@/components/layout/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type GoalType = "Kvalitet" | "Miljö" | "Arbetsmiljö";

const initialGoals = [
  {
    title: "Minska kundklagomål med 20 %",
    type: "Kvalitet" as GoalType,
    status: "Pågår",
    deadline: "2026-12-31",
  },
  {
    title: "Kartlägga alla betydande miljöaspekter",
    type: "Miljö" as GoalType,
    status: "Planerad",
    deadline: "2026-06-30",
  },
  {
    title: "Genomföra skyddsronder varje kvartal",
    type: "Arbetsmiljö" as GoalType,
    status: "Pågår",
    deadline: "2026-12-31",
  },
];

export default function MalPage() {
  const [open, setOpen] = useState(false);
  const [goals] = useState(initialGoals);

  return (
    <DashboardLayout
      description="Sätt och följ upp kvalitetsmål, miljömål och arbetsmiljömål utifrån SWOT och verksamhetens behov."
      navigation={navigation}
      title="Mål"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus data-icon="inline-start" />
              Nytt mål
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nytt mål</DialogTitle>
              <DialogDescription>
                Formulera mätbara mål som kan följas i Årshjulet och kopplas till Manualen.
              </DialogDescription>
            </DialogHeader>
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                setOpen(false);
              }}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="mal-titel">Titel</Label>
                <Input id="mal-titel" placeholder="Vad ska uppnås?" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Typ</Label>
                <Select defaultValue="kvalitet">
                  <SelectTrigger>
                    <SelectValue placeholder="Välj typ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kvalitet">Kvalitet</SelectItem>
                    <SelectItem value="miljo">Miljö</SelectItem>
                    <SelectItem value="arbetsmiljo">Arbetsmiljö</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="mal-beskrivning">Beskrivning</Label>
                <Textarea id="mal-beskrivning" placeholder="Hur mäts målet?" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="mal-deadline">Deadline</Label>
                <Input id="mal-deadline" type="date" />
              </div>
              <DialogFooter>
                <Button type="submit">Spara mål</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-4">
        {goals.map((goal) => (
          <Card key={goal.title}>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="size-4 text-primary" />
                  {goal.title}
                </CardTitle>
                <CardDescription>Deadline: {goal.deadline}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{goal.type}</Badge>
                <Badge>{goal.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Koppla gärna målet till aktiviteter i Årshjulet och till relevant avsnitt i
              Manualen.
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
