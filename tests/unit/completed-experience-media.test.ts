import { describe, expect, it } from "vitest";
import { resolveCompletedExperienceMedia } from "../../components/feed/completed-experience-media";

describe("resolveCompletedExperienceMedia", () => {
  it("resolves the canonical Experience image when no completion photo exists", () => {
    const media = resolveCompletedExperienceMedia({
      imageUrl: "https://cdn.example/experience.jpg",
      imageAlt: "Experience photo",
    });

    expect(media).toEqual({
      imageUrl: "https://cdn.example/experience.jpg",
      imageAlt: "Experience photo",
    });
  });

  it("is ready for a future completion photo to override the canonical image", () => {
    const media = resolveCompletedExperienceMedia(
      { imageUrl: "https://cdn.example/experience.jpg", imageAlt: "Canonical" },
      {
        imageUrl: "https://cdn.example/completion.jpg",
        imageAlt: "User photo",
      },
    );

    expect(media).toEqual({
      imageUrl: "https://cdn.example/completion.jpg",
      imageAlt: "User photo",
    });
  });

  it("falls back to the canonical experience alt text when the completion photo has none", () => {
    const media = resolveCompletedExperienceMedia(
      { imageUrl: "https://cdn.example/experience.jpg", imageAlt: "Canonical" },
      { imageUrl: "https://cdn.example/completion.jpg", imageAlt: null },
    );

    expect(media.imageAlt).toBe("Canonical");
  });

  it("ignores a completion photo with no imageUrl and falls back to canonical", () => {
    const media = resolveCompletedExperienceMedia(
      { imageUrl: "https://cdn.example/experience.jpg", imageAlt: "Canonical" },
      { imageUrl: null, imageAlt: "Ignored" },
    );

    expect(media.imageUrl).toBe("https://cdn.example/experience.jpg");
  });

  it("leaves both null so ExperienceImage's own branded fallback takes over", () => {
    const media = resolveCompletedExperienceMedia({
      imageUrl: null,
      imageAlt: null,
    });

    expect(media).toEqual({ imageUrl: null, imageAlt: null });
  });
});
