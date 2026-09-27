"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import { ClipReveal } from "@/components/motion/ClipReveal";
import { ParallaxMedia } from "@/components/motion/ParallaxMedia";

export type ArticleGalleryImage = {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
};

export function ArticleImageGallery({ images }: { images: ArticleGalleryImage[] }) {
  const [index, setIndex] = useState(-1);

  return <>
    <section className="article-end-gallery" aria-label="Συλλογή εικόνων άρθρου">
      {images.map((image, imageIndex) => <figure key={`${image.id}-${imageIndex}`} className="article-image article-image--gallery">
        <button type="button" className="article-gallery__button" onClick={() => setIndex(imageIndex)} aria-label={`Προβολή πλήρους εικόνας: ${image.alt}`}>
          <ClipReveal className="article-image__reveal"><ParallaxMedia className="article-image__parallax"><Image src={image.src} alt={image.alt} width={image.width} height={image.height} unoptimized sizes="(min-width: 900px) 33vw, (min-width: 701px) 50vw, 100vw" /></ParallaxMedia></ClipReveal>
        </button>
        {image.caption ? <figcaption>{image.caption}</figcaption> : null}
      </figure>)}
    </section>
    <Lightbox open={index >= 0} index={Math.max(index, 0)} close={() => setIndex(-1)}
      slides={images.map((image) => ({ src: image.src, alt: image.alt, width: image.width, height: image.height }))}
      carousel={{ finite: images.length <= 1 }} controller={{ closeOnBackdropClick: true }} />
  </>;
}
