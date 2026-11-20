"use client";

import { useEffect } from "react";

import {
  trackCrmEvent,
  type CrmEventName,
  type CrmEventPayload,
} from "@/lib/analytics/crm-events";

/** Fire a CRM view event once per session/page (deduped in trackCrmEvent). */
export function CrmPageView({
  customerId,
  event,
  payload,
}: {
  customerId?: string | null;
  event: CrmEventName;
  payload?: CrmEventPayload;
}) {
  useEffect(() => {
    trackCrmEvent(event, {
      customer_id: customerId ?? null,
      ...(payload ?? {}),
    });
    // Dedup lives in trackCrmEvent; avoid re-running on new payload object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, event]);

  return null;
}
