import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export { DashboardStatTiles } from "@/components/shared/dashboard-stat-tiles";
export type { DashboardStatIcon } from "@/components/shared/dashboard-stat-tiles";

export function DashboardWelcomeBanner({
  actions,
  eyebrow,
  firstName,
  subtitle,
}: {
  actions?: ReactNode;
  eyebrow?: string;
  firstName: string;
  subtitle: string;
}) {
  return (
    <section className="relative isolate overflow-hidden rounded-[1.35rem] bg-[#1c133b] text-white sm:rounded-[2rem]">
      <div className="relative z-10 px-4 py-5 pr-[6.5rem] sm:max-w-[58%] sm:px-8 sm:py-9 sm:pr-8 lg:max-w-[52%]">
        {eyebrow ? (
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#c79c66] sm:text-[11px] sm:tracking-[0.28em]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="whitespace-nowrap text-[1.35rem] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[2.35rem] sm:leading-[1.1]">
          Welcome back,{" "}
          <span className="font-normal text-[#e8bcac]">{firstName}</span>.
        </h1>
        <p className="mt-2 max-w-[16rem] text-[13px] font-light leading-5 text-white/80 sm:mt-2.5 sm:max-w-md sm:text-[15px] sm:leading-7">
          {subtitle}
        </p>
        {actions ? (
          <div className="mt-3.5 flex flex-wrap items-center gap-2 sm:mt-6 sm:gap-2.5">
            {actions}
          </div>
        ) : null}
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-1 right-0 h-[9.75rem] w-[8.25rem] sm:inset-y-0 sm:bottom-auto sm:h-auto sm:w-[48%] lg:w-[46%]"
      >
        <Image
          alt=""
          className="object-contain object-bottom mix-blend-screen sm:object-right"
          fill
          priority
          sizes="(max-width: 640px) 132px, 520px"
          src="/images/marketing/landing/dashboard-welcome-avatar.png"
        />
      </div>
    </section>
  );
}

export function DashboardSection({
  action,
  children,
  eyebrow,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  eyebrow?: string;
  title: string;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          {eyebrow ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c79c66]">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#1c133b] dark:text-foreground">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function SessionHighlightCard({
  actions,
  meta,
  personLine,
  photoSrc,
  statusLabel,
  statusTone = "confirmed",
  title,
}: {
  actions?: ReactNode;
  meta: Array<{ label: string; value: string }>;
  personLine?: string | null;
  photoSrc: string;
  statusLabel: string;
  statusTone?: "waiting" | "confirmed" | "neutral";
  title: string;
}) {
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-[#e8def8]/90 bg-white shadow-[0_16px_40px_rgba(28,19,59,0.08)] dark:border-border dark:bg-card">
      <div className="relative h-44 w-full overflow-hidden sm:h-52">
        <Image
          alt=""
          className="object-cover object-[center_35%]"
          fill
          sizes="(max-width: 768px) 100vw, 900px"
          src={photoSrc}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1c133b]/85 via-[#1c133b]/25 to-[#1c133b]/10" />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight",
              statusTone === "waiting" && "bg-[#e8bcac] text-[#1c133b]",
              statusTone === "confirmed" && "bg-white/95 text-[#312c79]",
              statusTone === "neutral" && "bg-white/85 text-[#1c133b]",
            )}
          >
            {statusLabel}
          </span>
          <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white sm:text-xl">
            {title}
          </h3>
          {personLine ? (
            <p className="mt-1 text-sm font-light text-white/85">{personLine}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-px border-t border-[#efe6ff] bg-[#efe6ff]/80 sm:grid-cols-2 lg:grid-cols-4 dark:border-border dark:bg-border">
        {meta.map((row) => (
          <div className="bg-white px-4 py-3.5 dark:bg-card" key={row.label}>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#823fb2]">
              {row.label}
            </p>
            <p className="mt-1 text-sm font-semibold tracking-tight text-[#1c133b] dark:text-foreground">
              {row.value}
            </p>
          </div>
        ))}
      </div>

      {actions ? (
        <div className="flex flex-col gap-2 border-t border-[#efe6ff] bg-white p-4 dark:border-border dark:bg-card sm:flex-row sm:flex-wrap sm:p-5">
          {actions}
        </div>
      ) : null}
    </article>
  );
}

export function DashboardHistoryList({
  actionHref,
  actionLabel,
  emptyBody,
  emptyTitle,
  rows,
}: {
  actionHref?: string;
  actionLabel?: string;
  emptyBody: string;
  emptyTitle: string;
  rows: Array<{
    amount: string;
    date: string;
    href: string;
    person: string;
    service: string;
    status: string;
  }>;
}) {
  if (!rows.length) {
    return (
      <div className="rounded-[1.75rem] bg-[#f3efe6] px-6 py-12 text-center shadow-[0_12px_28px_rgba(28,19,59,0.05)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c79c66]">
          History
        </p>
        <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#1c133b]">
          {emptyTitle}
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm font-light leading-6 text-[#3d3a48]">
          {emptyBody}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.href}>
            <Link
              className="group flex flex-col gap-3 rounded-[1.35rem] border border-[#e8def8]/80 bg-white/90 p-4 shadow-[0_10px_28px_rgba(49,44,121,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(49,44,121,0.12)] sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-border dark:bg-card"
              href={row.href}
            >
              <div className="min-w-0">
                <p className="font-semibold tracking-tight text-[#1c133b] dark:text-foreground">
                  {row.service}
                </p>
                <p className="mt-1 text-sm font-light text-[#5a5470] dark:text-muted-foreground">
                  {row.date}
                  {row.person !== "—" ? ` · ${row.person}` : ""}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <span className="rounded-full bg-[#f3efe6] px-2.5 py-1 text-[11px] font-semibold capitalize text-[#312c79]">
                  {row.status}
                </span>
                <span className="text-sm font-semibold tracking-tight text-[#1c133b] dark:text-foreground">
                  {row.amount}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {actionHref && actionLabel ? (
        <div className="flex justify-end pt-1">
          <Link
            className="inline-flex h-11 items-center rounded-full bg-[#1c133b] px-5 text-sm font-semibold text-white transition hover:bg-[#312c79]"
            href={actionHref}
          >
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function DashboardEmptyCard({
  action,
  body,
  title,
}: {
  action?: ReactNode;
  body: string;
  title: string;
}) {
  return (
    <div className="rounded-[1.75rem] bg-[#f3efe6] px-6 py-12 text-center shadow-[0_12px_28px_rgba(28,19,59,0.05)]">
      <h3 className="text-xl font-semibold tracking-[-0.03em] text-[#1c133b]">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm font-light leading-6 text-[#3d3a48]">
        {body}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function UpcomingSessionBars({
  emptyAction,
  sessions,
}: {
  emptyAction?: ReactNode;
  sessions: Array<{
    ctaHref: string;
    ctaLabel: string;
    href: string;
    id: string;
    meta: string;
    secondaryHref?: string | null;
    secondaryLabel?: string | null;
    statusLabel: string;
    statusTone: "waiting" | "confirmed" | "neutral";
    title: string;
  }>;
}) {
  if (!sessions.length) {
    return (
      <DashboardEmptyCard
        action={emptyAction}
        body="When you book, upcoming cleans show up here as notification bars — date, status, and quick actions."
        title="Nothing scheduled yet"
      />
    );
  }

  return (
    <ul className="space-y-3">
      {sessions.map((session) => (
        <li key={session.id}>
          <div
            className={cn(
              "overflow-hidden rounded-[1.35rem] border shadow-[0_10px_28px_rgba(49,44,121,0.07)]",
              session.statusTone === "waiting"
                ? "border-[#f0a888]/50 bg-[#fff6f0]"
                : "border-[#e8def8]/90 bg-white",
            )}
          >
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4">
              <Link className="min-w-0 flex-1" href={session.href}>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight",
                      session.statusTone === "waiting" &&
                        "bg-[#e8bcac] text-[#1c133b]",
                      session.statusTone === "confirmed" &&
                        "bg-[#efe6ff] text-[#312c79]",
                      session.statusTone === "neutral" &&
                        "bg-[#f3efe6] text-[#1c133b]",
                    )}
                  >
                    {session.statusLabel}
                  </span>
                  <p className="font-semibold tracking-tight text-[#1c133b]">
                    {session.title}
                  </p>
                </div>
                <p className="mt-1.5 text-sm font-light text-[#5a5470]">
                  {session.meta}
                </p>
              </Link>
              <div className="flex flex-wrap gap-2 sm:shrink-0">
                <Link
                  className="inline-flex h-10 items-center justify-center rounded-full bg-[#1c133b] px-4 text-sm font-semibold text-white transition hover:bg-[#312c79]"
                  href={session.ctaHref}
                >
                  {session.ctaLabel}
                </Link>
                {session.secondaryHref && session.secondaryLabel ? (
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-full border border-[#d8d4e0] bg-white px-4 text-sm font-semibold text-[#1c133b] transition hover:bg-[#f7f2ea]"
                    href={session.secondaryHref}
                  >
                    {session.secondaryLabel}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
