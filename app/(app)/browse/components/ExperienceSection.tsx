import Link from "next/link";
import type { Experience } from "../types";
import { ExperienceCard } from "./ExperienceCard";

export type SectionVariant = "wide" | "standard";

const VARIANT_COUNT: Record<SectionVariant, number> = {
  wide: 2,
  standard: 3,
};

function spanClassName(variant: SectionVariant, index: number, total: number) {
  const lgSpan = variant === "wide" ? "lg:col-span-6" : "lg:col-span-4";
  const isTrailingOdd = total % 2 === 1 && index === total - 1;

  return isTrailingOdd ? `sm:col-span-2 ${lgSpan}` : lgSpan;
}

interface ExperienceSectionProps {
  title: string;
  experiences: Experience[];
  completed: Set<string>;
  onToggle: (id: string) => Promise<void>;
  saved: Set<string>;
  onSave: (id: string) => Promise<void>;
  onRemoveSaved: (id: string) => Promise<void>;
  guest: boolean;
  onGuestSave: () => void;
  variant: SectionVariant;
  viewAllHref?: string;
}

export function ExperienceSection({
  title,
  experiences,
  completed,
  onToggle,
  saved,
  onSave,
  onRemoveSaved,
  guest,
  onGuestSave,
  variant,
  viewAllHref,
}: ExperienceSectionProps) {
  const items = experiences.slice(0, VARIANT_COUNT[variant]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-bold tracking-[-0.01em] text-ink">
          {title}
        </h2>

        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs font-semibold text-accent-dark hover:text-accent"
          >
            View all →
          </Link>
        )}
      </div>

      <ul className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-12">
        {items.map((experience, index) => (
          <ExperienceCard
            key={experience.id}
            experience={experience}
            done={completed.has(experience.id)}
            onToggle={() => onToggle(experience.id)}
            saved={saved.has(experience.id)}
            onSave={() => onSave(experience.id)}
            onRemoveSaved={() => onRemoveSaved(experience.id)}
            guest={guest}
            onGuestSave={onGuestSave}
            className={spanClassName(variant, index, items.length)}
            ratio={variant}
            showCategory={false}
          />
        ))}
      </ul>
    </section>
  );
}
