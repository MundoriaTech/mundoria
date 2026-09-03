import Image, { type ImageProps } from "next/image";

type LazyImageProps = Omit<ImageProps, "loading" | "priority"> & {
  /** Set true only for above-the-fold LCP images (hero, logo in nav). */
  priority?: boolean;
};

/** Next.js Image with explicit lazy-loading defaults for below-the-fold media. */
export function LazyImage({ priority = false, ...props }: LazyImageProps) {
  return <Image loading={priority ? undefined : "lazy"} priority={priority} {...props} />;
}
