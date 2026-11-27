"use client";

import { ChevronRight, MessageCircle } from "lucide-react";
import Link from "next/link";

import type { ConversationListItem } from "@/components/shared/conversation-list";
import { MedallionAvatar } from "@/components/shared/medallion-avatar";
import {
  ClientPagination,
  usePagedItems,
} from "@/components/shared/pagination-controls";
import { UserAvatar } from "@/components/shared/user-avatar";
import { PAGE_SIZES } from "@/lib/pagination";
import { cn } from "@/lib/utils";

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
      <div className="rounded-[18px] bg-[#F3F4F6] px-5 py-14 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EAE7F5]">
          <MessageCircle className="h-6 w-6 text-[#524096]" strokeWidth={1.6} />
        </div>
        <p className="m-0 text-[17px] font-semibold text-[#1E1848]">
          {emptyTitle}
        </p>
        <p className="mx-auto mt-1.5 max-w-xs text-[14px] leading-5 text-[#6B6B70]">
          {emptyBody}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {pageItems.map((item) => (
        <div
          className="flex items-center gap-3.5 rounded-[18px] bg-[#F3F4F6] p-4 transition hover:bg-[#ECE8F6]"
          key={item.bookingId}
        >
          <div className="relative shrink-0">
            {item.medallionTier ? (
              <MedallionAvatar
                avatarUrl={item.avatarUrl}
                className="h-12 w-12"
                name={item.title}
                seed={item.seed ?? item.bookingId}
                size="sm"
                tier={item.medallionTier}
              />
            ) : (
              <UserAvatar
                className="h-12 w-12"
                name={item.title}
                seed={item.seed}
                url={item.avatarUrl}
              />
            )}
            {item.unread ? (
              <span className="pointer-events-none absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#F3F4F6] bg-[#524096]" />
            ) : null}
          </div>

          <Link
            className="flex min-w-0 flex-1 items-center gap-3.5 no-underline"
            href={item.href}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className={cn(
                    "truncate text-[15px] text-[#1E1848]",
                    item.unread ? "font-bold" : "font-semibold",
                  )}
                >
                  {item.title}
                </span>
                {item.timeLabel ? (
                  <span className="shrink-0 text-[12px] text-[#8B8798]">
                    {item.timeLabel}
                  </span>
                ) : null}
              </div>
              <p className="m-0 mt-0.5 truncate text-[12.5px] text-[#8B8798]">
                {item.subtitle}
              </p>
              <p
                className={cn(
                  "m-0 mt-1 truncate text-[13.5px]",
                  item.unread
                    ? "font-semibold text-[#1E1848]"
                    : "font-normal text-[#5F5F66]",
                )}
              >
                {item.preview}
              </p>
            </div>

            <ChevronRight
              className="h-[18px] w-[18px] shrink-0 text-[#C4BFD4]"
              strokeWidth={2}
            />
          </Link>
        </div>
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
