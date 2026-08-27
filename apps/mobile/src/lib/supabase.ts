import { createBrowserClient } from '@apex/api';

/**
 * Supabase client for the React Native runtime. Only the public URL and anon
 * key are bundled — privileged calls go through Edge Functions.
 */
export function getSupabaseClient() {
  return createBrowserClient({
    url: process.env.EXPO_PUBLIC_SUPABASE_URL,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  });
}
