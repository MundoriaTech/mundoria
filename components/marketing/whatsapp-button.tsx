"use client";

import { useEffect, useState } from "react";

function whatsappUrl() {
  const digits = (
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "447490228111"
  ).replace(/\D/g, "");
  if (!digits) return null;
  const text = encodeURIComponent(
    "Hello Mundoria, I would like to ask about a clean.",
  );
  return `https://wa.me/${digits}?text=${text}`;
}

function WhatsAppMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .16 5.33.16 11.89c0 2.1.55 4.14 1.6 5.95L0 24l6.3-1.65a11.9 11.9 0 0 0 5.76 1.47h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.16-3.45-8.44zm-8.46 18.3h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.64-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z" />
    </svg>
  );
}

export function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const href = whatsappUrl();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end print:hidden">
      {open ? (
        <div
          aria-label="Chat with Mundoria on WhatsApp"
          className="mb-4 w-[min(22rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
          role="dialog"
        >
          <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25d366] text-white">
              <WhatsAppMark className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold leading-5">Mundoria</p>
              <p className="text-xs leading-4 text-white/80">Typically replies within a day</p>
            </div>
            <button
              aria-label="Close WhatsApp chat"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10"
              onClick={() => setOpen(false)}
              type="button"
            >
              <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          </div>
          <div
            className="bg-[#ece5dd] px-3 py-4"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35) 0 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          >
            <div className="max-w-[16rem] rounded-lg rounded-tl-none bg-white px-3 py-2 shadow-sm">
              <p className="text-[11px] font-semibold text-[#075e54]">Mundoria</p>
              <p className="mt-1 text-sm leading-5 text-[#111b21]">
                Hello. How can we help with your clean?
              </p>
            </div>
          </div>
          <div className="border-t border-black/5 bg-white p-3">
            <a
              className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#25d366] text-sm font-semibold text-white transition hover:bg-[#1ebe5d]"
              href={href ?? "/contact"}
              rel={href ? "noopener noreferrer" : undefined}
              target={href ? "_blank" : undefined}
            >
              <WhatsAppMark className="h-5 w-5" />
              Start chat
            </a>
          </div>
        </div>
      ) : null}
      <button
        aria-expanded={open}
        aria-label={open ? "Close WhatsApp chat" : "Chat on WhatsApp"}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.45)] transition hover:bg-[#1ebe5d]"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {open ? (
          <svg aria-hidden className="h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" />
          </svg>
        ) : (
          <WhatsAppMark className="h-8 w-8" />
        )}
      </button>
    </div>
  );
}
