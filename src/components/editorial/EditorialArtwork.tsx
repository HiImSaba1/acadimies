import Image from "next/image";
import { ParallaxMedia } from "@/components/motion/ParallaxMedia";

export type ArtworkVariant = "pitch" | "strategy" | "portrait" | "tournament";

export const artworkSources: Record<ArtworkVariant, string> = {
  pitch: "/webp/1.webp",
  strategy: "/webp/4.webp",
  portrait: "/webp/5.webp",
  tournament: "/webp/7.webp",
};

export function EditorialArtwork({ variant, label, priority = false, source }: { variant: ArtworkVariant; label: string; priority?: boolean; source?: string }) {
  return (
    <div className={`editorial-art editorial-art--${variant}`} data-priority={priority ? "true" : undefined}>
      <ParallaxMedia className="editorial-art__parallax">
        <Image
          src={source ?? artworkSources[variant]}
          alt={label}
          fill
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          sizes={priority ? "100vw" : "(max-width: 760px) 100vw, (max-width: 1080px) 50vw, 33vw"}
          className="editorial-art__image"
          unoptimized={Boolean(source)}
        />
      </ParallaxMedia>
    </div>
  );
}
