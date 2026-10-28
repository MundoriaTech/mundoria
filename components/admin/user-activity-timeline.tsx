import { activityEventLabel } from "@/lib/analytics/user-activity";

export type UserActivityRow = {
  created_at: string;
  event_name: string;
  id: string;
  metadata: Record<string, unknown> | null;
  path: string | null;
};

export function UserActivityTimeline({
  events,
}: {
  events: UserActivityRow[];
}) {
  return (
    <section className="rounded-xl border bg-card p-4 sm:p-5">
      <h2 className="font-semibold">Activity after signup</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        What this person did on Mundoria after creating an account.
      </p>
      <div className="mt-4 space-y-3">
        {events.map((event) => (
          <div
            className="flex gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0"
            key={event.id}
          >
            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-plum" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {activityEventLabel(event.event_name, event.metadata)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {new Date(event.created_at).toLocaleString("en-GB")}
                {event.path ? ` · ${event.path}` : ""}
              </p>
            </div>
          </div>
        ))}
        {!events.length ? (
          <p className="text-sm text-muted-foreground">
            No tracked activity yet. New actions will show here after signup.
          </p>
        ) : null}
      </div>
    </section>
  );
}
