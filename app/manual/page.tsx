import { AppLayout } from "@/components/layout/app-layout";
import { navigation } from "@/components/layout/navigation";
import { ManualWorkspace } from "@/components/manual/manual-workspace";

export default function ManualPage() {
  return (
    <AppLayout contentClassName="p-0 sm:p-0 lg:p-0" navigation={navigation}>
      <ManualWorkspace />
    </AppLayout>
  );
}
