export const USER_ROLES = ["customer", "cleaner", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  onesignal_player_id: string | null;
  stripe_customer_id: string | null;
  stripe_account_id: string | null;
  notification_preferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  referral_code: string;
  created_at: string;
  updated_at: string;
}

export function isUserRole(value: unknown): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  customer: "/dashboard",
  cleaner: "/cleaner/dashboard",
  admin: "/admin/dashboard",
};
