import { NextResponse, type NextRequest } from 'next/server';

import { defaultLocale, hasLocale, type Locale } from '@/i18n/config';
import { buildContentSecurityPolicy } from '@/lib/security-headers';

const LOCALE_COOKIE = 'NEXT_LOCALE';

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
 * Issues a fresh CSP nonce for every request, and ensures every path carries a
 * locale prefix (redirecting once if it doesn't).
 *
 * The nonce is put on the *request* headers as well as the response: Next.js
 * looks for it there when it renders, so its own scripts are emitted with the
 * matching nonce and everything else inline is refused by the browser.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
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
