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
  comingSoonPoints,
}: ModuleShellProps) {
  return (
    <DashboardLayout description={description} navigation={navigation} title={title}>
      {children}
      {comingSoonPoints && comingSoonPoints.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Under uppbyggnad</CardTitle>
            <CardDescription>
              Full funktionalitet byggs ut stegvis.
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
      ) : null}
    </DashboardLayout>
  );
}
