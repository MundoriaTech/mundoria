"use client";

import {
  createClientComponentClient,
  type SupabaseClient,
} from "@supabase/auth-helpers-nextjs";

let browserClient: SupabaseClient | undefined;

export function createBrowserClient() {
  if (!browserClient) {
    browserClient = createClientComponentClient();
  }

  return browserClient;
}
