import { createSsrServerClient } from '@apex/api';
import { NextResponse, type NextRequest } from 'next/server';

import { defaultLocale, hasLocale, type Locale } from '@/i18n/config';
import { buildContentSecurityPolicy } from '@/lib/security-headers';

const LOCALE_COOKIE = 'NEXT_LOCALE';

/**
 * Site-wide gate in front of everything, including `/sign-in` itself. The app
 * is not a public product yet — only someone who already has the shared
 * credential should ever reach the Google sign-in button.
 */
function isAuthorizedBySiteBasicAuth(request: NextRequest): boolean {
  const user = process.env.SITE_BASIC_AUTH_USER;
  const pass = process.env.SITE_BASIC_AUTH_PASS;
  if (!user || !pass) return true;

  const header = request.headers.get('authorization');
  if (!header?.startsWith('Basic ')) return false;

  const decoded = atob(header.slice('Basic '.length));
  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex === -1) return false;

  return decoded.slice(0, separatorIndex) === user && decoded.slice(separatorIndex + 1) === pass;
}

function siteBasicAuthChallenge(): NextResponse {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'www-authenticate': 'Basic realm="Madeforth Social AI"' },
  });
}

/** First path segment as a `Locale`, if the request already carries one. */
function localeFromPathname(pathname: string): Locale | null {
  const [, segment] = pathname.split('/');
  return segment && hasLocale(segment) ? segment : null;
}

/** Negotiates a locale from the request: cookie, then `Accept-Language`, then the default. */
function negotiateLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && hasLocale(cookieLocale)) return cookieLocale;

  const acceptLanguage = request.headers.get('accept-language') ?? '';
  for (const tag of acceptLanguage.split(',')) {
    const lang = tag.trim().split(';')[0]?.split('-')[0];
    if (lang && hasLocale(lang)) return lang;
  }

  return defaultLocale;
}

/**
 * Issues a fresh CSP nonce for every request, ensures every path carries a
 * locale prefix (redirecting once if it doesn't), and gates every
 * `[locale]` route behind a signed-in session except `/sign-in` itself.
 *
 * The nonce is put on the *request* headers as well as the response: Next.js
 * looks for it there when it renders, so its own scripts are emitted with the
 * matching nonce and everything else inline is refused by the browser.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // API routes are server-to-server, never a browser page, and authenticate
  // themselves (the creative-render route verifies an HMAC signature) — the
  // site's shared Basic Auth credential is for gating human access to pages,
  // and the locale/session logic below doesn't apply to them either.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (!isAuthorizedBySiteBasicAuth(request)) {
    return siteBasicAuthChallenge();
  }

  // The OAuth callback is deliberately outside `[locale]` — it's a machine
  // redirect target, not a screen, and never needs a locale prefix or an
  // auth check (it's what establishes the session in the first place).
  if (pathname.startsWith('/auth/')) {
    return NextResponse.next();
  }

  const pathLocale = localeFromPathname(pathname);

  if (!pathLocale) {
    const locale = negotiateLocale(request);
    const redirectUrl = new URL(`/${locale}${pathname}${search}`, request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    redirectResponse.cookies.set(LOCALE_COOKIE, locale, { maxAge: 60 * 60 * 24 * 365, path: '/' });
    return redirectResponse;
  }

  const nonce = crypto.randomUUID().replace(/-/g, '');
  const isDev = process.env.NODE_ENV === 'development';
  const csp = buildContentSecurityPolicy(nonce, isDev);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('content-security-policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('content-security-policy', csp);

  if (request.cookies.get(LOCALE_COOKIE)?.value !== pathLocale) {
    response.cookies.set(LOCALE_COOKIE, pathLocale, { maxAge: 60 * 60 * 24 * 365, path: '/' });
  }

  const supabase = createSsrServerClient(
    {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    },
    {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathAfterLocale = pathname.slice(pathLocale.length + 1) || '/';
  const isSignInRoute = pathAfterLocale === '/sign-in';

  if (!user && !isSignInRoute) {
    const signInUrl = new URL(`/${pathLocale}/sign-in`, request.url);
    signInUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(signInUrl);
  }

  if (user && isSignInRoute) {
    return NextResponse.redirect(new URL(`/${pathLocale}`, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Every path except Next's own static output and the favicon. Prerendered
     * static assets are immutable and carry no markup, so a per-request nonce
     * on them would only defeat caching.
     */
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
