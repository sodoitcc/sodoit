"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { ExperienceCard } from "@/app/(app)/browse/components/ExperienceCard";
import { removeFromMyList, setListStatus } from "@/app/(app)/browse/actions";
import { loginHrefWithNext } from "@/lib/auth-redirect";
import type { ExperienceCardData, ListStatus } from "@/app/(app)/browse/types";

interface RelatedExperienceCardProps {
  experience: ExperienceCardData;
  initialStatus: ListStatus | null;
  signedIn: boolean;
}

export function RelatedExperienceCard({
  experience,
  initialStatus,
  signedIn,
}: RelatedExperienceCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState(initialStatus);
  const done = status === "completed";

  function requireLogin() {
    router.push(loginHrefWithNext(pathname));
  }

  async function toggle() {
    const wasDone = done;
    setStatus(wasDone ? null : "completed");

    try {
      if (wasDone) {
        await removeFromMyList(experience.id);
      } else {
        await setListStatus(experience.id, "completed");
      }
    } catch (error) {
      setStatus(wasDone ? "completed" : null);
      throw error;
    }
  }

  return (
    <ExperienceCard
      experience={experience}
      done={done}
      onToggle={toggle}
      guest={!signedIn}
      onGuestSave={requireLogin}
      variant="related"
      showCategory={false}
    />
  );
}
