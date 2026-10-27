import {
  Skeleton,
  SkeletonCard,
  SkeletonHeader,
  SkeletonList,
  SkeletonRegion,
  SkeletonStatTiles,
  SkeletonTable,
} from "@/components/shared/skeleton";

/**
 * Page-shaped skeletons for `loading.tsx` files. Each one mirrors the
 * layout of the page it stands in for so the swap to real content is calm.
 */

/** Header + stat tiles + a list. The default for most signed-in pages. */
export function AppPageSkeleton({ label = "Loading page" }: { label?: string }) {
  return (
    <SkeletonRegion className="space-y-8 pb-4" label={label}>
      <SkeletonHeader />
      <SkeletonList rows={5} />
    </SkeletonRegion>
  );
}

/** Welcome banner + tiles + next-item card. Customer and cleaner dashboards. */
export function DashboardSkeleton() {
  return (
    <SkeletonRegion className="space-y-8 pb-4" label="Loading dashboard">
      <div className="grid grid-cols-[minmax(0,1fr)_8.25rem] items-end gap-x-2 sm:grid-cols-[minmax(0,1fr)_16rem] sm:items-center sm:gap-x-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-3 pb-1">
          <Skeleton className="h-9 w-72 max-w-full rounded-xl sm:h-11" />
          <Skeleton className="h-3.5 w-80 max-w-full" />
          <Skeleton className="h-3.5 w-56 max-w-full" />
          <div className="flex gap-2 pt-3">
            <Skeleton className="h-10 w-36 rounded-full sm:h-12" />
            <Skeleton className="h-10 w-36 rounded-full sm:h-12" />
          </div>
        </div>
        <Skeleton className="h-[15.5rem] rounded-[2rem] sm:h-[19rem] lg:h-[21rem]" />
      </div>
      <SkeletonStatTiles />
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-40 rounded-md" />
        <SkeletonCard lines={1} />
      </div>
    </SkeletonRegion>
  );
}

/** Header + tab strip + list. Sessions, jobs, messages. */
export function TabbedListSkeleton({ tabs = 3 }: { tabs?: number }) {
  return (
    <SkeletonRegion className="space-y-8 pb-4" label="Loading list">
      <SkeletonHeader />
      <div>
        <div className="flex gap-6 border-b border-brand-line pb-3">
          {Array.from({ length: tabs }).map((_, index) => (
            <Skeleton className="h-4 w-20" key={index} />
          ))}
        </div>
        <SkeletonList className="mt-4" rows={5} />
      </div>
    </SkeletonRegion>
  );
}

/** Header + filter row + data table. Admin list pages. */
export function TablePageSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <SkeletonRegion className="space-y-8 pb-4" label="Loading table">
      <SkeletonHeader />
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-11 w-72 max-w-full rounded-xl" />
        <Skeleton className="h-11 w-40 rounded-xl" />
        <Skeleton className="h-11 w-40 rounded-xl" />
      </div>
      <SkeletonTable cols={cols} rows={8} />
    </SkeletonRegion>
  );
}

/** Dark hero + tiles + chart row. Admin operations desk. */
export function OpsDashboardSkeleton() {
  return (
    <SkeletonRegion className="space-y-6 sm:space-y-7" label="Loading operations desk">
      <Skeleton className="h-40 rounded-[1.75rem] bg-brand-ink/90 sm:h-44" />
      <SkeletonStatTiles />
      <div className="grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
        <div className="rounded-[1.5rem] border border-brand-line bg-white p-5">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="mt-2 h-3 w-48" />
          <div className="mt-6 flex h-56 items-end gap-3">
            {[55, 80, 95, 60, 72, 90, 40, 10, 65, 78, 85, 15].map((height, index) => (
              <Skeleton
                className="flex-1 rounded-md"
                key={index}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
        <SkeletonCard lines={3} />
      </div>
      <Skeleton className="h-72 rounded-[1.5rem]" />
    </SkeletonRegion>
  );
}
