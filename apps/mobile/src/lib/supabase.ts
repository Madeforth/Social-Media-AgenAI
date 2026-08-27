import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBrowserClient } from '@apex/api';

/**
 * Supabase client for the React Native runtime. Only the public URL and
 * publishable key are bundled — privileged calls go through Edge Functions.
 *
 * The session is persisted in AsyncStorage and refreshed automatically.
 * `detectSessionInUrl` is off because there is no URL bar to parse — the
 * Google OAuth round trip is handled explicitly in `src/auth/provider.tsx`.
 */
export function getSupabaseClient() {
  return createBrowserClient(
    {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL,
      publishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    },
    {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    },
  );
}
