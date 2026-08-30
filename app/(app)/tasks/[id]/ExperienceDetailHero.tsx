import { ExperienceImage } from "@/components/ui";
import { experienceLocation } from "@/components/ui";
import { ExperienceMetaLine } from "@/app/(app)/browse/components/ExperienceMetaLine";
import { ExperienceSocialProof } from "@/app/(app)/browse/components/ExperienceSocialProof";

import type { ListStatus } from "@/app/(app)/browse/types";
import type { ExperienceLocationType } from "@/lib/experiences/types";
import { ExperienceDetailActions } from "./ExperienceDetailActions";

interface ExperienceDetailHeroProps {
  experience: {
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
  };
  fallbackColor: string;
  difficulty: string;
  initialStatus: ListStatus | null;
  signedIn: boolean;
  totalCompleted: number;
}

export function ExperienceDetailHero({
  experience,
  fallbackColor,
  difficulty,
  initialStatus,
  signedIn,
  totalCompleted,
}: ExperienceDetailHeroProps) {
  const location = experienceLocation(experience);

  return (
    <section className="grid items-stretch gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
      <div className="min-w-0">
        <ExperienceImage
          title={experience.title}
          imageUrl={experience.image_url}
          imageAlt={experience.image_alt}
          fallbackColor={fallbackColor}
          className="aspect-[16/10] w-full rounded-media"
          sizes="(min-width: 1440px) 820px, (min-width: 1024px) 58vw, 100vw"
          priority
        />
      </div>

      <div className="flex min-w-0 flex-col justify-center py-1 lg:py-6">
        <ExperienceMetaLine
          location={location}
          difficulty={difficulty}
          category={experience.category}
          size="sm"
        />

        <h1 className="mt-4 max-w-[620px] text-[34px] font-extrabold leading-[1.02] tracking-[-0.04em] text-ink sm:text-[42px] lg:text-[48px]">
          {experience.title}
        </h1>

        <ExperienceSocialProof
          savedCount={experience.saved_count}
          variant="full"
          className="mt-5 text-sm"
        />

        <div className="mt-7">
          <ExperienceDetailActions
            taskId={experience.id}
            taskTitle={experience.title}
            initialStatus={initialStatus}
            signedIn={signedIn}
            totalCompleted={totalCompleted}
          />
        </div>
      </div>
    </section>
  );
}
