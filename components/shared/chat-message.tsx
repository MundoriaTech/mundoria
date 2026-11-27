"use client";

import { Check, CheckCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Message } from "@/types/customer";

export function ChatMessage({
  isOwn,
  message,
  senderName,
}: {
  isOwn: boolean;
  message: Message;
  senderName?: string;
}) {
  const attachments = message.attachments ?? [];
  const text = message.content?.trim() ?? "";
  const mediaOnly = attachments.length > 0 && !text;
  const time = new Date(message.created_at).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const peer = senderName ?? message.sender?.full_name ?? "Cleaner";

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[88%] flex-col sm:max-w-[70%]", isOwn ? "items-end" : "items-start")}>
        {!isOwn ? (
          <p className="mb-1.5 px-1 text-[12px] font-semibold tracking-[-0.01em] text-[#524096]">
            {peer.split(" ")[0] ?? peer}
          </p>
        ) : null}

        <div
          className={cn(
            "overflow-hidden text-[14.5px] leading-[1.45]",
            isOwn
              ? "rounded-[22px] rounded-br-[6px] text-white"
              : "rounded-[22px] rounded-bl-[6px] bg-white text-[#1E1848] shadow-[0_1px_2px_rgba(30,24,72,0.04)]",
          )}
          style={
            isOwn
              ? {
                  background:
                    "linear-gradient(160deg, #6A5BA6 0%, #524096 55%, #46367F 100%)",
                }
              : undefined
          }
        >
          {attachments.length ? (
            <div
              className={cn(
                "grid gap-0.5",
                attachments.length > 1 && "grid-cols-2",
                mediaOnly ? "p-1" : "p-1 pb-0",
              )}
            >
              {attachments.map((attachment) =>
                attachment.type === "video" ? (
                  <video
                    className="max-h-64 w-full rounded-[16px] bg-black object-cover"
                    controls
                    key={attachment.url}
                    preload="metadata"
                    src={attachment.url}
                  />
                ) : (
                  <a
                    className="relative block overflow-hidden rounded-[16px]"
                    href={attachment.url}
                    key={attachment.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={attachment.name ?? "Photo"}
                      className="max-h-64 w-full object-cover"
                      src={attachment.url}
                    />
                  </a>
                ),
              )}
            </div>
          ) : null}

          {text ? (
            <p
              className={cn(
                "m-0 whitespace-pre-wrap break-words px-3.5 pt-2.5",
                mediaOnly ? "pt-2" : null,
              )}
            >
              {text}
            </p>
          ) : null}

          <div
            className={cn(
              "flex items-center justify-end gap-1 px-3 pb-2 pt-1",
              isOwn ? "text-white/65" : "text-[#8B8798]",
              mediaOnly && "pt-1.5",
            )}
          >
            <span className="text-[11px] tabular-nums tracking-wide">{time}</span>
            {isOwn ? (
              message.is_read ? (
                <CheckCheck className="h-3.5 w-3.5" strokeWidth={2.2} />
              ) : (
                <Check className="h-3.5 w-3.5 opacity-70" strokeWidth={2.2} />
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
