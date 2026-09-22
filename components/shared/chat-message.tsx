"use client";

import { CheckCheck } from "lucide-react";

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

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div className="max-w-[85%] sm:max-w-[72%]">
        <p
          className={cn(
            "mb-1 px-1 text-[11px] text-[#8b8798]",
            isOwn && "text-right",
          )}
        >
          {isOwn ? "You" : senderName ?? message.sender?.full_name ?? "Cleaner"}
        </p>
        <div
          className={cn(
            "overflow-hidden rounded-[1.25rem] text-sm",
            isOwn
              ? "rounded-br-md bg-[#1c133b] text-white"
              : "rounded-bl-md bg-white text-[#1c133b] shadow-[0_8px_20px_rgba(28,19,59,0.06)] ring-1 ring-[#ece8f3] dark:bg-card dark:text-foreground dark:ring-border",
          )}
        >
          {attachments.length ? (
            <div
              className={cn(
                "grid gap-1 p-1",
                attachments.length > 1 && "grid-cols-2",
              )}
            >
              {attachments.map((attachment) =>
                attachment.type === "video" ? (
                  <video
                    className="max-h-64 w-full rounded-[1rem] bg-black object-cover"
                    controls
                    key={attachment.url}
                    preload="metadata"
                    src={attachment.url}
                  />
                ) : (
                  <a
                    className="relative block overflow-hidden rounded-[1rem]"
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
                "whitespace-pre-wrap break-words px-3.5 py-2.5",
                attachments.length > 0 && "pt-1.5",
              )}
            >
              {text}
            </p>
          ) : null}

          <div
            className={cn(
              "flex items-center justify-end gap-1 px-3 pb-2 text-[10px]",
              isOwn ? "text-white/65" : "text-[#8b8798]",
              !text && attachments.length > 0 && "pt-1",
            )}
          >
            {new Date(message.created_at).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {isOwn && message.is_read ? (
              <CheckCheck className="h-3 w-3" />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
