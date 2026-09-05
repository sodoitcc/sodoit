import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminLinkButton } from "@/components/admin/AdminLinkButton";
import { TagTable } from "@/components/admin/tags/TagTable";
import { listTagsAdmin } from "@/lib/admin/tags/queries";

export default async function AdminTagsPage() {
  const tags = await listTagsAdmin();

  return (
    <div>
      <AdminPageHeader
        title="Tags"
        description="Manage the controlled Tick tag vocabulary."
        actions={
          <AdminLinkButton href="/admin/tags/new">New tag</AdminLinkButton>
        }
      />
      <TagTable tags={tags} />
    </div>
  );
}
