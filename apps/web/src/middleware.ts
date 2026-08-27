import { NextResponse, type NextRequest } from 'next/server';

import { buildContentSecurityPolicy } from '@/lib/security-headers';

/**
 * Issues a fresh CSP nonce for every request.
 *
 * The nonce is put on the *request* headers as well as the response: Next.js
 * looks for it there when it renders, so its own scripts are emitted with the
 * matching nonce and everything else inline is refused by the browser.
 */
export function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const isDev = process.env.NODE_ENV === 'development';
  const csp = buildContentSecurityPolicy(nonce, isDev);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('content-security-policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('content-security-policy', csp);
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
