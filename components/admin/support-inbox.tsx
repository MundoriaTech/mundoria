"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  formatMessagePreview,
  parseGifMessage,
} from "@/components/shared/chat-gif-picker";
import {
  ClientPagination,
  usePagedItems,
} from "@/components/shared/pagination-controls";
import { PAGE_SIZES } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import type {
  SupportConversationWithUser,
  SupportMessage,
} from "@/types/support";

function displayName(conversation: SupportConversationWithUser) {
  return (
    conversation.user?.full_name?.trim() ||
    conversation.guest_name?.trim() ||
    conversation.user?.email?.trim() ||
    conversation.guest_email?.trim() ||
    "Visitor"
  );
}

function formatWhen(value: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function SupportInboxList({
  initial,
}: {
  initial: SupportConversationWithUser[];
}) {
  const [status, setStatus] = useState<"all" | "open" | "closed">("open");
  const [items, setItems] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch(
        `/api/admin/support${status === "all" ? "" : `?status=${status}`}`,
      );
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as {
        conversations: SupportConversationWithUser[];
      };
      setItems(data.conversations ?? []);
    }
    void load();
    const timer = setInterval(() => void load(), 10000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [status]);

  const { page, pageItems, setPage, totalItems } = usePagedItems(
    items,
    PAGE_SIZES.admin,
    status,
  );

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-wrap gap-2">
        {(["open", "closed", "all"] as const).map((value) => (
          <button
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-semibold transition",
              status === value
                ? "bg-[#312c79] text-white"
                : "bg-white text-[#5a5470] ring-1 ring-[#eadff5]",
            )}
            key={value}
            onClick={() => setStatus(value)}
            type="button"
          >
            {value === "all" ? "All" : value === "open" ? "Open" : "Closed"}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[#5a5470]">No conversations yet.</p>
      ) : (
        <>
          <ul className="grid gap-3">
            {pageItems.map((item) => (
              <li key={item.id}>
                <Link
                  className="block rounded-2xl border border-[#e6e0f2] bg-white p-4 transition hover:border-[#312c79]/25 hover:bg-[#faf8ff]"
                  href={`/admin/inbox/${item.id}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#1c133b]">
                      {displayName(item)}
                    </p>
                    <div className="flex items-center gap-2">
                      {item.unread_admin > 0 ? (
                        <span className="rounded-full bg-[#e67248] px-2 py-0.5 text-[11px] font-bold text-white">
                          {item.unread_admin} new
                        </span>
                      ) : null}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                          item.status === "open"
                            ? "bg-[#efe8ff] text-[#312c79]"
                            : "bg-[#f3f0f7] text-[#8b8798]",
                        )}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-[#5a5470]">
                    {formatMessagePreview(item.last_message_preview) ||
                      "No messages yet"}
                  </p>
                  <p className="mt-2 text-xs text-[#8b8798]">
                    {formatWhen(item.last_message_at)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <ClientPagination
            className="mt-4"
            onPageChange={setPage}
            page={page}
            pageSize={PAGE_SIZES.admin}
            totalItems={totalItems}
          />
        </>
      )}
    </div>
  );
}

export function SupportInboxThread({
  conversationId,
  initialConversation,
  initialMessages,
}: {
  conversationId: string;
  initialConversation: SupportConversationWithUser;
  initialMessages: SupportMessage[];
}) {
  const [conversation, setConversation] = useState(initialConversation);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => displayName(conversation), [conversation]);

  async function refresh() {
    const res = await fetch(`/api/admin/support/${conversationId}`);
    if (!res.ok) return;
    const data = (await res.json()) as {
      conversation: SupportConversationWithUser;
      messages: SupportMessage[];
    };
    setConversation(data.conversation);
    setMessages(data.messages ?? []);
  }

  useEffect(() => {
    const timer = setInterval(() => void refresh(), 8000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  async function reply(status?: "open" | "closed") {
    if (sending) return;
    const content = draft.trim();
    if (!content && !status) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/support/${conversationId}`, {
        body: JSON.stringify({
          content: content || undefined,
          status,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not update conversation.");
        return;
      }
      setDraft("");
      await refresh();
    } catch {
      setError("Could not update conversation.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="rounded-2xl border border-[#e6e0f2] bg-white">
        <div className="border-b border-[#eadff5] px-4 py-3">
          <p className="text-sm font-semibold text-[#1c133b]">{title}</p>
          <p className="text-xs text-[#8b8798]">
            {[conversation.user?.email, conversation.guest_email]
              .filter(Boolean)
              .join(" · ") || "Guest visitor"}
          </p>
        </div>
        <div className="max-h-[28rem] space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((message) => {
            const admin = message.sender_type === "admin";
            const gifUrl = parseGifMessage(message.content);
            return (
              <div
                className={cn("flex", admin ? "justify-end" : "justify-start")}
                key={message.id}
              >
                <div
                  className={cn(
                    "max-w-[85%] text-sm leading-5",
                    gifUrl
                      ? "overflow-hidden rounded-2xl p-0"
                      : "rounded-2xl px-3 py-2",
                    !gifUrl &&
                      (admin
                        ? "rounded-br-md bg-[#312c79] text-white"
                        : "rounded-bl-md bg-[#f6f0ff] text-[#1c133b]"),
                  )}
                >
                  {gifUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt="GIF"
                      className="max-h-48 w-auto max-w-full rounded-xl"
                      src={gifUrl}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      gifUrl
                        ? "px-1 text-[#8b8798]"
                        : admin
                          ? "text-white/70"
                          : "text-[#8b8798]",
                    )}
                  >
                    {formatWhen(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-[#eadff5] p-4">
          <textarea
            className="min-h-[5rem] w-full resize-y rounded-xl border border-[#eadff5] px-3 py-2 text-sm outline-none ring-[#312c79]/20 focus:ring-2"
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Reply to visitor…"
            value={draft}
          />
          {error ? <p className="mt-2 text-xs text-[#9a3412]">{error}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="rounded-full bg-[#312c79] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={sending || !draft.trim()}
              onClick={() => void reply()}
              type="button"
            >
              Send reply
            </button>
            {conversation.status === "open" ? (
              <button
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#5a5470] ring-1 ring-[#eadff5]"
                disabled={sending}
                onClick={() => void reply("closed")}
                type="button"
              >
                Close conversation
              </button>
            ) : (
              <button
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#5a5470] ring-1 ring-[#eadff5]"
                disabled={sending}
                onClick={() => void reply("open")}
                type="button"
              >
                Reopen
              </button>
            )}
          </div>
        </div>
      </div>

      <aside className="rounded-2xl border border-[#e6e0f2] bg-white p-4 text-sm text-[#5a5470]">
        <p className="font-semibold text-[#1c133b]">Details</p>
        <dl className="mt-3 space-y-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#8b8798]">
              Status
            </dt>
            <dd className="capitalize">{conversation.status}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#8b8798]">
              Started
            </dt>
            <dd>{formatWhen(conversation.created_at)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#8b8798]">
              Last message
            </dt>
            <dd>{formatWhen(conversation.last_message_at)}</dd>
          </div>
        </dl>
        <Link
          className="mt-4 inline-flex text-sm font-semibold text-[#6a45b8]"
          href="/admin/inbox"
        >
          Back to inbox
        </Link>
      </aside>
    </div>
  );
}
