import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
      <Link className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-token hover:text-foreground" href="/manual">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Tillbaka till {title}
      </Link>
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
