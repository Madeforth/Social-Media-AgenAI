/**
 * Public Supabase configuration. Only the project URL and the publishable key
 * are ever allowed on a client — the secret key and all provider credentials
 * stay in Supabase secrets and are read exclusively inside Edge Functions.
 */
export interface SupabasePublicConfig {
  url: string;
  publishableKey: string;
}

export function assertSupabaseConfig(config: Partial<SupabasePublicConfig>): SupabasePublicConfig {
  if (!config.url) {
    throw new Error(
      'Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_URL.',
    );
  }
  if (!config.publishableKey) {
    throw new Error(
      'Missing Supabase publishable key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / ' +
        'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }
  return { url: config.url, publishableKey: config.publishableKey };
}
