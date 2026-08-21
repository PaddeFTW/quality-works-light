import type { ReactNode } from "react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { navigation } from "@/components/layout/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ModuleShellProps {
  title: string;
  description: string;
  children?: ReactNode;
  comingSoonPoints?: string[];
}

export function ModuleShell({
  title,
  description,
  children,
  comingSoonPoints = [
    "Lista och registrering",
    "Koppling till Manualen",
    "Uppföljning i Årshjulet",
  ],
}: ModuleShellProps) {
  return (
    <DashboardLayout description={description} navigation={navigation} title={title}>
      {children}
      <Card>
        <CardHeader>
          <CardTitle>Under uppbyggnad i V1</CardTitle>
          <CardDescription>
            Modulen finns i menyn så att flödet i ledningssystemet blir komplett. Full
            funktionalitet byggs ut stegvis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {comingSoonPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
