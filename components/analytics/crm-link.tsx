"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";

import {
  trackCrmEvent,
  type CrmEventName,
  type CrmEventPayload,
} from "@/lib/analytics/crm-events";

type CrmLinkProps = ComponentProps<typeof Link> & {
  crmEvent: CrmEventName;
  crmPayload?: CrmEventPayload;
};

/** Next Link that fires a CRM dataLayer event on click. */
export function CrmLink({
  crmEvent,
  crmPayload,
  onClick,
  ...props
}: CrmLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    trackCrmEvent(crmEvent, {
      action: crmPayload?.action ?? crmEvent,
      ...crmPayload,
    });
    onClick?.(event);
  }

  return <Link {...props} onClick={handleClick} />;
}
