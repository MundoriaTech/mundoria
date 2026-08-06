"use client";

import { ExternalLink, FileText, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function documentKind(pathOrUrl: string | null | undefined) {
  const source = (pathOrUrl ?? "").toLowerCase();
  if (/\.(png|jpe?g|webp|gif|heic)(\?|$)/.test(source)) return "image" as const;
  if (/\.pdf(\?|$)/.test(source)) return "pdf" as const;
  return "unknown" as const;
}

export function DocumentViewerButton({
  className,
  label,
  path,
  url,
}: {
  className?: string;
  label: string;
  path?: string | null;
  url: string | null;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const kind = documentKind(path ?? url);

  if (!url) {
    return (
      <span className="text-sm text-muted-foreground">{label}: missing</span>
    );
  }

  return (
    <>
      <Button
        className={className}
        onClick={() => setOpen(true)}
        type="button"
        variant="outline"
      >
        <FileText className="mr-2 h-4 w-4" />
        View {label}
      </Button>
      {open ? (
        <DocumentModal
          kind={kind}
          label={label}
          onClose={() => setOpen(false)}
          titleId={titleId}
          url={url}
        />
      ) : null}
    </>
  );
}

function DocumentModal({
  kind,
  label,
  onClose,
  titleId,
  url,
}: {
  kind: "image" | "pdf" | "unknown";
  label: string;
  onClose: () => void;
  titleId: string;
  url: string;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={cn(
          "relative flex h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl",
        )}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-3 sm:px-4">
          <h2 className="min-w-0 truncate font-semibold text-foreground" id={titleId}>
            {label}
          </h2>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <a
              className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-primary hover:bg-muted sm:px-3"
              href={url}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Open</span>
            </a>
            <button
              aria-label="Close"
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-muted/40 p-2 sm:p-5">
          {kind === "pdf" ? (
            <iframe
              className="h-[calc(92dvh-4.5rem)] w-full rounded-lg bg-white sm:h-[70vh]"
              src={url}
              title={label}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={label}
              className="mx-auto max-h-[calc(92dvh-5rem)] w-auto max-w-full rounded-lg object-contain shadow-md sm:max-h-[70vh]"
              src={url}
            />
          )}
        </div>
      </div>
    </div>
  );
}
