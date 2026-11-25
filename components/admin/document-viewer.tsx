"use client";

import { ChevronLeft, ChevronRight, ExternalLink, FileText, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ViewerFile = {
  label: string;
  path: string | null;
  url: string | null;
};

function documentKind(pathOrUrl: string | null | undefined) {
  const source = (pathOrUrl ?? "").toLowerCase();
  if (/\.(png|jpe?g|webp|gif|heic)(\?|$)/.test(source)) return "image" as const;
  if (/\.pdf(\?|$)/.test(source)) return "pdf" as const;
  // Phone screenshots often lose the suffix after the file name is shortened.
  return "image" as const;
}

export function DocumentViewerButton({
  className,
  files,
  label,
  path,
  url,
}: {
  className?: string;
  files?: ViewerFile[];
  label?: string;
  path?: string | null;
  url?: string | null;
}) {
  const pages = (files?.length
    ? files
    : [{ label: label ?? "Open", path: path ?? null, url: url ?? null }]
  ).filter((file) => Boolean(file.url));
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const titleId = useId();

  if (!pages.length) {
    if (files?.some((file) => file.path)) {
      return (
        <span className="inline-flex h-9 items-center px-2 text-xs text-muted-foreground">
          On file
        </span>
      );
    }
    return label ? (
      <span className="text-sm text-muted-foreground">{label}: missing</span>
    ) : null;
  }

  const current = pages[Math.min(index, pages.length - 1)]!;
  const kind = documentKind(current.path ?? current.url);
  const buttonLabel = pages.length > 1 ? `View (${pages.length})` : "View";

  return (
    <>
      <Button
        className={className}
        onClick={() => {
          setIndex(0);
          setOpen(true);
        }}
        type="button"
        variant="outline"
      >
        <FileText className="mr-2 h-4 w-4" />
        {buttonLabel}
      </Button>
      {open ? (
        <DocumentModal
          files={pages}
          index={index}
          kind={kind === "pdf" ? "pdf" : "image"}
          onClose={() => setOpen(false)}
          onIndex={setIndex}
          titleId={titleId}
        />
      ) : null}
    </>
  );
}

function DocumentModal({
  files,
  index,
  kind,
  onClose,
  onIndex,
  titleId,
}: {
  files: ViewerFile[];
  index: number;
  kind: "image" | "pdf";
  onClose: () => void;
  onIndex: (next: number) => void;
  titleId: string;
}) {
  const current = files[index]!;
  const url = current.url!;
  const many = files.length > 1;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && index > 0) onIndex(index - 1);
      if (event.key === "ArrowRight" && index < files.length - 1) {
        onIndex(index + 1);
      }
    }
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [files.length, index, onClose, onIndex]);

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
            {current.label}
            {many ? ` · ${index + 1} of ${files.length}` : ""}
          </h2>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {many ? (
              <>
                <Button
                  className="h-9 px-2"
                  disabled={index === 0}
                  onClick={() => onIndex(index - 1)}
                  type="button"
                  variant="outline"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous file</span>
                </Button>
                <Button
                  className="h-9 px-2"
                  disabled={index === files.length - 1}
                  onClick={() => onIndex(index + 1)}
                  type="button"
                  variant="outline"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next file</span>
                </Button>
              </>
            ) : null}
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
        {many ? (
          <div className="flex flex-wrap gap-1.5 border-b border-border px-3 py-2 sm:px-4">
            {files.map((file, pageIndex) => (
              <Button
                className="h-8 px-2.5 text-xs"
                key={`${file.label}-${pageIndex}`}
                onClick={() => onIndex(pageIndex)}
                type="button"
                variant={pageIndex === index ? "secondary" : "outline"}
              >
                {file.label}
              </Button>
            ))}
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-auto bg-muted/40 p-2 sm:p-5">
          {kind === "pdf" ? (
            <iframe
              className="h-[calc(92dvh-4.5rem)] w-full rounded-lg bg-white sm:h-[70vh]"
              src={url}
              title={current.label}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={current.label}
              className="mx-auto max-h-[calc(92dvh-5rem)] w-auto max-w-full rounded-lg object-contain shadow-md sm:max-h-[70vh]"
              src={url}
            />
          )}
        </div>
      </div>
    </div>
  );
}
