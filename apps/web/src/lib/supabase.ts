import { createBrowserClient } from '@apex/api';

/**
 * Browser Supabase client. Only the public URL and publishable key are used
 * here — privileged calls (Gemini, Meta Graph API) go through Edge Functions.
 */
export function getSupabaseClient() {
  return createBrowserClient({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
