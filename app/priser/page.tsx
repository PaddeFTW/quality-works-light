import Link from "next/link";

import { PlanGrid } from "@/components/billing/plan-grid";
import { BrandMark } from "@/components/brand/brand-mark";

export default function PriserPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <Link className="flex items-center gap-2 font-bold" href="/login">
          <BrandMark markClassName="size-8" />
          Quality Works Light
        </Link>
        <Link className="text-sm font-semibold text-primary hover:underline" href="/login">
          Logga in
        </Link>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-16 pt-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight">Ett paket per företag</h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Börja gratis med Manualen. Betala när ni behöver fler personer, avvikelser och revision.
            Priset är per år, per företag – inte per klick.
          </p>
        </div>
        <PlanGrid />
        <p className="text-sm text-muted-foreground">
          Betalning i programmet kommer snart. Tills dess väljer du paket inne i Inställningar, eller mejlar oss efter att du skapat konto.
        </p>
      </main>
    </div>
  );
}
