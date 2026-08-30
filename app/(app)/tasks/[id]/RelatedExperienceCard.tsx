"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { ExperienceCard } from "@/app/(app)/browse/components/ExperienceCard";
import {
  removeFromMyList,
  setListStatus,
  toggleCompletion,
} from "@/app/(app)/browse/actions";
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
  const saved = status === "saved";
  const done = status === "completed";

  function requireLogin() {
    router.push(loginHrefWithNext(pathname));
  }

  async function toggleComplete() {
    const wasDone = done;
    const previous = status;
    setStatus(wasDone ? "saved" : "completed");

    try {
      await toggleCompletion(experience.id, wasDone);
    } catch (error) {
      setStatus(previous);
      throw error;
    }
  }

  async function save() {
    const previous = status;
    setStatus("saved");

    try {
      await setListStatus(experience.id, "saved");
    } catch (error) {
      setStatus(previous);
      throw error;
    }
  }

  async function removeSaved() {
    const previous = status;
    setStatus(null);

    try {
      await removeFromMyList(experience.id);
    } catch (error) {
      setStatus(previous);
      throw error;
    }
  }

  return (
    <ExperienceCard
      experience={experience}
      done={done}
      onToggle={toggleComplete}
      saved={saved}
      onSave={save}
      onRemoveSaved={removeSaved}
      guest={!signedIn}
      onGuestSave={requireLogin}
      variant="related"
      showCategory={false}
    />
  );
}
