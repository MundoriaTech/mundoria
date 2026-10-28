import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The one heading block for every signed-in page: eyebrow, title,
 * description, and optional actions aligned to the end on larger screens.
 * Use it instead of ad-hoc `<h1>` markup so titles line up across roles.
 */
export function PageHeader({
  actions,
  as: Heading = "h1",
  className,
  description,
  eyebrow,
  size = "default",
  title,
}: {
  actions?: ReactNode;
  as?: "h1" | "h2";
  className?: string;
  description?: ReactNode;
  eyebrow?: string;
  /** `compact` suits detail pages and nested sections. */
  size?: "default" | "compact";
  title: ReactNode;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-gold">
            {eyebrow}
          </p>
        ) : null}
        <Heading
          className={cn(
            "break-words font-semibold tracking-[-0.03em] text-brand-ink",
            eyebrow && "mt-1.5",
            size === "compact"
              ? "text-xl sm:text-2xl"
              : "text-2xl sm:text-3xl",
          )}
        >
          {title}
        </Heading>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-brand-muted sm:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
