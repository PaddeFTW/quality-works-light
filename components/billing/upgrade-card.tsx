"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { neededPlan, type PlanFeature } from "@/lib/billing/plans";

export function UpgradeCard({ feature, text }: { feature: PlanFeature; text: string }) {
  const plan = neededPlan(feature);
  return (
    <Card className="border-primary/25 bg-gradient-to-br from-secondary to-card shadow-token-md">
      <CardContent className="flex flex-col gap-4 p-6">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Ingår i {plan.name}</p>
        <h2 className="text-xl font-bold">{text}</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          {plan.name} kostar {plan.price} {plan.period}. Du kan fortsätta skriva i Manualen på Gratis.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/installningar">Välj paket</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/manual">
              Öppna manualen
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
