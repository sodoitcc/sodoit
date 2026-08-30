import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RecategorizeTable } from "@/components/admin/recategorize/RecategorizeTable";
import { loadRecategorizeData } from "@/lib/admin/recategorize/queries";

export default async function RecategorizeExperiencesPage() {
  const { rows, categories } = await loadRecategorizeData();

  return (
    <div>
      <AdminPageHeader
        title="Recategorize experiences"
        description="Review deterministic taxonomy proposals and apply them to existing Experiences."
      />
      <RecategorizeTable rows={rows} categories={categories} />
    </div>
  );
}
