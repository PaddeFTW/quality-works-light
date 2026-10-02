import { AppLayout } from "@/components/layout/app-layout";
import { navigation } from "@/components/layout/navigation";
import { ManualWorkspace } from "@/components/manual/manual-workspace";

export default async function ManualPage({
  searchParams,
}: {
  searchParams: Promise<{ blad?: string }>;
}) {
  const params = await searchParams;
  return (
    <AppLayout contentClassName="flex flex-col overflow-hidden p-0 pb-14 lg:pb-0" navigation={navigation}>
      <ManualWorkspace embedded openDocumentId={params.blad ?? null} />
    </AppLayout>
  );
}
