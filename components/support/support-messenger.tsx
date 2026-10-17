"use client";

import {
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  CircleHelp,
  Download,
  Expand,
  Home,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Search,
  Send,
  Smile,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChatEmojiPicker } from "@/components/customer/chat-emoji-picker";
import { EditorialBody } from "@/components/marketing/editorial-body";
import {
  ChatGifPicker,
  encodeGifMessage,
  formatMessagePreview,
  parseGifMessage,
} from "@/components/shared/chat-gif-picker";
import {
  getOrCreateGuestToken,
  SUPPORT_GUEST_HEADER,
} from "@/lib/support/guest-token";
import { cn } from "@/lib/utils";
import type { SupportConversation, SupportMessage } from "@/types/support";

function SupportMessageBody({
  content,
  mine,
}: {
  content: string;
  mine: boolean;
}) {
  const gifUrl = parseGifMessage(content);
  if (gifUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt="GIF"
        className="max-h-40 w-auto max-w-full rounded-xl"
        src={gifUrl}
      />
    );
  }
  return (
    <p className={cn("whitespace-pre-wrap", mine ? "text-white" : "text-[#1c133b]")}>
      {content}
    </p>
  );
}

export const SUPPORT_MESSENGER_EVENT = "mundoria:open-support-messenger";

type Tab = "home" | "messages" | "help";

type HelpArticle = {
  collectionSlug: string;
  collectionTitle: string;
  slug: string;
  summary: string;
  title: string;
  topic: string;
};

type HelpCollection = {
  articleCount: number;
  description: string;
  emoji: string;
  slug: string;
  title: string;
};

type HelpArticleDetail = {
  blocks: Parameters<typeof EditorialBody>[0]["blocks"];
  collectionSlug: string | null;
  collectionTitle: string | null;
  slug: string;
  summary: string;
  title: string;
  topic: string;
};

type HelpView =
  | { kind: "browse" }
  | { kind: "collection"; slug: string; title: string }
  | { kind: "article"; slug: string; fromCollection?: string | null };

const TRIAGE_OPTIONS = [
  "A Mundoria customer",
  "A future customer",
  "A future Mundoria cleaner — I'm registering to work with Mundoria",
  "A Mundoria cleaner — I already work with Mundoria",
] as const;

const AGENT_NAME = "Mundoria";
const AGENT_SUBTITLE = "The team can also help";
const CONVERSATION_BANNER =
  "Here, there are no silly questions — only clear answers.";
const NAVY = "#1c133b";

function MundoriaMarkWhite({
  className,
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- transparent white brand mark
    <img
      alt=""
      className={cn("object-contain", className)}
      height={size}
      src="/images/brand/mundoria-mark-white.png"
      width={size}
    />
  );
}

function MundoriaAvatar({ size = 36 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        backgroundColor: NAVY,
        height: size,
        width: size,
      }}
    >
      <MundoriaMarkWhite size={Math.round(size * 0.58)} />
    </span>
  );
}

function supportHeaders(guestToken: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    [SUPPORT_GUEST_HEADER]: guestToken,
  };
}

function formatRelative(value: string) {
  const then = new Date(value).getTime();
  const diff = Date.now() - then;
  if (Number.isNaN(diff) || diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function openSupportMessenger(tab: Tab = "home") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SUPPORT_MESSENGER_EVENT, { detail: { tab } }),
  );
}

