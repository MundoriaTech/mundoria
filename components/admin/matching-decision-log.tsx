import { summariseMatchingDecisions } from "@/lib/matching/decision-summary";

export function MatchingDecisionLog({
  cleanerName,
  customerName,
  decisions,
  names,
  offerExpiresAt,
  offerOpen,
  status,
}: {
  cleanerName: string | null;
  customerName: string | null;
  decisions: {
    cleaner_id: string | null;
    created_at: string;
    decision: string;
    reasons: Record<string, unknown> | null;
  }[];
  names: Record<string, string>;
  offerExpiresAt: string | null;
  offerOpen: boolean;
  status: string;
}) {
  const summary = summariseMatchingDecisions(
    decisions.map((row) => ({
      cleanerId: row.cleaner_id,
      createdAt: row.created_at,
      decision: row.decision,
      reasons: row.reasons,
    })),
    names,
  );
  const customer = customerName?.split(" ")[0] ?? "The customer";
  const cleaner = cleanerName?.split(" ")[0] ?? "The cleaner";
  const replyBy = offerExpiresAt ? formatWhen(offerExpiresAt) : null;

  return (
    <section className="rounded-xl border bg-card p-4 sm:p-5">
      <h2 className="font-semibold">Matching</h2>
      <p className="mt-3 text-sm leading-6 text-foreground">{summary.headline}</p>
      {summary.detail ? (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{summary.detail}</p>
      ) : null}

      <div className="mt-5">
        <h3 className="text-sm font-semibold">What people are told</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted-foreground">
          {status === "pending_match" ? (
            <li>
              {customer} sees “Looking for a cleaner”. No cleaner has been
              offered the job yet.
            </li>
          ) : null}
          {status === "matched" ? (
            <li>
              {`${customer} sees “Waiting for confirmation”. ${cleaner}'s name stays hidden until they accept.`}
            </li>
          ) : null}
          {status === "matched" && offerOpen ? (
            <li>
              {`${cleaner} has an in-app job offer${replyBy ? ` until ${replyBy}` : ""}. They also get an email if their address can receive one.`}
            </li>
          ) : null}
          {status === "matched" && !offerOpen ? (
            <li>
              The reply time has passed and {cleaner} has not accepted. The
              next suitable cleaner should be offered the job.
            </li>
          ) : null}
          {status === "matched" ? (
            <li>
              {customer} already got an in-app note and an email saying we are
              looking for a cleaner. When {cleaner} accepts, {customer} gets
              “Your session is confirmed” with the cleaner’s first name.
            </li>
          ) : null}
          {status === "confirmed" ? (
            <li>
              {customer} can see {cleaner}. They were notified that the session
              is confirmed.
            </li>
          ) : null}
          <li>
            If the offer is declined or the reply time passes, the next
            suitable cleaner is offered the job and {customer} is told we are
            arranging another professional.
          </li>
        </ul>
      </div>

      {summary.groups.length ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold">Other cleaners</h3>
          <ul className="mt-2 space-y-1.5 text-sm leading-6 text-muted-foreground">
            {summary.groups.map((group) => (
              <li key={group.label}>
                {`${group.count} ${group.count === 1 ? "cleaner" : "cleaners"}: ${group.label.charAt(0).toLowerCase()}${group.label.slice(1)}.`}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    hour: "numeric",
    hourCycle: "h12",
    minute: "2-digit",
    month: "short",
    timeZone: "Europe/London",
  }).format(date);
}
