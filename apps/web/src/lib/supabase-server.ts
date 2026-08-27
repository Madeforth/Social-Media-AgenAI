import { createSsrServerClient } from '@apex/api';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client for Server Components, Server Actions and
 * Route Handlers. Cookie writes are wrapped in a `try/catch`: Server
 * Components cannot set cookies, and this is only ever a session-refresh
 * write that the proxy's own `setAll` call already covers on the next
 * request.
 */
export async function getServerSupabase() {
  const cookieStore = await cookies();

  return createSsrServerClient(
    {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    },
    {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render — safe to ignore, the
          // proxy refreshes the session cookie on every request anyway.
        }
      },
    },
  );
}
