import Image from "next/image";

import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex h-11 w-11 items-center justify-center",
        className,
      )}
    >
      <Image
        alt=""
        className="h-full w-full object-contain drop-shadow-lg"
        height={46}
        src="/images/brand/cleanscape-mark.png"
        width={50}
      />
    </span>
  );
}
