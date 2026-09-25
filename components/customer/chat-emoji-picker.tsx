"use client";

import type { EmojiClickData } from "emoji-picker-react";
import { Theme } from "emoji-picker-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, type CSSProperties } from "react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[22rem] items-center justify-center text-sm text-[#8b8798]">
      Loading emoji…
    </div>
  ),
});

const PICKER_VARS = {
  "--epr-bg-color": "#ffffff",
  "--epr-category-label-bg-color": "#faf8ff",
  "--epr-text-color": "#1c133b",
  "--epr-search-input-bg-color": "#faf8ff",
  "--epr-search-input-text-color": "#1c133b",
  "--epr-search-input-placeholder-color": "#8b8798",
  "--epr-hover-bg-color": "#f3efe6",
  "--epr-focus-bg-color": "#efe8f8",
  "--epr-highlight-color": "#6a45b8",
  "--epr-category-icon-active-color": "#312c79",
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
      className="absolute bottom-[calc(100%-0.25rem)] left-3 right-3 z-20 overflow-hidden rounded-[1.25rem] border border-[#ece8f3] bg-white shadow-[0_18px_44px_rgba(28,19,59,0.14)] sm:left-auto sm:right-4 sm:w-[min(100%,22rem)] [&_.EmojiPickerReact]:!border-none"
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
        theme={Theme.LIGHT}
        width="100%"
      />
    </div>
  );
}
