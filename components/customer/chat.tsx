"use client";

import { ImagePlus, Loader2, MessageCircle, Send, Smile, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ChatEmojiPicker } from "@/components/customer/chat-emoji-picker";
import { pillPrimaryStyle } from "@/components/customer/dashboard/section-banner";
import { ActionError } from "@/components/shared/action-error";
import { ChatMessage } from "@/components/shared/chat-message";
import { MedallionAvatar } from "@/components/shared/medallion-avatar";
import { UserAvatar } from "@/components/shared/user-avatar";
import { trackCrmEvent } from "@/lib/analytics/crm-events";
import { ownStoragePath } from "@/lib/storage/own-object";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { CleanerTier } from "@/types/cleaner";
import type { Message, MessageAttachment } from "@/types/customer";

const MAX_ATTACHMENTS = 4;
const IMAGE_MAX_MB = 10;
const VIDEO_MAX_MB = 25;

type PendingAttachment = MessageAttachment & { id: string };

function attachmentType(file: File): MessageAttachment["type"] | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

export function Chat({
  bookingId,
  currentUserId,
  initialMessages,
  names,
  peerAvatarUrl,
  peerLabel,
  peerSeed,
  peerTier,
  safetyHold = false,
  subtitle,
}: {
  bookingId: string;
  currentUserId: string;
  initialMessages: Message[];
  names: Record<string, string>;
  peerAvatarUrl?: string | null;
  peerLabel?: string;
  peerSeed?: string | null;
  /** When set, peer is a cleaner — show the medallion ring. */
  peerTier?: CleanerTier | null;
  /** When true, show a safety-review banner above the thread. */
  safetyHold?: boolean;
  subtitle?: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const closeEmoji = useCallback(() => setEmojiOpen(false), []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

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

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    if (pending.length + list.length > MAX_ATTACHMENTS) {
      setError(`You can attach up to ${MAX_ATTACHMENTS} files.`);
      return;
    }

    setUploading(true);
    setError(null);
    const supabase = createBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      setError("Sign in to send media.");
      return;
    }

    const uploaded: PendingAttachment[] = [];
    for (const file of list) {
      const type = attachmentType(file);
      if (!type) {
        setError("Only photos and videos are supported.");
        continue;
      }
      const maxMb = type === "video" ? VIDEO_MAX_MB : IMAGE_MAX_MB;
      if (file.size > maxMb * 1024 * 1024) {
        setError(
          type === "video"
            ? `Videos must be ${VIDEO_MAX_MB} MB or smaller.`
            : `Photos must be ${IMAGE_MAX_MB} MB or smaller.`,
        );
        continue;
      }

      const extension = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const safeName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .slice(0, 60);
      const path = `${user.id}/${bookingId}/${Date.now()}-${safeName}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("message-media")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        setError(uploadError.message);
        continue;
      }
      const { data } = supabase.storage.from("message-media").getPublicUrl(path);
      uploaded.push({
        id: path,
        mime: file.type,
        name: file.name,
        type,
        url: data.publicUrl,
      });
    }

    if (uploaded.length) {
      setPending((current) => [...current, ...uploaded].slice(0, MAX_ATTACHMENTS));
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function removePending(path: string) {
    setPending((current) => current.filter((entry) => entry.id !== path));
    const stored = ownStoragePath("message-media", path, currentUserId);
    if (!stored) return;
    await createBrowserClient().storage.from("message-media").remove([stored]);
  }

  async function sendMessage(event?: React.FormEvent) {
    event?.preventDefault();
    const text = content.trim();
    if (!text && !pending.length) return;
    setSending(true);
    setError(null);
    const attachments = pending.map(({ url, type, mime, name }) => ({
      mime,
      name,
      type,
      url,
    }));
    // Show the message straight away; swap in the saved copy when it lands.
    const tempId = `temp-${Date.now()}`;
    const draft = { content, pending };
    setMessages((current) => [
      ...current,
      {
        attachments,
        booking_id: bookingId,
        content: text,
        created_at: new Date().toISOString(),
        id: tempId,
        is_read: false,
        receiver_id: "",
        sender_id: currentUserId,
      },
    ]);
    setContent("");
    setPending([]);
    setEmojiOpen(false);

    let result: { error?: string; message?: Message } = {};
    let ok = false;
    try {
      const response = await fetch("/api/messages", {
        body: JSON.stringify({
          attachments,
          bookingId,
          content: text,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      ok = response.ok;
      result = (await response.json().catch(() => ({}))) as typeof result;
    } catch {
      result = { error: "No connection. Check your signal and try again." };
    }
    setSending(false);

    if (!ok || !result.message) {
      // Roll back and give the text back so they can retry.
      setMessages((current) => current.filter((message) => message.id !== tempId));
      setContent(draft.content);
      setPending(draft.pending);
      setError(result.error ?? "Unable to send message.");
      return;
    }

    trackCrmEvent("message_sent", {
      action: "send_message",
      booking_id: bookingId,
      customer_id: currentUserId,
    });

    const saved = result.message;
    setMessages((current) => {
      const withoutTemp = current.filter((message) => message.id !== tempId);
      return withoutTemp.some((message) => message.id === saved.id)
        ? withoutTemp
        : [...withoutTemp, saved];
    });
  }

  function insertEmoji(emoji: string) {
    const el = textareaRef.current;
    if (!el) {
      setContent((current) => current + emoji);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = content.slice(0, start) + emoji + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + emoji.length;
      el.setSelectionRange(cursor, cursor);
    });
  }

  const canSend = Boolean(content.trim() || pending.length) && !sending && !uploading;

  return (
    <div className="flex h-[calc(100dvh-11rem-env(safe-area-inset-bottom))] min-h-[18rem] flex-col overflow-hidden rounded-[22px] bg-white sm:h-[calc(100vh-12rem)] sm:min-h-[28rem]">
      <div className="shrink-0 p-4 sm:p-5">
        <div className="flex items-center gap-3.5 rounded-[18px] bg-[#F3F4F6] px-4 py-3.5">
          {peerTier ? (
            <MedallionAvatar
              avatarUrl={peerAvatarUrl}
              name={peerLabel ?? "Cleaner"}
              seed={peerSeed}
              size="sm"
              tier={peerTier}
            />
          ) : (
            <UserAvatar
              name={peerLabel ?? "Conversation"}
              seed={peerSeed}
              size="sm"
              url={peerAvatarUrl}
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-[15px] font-semibold text-[#1E1848]">
              {peerLabel ?? "Conversation"}
            </p>
            {subtitle ? (
              <p className="m-0 mt-0.5 truncate text-[13px] text-[#6B6B70]">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {safetyHold ? (
        <div className="mx-4 mb-3 rounded-[14px] bg-[#fff7f2] px-4 py-3 text-[13px] leading-5 text-[#7a3b28] sm:mx-5">
          Safety review in progress — keep messages respectful. Mundoria can see
          this thread.
        </div>
      ) : null}

      <div className="mx-4 flex-1 space-y-2.5 overflow-y-auto rounded-[18px] bg-[#F3F4F6] px-3 py-4 sm:mx-5 sm:space-y-3 sm:px-5 sm:py-5">
        {messages.length ? (
          messages.map((message) => {
            const mine = message.sender_id === currentUserId;
            return (
              <div
                className={message.id.startsWith("temp-") ? "opacity-60" : undefined}
                key={message.id}
              >
                <ChatMessage
                  isOwn={mine}
                  message={message}
                  senderName={names[message.sender_id]}
                />
              </div>
            );
          })
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#EAE7F5]">
              <MessageCircle
                className="h-5 w-5 text-[#524096]"
                strokeWidth={1.6}
              />
            </div>
            <p className="m-0 text-[15px] font-semibold text-[#1E1848]">
              Start the conversation
            </p>
            <p className="m-0 mt-1.5 max-w-xs text-[13px] leading-5 text-[#6B6B70]">
              Say hello, share access notes, parking tips, or photos.
            </p>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="relative shrink-0 p-4 sm:p-5"
        onSubmit={sendMessage}
      >
        {emojiOpen ? (
          <ChatEmojiPicker
            onClose={closeEmoji}
            onPick={(emoji) => {
              insertEmoji(emoji);
            }}
          />
        ) : null}

        {pending.length ? (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {pending.map((item) => (
              <div
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[14px] bg-[#F3F4F6]"
                key={item.id}
              >
                {item.type === "video" ? (
                  <video
                    className="h-full w-full object-cover"
                    muted
                    preload="metadata"
                    src={item.url}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="h-full w-full object-cover"
                    src={item.url}
                  />
                )}
                <button
                  aria-label="Remove attachment"
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  onClick={() => void removePending(item.id)}
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="mb-3">
            <ActionError message={error} title="Couldn’t send that" />
          </div>
        ) : null}

        <div className="flex items-end gap-1.5 rounded-[18px] bg-[#F3F4F6] p-2 sm:gap-2 sm:p-2.5">
          <input
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
            className="hidden"
            multiple
            onChange={(event) => {
              if (event.target.files?.length) {
                void uploadFiles(event.target.files);
              }
            }}
            ref={fileRef}
            type="file"
          />
          <button
            aria-label="Add photo or video"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#524096] transition hover:bg-white disabled:opacity-50"
            disabled={uploading || pending.length >= MAX_ATTACHMENTS}
            onClick={() => fileRef.current?.click()}
            type="button"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
          </button>
          <button
            aria-label="Add emoji"
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#524096] transition hover:bg-white",
              emojiOpen && "bg-white text-[#524096]",
            )}
            onClick={() => setEmojiOpen((open) => !open)}
            type="button"
          >
            <Smile className="h-5 w-5" />
          </button>
          <textarea
            className="max-h-28 min-h-11 flex-1 resize-none rounded-[14px] border-0 bg-transparent px-2 py-2.5 text-[14px] text-[#1E1848] outline-none placeholder:text-[#8B8798]"
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage();
              }
            }}
            placeholder="Write a message…"
            ref={textareaRef}
            rows={1}
            value={content}
          />
          <button
            aria-label="Send"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition hover:brightness-110 disabled:opacity-40"
            disabled={!canSend}
            style={pillPrimaryStyle}
            type="submit"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
