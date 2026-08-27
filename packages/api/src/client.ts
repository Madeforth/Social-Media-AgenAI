import type { Database } from '@apex/types';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { assertSupabaseConfig, type SupabasePublicConfig } from './env';

export type ApexSupabaseClient = SupabaseClient<Database>;

/**
 * Creates a Supabase client for a browser or React Native runtime.
 *
 * Row Level Security is the only access boundary these clients get. Every table
 * in `public` has RLS enabled and `anon` holds no grants at all, so an
 * unauthenticated client can read nothing.
 */
export function createBrowserClient(config: Partial<SupabasePublicConfig>): ApexSupabaseClient {
  const { url, publishableKey } = assertSupabaseConfig(config);
  return createClient<Database>(url, publishableKey);
}
