import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function LoadingSpinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      aria-label={label}
      className={cn("inline-flex items-center gap-2 text-sm text-muted-foreground", className)}
      role="status"
    >
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
