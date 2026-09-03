import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export const LANDING_LOGO = "/images/marketing/landing/New logo with text.png";

const LOGO_WIDTH = 221;
const LOGO_HEIGHT = 54;
/** Source-pixel split between the coloured mark and the wordmark. */
const LOGO_MARK_WIDTH = 52;
const LOGO_WORDMARK_OFFSET = 56;
const LOGO_WORDMARK_WIDTH = LOGO_WIDTH - LOGO_WORDMARK_OFFSET;

type LandingLogoProps = {
  className?: string;
  href?: string;
  priority?: boolean;
  /** Full logo on light backgrounds; coloured mark + navbar wordmark on dark. */
  variant?: "default" | "onDark";
};

export function LandingLogo({
  className,
  href,
  priority = false,
  variant = "default",
}: LandingLogoProps) {
  const logo =
    variant === "default" ? (
      <Image
        alt="CleanScape"
        className={cn("h-9 w-auto sm:h-11", className)}
        height={LOGO_HEIGHT}
        priority={priority}
        src={LANDING_LOGO}
        width={LOGO_WIDTH}
      />
    ) : (
      <div
        aria-label="CleanScape"
        className={cn("inline-flex h-9 items-center sm:h-11", className)}
        role="img"
      >
        <div
          className="relative h-full shrink-0 overflow-hidden"
          style={{ aspectRatio: `${LOGO_MARK_WIDTH} / ${LOGO_HEIGHT}` }}
        >
          <Image
            alt=""
            aria-hidden
            className="h-full w-auto max-w-none"
            height={LOGO_HEIGHT}
            src={LANDING_LOGO}
            width={LOGO_WIDTH}
          />
        </div>
        <div
          className="relative h-full shrink-0 overflow-hidden"
          style={{ aspectRatio: `${LOGO_WORDMARK_WIDTH} / ${LOGO_HEIGHT}` }}
        >
          <Image
            alt=""
            aria-hidden
            className="h-full w-auto max-w-none brightness-0 invert"
            height={LOGO_HEIGHT}
            src={LANDING_LOGO}
            style={{
              transform: `translateX(-${(LOGO_WORDMARK_OFFSET / LOGO_WIDTH) * 100}%)`,
            }}
            width={LOGO_WIDTH}
          />
        </div>
      </div>
    );

  if (!href) {
    return logo;
  }

  return (
    <Link className="shrink-0" href={href}>
      {logo}
    </Link>
  );
}
