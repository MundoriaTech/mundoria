import type { ReactNode } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";

/**
 * Standard wrapper for every signed-in page. Gives each page the same vertical
 * rhythm and, when a `title` is passed, the same `PageHeader` at the top.
 */
export function AppPage({
  actions,
  children,
  className,
  description,
  eyebrow,
  headerSize,
  title,
}: {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow?: string;
  headerSize?: "default" | "compact";
  title?: ReactNode;
}) {
  return (
    <div className={cn("min-w-0 space-y-8 pb-4", className)}>
      {title ? (
        <PageHeader
          actions={actions}
          description={description}
          eyebrow={eyebrow}
          size={headerSize}
          title={title}
        />
      ) : null}
      {children}
    </div>
  );
}
