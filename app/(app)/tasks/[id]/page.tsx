import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronLeft } from "lucide-react";

import { ExperienceMeta } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getDifficulty, getTaskMeta } from "@/app/(app)/browse/types";
import type { ListStatus } from "@/app/(app)/browse/types";
import type { ExperienceLocationType } from "@/lib/experiences/types";

import { ExperienceDetailHero } from "./ExperienceDetailHero";

interface TaskRow {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  difficulty: string | null;
  image_url: string | null;
  image_alt: string | null;
  location_type: ExperienceLocationType;
  city: string | null;
  country_code: string | null;
  saved_count: number;
}

interface SimilarExperience {
  id: string;
  title: string;
  category: string | null;
  difficulty: string | null;
}

const PRACTICAL_TIPS: readonly string[] = [
  "Block a fixed time on your calendar instead of waiting for motivation.",
  "Tell a friend you're doing this - accountability makes it stick.",
  "Break it into one small first step you can do today.",
  "Take a photo when you finish. It's optional, but future-you will thank you.",
];

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: task } = await supabase
    .from("experiences")
    .select(
      [
        "id",
        "title",
        "category",
        "description",
        "difficulty",
        "image_url",
        "image_alt",
        "location_type",
        "city",
        "country_code",
        "saved_count",
      ].join(", "),
    )
    .eq("id", id)
    .single<TaskRow>();

  if (!task) {
    notFound();
  }

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
        .eq("experience_id", id)
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
        .select("id, title, category, difficulty")
        .eq("is_public", true)
        .eq("category", task.category)
        .neq("id", task.id)
        .limit(3)
    : { data: [] as SimilarExperience[] };

  const { thumbnail } = getTaskMeta(task.id);
  const difficulty = getDifficulty(task.id, task.difficulty);

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 pb-12 pt-4 sm:px-6 lg:px-8">
      <Link
        href="/"
        className={[
          "inline-flex items-center gap-1 text-sm font-semibold text-muted",
          "transition-colors hover:text-ink",
          "rounded-control outline-none",
          "focus-visible:ring-2 focus-visible:ring-accent/30",
        ].join(" ")}
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        Back to Browse
      </Link>

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

      <div className="mt-12 max-w-4xl">
        <section>
          <h2 className="text-lg font-extrabold tracking-[-0.02em] text-ink">
            About this experience
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-secondary sm:text-base">
            {task.description ||
              "No description yet — just a good idea worth doing."}
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-extrabold tracking-[-0.02em] text-ink">
            Practical tips
          </h2>

          <ul className="mt-4 flex max-w-3xl flex-col gap-3">
            {PRACTICAL_TIPS.map((tip) => (
              <li
                key={tip}
                className="flex items-start gap-3 text-sm leading-6 text-secondary"
              >
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                />

                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        {similar && similar.length > 0 && (
          <section className="mt-10">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-extrabold tracking-[-0.02em] text-ink">
                Related experiences
              </h2>
            </div>

            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {similar.map((item) => {
                const itemDifficulty = getDifficulty(item.id, item.difficulty);

                return (
                  <li key={item.id}>
                    <Link
                      href={`/tasks/${item.id}`}
                      className={[
                        "flex h-full flex-col gap-2 rounded-card border border-border bg-surface p-3.5",
                        "transition-colors hover:border-border-strong",
                        "outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                      ].join(" ")}
                    >
                      <p className="line-clamp-2 text-sm font-semibold leading-5 text-ink">
                        {item.title}
                      </p>

                      <ExperienceMeta
                        className="mt-auto"
                        category={item.category}
                        difficulty={itemDifficulty.label}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
