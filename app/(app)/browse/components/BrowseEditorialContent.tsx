import { BrowseSignupCta } from "./BrowseSignupCta";
import { ExperienceFeature } from "./ExperienceFeature";
import { ExperienceSection } from "./ExperienceSection";

import type { Experience } from "../types";
import type { CuratedSection } from "../data";

interface BrowseEditorialContentProps {
  featured: Experience | null;
  curatedSections: CuratedSection[];
  completed: Set<string>;
  saved: Set<string>;
  onSave: (id: string) => Promise<void>;
  onRemoveSaved: (id: string) => Promise<void>;
  signedIn: boolean;
  onToggle: (id: string) => Promise<void>;
  onGuestSave: () => void;
}

export function BrowseEditorialContent({
  featured,
  curatedSections,
  completed,
  saved,
  onSave,
  onRemoveSaved,
  signedIn,
  onToggle,
  onGuestSave,
}: BrowseEditorialContentProps) {
  return (
    <>
      {featured && (
        <div
          className={[
            "mb-8 grid gap-4",
            !signedIn &&
              "lg:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)] lg:auto-rows-[320px]",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <ExperienceFeature
            experience={featured}
            done={completed.has(featured.id)}
            onToggle={() => onToggle(featured.id)}
            guest={!signedIn}
            onGuestSave={onGuestSave}
          />

          {!signedIn && <BrowseSignupCta featured />}
        </div>
      )}

      {curatedSections.map((section, index) => (
        <ExperienceSection
          key={section.title}
          title={section.title}
          experiences={section.items}
          completed={completed}
          onToggle={onToggle}
          saved={saved}
          onSave={onSave}
          onRemoveSaved={onRemoveSaved}
          guest={!signedIn}
          onGuestSave={onGuestSave}
          variant={index === 0 ? "wide" : "standard"}
          viewAllHref={`/?category=${encodeURIComponent(section.category)}`}
        />
      ))}
    </>
  );
}
