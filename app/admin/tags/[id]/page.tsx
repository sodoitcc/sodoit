import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TagForm } from "@/components/admin/tags/TagForm";
import { getTagAdmin } from "@/lib/admin/tags/queries";
import { UUID_RE } from "@/lib/validation";

interface EditTagPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTagPage({ params }: EditTagPageProps) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const tag = await getTagAdmin(id);
  if (!tag) notFound();

  return (
    <div>
      <AdminPageHeader
        title={tag.name}
        description={tag.is_active ? "Active tag." : "Inactive tag."}
      />
      <TagForm tag={tag} />
    </div>
  );
}
