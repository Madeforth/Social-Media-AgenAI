import type { Database } from '@apex/types';
import {
  createBrowserClient as createSupabaseSsrBrowserClient,
  createServerClient as createSupabaseSsrServerClient,
  type CookieMethodsServer,
} from '@supabase/ssr';
import { createClient, type SupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js';

import { assertSupabaseConfig, type SupabasePublicConfig } from './env';

export type ApexSupabaseClient = SupabaseClient<Database>;

/**
 * Creates a Supabase client for a React Native runtime, or any caller that
 * manages its own session storage (pass `options.auth.storage`).
 *
 * Row Level Security is the only access boundary these clients get. Every table
 * in `public` has RLS enabled and `anon` holds no grants at all, so an
 * unauthenticated client can read nothing.
 */
export function createBrowserClient(
  config: Partial<SupabasePublicConfig>,
  options?: SupabaseClientOptions<'public'>,
): ApexSupabaseClient {
  const { url, publishableKey } = assertSupabaseConfig(config);
  return createClient<Database>(url, publishableKey, options);
}

/**
 * Creates a Supabase client for the browser that keeps its session in
 * cookies instead of `localStorage`, so a server (Server Component, Route
 * Handler, or the proxy) can read the same session from the request.
 */
export function createSsrBrowserClient(config: Partial<SupabasePublicConfig>): ApexSupabaseClient {
  const { url, publishableKey } = assertSupabaseConfig(config);
  return createSupabaseSsrBrowserClient<Database>(url, publishableKey);
}

/**
 * Creates a Supabase client for server-side use (Server Components, Server
 * Actions, Route Handlers, the proxy) given a cookie adapter. Callers must
 * implement both `getAll` and `setAll` wherever cookies can be written —
 * omitting `setAll` silently breaks token refresh.
 */
export function createSsrServerClient(
  config: Partial<SupabasePublicConfig>,
  cookies: CookieMethodsServer,
): ApexSupabaseClient {
  const { url, publishableKey } = assertSupabaseConfig(config);
  return createSupabaseSsrServerClient<Database>(url, publishableKey, { cookies });
}
