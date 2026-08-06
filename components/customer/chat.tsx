"use client";

import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ChatMessage } from "@/components/shared/chat-message";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Message } from "@/types/customer";

export function Chat({
  bookingId,
  currentUserId,
  initialMessages,
  names,
}: {
  bookingId: string;
  currentUserId: string;
  initialMessages: Message[];
  names: Record<string, string>;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel(`messages-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          filter: `booking_id=eq.${bookingId}`,
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const message = payload.new as Message;
          setMessages((current) =>
            current.some((item) => item.id === message.id)
              ? current
              : [...current, message],
          );
          if (message.receiver_id === currentUserId) {
            void supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", message.id);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          filter: `booking_id=eq.${bookingId}`,
          schema: "public",
          table: "messages",
        },
        (payload) => {
          setMessages((current) =>
            current.map((message) =>
              message.id === payload.new.id
                ? (payload.new as Message)
                : message,
            ),
          );
        },
      )
      .subscribe();

    void supabase
      .from("messages")
      .update({ is_read: true })
      .eq("booking_id", bookingId)
      .eq("receiver_id", currentUserId)
      .eq("is_read", false);

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [bookingId, currentUserId]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    setError(null);
    const response = await fetch("/api/messages", {
      body: JSON.stringify({ bookingId, content }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as {
      error?: string;
      message?: Message;
    };
    setSending(false);

    if (!response.ok || !result.message) {
      setError(result.error ?? "Unable to send message.");
      return;
    }

    setMessages((current) =>
      current.some((message) => message.id === result.message!.id)
        ? current
        : [...current, result.message!],
    );
    setContent("");
  }

  return (
    <div className="flex h-[calc(100dvh-11rem-env(safe-area-inset-bottom))] min-h-[18rem] flex-col overflow-hidden rounded-2xl border bg-background shadow-sm sm:h-[calc(100vh-12rem)] sm:min-h-[28rem]">
      <div className="border-b px-5 py-4">
        <h1 className="font-semibold">Booking conversation</h1>
        <p className="text-xs text-muted-foreground">
          Messages are only visible to you and your cleaner.
        </p>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {messages.length ? (
          messages.map((message) => {
            const mine = message.sender_id === currentUserId;
            return (
              <ChatMessage
                isOwn={mine}
                key={message.id}
                message={message}
                senderName={names[message.sender_id]}
              />
            );
          })
        ) : (
          <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
            Say hello to your cleaner.
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form className="border-t p-3" onSubmit={sendMessage}>
        {error ? <p className="mb-2 text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-2">
          <textarea
            className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border bg-background px-3 py-2.5 text-sm"
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Write a message…"
            value={content}
          />
          <Button
            disabled={sending || !content.trim()}
            size="icon"
            type="submit"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
