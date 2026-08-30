import { notFound, permanentRedirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getExperienceHref } from "@/lib/experiences/href";
import { UUID_RE } from "@/lib/validation";

export default async function LegacyTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: experience } = await supabase
    .from("experiences")
    .select("slug")
    .eq("id", id)
    .eq("is_public", true)
    .maybeSingle<{ slug: string }>();

  if (!experience) {
    notFound();
  }

  permanentRedirect(getExperienceHref(experience));
}
