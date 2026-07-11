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
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div className="max-w-[82%]">
        <p className="mb-1 px-1 text-xs text-muted-foreground">
          {isOwn ? "You" : senderName ?? message.sender?.full_name ?? "Cleaner"}
        </p>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            isOwn
              ? "rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm bg-muted",
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          <div
            className={cn(
              "mt-1 flex items-center justify-end gap-1 text-[10px]",
              isOwn
                ? "text-primary-foreground/70"
                : "text-muted-foreground",
            )}
          >
            {new Date(message.created_at).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {isOwn && message.is_read ? <CheckCheck className="h-3 w-3" /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
