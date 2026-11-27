"use client";

import type { EmojiClickData, Theme } from "emoji-picker-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, type CSSProperties } from "react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[22rem] items-center justify-center text-sm text-[#6B6B70]">
      Loading emoji…
    </div>
  ),
});

const PICKER_VARS = {
  "--epr-bg-color": "#ffffff",
  "--epr-category-label-bg-color": "#F3F4F6",
  "--epr-text-color": "#1E1848",
  "--epr-search-input-bg-color": "#F3F4F6",
  "--epr-search-input-text-color": "#1E1848",
  "--epr-search-input-placeholder-color": "#8B8798",
  "--epr-hover-bg-color": "#ECE8F6",
  "--epr-focus-bg-color": "#EAE7F5",
  "--epr-highlight-color": "#524096",
  "--epr-category-icon-active-color": "#524096",
  "--epr-header-padding": "10px 12px 6px",
} as CSSProperties;

export function ChatEmojiPicker({
  onPick,
  onClose,
}: {
  onPick: (emoji: string) => void;
  onClose: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      className="absolute bottom-[calc(100%-0.25rem)] left-3 right-3 z-20 overflow-hidden rounded-[18px] border border-[#E7E7EF] bg-white shadow-[0_18px_44px_rgba(30,24,72,0.12)] sm:left-auto sm:right-4 sm:w-[min(100%,22rem)] [&_.EmojiPickerReact]:!border-none"
      ref={rootRef}
      style={PICKER_VARS}
    >
      <EmojiPicker
        height={352}
        lazyLoadEmojis
        onEmojiClick={(emoji: EmojiClickData) => onPick(emoji.emoji)}
        previewConfig={{ showPreview: false }}
        searchPlaceHolder="Search emoji"
        skinTonesDisabled
        // A value import of Theme would pull the whole emoji library (~310 KB)
        // into every page that renders a chat, defeating the dynamic import.
        theme={"light" as Theme}
        width="100%"
      />
    </div>
  );
}
