import type { Session } from '@supabase/supabase-js';

/**
 * Calls a Supabase Edge Function with the signed-in user's own access token,
 * the same pattern as the web server actions in apps/web/src/lib/actions.ts —
 * the function itself re-verifies authorization, this is just the transport.
 */
export async function callFunction<T = unknown>(
  session: Session | null,
  name: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; data: T | null }> {
  if (!session) return { ok: false, status: 401, data: null };

  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/${name}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => null)) as T | null;
    return { ok: response.ok, status: response.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}