export function SupportMessengerWidget() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [guestToken, setGuestToken] = useState("");
  const [conversations, setConversations] = useState<SupportConversation[]>(
    [],
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [awaitingTriage, setAwaitingTriage] = useState(true);
  const [threadSearch, setThreadSearch] = useState("");
  const [showThreadSearch, setShowThreadSearch] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [helpQuery, setHelpQuery] = useState("");
  const [homeHelpQuery, setHomeHelpQuery] = useState("");
  const [helpArticles, setHelpArticles] = useState<HelpArticle[]>([]);
  const [helpCollections, setHelpCollections] = useState<HelpCollection[]>([]);
  const [helpLoading, setHelpLoading] = useState(false);
  const [helpView, setHelpView] = useState<HelpView>({ kind: "browse" });
  const [collectionArticles, setCollectionArticles] = useState<HelpArticle[]>(
    [],
  );
  const [activeArticle, setActiveArticle] = useState<HelpArticleDetail | null>(
    null,
  );
  const [helpDetailLoading, setHelpDetailLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const helpInDetail =
    helpView.kind === "collection" || helpView.kind === "article";
  const inThread = Boolean(activeId) || composing;
  const showTabs =
    open &&
    !(tab === "messages" && inThread) &&
    !(tab === "help" && helpInDetail);

  useEffect(() => {
    setGuestToken(getOrCreateGuestToken());
  }, []);

  useEffect(() => {
    function onOpen(event: Event) {
      const detail = (event as CustomEvent<{ tab?: Tab }>).detail;
      setTab(detail?.tab ?? "home");
      setOpen(true);
    }
    window.addEventListener(SUPPORT_MESSENGER_EVENT, onOpen);
    return () => window.removeEventListener(SUPPORT_MESSENGER_EVENT, onOpen);
  }, []);

  const unread = useMemo(
    () => conversations.reduce((sum, item) => sum + (item.unread_user ?? 0), 0),
    [conversations],
  );

  const recent = conversations[0] ?? null;

  const loadConversations = useCallback(async () => {
    if (!guestToken) return;
    try {
      const res = await fetch("/api/support/conversations", {
        headers: supportHeaders(guestToken),
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        conversations: SupportConversation[];
      };
      setConversations(data.conversations ?? []);
    } catch {
      // ignore
    }
  }, [guestToken]);

  const loadThread = useCallback(
    async (id: string) => {
      if (!guestToken) return;
      try {
        const res = await fetch(`/api/support/conversations/${id}`, {
          headers: supportHeaders(guestToken),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { messages: SupportMessage[] };
        setMessages(data.messages ?? []);
        setActiveId(id);
        setComposing(false);
        setAwaitingTriage(false);
        setTab("messages");
        void loadConversations();
      } catch {
        // ignore
      }
    },
    [guestToken, loadConversations],
  );

  const loadHelp = useCallback(async (q = "") => {
    setHelpLoading(true);
    try {
      const res = await fetch(
        `/api/support/help${q ? `?q=${encodeURIComponent(q)}` : ""}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        articles: HelpArticle[];
        collections: HelpCollection[];
      };
      setHelpArticles(data.articles ?? []);
      setHelpCollections(data.collections ?? []);
    } finally {
      setHelpLoading(false);
    }
  }, []);

  const openHelpCollection = useCallback(async (slug: string, title: string) => {
    setHelpView({ kind: "collection", slug, title });
    setActiveArticle(null);
    setHelpDetailLoading(true);
    setTab("help");
    try {
      const res = await fetch(
        `/api/support/help?collection=${encodeURIComponent(slug)}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        articles: HelpArticle[];
        collection: HelpCollection;
      };
      setCollectionArticles(data.articles ?? []);
      if (data.collection?.title) {
        setHelpView({
          kind: "collection",
          slug: data.collection.slug,
          title: data.collection.title,
        });
      }
    } finally {
      setHelpDetailLoading(false);
    }
  }, []);

  const openHelpArticle = useCallback(
    async (slug: string, fromCollection?: string | null) => {
      setHelpView({ kind: "article", slug, fromCollection });
      setHelpDetailLoading(true);
      setTab("help");
      try {
        const res = await fetch(
          `/api/support/help?article=${encodeURIComponent(slug)}`,
        );
        if (!res.ok) {
          setActiveArticle(null);
          return;
        }
        const data = (await res.json()) as { article: HelpArticleDetail };
        setActiveArticle(data.article);
        setHelpView({
          kind: "article",
          fromCollection:
            fromCollection ?? data.article.collectionSlug ?? null,
          slug: data.article.slug,
        });
      } finally {
        setHelpDetailLoading(false);
      }
    },
    [],
  );

  const handleHelpLink = useCallback(
    (href: string) => {
      try {
        const url = new URL(href, window.location.origin);
        const articleMatch = url.pathname.match(/^\/help\/article\/([^/]+)/);
        if (articleMatch?.[1]) {
          void openHelpArticle(
            decodeURIComponent(articleMatch[1]),
            helpView.kind === "collection" ? helpView.slug : null,
          );
          return true;
        }
        const collectionMatch = url.pathname.match(/^\/help\/([^/]+)$/);
        if (collectionMatch?.[1] && collectionMatch[1] !== "article") {
          const slug = decodeURIComponent(collectionMatch[1]);
          const title =
            helpCollections.find((item) => item.slug === slug)?.title ?? slug;
          void openHelpCollection(slug, title);
          return true;
        }
        if (url.pathname === "/help") {
          setHelpView({ kind: "browse" });
          setActiveArticle(null);
          setTab("help");
          return true;
        }
      } catch {
        return false;
      }
      return false;
    },
    [helpCollections, helpView, openHelpArticle, openHelpCollection],
  );

  useEffect(() => {
    if (!open || !guestToken) return;
    void loadConversations();
    void loadHelp();
  }, [open, guestToken, loadConversations, loadHelp]);

  useEffect(() => {
    if (!open || tab !== "help" || helpView.kind !== "browse") return;
    const timer = setTimeout(() => void loadHelp(helpQuery), 220);
    return () => clearTimeout(timer);
  }, [helpQuery, helpView.kind, loadHelp, open, tab]);

  useEffect(() => {
    if (!open || tab !== "home" || !homeHelpQuery.trim()) return;
    const timer = setTimeout(() => {
      setHelpQuery(homeHelpQuery);
      setHelpView({ kind: "browse" });
      setTab("help");
    }, 280);
    return () => clearTimeout(timer);
  }, [homeHelpQuery, open, tab]);

  useEffect(() => {
    if (!open) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      return;
    }
    pollRef.current = setInterval(() => {
      void loadConversations();
      if (activeId) void loadThread(activeId);
    }, 8000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open, activeId, loadConversations, loadThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeId, composing]);

  function startAskQuestion() {
    setTab("messages");
    setActiveId(null);
    setMessages([]);
    setComposing(true);
    setAwaitingTriage(true);
    setDraft("");
    setError(null);
    setShowThreadSearch(false);
    setThreadSearch("");
    setMoreOpen(false);
  }

  async function sendMessage(contentOverride?: string) {
    const content = (contentOverride ?? draft).trim();
    if (!content || !guestToken || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = activeId
        ? await fetch(`/api/support/conversations/${activeId}`, {
            body: JSON.stringify({ content }),
            headers: supportHeaders(guestToken),
            method: "POST",
          })
        : await fetch("/api/support/conversations", {
            body: JSON.stringify({ content, guestToken }),
            headers: supportHeaders(guestToken),
            method: "POST",
          });
      const data = (await res.json()) as {
        conversation?: SupportConversation;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not send message.");
        return;
      }
      setDraft("");
      setAwaitingTriage(false);
      if (data.conversation) {
        await loadThread(data.conversation.id);
      } else if (activeId) {
        await loadThread(activeId);
      }
      await loadConversations();
    } catch {
      setError("Could not send message.");
    } finally {
      setSending(false);
    }
  }

  async function pickTriage(option: string) {
    setAwaitingTriage(false);
    await sendMessage(option);
  }

  function downloadTranscript() {
    const lines = messages.map((message) => {
      const who =
        message.sender_type === "user"
          ? "You"
          : message.sender_type === "admin"
            ? "Mundoria team"
            : "Mundoria";
      return `[${new Date(message.created_at).toLocaleString("en-GB")}] ${who}: ${message.content}`;
    });
    const blob = new Blob([lines.join("\n\n") || "No messages yet."], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `mundoria-support-${activeId ?? "draft"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMoreOpen(false);
  }

  const visibleMessages = useMemo(() => {
    const q = threadSearch.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((message) =>
      message.content.toLowerCase().includes(q),
    );
  }, [messages, threadSearch]);

  const headerTitle =
    tab === "home"
      ? null
      : tab === "help"
        ? helpView.kind === "article"
          ? activeArticle?.title || "Article"
          : helpView.kind === "collection"
            ? helpView.title
            : "Help"
        : inThread
          ? null
          : "Messages";

  return (
    <div className="support-messenger-dock pointer-events-none fixed bottom-4 right-4 z-[80] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <div
          aria-label="Mundoria support"
          className={cn(
            "pointer-events-auto flex flex-col overflow-hidden rounded-[1.35rem] border border-black/5 bg-white",
            expanded
              ? "h-[min(42rem,calc(100dvh-5.5rem))] w-[min(34rem,calc(100vw-1.5rem))]"
              : "h-[min(36rem,calc(100dvh-6.5rem))] w-[min(24rem,calc(100vw-1.5rem))]",
          )}
          role="dialog"
        >
          {/* Space headers */}
          {tab === "home" && !inThread ? (
            <HomeHeader onClose={() => setOpen(false)} />
          ) : inThread && tab === "messages" ? (
            <ThreadHeader
              moreOpen={moreOpen}
              onBack={() => {
                setActiveId(null);
                setMessages([]);
                setComposing(false);
                setAwaitingTriage(true);
                setShowThreadSearch(false);
                setMoreOpen(false);
              }}
              onClose={() => setOpen(false)}
              onDownload={downloadTranscript}
              onExpand={() => {
                setExpanded((value) => !value);
                setMoreOpen(false);
              }}
              onSearch={() => {
                setShowThreadSearch((value) => !value);
                setMoreOpen(false);
              }}
              onToggleMore={() => setMoreOpen((value) => !value)}
            />
          ) : (
            <SimpleHeader
              onClose={() => setOpen(false)}
              title={headerTitle ?? "Mundoria"}
            />
          )}

          {showThreadSearch && tab === "messages" && inThread ? (
            <div className="border-b border-[#ebe6f2] bg-white px-3 py-2">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6b6580]" />
                <input
                  className="h-9 w-full rounded-full bg-[#f4f1f8] pl-9 pr-3 text-sm outline-none"
                  onChange={(event) => setThreadSearch(event.target.value)}
                  placeholder="Search conversation"
                  value={threadSearch}
                />
              </label>
            </div>
          ) : null}

          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto",
              "bg-white",
            )}
          >
            {tab === "home" ? (
              <HomeTab
                helpQuery={homeHelpQuery}
                onAsk={startAskQuestion}
                onOpenHelp={() => {
                  setHelpView({ kind: "browse" });
                  setActiveArticle(null);
                  setTab("help");
                }}
                onOpenRecent={() => {
                  if (recent) void loadThread(recent.id);
                  else startAskQuestion();
                }}
                onQueryChange={setHomeHelpQuery}
                recent={recent}
              />
            ) : null}

            {tab === "messages" ? (
              inThread ? (
                <ThreadView
                  awaitingTriage={awaitingTriage && messages.length === 0}
                  draft={draft}
                  error={error}
                  fileInputRef={fileInputRef}
                  messages={visibleMessages}
                  messagesEndRef={messagesEndRef}
                  onDraftChange={setDraft}
                  onPickTriage={(option) => void pickTriage(option)}
                  onSend={() => void sendMessage()}
                  sending={sending}
                />
              ) : (
                <MessagesEmpty
                  conversations={conversations}
                  onAsk={startAskQuestion}
                  onOpen={(id) => void loadThread(id)}
                  unread={unread}
                />
              )
            ) : null}

            {tab === "help" ? (
              <HelpTab
                activeArticle={activeArticle}
                articles={helpArticles}
                collectionArticles={collectionArticles}
                collections={helpCollections}
                detailLoading={helpDetailLoading}
                loading={helpLoading}
                onLinkClick={handleHelpLink}
                onOpenArticle={(slug, fromCollection) =>
                  void openHelpArticle(slug, fromCollection)
                }
                onOpenCollection={(slug, title) =>
                  void openHelpCollection(slug, title)
                }
                onQueryChange={setHelpQuery}
                onSendMessage={startAskQuestion}
                onViewChange={(view) => {
                  setHelpView(view);
                  if (view.kind === "browse") {
                    setActiveArticle(null);
                    setCollectionArticles([]);
                  }
                  if (view.kind === "collection") {
                    setActiveArticle(null);
                    void openHelpCollection(view.slug, view.title);
                  }
                }}
                query={helpQuery}
                view={helpView}
              />
            ) : null}
          </div>

          {showTabs ? (
            <nav
              aria-label="Messenger spaces"
              className="grid grid-cols-3 border-t border-[#ebe6f2] bg-white"
            >
              {(
                [
                  ["home", "Home", Home],
                  ["messages", "Messages", MessageSquare],
                  ["help", "Help", CircleHelp],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  className={cn(
                    "relative flex flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-semibold transition",
                    tab === id
                      ? "text-[#1c133b]"
                      : "text-[#9a95a8] hover:text-[#1c133b]",
                  )}
                  key={id}
                  onClick={() => {
                    setTab(id);
                    setActiveId(null);
                    setMessages([]);
                    setComposing(false);
                    setMoreOpen(false);
                    if (id === "help") {
                      setHelpView({ kind: "browse" });
                      setActiveArticle(null);
                    }
                  }}
                  type="button"
                >
                  <Icon className="h-4 w-4" strokeWidth={tab === id ? 2.4 : 2} />
                  {label}
                  {id === "messages" && unread > 0 ? (
                    <span className="absolute right-5 top-1.5 h-2 w-2 rounded-full bg-[#1c133b]" />
                  ) : null}
                </button>
              ))}
            </nav>
          ) : null}
        </div>
      ) : null}

      <button
        aria-label={open ? "Minimize support chat" : "Open support chat"}
        className="pointer-events-auto relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#1c133b] text-white transition hover:bg-[#15102e]"
        onClick={() => {
          setOpen((value) => !value);
          setMoreOpen(false);
        }}
        type="button"
      >
        {open ? (
          <ChevronDown className="h-6 w-6" strokeWidth={2.5} />
        ) : (
          <MundoriaMarkWhite size={26} />
        )}
        {!open && unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-[#1c133b]">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
    </div>
  );
}

function HomeHeader({ onClose }: { onClose: () => void }) {
  return (
    <header className="bg-[#1c133b] px-5 pb-5 pt-4 text-white">
      <div className="flex justify-end">
        <button
          aria-label="Close messenger"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/85 transition hover:bg-white/10"
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 text-[1.45rem] font-semibold leading-tight tracking-[-0.03em]">
        Hello there 👋
      </p>
      <p className="mt-1 text-base font-medium leading-snug text-white/75">
        How can we help?
      </p>
    </header>
  );
}

function SimpleHeader({
  onClose,
  title,
}: {
  onClose: () => void;
  title: string;
}) {
  return (
    <header className="relative flex items-center justify-center border-b border-[#ebe6f2] px-4 py-3">
      <p className="text-sm font-semibold text-[#1c133b]">{title}</p>
      <button
        aria-label="Close messenger"
        className="absolute right-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6b6580] hover:bg-[#f7f5fb]"
        onClick={onClose}
        type="button"
      >
        <X className="h-4 w-4" />
      </button>
    </header>
  );
}

function ThreadHeader({
  moreOpen,
  onBack,
  onClose,
  onDownload,
  onExpand,
  onSearch,
  onToggleMore,
}: {
  moreOpen: boolean;
  onBack: () => void;
  onClose: () => void;
  onDownload: () => void;
  onExpand: () => void;
  onSearch: () => void;
  onToggleMore: () => void;
}) {
  return (
    <header className="relative flex items-center gap-2 border-b border-[#ebe6f2] px-2 py-2.5">
      <button
        aria-label="Back"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#1c133b] hover:bg-[#f7f5fb]"
        onClick={onBack}
        type="button"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <MundoriaAvatar size={32} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#1c133b]">
          {AGENT_NAME}
        </p>
        <p className="truncate text-[11px] text-[#6b6580]">{AGENT_SUBTITLE}</p>
      </div>
      <button
        aria-label="More options"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#1c133b] hover:bg-[#f7f5fb]"
        onClick={onToggleMore}
        type="button"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <button
        aria-label="Close messenger"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#1c133b] hover:bg-[#f7f5fb]"
        onClick={onClose}
        type="button"
      >
        <X className="h-4 w-4" />
      </button>
      {moreOpen ? (
        <div className="absolute right-3 top-12 z-10 w-52 overflow-hidden rounded-xl border border-[#ebe6f2] bg-white py-1">
          <MoreItem icon={Expand} label="Expand window" onClick={onExpand} />
          <MoreItem
            icon={Search}
            label="Search conversation"
            onClick={onSearch}
          />
          <MoreItem
            icon={Download}
            label="Download transcript"
            onClick={onDownload}
          />
        </div>
      ) : null}
    </header>
  );
}

function MoreItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Expand;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-[#1c133b] hover:bg-[#f7f5fb]"
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4 text-[#6b6580]" />
      {label}
    </button>
  );
}

function HomeTab({
  helpQuery,
  onAsk,
  onOpenHelp,
  onOpenRecent,
  onQueryChange,
  recent,
}: {
  helpQuery: string;
  onAsk: () => void;
  onOpenHelp: () => void;
  onOpenRecent: () => void;
  onQueryChange: (value: string) => void;
  recent: SupportConversation | null;
}) {
  return (
    <div className="flex h-full flex-col">
      <button
        className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-[#f7f5fb]"
        onClick={onOpenRecent}
        type="button"
      >
        <MundoriaAvatar size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#1c133b]">{AGENT_NAME}</p>
            <p className="shrink-0 text-[11px] text-[#6b6580]">
              {recent ? formatRelative(recent.last_message_at) : "Just now"}
            </p>
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#6b6580]">
            {formatMessagePreview(recent?.last_message_preview) ||
              "Ask us about booking, cleaners, or your account."}
          </p>
        </div>
      </button>

      <div className="mx-5 border-t border-[#ebe6f2]" />

      <div className="px-5 py-4">
        <label className="relative block">
          <input
            className="h-11 w-full rounded-full border border-[#ebe6f2] bg-white px-4 pr-11 text-sm outline-none placeholder:text-[#9a95a8] focus:border-[#1c133b]/35"
            onChange={(event) => onQueryChange(event.target.value)}
            onFocus={onOpenHelp}
            placeholder="Search for help"
            value={helpQuery}
          />
          <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1c133b]" />
        </label>
      </div>

      <div className="mt-auto px-5 pb-5">
        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1c133b] px-4 text-sm font-semibold text-white transition hover:bg-[#15102e]"
          onClick={onAsk}
          type="button"
        >
          Ask a question
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function MessagesEmpty({
  conversations,
  onAsk,
  onOpen,
}: {
  conversations: SupportConversation[];
  onAsk: () => void;
  onOpen: (id: string) => void;
  unread: number;
}) {
  if (conversations.length > 0) {
    return (
      <div className="flex h-full flex-col">
        <ul className="divide-y divide-[#ebe6f2]">
          {conversations.map((item) => (
            <li key={item.id}>
              <button
                className="flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-[#f7f5fb]"
                onClick={() => onOpen(item.id)}
                type="button"
              >
                <MundoriaAvatar size={36} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#1c133b]">
                      {AGENT_NAME}
                    </span>
                    <span className="text-[11px] text-[#6b6580]">
                      {formatRelative(item.last_message_at)}
                    </span>
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-sm text-[#6b6580]">
                    {formatMessagePreview(item.last_message_preview) ||
                      "Conversation"}
                  </span>
                </span>
                {item.unread_user > 0 ? (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#1c133b]" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-auto p-4">
          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1c133b] px-4 text-sm font-semibold text-white transition hover:bg-[#15102e]"
            onClick={onAsk}
            type="button"
          >
            Ask a question
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-between px-6 pb-6 pt-16">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#f7f5fb] text-[#1c133b]">
          <MessageSquare className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <p className="mt-4 text-base font-semibold text-[#1c133b]">
          No messages
        </p>
        <p className="mt-1 max-w-[14rem] text-sm text-[#6b6580]">
          Messages from the team will be shown here
        </p>
      </div>
      <button
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1c133b] px-4 text-sm font-semibold text-white transition hover:bg-[#15102e]"
        onClick={onAsk}
        type="button"
      >
        Ask a question
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}

function ThreadView({
  awaitingTriage,
  draft,
  error,
  fileInputRef,
  messages,
  messagesEndRef,
  onDraftChange,
  onPickTriage,
  onSend,
  sending,
}: {
  awaitingTriage: boolean;
  draft: string;
  error: string | null;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  messages: SupportMessage[];
  messagesEndRef: React.MutableRefObject<HTMLDivElement | null>;
  onDraftChange: (value: string) => void;
  onPickTriage: (option: string) => void;
  onSend: () => void;
  sending: boolean;
}) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [gifOpen, setGifOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertEmoji(emoji: string) {
    const el = textareaRef.current;
    if (!el) {
      onDraftChange(`${draft}${emoji}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = draft.slice(0, start) + emoji + draft.slice(end);
    onDraftChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + emoji.length;
      el.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div className="flex h-full flex-col">
      <p className="px-4 pb-2 pt-3 text-center text-[11px] text-[#6b6580]">
        {CONVERSATION_BANNER}
      </p>
      <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-3">
        {messages.length === 0 && awaitingTriage ? (
          <div className="space-y-2">
            <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-[#f3f0f7] px-3.5 py-2.5 text-sm leading-5 text-[#1c133b]">
              Hi there 👋 Welcome to Mundoria! To help you faster, could you tell
              us who you are? 👇 Just choose the option that fits you best:
            </div>
            <p className="text-[11px] text-[#6b6580]">
              {AGENT_NAME} · Support · Just now
            </p>
          </div>
        ) : null}

        {messages.map((message, index) => {
          const mine = message.sender_type === "user";
          const gifUrl = parseGifMessage(message.content);
          const showMeta =
            !mine &&
            (index === messages.length - 1 ||
              messages[index + 1]?.sender_type === "user");
          return (
            <div key={message.id}>
              <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] text-sm leading-5",
                    gifUrl
                      ? "overflow-hidden rounded-2xl bg-transparent p-0"
                      : "rounded-2xl px-3.5 py-2.5",
                    !gifUrl &&
                      (mine
                        ? "rounded-br-md bg-[#1c133b] text-white"
                        : "rounded-bl-md bg-[#f3f0f7] text-[#1c133b]"),
                  )}
                >
                  <SupportMessageBody content={message.content} mine={mine} />
                </div>
              </div>
              {showMeta ? (
                <p className="mt-1 text-[11px] text-[#6b6580]">
                  {AGENT_NAME} ·{" "}
                  {message.sender_type === "system" ? "Support" : "Team"} ·{" "}
                  {formatRelative(message.created_at)}
                </p>
              ) : null}
            </div>
          );
        })}
        <div
          ref={(node) => {
            messagesEndRef.current = node;
          }}
        />
      </div>

      {awaitingTriage && messages.length === 0 ? (
        <div className="space-y-2 border-t border-[#ebe6f2] px-3 py-3">
          {TRIAGE_OPTIONS.map((option) => (
            <button
              className="w-full rounded-xl border border-[#ebe6f2] bg-white px-3 py-2.5 text-left text-sm font-medium text-[#1c133b] transition hover:bg-[#f7f5fb]"
              disabled={sending}
              key={option}
              onClick={() => onPickTriage(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <div className="relative border-t border-[#ebe6f2] p-3">
          {emojiOpen ? (
            <ChatEmojiPicker
              onClose={() => setEmojiOpen(false)}
              onPick={(emoji) => {
                insertEmoji(emoji);
                setEmojiOpen(false);
              }}
            />
          ) : null}
          {gifOpen ? (
            <ChatGifPicker
              onClose={() => setGifOpen(false)}
              onPick={(url) => {
                onDraftChange(encodeGifMessage(url));
                setGifOpen(false);
              }}
            />
          ) : null}
          <div className="rounded-2xl border border-[#ebe6f2] bg-white p-2 focus-within:border-[#1c133b]/40">
            {parseGifMessage(draft) ? (
              <div className="relative mb-2 inline-block overflow-hidden rounded-xl bg-[#f7f5fb] p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Selected GIF"
                  className="max-h-28 w-auto rounded-lg"
                  src={parseGifMessage(draft) ?? undefined}
                />
                <button
                  aria-label="Remove GIF"
                  className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white"
                  onClick={() => onDraftChange("")}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <textarea
                className="max-h-28 min-h-[2.5rem] w-full resize-none bg-transparent px-2 py-1.5 text-sm outline-none"
                onChange={(event) => onDraftChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    onSend();
                  }
                }}
                placeholder="Message..."
                ref={textareaRef}
                rows={2}
                value={draft}
              />
            )}
            <div className="flex items-center justify-between gap-2 px-1 pt-1">
              <div className="flex items-center gap-1 text-[#6b6580]">
                <button
                  aria-label="Attach file"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#f7f5fb]"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <button
                  aria-label="Insert emoji"
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#f7f5fb]",
                    emojiOpen && "bg-[#f7f5fb] text-[#1c133b]",
                  )}
                  onClick={() => {
                    setGifOpen(false);
                    setEmojiOpen((open) => !open);
                  }}
                  type="button"
                >
                  <Smile className="h-4 w-4" />
                </button>
                <button
                  aria-label="Insert GIF"
                  className={cn(
                    "inline-flex h-8 items-center rounded-full px-2 text-[10px] font-bold tracking-wide hover:bg-[#f7f5fb]",
                    gifOpen ? "bg-[#f7f5fb] text-[#1c133b]" : "text-[#6b6580]",
                  )}
                  onClick={() => {
                    setEmojiOpen(false);
                    setGifOpen((open) => !open);
                  }}
                  type="button"
                >
                  GIF
                </button>
              </div>
              <button
                aria-label="Send message"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1c133b] text-white transition hover:bg-[#15102e] disabled:bg-[#e8e4ef] disabled:text-[#b0aab8]"
                disabled={sending || !draft.trim()}
                onClick={onSend}
                type="button"
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
          <input
            accept="image/*,.pdf,.txt,.doc,.docx"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              onDraftChange(
                draft
                  ? `${draft}\n[Attachment: ${file.name}]`
                  : `[Attachment: ${file.name}]`,
              );
              event.target.value = "";
            }}
            ref={(node) => {
              fileInputRef.current = node;
            }}
            type="file"
          />
          {error ? <p className="mt-2 text-xs text-[#9a3412]">{error}</p> : null}
        </div>
      )}
    </div>
  );
}

function HelpTab({
  activeArticle,
  articles,
  collectionArticles,
  collections,
  detailLoading,
  loading,
  onLinkClick,
  onOpenArticle,
  onOpenCollection,
  onQueryChange,
  onSendMessage,
  onViewChange,
  query,
  view,
}: {
  activeArticle: HelpArticleDetail | null;
  articles: HelpArticle[];
  collectionArticles: HelpArticle[];
  collections: HelpCollection[];
  detailLoading: boolean;
  loading: boolean;
  onLinkClick: (href: string) => boolean;
  onOpenArticle: (slug: string, fromCollection?: string | null) => void;
  onOpenCollection: (slug: string, title: string) => void;
  onQueryChange: (value: string) => void;
  onSendMessage: () => void;
  onViewChange: (view: HelpView) => void;
  query: string;
  view: HelpView;
}) {
  if (view.kind === "article") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-[#ebe6f2] px-3 py-2">
          <button
            aria-label="Back"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#1c133b] hover:bg-[#f7f5fb]"
            onClick={() => {
              if (view.fromCollection) {
                const title =
                  collections.find((item) => item.slug === view.fromCollection)
                    ?.title ??
                  activeArticle?.collectionTitle ??
                  "Collection";
                onViewChange({
                  kind: "collection",
                  slug: view.fromCollection,
                  title,
                });
                return;
              }
              onViewChange({ kind: "browse" });
            }}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <p className="truncate text-sm font-semibold text-[#1c133b]">
            {activeArticle?.title || "Article"}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {detailLoading || !activeArticle ? (
            <p className="text-xs text-[#6b6580]">Loading article…</p>
          ) : (
            <>
              {activeArticle.topic ? (
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6b6580]">
                  {activeArticle.topic}
                </p>
              ) : null}
              {activeArticle.summary ? (
                <p className="mt-2 text-sm leading-6 text-[#5a5470]">
                  {activeArticle.summary}
                </p>
              ) : null}
              <EditorialBody
                blocks={activeArticle.blocks}
                className="!mx-0 mt-2"
                compact
                onLinkClick={onLinkClick}
              />
              <div className="mt-6 rounded-2xl bg-[#f7f5fb] px-4 py-3">
                <p className="text-sm font-semibold text-[#1c133b]">
                  Still need help?
                </p>
                <button
                  className="mt-2 text-sm font-semibold text-[#1c133b] underline underline-offset-2"
                  onClick={onSendMessage}
                  type="button"
                >
                  Send us a message
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (view.kind === "collection") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-[#ebe6f2] px-3 py-2">
          <button
            aria-label="Back to Help"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#1c133b] hover:bg-[#f7f5fb]"
            onClick={() => onViewChange({ kind: "browse" })}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <p className="truncate text-sm font-semibold text-[#1c133b]">
            {view.title}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {detailLoading ? (
            <p className="p-4 text-xs text-[#6b6580]">Loading…</p>
          ) : collectionArticles.length === 0 ? (
            <p className="p-4 text-xs text-[#6b6580]">
              No articles in this collection.
            </p>
          ) : (
            <ul className="divide-y divide-[#ebe6f2]">
              {collectionArticles.map((article) => (
                <li key={article.slug}>
                  <button
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-[#f7f5fb]"
                    onClick={() => onOpenArticle(article.slug, view.slug)}
                    type="button"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[#1c133b]">
                        {article.title}
                      </span>
                      {article.summary ? (
                        <span className="mt-0.5 line-clamp-2 block text-xs text-[#6b6580]">
                          {article.summary}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-[#c5bfd0]">›</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-3 pt-1">
        <label className="relative block">
          <input
            className="h-11 w-full rounded-full bg-[#f4f1f8] px-4 pr-11 text-sm outline-none placeholder:text-[#9a95a8]"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search for help"
            value={query}
          />
          <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1c133b]" />
        </label>
      </div>

      {!query ? (
        <div className="px-4 pb-2">
          <p className="text-sm font-semibold text-[#1c133b]">
            {collections.length} collection{collections.length === 1 ? "" : "s"}
          </p>
        </div>
      ) : (
        <div className="px-4 pb-2">
          <p className="text-sm font-semibold text-[#1c133b]">Results</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-4 text-xs text-[#6b6580]">Loading…</p>
        ) : query ? (
          articles.length === 0 ? (
            <p className="px-4 text-xs text-[#6b6580]">No articles found.</p>
          ) : (
            <ul className="divide-y divide-[#ebe6f2]">
              {articles.map((article) => (
                <li key={article.slug}>
                  <button
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-[#f7f5fb]"
                    onClick={() => onOpenArticle(article.slug)}
                    type="button"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[#1c133b]">
                        {article.title}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-[#6b6580]">
                        {article.summary}
                      </span>
                    </span>
                    <span className="text-[#c5bfd0]">›</span>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : (
          <ul className="divide-y divide-[#ebe6f2]">
            {collections.map((collection) => (
              <li key={collection.slug}>
                <button
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-[#f7f5fb]"
                  onClick={() =>
                    onOpenCollection(collection.slug, collection.title)
                  }
                  type="button"
                >
                  <span className="text-lg leading-none" aria-hidden>
                    {collection.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[#1c133b]">
                      {collection.title}
                    </span>
                    <span className="mt-0.5 block text-sm leading-5 text-[#5a5470]">
                      {collection.description}
                    </span>
                    <span className="mt-1 block text-xs text-[#6b6580]">
                      {collection.articleCount} article
                      {collection.articleCount === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="mt-1 text-[#c5bfd0]">›</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
