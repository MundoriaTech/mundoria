"use client";

import Image from "next/image";

import type { CleanerHeroMoment } from "@/lib/avatars/hero-poses";

export function CleanerHeroStage({
  moment,
  src,
}: {
  moment: CleanerHeroMoment;
  src: string;
}) {
  return (
    <div className="relative h-[15.5rem] sm:h-[19rem] lg:h-[21rem]" data-moment={moment}>
      <Image
        alt=""
        aria-hidden
        className="object-contain object-bottom select-none"
        fill
        priority
        sizes="(max-width: 640px) 140px, 320px"
        src={src}
      />
    </div>
  );
}
