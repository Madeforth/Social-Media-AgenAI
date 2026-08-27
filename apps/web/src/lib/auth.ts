import type { User } from '@supabase/supabase-js';

import { getServerSupabase } from './supabase-server';

/** The signed-in user, or `null`. The proxy already guarantees one exists on every workspace route. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
