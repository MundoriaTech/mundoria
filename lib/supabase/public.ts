import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { hasSupabasePublicConfig } from "@/lib/supabase/config";

/**
 * Cookie-free anon client for public editorial reads (blog/help).
 * Safe to call from generateStaticParams / generateMetadata — unlike
 * createServerClient(), which requires a request cookie store.
 */
let publicClient: SupabaseClient | null | undefined;

export function createPublicSupabaseClient(): SupabaseClient | null {
  if (publicClient !== undefined) return publicClient;
  if (!hasSupabasePublicConfig()) {
    publicClient = null;
    return publicClient;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    publicClient = null;
    return publicClient;
  }
  publicClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  return publicClient;
}
