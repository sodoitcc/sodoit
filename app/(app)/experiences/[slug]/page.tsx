import Link from "next/link";
import { notFound } from "next/navigation";
import { MoveRight, Sparkles } from "lucide-react";
import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { getDifficulty, getTaskMeta } from "@/app/(app)/browse/types";
import type { ListStatus } from "@/app/(app)/browse/types";
import type { ExperienceCardData } from "@/app/(app)/browse/types";
import { SITE_URL } from "@/lib/site";
import { isValidPublicImageUrl } from "@/lib/seo/image";

import { ExperienceDetailHero } from "./ExperienceDetailHero";
import { ExperienceDetailFacts } from "./ExperienceDetailFacts";
import { RelatedExperienceCard } from "./RelatedExperienceCard";
import { loadExperienceBySlug } from "./data";
import { ScrollToTop } from "./ScrollToTop";
import { ExperienceBackButton } from "./ExperienceBackButton";

type SimilarExperience = ExperienceCardData;

const SIMILAR_COLUMNS =
  "id, slug, title, image_url, image_alt, difficulty, category, saved_count, location_type, city, country_code";

function fallbackDescription(title: string, category: string | null) {
  return category
    ? `${title} — a ${category.toLowerCase()} experience on Sodoit.`
    : `${title} — discover it on Sodoit.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const experience = await loadExperienceBySlug(slug);

  if (!experience) return {};

  const description =
    experience.description ||
    experience.why_it_matters ||
    fallbackDescription(experience.title, experience.category);

  const canonical = `${SITE_URL}/experiences/${experience.slug}`;
  const hasImage = isValidPublicImageUrl(experience.image_url);

  return {
    title: experience.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: experience.title,
      description,
      url: canonical,
      images: hasImage
        ? [
            {
              url: experience.image_url as string,
              alt: experience.image_alt || experience.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: hasImage ? "summary_large_image" : "summary",
      title: experience.title,
      description,
      images: hasImage ? [experience.image_url as string] : undefined,
    },
  };
}

export default async function ExperienceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const task = await loadExperienceBySlug(slug);

  if (!task) {
    notFound();
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let status: ListStatus | null = null;
  let totalCompleted = 0;

  if (user) {
    const [{ data: mine }, { count }] = await Promise.all([
      supabase
        .from("user_lists")
        .select("status")
        .eq("user_id", user.id)
        .eq("experience_id", task.id)
        .maybeSingle<{ status: ListStatus }>(),
      supabase
        .from("user_lists")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed"),
    ]);

    status = mine?.status ?? null;
    totalCompleted = count ?? 0;
  }

  const { data: similar } = task.category
    ? await supabase
        .from("experiences")
        .select(SIMILAR_COLUMNS)
        .eq("is_public", true)
        .eq("category", task.category)
        .neq("id", task.id)
        .limit(4)
    : { data: [] as SimilarExperience[] };

  const similarExperiences: SimilarExperience[] = similar ?? [];

  let similarStatuses: Record<string, ListStatus> = {};

  if (user && similarExperiences.length > 0) {
    const { data: statusRows } = await supabase
      .from("user_lists")
      .select("experience_id, status")
      .eq("user_id", user.id)
      .in(
        "experience_id",
        similarExperiences.map((item) => item.id),
      );

    similarStatuses = Object.fromEntries(
      (statusRows ?? []).map((row) => [
        row.experience_id,
        row.status as ListStatus,
      ]),
    );
  }

  const { thumbnail } = getTaskMeta(task.id);
  const difficulty = getDifficulty(task.id, task.difficulty);

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 pb-14 pt-4 sm:px-6 lg:px-8">
      <ScrollToTop />

      <ExperienceBackButton />

      <div className="mt-4">
        <ExperienceDetailHero
          experience={task}
          fallbackColor={thumbnail}
          difficulty={difficulty.label}
          initialStatus={status}
          signedIn={Boolean(user)}
          totalCompleted={totalCompleted}
        />
      </div>

      <div className="mt-12 max-w-[1120px]">
        <section className="max-w-[780px]">
          <h2 className="text-xl font-extrabold tracking-[-0.025em] text-ink sm:text-2xl">
            About this experience
          </h2>

          {task.description ? (
            <p className="mt-4 text-base leading-8 text-secondary sm:text-[18px]">
              {task.description}
            </p>
          ) : (
            <p className="mt-4 text-base leading-8 text-muted">
              No description yet — just a good idea worth doing.
            </p>
          )}
        </section>

        {task.why_it_matters && (
          <section className="mt-8 max-w-[920px] rounded-[24px] bg-[#FFF9F2] px-5 py-6 sm:px-7 sm:py-7">
            <div className="grid gap-4 sm:grid-cols-[44px_minmax(0,1fr)] sm:gap-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
                <Sparkles aria-hidden="true" className="h-5 w-5 text-accent" />
              </div>

              <div className="max-w-[760px]">
                <h2 className="text-lg font-extrabold tracking-[-0.02em] text-ink sm:text-xl">
                  Why it&rsquo;s worth doing
                </h2>

                <p className="mt-2.5 text-base leading-7 text-secondary sm:text-[17px] sm:leading-8">
                  {task.why_it_matters}
                </p>
              </div>
            </div>
          </section>
        )}

        <div className="mt-8 max-w-[1080px]">
          <ExperienceDetailFacts
            bestTime={task.best_time}
            durationText={task.duration_text}
            locationNote={task.location_note}
          />
        </div>

        {task.what_to_know && task.what_to_know.length > 0 && (
          <section className="mt-10 max-w-[900px]">
            <h2 className="text-xl font-extrabold tracking-[-0.025em] text-ink sm:text-2xl">
              What to know
            </h2>

            <ol className="mt-4">
              {task.what_to_know.map((item, index) => (
                <li
                  key={`${index}-${item}`}
                  className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 border-b border-border py-4 first:pt-1 last:border-b-0"
                >
                  <span className="pt-0.5 text-xs font-extrabold tabular-nums text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <p className="text-[15px] leading-7 text-secondary sm:text-base">
                    {item}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      {similarExperiences.length > 0 && (
        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
                You might also like
              </p>

              <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.025em] text-ink">
                Keep exploring
              </h2>
            </div>

            <Link
              href={`/?category=${encodeURIComponent(task.category ?? "")}`}
              className={[
                "inline-flex items-center gap-1.5 text-sm font-bold text-accent",
                "rounded-control outline-none",
                "hover:text-accent-dark",
                "focus-visible:ring-2 focus-visible:ring-accent/30",
              ].join(" ")}
            >
              View all
              <MoveRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {similarExperiences.map((item) => (
              <RelatedExperienceCard
                key={item.id}
                experience={item}
                initialStatus={similarStatuses[item.id] ?? null}
                signedIn={Boolean(user)}
              />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
