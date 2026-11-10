/**
 * Tiny, dependency-free half of the support messenger: the open event and its
 * dispatcher. Kept apart so buttons that open the messenger do not pull the
 * full widget (and its emoji/GIF pickers) into the page bundle.
 */

export const SUPPORT_MESSENGER_EVENT = "mundoria:open-support-messenger";

export type SupportMessengerTab = "home" | "messages" | "help";

export function openSupportMessenger(tab: SupportMessengerTab = "home") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SUPPORT_MESSENGER_EVENT, { detail: { tab } }),
  );
}
