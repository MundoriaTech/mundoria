export type EmailLogEntry = {
  createdAt: string;
  error: string | null;
  id: string;
  recipient: string;
  status: string;
  subject: string;
};

const STATUS: Record<string, { className: string; label: string }> = {
  bounced: { className: "bg-red-50 text-red-700", label: "Bounced" },
  complained: { className: "bg-red-50 text-red-700", label: "Marked as spam" },
  delivered: { className: "bg-emerald-50 text-emerald-700", label: "Delivered" },
  delivery_delayed: { className: "bg-amber-50 text-amber-800", label: "Delayed" },
  failed: { className: "bg-red-50 text-red-700", label: "Failed" },
  sent: { className: "bg-muted text-muted-foreground", label: "Sent" },
  skipped: { className: "bg-muted text-muted-foreground", label: "Not sent" },
};

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Europe/London",
  });
}

/** Every email sent about this booking, and whether it arrived. */
export function BookingEmailLog({ entries }: { entries: EmailLogEntry[] }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Emails sent</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        What was emailed about this booking, to whom, and whether it arrived.
      </p>
      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No emails recorded yet.</p>
      ) : (
        <ul className="mt-4 divide-y text-sm">
          {entries.map((entry) => {
            const status = STATUS[entry.status] ?? STATUS.sent;
            return (
              <li className="flex flex-wrap items-start justify-between gap-2 py-2.5" key={entry.id}>
                <div className="min-w-0">
                  <p className="font-medium">{entry.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.recipient} · {when(entry.createdAt)}
                  </p>
                  {entry.error ? <p className="mt-0.5 text-xs text-muted-foreground">{entry.error}</p> : null}
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                  {status.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
