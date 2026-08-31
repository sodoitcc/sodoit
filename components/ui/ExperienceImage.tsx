import Image from "next/image";

interface ExperienceImageProps {
  imageUrl: string | null;
  imageAlt: string | null;
  title: string;
  fallbackColor: string;
  className?: string;
  sizes?: string;
  quality?: number;
  priority?: boolean;
}

export function ExperienceImage({
  imageUrl,
  imageAlt,
  title,
  fallbackColor,
  className = "",
  sizes = "56px",
  quality = 75,
  priority = false,
}: ExperienceImageProps) {
  if (!imageUrl) {
    return (
      <span
        aria-hidden="true"
        className={`block ${className}`}
        style={{ backgroundColor: fallbackColor }}
      />
    );
  }

  return (
    <span className={`relative block overflow-hidden ${className}`}>
      <Image
        src={imageUrl}
        alt={imageAlt ?? title}
        fill
        sizes={sizes}
        quality={quality}
        priority={priority}
        className="object-cover"
      />
    </span>
  );
}
