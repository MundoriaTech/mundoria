"use client";

import { X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { avatarImageClass } from "@/lib/avatars/default-pack";

/** Full-screen look at a profile photo. */
export function AvatarLightbox({
  alt,
  caption,
  onClose,
  src,
  title,
}: {
  alt: string;
  caption?: string | null;
  onClose: () => void;
  src: string;
  title: string;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-center justify-center p-5"
      role="dialog"
    >
      <button
        aria-label="Close photo"
        className="absolute inset-0 bg-[#1E1848]/55 backdrop-blur-[2px]"
        onClick={onClose}
        type="button"
      />
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-4 rounded-[28px] bg-white p-6 shadow-[0_24px_60px_rgba(30,24,72,0.28)]">
        <button
          aria-label="Close"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-[#6B6B70] transition hover:bg-[#F3F4F6] hover:text-[#1E1848]"
          onClick={onClose}
          type="button"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>

        <div className="mt-2 h-56 w-56 overflow-hidden rounded-full bg-[#F3F4F6] shadow-[inset_0_0_0_1px_rgba(30,24,72,0.06)] sm:h-64 sm:w-64">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={alt} className={avatarImageClass(src)} src={src} />
        </div>

        <div className="text-center">
          <p
            className="m-0 text-[18px] font-semibold tracking-[-0.02em] text-[#1E1848]"
            id={titleId}
          >
            {title}
          </p>
          {caption ? (
            <p className="m-0 mt-1 text-[13px] text-[#6B6B70]">{caption}</p>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
