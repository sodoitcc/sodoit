import type { Experience } from "@/lib/experiences/types";
import { Badge } from "./Badge";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

function countryName(code: string | null): string | null {
  if (!code) return null;
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export type ExperienceLocationFields = Pick<
  Experience,
  "location_type" | "city" | "country_code"
>;

export function experienceLocation(
  experience: ExperienceLocationFields,
): string | null {
  if (experience.location_type === "city") {
    const country = countryName(experience.country_code);
    if (experience.city && country) return `${experience.city}, ${country}`;
    return experience.city ?? country;
  }
  if (experience.location_type === "country") {
    return countryName(experience.country_code);
  }
  return null;
}

interface ExperienceMetaProps {
  category: string | null;
  difficulty: string;
  location?: string | null;
  dimmed?: boolean;
  className?: string;
}

export function ExperienceMeta({
  category,
  difficulty,
  location,
  dimmed = false,
  className = "",
}: ExperienceMetaProps) {
  return (
    <div
      className={[
        "flex flex-wrap items-center gap-x-2 gap-y-1",
        dimmed ? "opacity-60" : "",
        className,
      ].join(" ")}
    >
      {category && <Badge variant="muted">{category}</Badge>}

      <span className="text-[11px] font-semibold text-muted">{difficulty}</span>

      {location && (
        <>
          <span aria-hidden="true" className="text-[11px] text-border-strong">
            •
          </span>
          <span className="truncate text-[11px] font-semibold text-muted">
            {location}
          </span>
        </>
      )}
    </div>
  );
}
