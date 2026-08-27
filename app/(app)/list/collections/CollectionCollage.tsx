import Image from "next/image";
import { Bookmark } from "lucide-react";

interface TileProps {
  src: string;
  className?: string;
  sizes?: string;
}

function Tile({ src, className = "", sizes = "240px" }: TileProps) {
  return (
    <div className={`relative bg-surface-subtle ${className}`}>
      <Image src={src} alt="" fill sizes={sizes} className="object-cover" />
    </div>
  );
}

export function EmptyCollectionCover({
  iconClassName = "h-11 w-11",
}: {
  iconClassName?: string;
}) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-accent-wash">
      <div
        className={`flex items-center justify-center rounded-full bg-surface text-accent-dark shadow-sm ${iconClassName}`}
      >
        <Bookmark aria-hidden="true" className="h-5 w-5" />
      </div>
    </div>
  );
}

interface CollectionCollageProps {
  images: string[];
  sizes?: string;
}

export function CollectionCollage({ images, sizes }: CollectionCollageProps) {
  if (images.length === 0) {
    return <EmptyCollectionCover />;
  }

  if (images.length === 1) {
    return <Tile src={images[0]} className="h-full w-full" sizes={sizes} />;
  }

  if (images.length === 2) {
    return (
      <div className="grid h-full w-full grid-cols-2 gap-0.5">
        {images.map((src, index) => (
          <Tile
            key={`${src}-${index}`}
            src={src}
            className="h-full w-full"
            sizes={sizes}
          />
        ))}
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5">
        <Tile
          src={images[0]}
          className="row-span-2 h-full w-full"
          sizes={sizes}
        />
        <Tile src={images[1]} className="h-full w-full" sizes={sizes} />
        <Tile src={images[2]} className="h-full w-full" sizes={sizes} />
      </div>
    );
  }

  return (
    <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5">
      {images.slice(0, 4).map((src, index) => (
        <Tile
          key={`${src}-${index}`}
          src={src}
          className="h-full w-full"
          sizes={sizes}
        />
      ))}
    </div>
  );
}
