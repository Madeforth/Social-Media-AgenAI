import type { Database } from '@apex/types';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { assertSupabaseConfig, type SupabasePublicConfig } from './env';

export type ApexSupabaseClient = SupabaseClient<Database>;

/**
 * Creates a Supabase client for a browser or React Native runtime.
 *
 * Row Level Security is the only access boundary these clients get, so every
 * organization-scoped table must have RLS enabled before it is queried here.
 */
export function createBrowserClient(config: Partial<SupabasePublicConfig>): ApexSupabaseClient {
  const { url, anonKey } = assertSupabaseConfig(config);
  return createClient<Database>(url, anonKey);
}
