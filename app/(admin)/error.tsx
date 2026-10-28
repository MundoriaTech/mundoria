"use client";

import { ErrorPage } from "@/components/shared/error-page";

export default function AdminError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPage
      {...props}
      fallbackHref="/admin/dashboard"
      fallbackLabel="Back to operations"
    />
  );
}
