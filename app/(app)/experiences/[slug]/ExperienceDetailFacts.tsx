import { Clock3, MapPin, Timer } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Fact {
  label: string;
  value: string;
  icon: LucideIcon;
}

interface ExperienceDetailFactsProps {
  bestTime: string | null;
  durationText: string | null;
  locationNote: string | null;
}

export function ExperienceDetailFacts({
  bestTime,
  durationText,
  locationNote,
}: ExperienceDetailFactsProps) {
  const facts: Fact[] = [
    bestTime
      ? {
          label: "Best time to go",
          value: bestTime,
          icon: Clock3,
        }
      : null,
    durationText
      ? {
          label: "Time needed",
          value: durationText,
          icon: Timer,
        }
      : null,
    locationNote
      ? {
          label: "Where",
          value: locationNote,
          icon: MapPin,
        }
      : null,
  ].filter((fact): fact is Fact => fact !== null);

  if (facts.length === 0) {
    return null;
  }

  return (
    <dl
      className={[
        "grid gap-6 border-y border-border py-6",
        facts.length === 1
          ? "grid-cols-1"
          : facts.length === 2
            ? "sm:grid-cols-2"
            : "sm:grid-cols-3",
      ].join(" ")}
    >
      {facts.map((fact) => {
        const Icon = fact.icon;

        return (
          <div key={fact.label} className="flex min-w-0 items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-wash">
              <Icon
                aria-hidden="true"
                className="h-[18px] w-[18px] text-accent"
              />
            </div>

            <div className="min-w-0">
              <dt className="text-xs font-bold text-ink">{fact.label}</dt>

              <dd className="mt-1 text-sm leading-6 text-secondary">
                {fact.value}
              </dd>
            </div>
          </div>
        );
      })}
    </dl>
  );
}
