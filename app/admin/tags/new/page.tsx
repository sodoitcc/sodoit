import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TagForm } from "@/components/admin/tags/TagForm";

export default function NewTagPage() {
  return (
    <div>
      <AdminPageHeader
        title="New tag"
        description="Create a new Experience tag."
      />
      <TagForm />
    </div>
  );
}
