"use client";

import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export const GIF_MESSAGE_PREFIX = "[[gif:";
export const GIF_MESSAGE_SUFFIX = "]]";

export function encodeGifMessage(url: string) {
  return `${GIF_MESSAGE_PREFIX}${url}${GIF_MESSAGE_SUFFIX}`;
}

export function parseGifMessage(content: string): string | null {
  const trimmed = content.trim();
  if (
    trimmed.startsWith(GIF_MESSAGE_PREFIX) &&
    trimmed.endsWith(GIF_MESSAGE_SUFFIX)
  ) {
    const url = trimmed.slice(
      GIF_MESSAGE_PREFIX.length,
      trimmed.length - GIF_MESSAGE_SUFFIX.length,
    );
    if (
      /^https:\/\//i.test(url) ||
      url.startsWith("/images/chat/gifs/")
    ) {
      return url;
    }
  }
  return null;
}

export function formatMessagePreview(content: string | null | undefined) {
  if (!content) return "";
  if (parseGifMessage(content)) return "GIF";
  return content;
}

type GifItem = {
  id: string;
  label: string;
  url: string;
};

const CURATED_GIFS: GifItem[] = [
  { id: "thumbs-up", label: "Thumbs up", url: "/images/chat/gifs/thumbs-up.gif" },
  { id: "clap", label: "Clap", url: "/images/chat/gifs/clap.gif" },
  { id: "thanks", label: "Thank you", url: "/images/chat/gifs/thanks.gif" },
  { id: "wave", label: "Wave", url: "/images/chat/gifs/wave.gif" },
  { id: "laugh", label: "Laugh", url: "/images/chat/gifs/laugh.gif" },
  { id: "thinking", label: "Thinking", url: "/images/chat/gifs/thinking.gif" },
  { id: "high-five", label: "High five", url: "/images/chat/gifs/high-five.gif" },
];

export function ChatGifPicker({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (url: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onClose();
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CURATED_GIFS;
    return CURATED_GIFS.filter((item) => item.label.toLowerCase().includes(q));
  }, [query]);

  return (
    <div
      className="absolute bottom-[calc(100%-0.25rem)] left-2 right-2 z-20 overflow-hidden rounded-[1.25rem] border border-[#ebe6f2] bg-white sm:left-3 sm:right-3"
      ref={rootRef}
    >
      <div className="flex items-center gap-2 border-b border-[#ebe6f2] px-3 py-2.5">
        <p className="flex-1 text-sm font-semibold text-brand-ink">GIFs</p>
        <button
          aria-label="Close GIFs"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#6b6580] hover:bg-brand-surface"
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <label className="relative block px-3 pt-2.5">
        <Search className="pointer-events-none absolute left-6 top-[calc(50%+0.2rem)] h-3.5 w-3.5 -translate-y-1/2 text-[#6b6580]" />
        <input
          autoFocus
          className="h-9 w-full rounded-full bg-brand-surface pl-9 pr-3 text-sm outline-none placeholder:text-[#9a95a8]"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search reactions"
          value={query}
        />
      </label>
      <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto p-3">
        {items.length === 0 ? (
          <p className="col-span-3 py-6 text-center text-xs text-[#6b6580]">
            No GIFs match that search.
          </p>
        ) : (
          items.map((item) => (
            <button
              aria-label={item.label}
              className={cn(
                "overflow-hidden rounded-xl bg-brand-surface transition hover:ring-2 hover:ring-brand-ink/25",
              )}
              key={item.id}
              onClick={() => onPick(item.url)}
              type="button"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={item.label}
                className="aspect-square h-full w-full object-cover"
                loading="lazy"
                src={item.url}
              />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
