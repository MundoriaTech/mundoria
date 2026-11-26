/** Placeholder shown while a signed-in page loads (Next `loading.tsx`). */
export function PageSkeleton({ label = "Loading page" }: { label?: string }) {
  return (
    <div aria-busy="true" aria-label={label} className="space-y-5 py-2" role="status">
      <div className="h-7 w-48 animate-pulse rounded-lg bg-[#ece8f3]" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <div className="h-24 animate-pulse rounded-2xl bg-[#f3f0f8]" key={key} />
        ))}
      </div>
      <div className="space-y-2.5">
        {[0, 1, 2, 3, 4].map((key) => (
          <div className="h-12 animate-pulse rounded-xl bg-[#f3f0f8]" key={key} />
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
