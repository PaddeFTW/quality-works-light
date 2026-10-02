"use client";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PLANS, type PlanId } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

export function PlanGrid({
  current,
  onChoose,
  choosing,
}: {
  current?: PlanId | null;
  onChoose?: (id: PlanId) => void;
  choosing?: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {PLANS.map((plan) => {
        const active = current === plan.id;
        return (
          <Card
            className={cn(
              "h-full shadow-token-md",
              plan.featured ? "border-primary/40 bg-gradient-to-br from-secondary to-card" : "bg-card",
              active && "ring-2 ring-primary",
            )}
            key={plan.id}
          >
            <CardContent className="flex h-full flex-col gap-4 p-5">
              {plan.featured ? (
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Mest valt</p>
              ) : (
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{plan.name}</p>
              )}
              <div>
                <p className="text-lg font-bold">{plan.name}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">
                  {plan.price}
                  <span className="ml-1 text-sm font-medium text-muted-foreground">{plan.period}</span>
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{plan.blurb}</p>
              </div>
              <ul className="flex flex-col gap-2 text-sm">
                {plan.includes.map((item) => (
                  <li className="flex items-start gap-2" key={item}>
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {onChoose ? (
                <Button
                  className="mt-auto"
                  disabled={choosing || active}
                  onClick={() => onChoose(plan.id)}
                  type="button"
                  variant={plan.featured ? "default" : "outline"}
                >
                  {active ? "Nuvarande" : plan.id === "gratis" ? "Använd gratis" : `Välj ${plan.name}`}
                </Button>
              ) : (
                <Button asChild className="mt-auto" variant={plan.featured ? "default" : "outline"}>
                  <a href={plan.id === "gratis" ? "/skapa-konto" : `/skapa-konto?paket=${plan.id}`}>
                    {plan.id === "gratis" ? "Börja gratis" : `Börja med ${plan.name}`}
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
