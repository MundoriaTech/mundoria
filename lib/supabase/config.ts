export const SUPABASE_PUBLIC_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export function hasSupabasePublicConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

export function missingSupabasePublicConfig() {
  return SUPABASE_PUBLIC_ENV_VARS.filter(
    (name) => !process.env[name]?.trim(),
  );
}
