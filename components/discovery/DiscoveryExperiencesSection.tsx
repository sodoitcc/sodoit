import Image from "next/image";
import Link from "next/link";
import type { Experience } from "@/lib/experiences/types";
import { getExperienceHref } from "@/lib/experiences/href";

export function DiscoveryExperiencesSection({
  experiences,
}: {
  experiences: Experience[];
}) {
  if (experiences.length === 0) return null;

  return (
    <section>
      <div className="mb-4">
        <h2 className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
          Experiences worth trying
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {experiences.map((experience) => (
          <Link
            key={experience.id}
            href={getExperienceHref(experience)}
            className="group block h-full rounded-card outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4"
          >
            <article className="flex h-full flex-col">
              <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-media bg-accent-wash">
                {experience.image_url && (
                  <Image
                    src={experience.image_url}
                    alt={experience.image_alt ?? experience.title}
                    fill
                    sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
                  />
                )}
              </span>

              <div className="flex flex-1 flex-col pt-3.5">
                {experience.category && (
                  <span className="text-xs font-semibold text-accent-dark">
                    {experience.category}
                  </span>
                )}

                <h3 className="mt-1.5 text-base font-extrabold leading-snug tracking-[-0.01em] text-ink transition-colors group-hover:text-accent-dark">
                  {experience.title}
                </h3>

                {experience.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-secondary">
                    {experience.description}
                  </p>
                )}
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
