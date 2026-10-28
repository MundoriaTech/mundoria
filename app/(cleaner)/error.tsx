"use client";

import { ErrorPage } from "@/components/shared/error-page";

export default function CleanerError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPage
      {...props}
      fallbackHref="/cleaner/dashboard"
      fallbackLabel="Back to dashboard"
    />
  );
}
