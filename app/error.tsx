"use client";

import { ErrorPage } from "@/components/shared/error-page";

export default function RootError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPage {...props} fallbackHref="/" fallbackLabel="Go home" variant="page" />;
}
