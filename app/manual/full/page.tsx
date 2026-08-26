import Link from "next/link";

import { ManualWorkspace } from "@/components/manual/manual-workspace";
import { Button } from "@/components/ui/button";

export default function ManualFullPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <p className="text-sm text-muted-foreground">
          Manual · helsida
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/manual">Tillbaka till arbetsytan</Link>
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <ManualWorkspace initialView="full" />
      </div>
    </div>
  );
}
