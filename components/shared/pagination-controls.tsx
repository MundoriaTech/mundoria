"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  buildPageHref,
  clampPage,
  pageWindow,
  rangeLabel,
  totalPages,
} from "@/lib/pagination";
import { cn } from "@/lib/utils";

type SharedProps = {
  className?: string;
  page: number;
  pageSize: number;
  totalItems: number;
};

function PaginationShell({
  className,
  label,
  children,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-1">{children}</div>
    </nav>
  );
}

function PageButton({
  active,
  children,
  disabled,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <Button
      aria-current={active ? "page" : undefined}
      className={cn(
        "h-9 min-w-9 px-2.5",
        active && "pointer-events-none",
      )}
      disabled={disabled}
      onClick={onClick}
      size="sm"
      type="button"
      variant={active ? "default" : "outline"}
    >
      {children}
    </Button>
  );
}

function PageLink({
  active,
  children,
  disabled,
  href,
}: {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  href: string;
}) {
  if (disabled || active) {
    return (
      <span
        aria-current={active ? "page" : undefined}
        aria-disabled={disabled || undefined}
        className={cn(
          "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2.5 text-sm font-medium",
          active
            ? "border-transparent bg-primary text-primary-foreground"
            : "border-border bg-muted/40 text-muted-foreground opacity-60",
        )}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-border bg-background px-2.5 text-sm font-medium transition hover:bg-muted"
      href={href}
    >
      {children}
    </Link>
  );
}

/** URL-driven pagination for server-rendered lists (`?page=`). */
export function PaginationLinks({
  className,
  page,
  pageSize,
  pathname,
  query = {},
  totalItems,
}: SharedProps & {
  pathname: string;
  query?: Record<string, string | undefined | null>;
}) {
  const pages = totalPages(totalItems, pageSize);
  const current = clampPage(page, pages);
  if (pages <= 1) return null;

  const hrefFor = (n: number) => buildPageHref(pathname, query, n);
  const window = pageWindow(current, pages);

  return (
    <PaginationShell
      className={className}
      label={rangeLabel(current, pageSize, totalItems)}
    >
      <PageLink disabled={current <= 1} href={hrefFor(current - 1)}>
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous</span>
      </PageLink>
      {window.map((item, index) =>
        item === "ellipsis" ? (
          <span
            className="inline-flex h-9 min-w-9 items-center justify-center text-sm text-muted-foreground"
            key={`e-${index}`}
          >
            …
          </span>
        ) : (
          <PageLink
            active={item === current}
            href={hrefFor(item)}
            key={item}
          >
            {item}
          </PageLink>
        ),
      )}
      <PageLink disabled={current >= pages} href={hrefFor(current + 1)}>
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next</span>
      </PageLink>
    </PaginationShell>
  );
}

/** Client pagination for filtered in-memory tables. */
export function ClientPagination({
  className,
  onPageChange,
  page,
  pageSize,
  totalItems,
}: SharedProps & {
  onPageChange: (page: number) => void;
}) {
  const pages = totalPages(totalItems, pageSize);
  const current = clampPage(page, pages);
  if (pages <= 1) return null;

  const window = pageWindow(current, pages);

  return (
    <PaginationShell
      className={className}
      label={rangeLabel(current, pageSize, totalItems)}
    >
      <PageButton
        disabled={current <= 1}
        onClick={() => onPageChange(current - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous</span>
      </PageButton>
      {window.map((item, index) =>
        item === "ellipsis" ? (
          <span
            className="inline-flex h-9 min-w-9 items-center justify-center text-sm text-muted-foreground"
            key={`e-${index}`}
          >
            …
          </span>
        ) : (
          <PageButton
            active={item === current}
            key={item}
            onClick={() => onPageChange(item)}
          >
            {item}
          </PageButton>
        ),
      )}
      <PageButton
        disabled={current >= pages}
        onClick={() => onPageChange(current + 1)}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next</span>
      </PageButton>
    </PaginationShell>
  );
}

/** Slice + page state that resets when `resetKey` changes (e.g. filters). */
export function usePagedItems<T>(
  items: T[],
  pageSize: number,
  resetKey?: string | number | boolean,
) {
  const [page, setPage] = useState(1);
  const pages = totalPages(items.length, pageSize);
  const safePage = clampPage(page, pages);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, pageSize, safePage]);

  return {
    page: safePage,
    pageItems,
    setPage,
    totalItems: items.length,
    totalPages: pages,
  };
}
