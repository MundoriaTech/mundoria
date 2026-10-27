import { cn } from "@/lib/utils";

/**
 * Loading placeholders. Compose the small pieces into page-shaped
 * `loading.tsx` files so the skeleton matches the layout it stands in for.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-lg bg-brand-lavender/60 motion-safe:animate-pulse",
        className,
      )}
      {...props}
    />
  );
}

/** Wrap a skeleton block so assistive tech announces it once. */
export function SkeletonRegion({
  children,
  className,
  label = "Loading",
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div aria-busy="true" aria-live="polite" className={className} role="status">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function SkeletonText({
  className,
  lines = 3,
  widths = ["100%", "92%", "68%"],
}: {
  className?: string;
  lines?: number;
  widths?: string[];
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          className="h-3.5"
          key={index}
          style={{ width: widths[index % widths.length] }}
        />
      ))}
    </div>
  );
}

export function SkeletonHeader({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-64 max-w-full rounded-xl" />
      <Skeleton className="h-3.5 w-96 max-w-full" />
    </div>
  );
}

export function SkeletonCard({
  className,
  lines = 2,
  media = false,
}: {
  className?: string;
  lines?: number;
  media?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-brand-line bg-white p-5",
        className,
      )}
    >
      {media ? <Skeleton className="mb-4 h-36 w-full rounded-xl" /> : null}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3.5 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      {lines > 0 ? <SkeletonText className="mt-4" lines={lines} /> : null}
    </div>
  );
}

export function SkeletonStatTiles({
  className,
  count = 4,
}: {
  className?: string;
  count?: number;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          className="rounded-2xl border border-brand-line bg-white p-4"
          key={index}
        >
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="mt-4 h-6 w-16 rounded-md" />
          <Skeleton className="mt-2 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({
  className,
  rows = 4,
}: {
  className?: string;
  rows?: number;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          className="flex items-center gap-4 rounded-2xl border border-brand-line bg-white p-4"
          key={index}
        >
          <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({
  className,
  cols = 5,
  rows = 6,
}: {
  className?: string;
  cols?: number;
  rows?: number;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-brand-line bg-white",
        className,
      )}
    >
      <div
        className="grid gap-4 border-b border-brand-line bg-brand-surface px-4 py-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cols }).map((_, index) => (
          <Skeleton className="h-3 w-3/4" key={index} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div
          className="grid gap-4 border-b border-brand-line px-4 py-3.5 last:border-b-0"
          key={row}
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, col) => (
            <Skeleton
              className="h-3.5"
              key={col}
              style={{ width: `${55 + ((row * 7 + col * 13) % 40)}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
