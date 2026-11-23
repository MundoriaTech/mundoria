/**
 * Opens the site support chat. The launcher listens and shows SalesIQ.
 */

export const SUPPORT_MESSENGER_EVENT = "mundoria:open-support-messenger";

export type SupportMessengerTab = "home" | "messages" | "help";

export function openSupportMessenger(tab: SupportMessengerTab = "home") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SUPPORT_MESSENGER_EVENT, { detail: { tab } }),
  );
}
