import { defaultLocale, hasLocale } from '@/i18n/config';
import { getServerSupabase } from '@/lib/supabase-server';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Google OAuth lands here with a `code` to exchange for a session. This is
 * the only place in the app that writes the initial session cookie — every
 * later request just reads it back via the proxy.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const rawLocale = searchParams.get('locale');
  const locale = rawLocale && hasLocale(rawLocale) ? rawLocale : defaultLocale;
  const next = searchParams.get('next');

  if (code) {
    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const destination = next && next.startsWith('/') ? next : `/${locale}`;
      return NextResponse.redirect(new URL(destination, origin));
    }
  }

  return NextResponse.redirect(new URL(`/${locale}/sign-in`, origin));
}
