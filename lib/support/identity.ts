import type { User } from "@supabase/supabase-js";

import { readGuestTokenFromRequest } from "@/lib/support/guest-token";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-client";
import type { SupportConversation } from "@/types/support";

export type SupportIdentity = {
  guestToken: string | null;
  user: User | null;
};

export async function resolveSupportIdentity(
  request: Request,
): Promise<SupportIdentity> {
  const { user } = await getRequestUser(request);
  const guestToken = readGuestTokenFromRequest(request);
  return { guestToken, user };
}

export function conversationOwnedBy(
  conversation: Pick<SupportConversation, "guest_token" | "user_id">,
  identity: SupportIdentity,
) {
  if (identity.user && conversation.user_id === identity.user.id) return true;
  if (
    identity.guestToken &&
    conversation.guest_token &&
    conversation.guest_token === identity.guestToken
  ) {
    return true;
  }
  return false;
}

export async function loadOwnedConversation(
  conversationId: string,
  identity: SupportIdentity,
) {
  if (!identity.user && !identity.guestToken) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("support_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (!data) return null;
  const conversation = data as SupportConversation;
  if (!conversationOwnedBy(conversation, identity)) return null;
  return conversation;
}
