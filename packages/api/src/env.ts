/**
 * Public Supabase configuration. Only the project URL and the anon key are ever
 * allowed on a client — the service role key and all provider secrets stay in
 * Supabase secrets and are read exclusively inside Edge Functions.
 */
export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
}

export function assertSupabaseConfig(config: Partial<SupabasePublicConfig>): SupabasePublicConfig {
  if (!config.url) {
    throw new Error(
      'Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_URL.',
    );
  }
  if (!config.anonKey) {
    throw new Error(
      'Missing Supabase anon key. Set NEXT_PUBLIC_SUPABASE_ANON_KEY / EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
  return { url: config.url, anonKey: config.anonKey };
}
