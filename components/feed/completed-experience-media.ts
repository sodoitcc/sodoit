export interface ExperienceMediaSource {
  imageUrl: string | null;
  imageAlt: string | null;
}

export function resolveCompletedExperienceMedia(
  experience: ExperienceMediaSource,
  completionPhoto?: ExperienceMediaSource | null,
): ExperienceMediaSource {
  if (completionPhoto?.imageUrl) {
    return {
      imageUrl: completionPhoto.imageUrl,
      imageAlt: completionPhoto.imageAlt ?? experience.imageAlt,
    };
  }

  return experience;
}
