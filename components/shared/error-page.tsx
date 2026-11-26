"use client";

import * as Sentry from "@sentry/nextjs";
import { RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Friendly error screen for every `error.tsx`: reports to Sentry once, offers
 * a retry (Next's `reset`) and a way back, instead of Next's bare error page.
 */
export function ErrorPage({
  error,
  fallbackHref = "/",
  fallbackLabel = "Go home",
  reset,
  title = "Something went wrong",
  variant = "app",
}: {
  error: Error & { digest?: string };
  fallbackHref?: string;
  fallbackLabel?: string;
  reset: () => void;
  title?: string;
  /** `page` centres the block on a full-height public page. */
  variant?: "app" | "page";
}) {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div
      className={cn(
        "flex w-full justify-center",
        variant === "page" ? "min-h-[70vh] items-center px-6 py-16" : "py-10",
      )}
    >
      <div className="w-full max-w-md rounded-[1.75rem] border border-[#ebe4da] bg-white p-7 text-center shadow-[0_18px_40px_rgba(28,19,59,0.08)] sm:p-9">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fbe7dc] text-[#d4694a]">
          <TriangleAlert className="h-6 w-6" strokeWidth={2} />
        </span>
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-[#1c133b]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#5a5470]">
          This page didn&apos;t load properly. Try again, and if it keeps happening, let us
          know and we&apos;ll sort it out.
        </p>
        {error.digest ? (
          <p className="mt-2 text-xs text-[#6f6a82]">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            disabled={retrying}
            onClick={() => {
              setRetrying(true);
              reset();
              window.setTimeout(() => setRetrying(false), 1500);
            }}
            type="button"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", retrying && "animate-spin")} />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href={fallbackHref}>{fallbackLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
