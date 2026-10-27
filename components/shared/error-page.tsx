"use client";

import * as Sentry from "@sentry/nextjs";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { fadeFrom, SPRING, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Friendly error boundary body shared by every `error.tsx`. Reports to
 * Sentry once, offers a retry (Next's `reset`) and a way back home.
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
      <motion.div
        animate="visible"
        className="w-full max-w-md rounded-[1.75rem] border border-brand-line bg-white p-7 text-center shadow-[0_18px_40px_rgba(28,19,59,0.08)] sm:p-9"
        initial="hidden"
        variants={staggerContainer(0.07)}
      >
        <motion.span
          animate={{ rotate: 0, scale: 1 }}
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-peach-light/60 text-brand-terracotta"
          initial={{ rotate: -12, scale: 0.6 }}
          transition={SPRING.lively}
        >
          <TriangleAlert className="h-6 w-6" strokeWidth={2} />
        </motion.span>
        <motion.h1
          className="mt-5 text-xl font-semibold tracking-[-0.03em] text-brand-ink sm:text-2xl"
          variants={fadeFrom("up", { distance: 12 })}
        >
          {title}
        </motion.h1>
        <motion.p
          className="mt-2 text-sm leading-6 text-brand-muted"
          variants={fadeFrom("up", { distance: 12 })}
        >
          This page hit a problem on our side. You can try again, or head back
          and carry on from there.
        </motion.p>
        {error.digest ? (
          <motion.p
            className="mt-3 font-mono text-[11px] text-brand-subtle"
            variants={fadeFrom("up", { distance: 12 })}
          >
            Reference {error.digest}
          </motion.p>
        ) : null}
        <motion.div
          className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center"
          variants={fadeFrom("up", { distance: 12 })}
        >
          <Button
            className="rounded-full bg-brand-ink hover:bg-brand-indigo"
            loading={retrying}
            onClick={() => {
              setRetrying(true);
              reset();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button asChild className="rounded-full" variant="outline">
            <Link href={fallbackHref}>{fallbackLabel}</Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
