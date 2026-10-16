export type SupportConversationStatus = "open" | "closed";
export type SupportSenderType = "user" | "admin" | "system";

export type SupportConversation = {
  created_at: string;
  guest_email: string | null;
  guest_name: string | null;
  guest_token: string | null;
  id: string;
  last_message_at: string;
  last_message_preview: string | null;
  status: SupportConversationStatus;
  subject: string | null;
  unread_admin: number;
  unread_user: number;
  updated_at: string;
  user_id: string | null;
};

export type SupportMessage = {
  content: string;
  conversation_id: string;
  created_at: string;
  id: string;
  sender_id: string | null;
  sender_type: SupportSenderType;
};

export type SupportConversationWithUser = SupportConversation & {
  user?: {
    email: string | null;
    full_name: string | null;
    id: string;
  } | null;
};
