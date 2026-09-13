import { ManualWorkspace } from "@/components/manual/manual-workspace";

export default async function ManualPage({
  searchParams,
}: {
  searchParams: Promise<{ blad?: string }>;
}) {
  const params = await searchParams;
  return <ManualWorkspace openDocumentId={params.blad ?? null} />;
}
