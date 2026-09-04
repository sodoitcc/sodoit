import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { GuideForm } from "@/components/admin/guides/GuideForm";
import { GuideItemsEditor } from "@/components/admin/guides/GuideItemsEditor";
import { GuideComparisonsEditor } from "@/components/admin/guides/GuideComparisonsEditor";
import { getGuideAdmin } from "@/lib/admin/guides/queries";
import { getGuideRenderer } from "@/lib/guides/types";
import { UUID_RE } from "@/lib/validation";

interface EditGuidePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditGuidePage({ params }: EditGuidePageProps) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const guide = await getGuideAdmin(id);
  if (!guide) notFound();

  const renderer = getGuideRenderer(guide.type);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <AdminPageHeader
          title={guide.title}
          description={guide.is_public ? "Published guide." : "Hidden guide."}
        />
        <GuideForm guide={guide} />
      </div>

      <div className="border-t border-border pt-8">
        {renderer === "comparison" ? (
          <GuideComparisonsEditor
            guideId={guide.id}
            comparisons={guide.comparisons ?? []}
          />
        ) : (
          <GuideItemsEditor guideId={guide.id} items={guide.items} />
        )}
      </div>
    </div>
  );
}
