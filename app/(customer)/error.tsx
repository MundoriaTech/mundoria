"use client";

import { ErrorPage } from "@/components/shared/error-page";

export default function CustomerError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPage
      {...props}
      fallbackHref="/dashboard"
      fallbackLabel="Back to dashboard"
    />
  );
}
