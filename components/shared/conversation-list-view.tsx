"use client";

import Link from "next/link";

import {
  ClientPagination,
  usePagedItems,
} from "@/components/shared/pagination-controls";
import { UserAvatar } from "@/components/shared/user-avatar";
import { PAGE_SIZES } from "@/lib/pagination";
import type { ConversationListItem } from "@/components/shared/conversation-list";

/** Paged conversation list (customer and cleaner messages). */
export function ConversationListView({
  emptyBody,
  emptyTitle,
  items,
}: {
  emptyBody: string;
  emptyTitle: string;
  items: ConversationListItem[];
}) {
  const { page, pageItems, setPage, totalItems } = usePagedItems(
    items,
    PAGE_SIZES.app,
  );
  if (!items.length) {
    return (
      <div className="rounded-[14px] bg-[#F3F4F6] px-5 py-14 text-center">
        <div
          className="mx-auto mb-4 flex items-center justify-center rounded-full bg-[#EAE7F5]"
          style={{ width: "56px", height: "56px" }}
        >
          <svg fill="none" height={26} stroke="#524096" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24" width={26}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p style={{ fontSize: "17.4px", fontWeight: 700, color: "#1E1848", margin: 0 }}>{emptyTitle}</p>
        <p style={{ fontSize: "14.5px", color: "#6B6B70", maxWidth: "320px", margin: "6px auto 0" }}>{emptyBody}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[6px]">
      {pageItems.map((item) => (
        <Link
          className="flex items-center gap-4 rounded-[14px] bg-[#F3F4F6] p-4 transition-colors hover:bg-white hover:shadow-sm"
          href={item.href}
          key={item.bookingId}
          style={{ textDecoration: "none" }}
        >
          <div className="relative shrink-0">
            <UserAvatar
              className="h-12 w-12"
              name={item.title}
              url={item.avatarUrl}
            />
            {item.unread ? (
              <span
                className="absolute -right-0.5 -top-0.5 rounded-full bg-[#D4694A]"
                style={{ width: "10px", height: "10px", border: "2px solid #F3F4F6" }}
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span
                className="truncate"
                style={{ fontSize: "15px", fontWeight: item.unread ? 700 : 600, color: "#1E1848" }}
              >
                {item.title}
              </span>
              {item.timeLabel ? (
                <span style={{ fontSize: "12px", color: "#8B8798", flexShrink: 0 }}>{item.timeLabel}</span>
              ) : null}
            </div>
            <p className="truncate" style={{ fontSize: "12.5px", color: "#8B8798", margin: "1px 0 0" }}>
              {item.subtitle}
            </p>
            <p
              className="truncate"
              style={{
                fontSize: "13.5px",
                color: item.unread ? "#1E1848" : "#5F5F66",
                fontWeight: item.unread ? 600 : 400,
                margin: "3px 0 0",
              }}
            >
              {item.preview}
            </p>
          </div>

          <svg fill="none" height={18} stroke="#C4BFD4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" width={18}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      ))}
      <ClientPagination
        className="mt-3"
        onPageChange={setPage}
        page={page}
        pageSize={PAGE_SIZES.app}
        totalItems={totalItems}
      />
    </div>
  );
}

