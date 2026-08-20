import { PageHeader } from "@/components/common/page-header";
import { ArshjulOverview } from "@/components/arshjul/arshjul-overview";
import { AppLayout } from "@/components/layout/app-layout";
import { navigation } from "@/components/layout/navigation";


export default function ArshjulPage() {
  return (
    <AppLayout navigation={navigation}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <PageHeader
          description="Planera, följ upp och få koll på årets återkommande aktiviteter."
          eyebrow="Planering"
          title="Årshjul"
        />
        <ArshjulOverview />
      </div>
    </AppLayout>
  );
}
