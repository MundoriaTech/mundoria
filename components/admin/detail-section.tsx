import type { ReactNode } from "react";

export type DetailRow = {
  label: string;
  /** Rendered as-is; empty values show "—" so a missing answer is visible. */
  value: ReactNode;
  /** Spans both columns (long text such as notes). */
  wide?: boolean;
};

function isEmpty(value: ReactNode) {
  return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

/**
 * A titled block of label/value rows for admin detail pages. Server-safe (no
 * client hooks), so pages can pass ReactNode values directly.
 */
export function DetailSection({
  children,
  description,
  rows,
  title,
}: {
  children?: ReactNode;
  description?: string;
  rows?: DetailRow[];
  title: string;
}) {
  return (
    <section className="rounded-xl border bg-card p-4 sm:p-5">
      <h2 className="font-semibold">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      {rows?.length ? (
        <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div className={row.wide ? "sm:col-span-2" : undefined} key={row.label}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{row.label}</dt>
              <dd className="mt-0.5 whitespace-pre-line break-words text-sm text-foreground">
                {isEmpty(row.value) ? <span className="text-muted-foreground">—</span> : row.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {children}
    </section>
  );
}

/** Small pill list for multi-value answers (services, areas, equipment). */
export function Chips({ items }: { items: string[] }) {
  if (!items.length) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground" key={item}>
          {item}
        </span>
      ))}
    </span>
  );
}
