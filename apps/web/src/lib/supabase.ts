import { createSsrBrowserClient } from '@apex/api';

/**
 * Browser Supabase client. The session lives in cookies (not `localStorage`)
 * so the proxy and Server Components can read the same session from the
 * request. Only the public URL and publishable key are used here — privileged
 * calls (Gemini, Meta Graph API) go through Edge Functions.
 */
export function getSupabaseClient() {
  return createSsrBrowserClient({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
