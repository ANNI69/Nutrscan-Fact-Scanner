"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

export default function SafeImage(props: ImageProps & { fallbackSrc?: string }) {
  const { src, alt, fallbackSrc = "/no-image.webp", ...rest } = props as any;
  const [currentSrc, setCurrentSrc] = useState<string>(typeof src === "string" ? src : String(src));
  return (
    <Image
      {...rest}
      src={currentSrc}
      alt={alt}
      onError={() => {
        if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc);
      }}
    />
  );
}


