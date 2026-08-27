/**
 * Response headers applied to every route.
 *
 * The Content-Security-Policy is built per request because it carries a
 * one-time nonce. Next.js reads the nonce out of this header and stamps it onto
 * the scripts it injects, so no inline script runs without it.
 */

/** Origins the browser is allowed to talk to. Nothing else is reachable. */
const SUPABASE_ORIGIN = 'https://*.supabase.co';
const SUPABASE_REALTIME = 'wss://*.supabase.co';

export function buildContentSecurityPolicy(nonce: string, isDev: boolean): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],

    // `strict-dynamic` means a script loaded by a nonced script inherits trust,
    // which is what Next's chunk loading needs. Host allowlists are ignored by
    // browsers that honour `strict-dynamic`, so this is nonce-only in practice.
    // The dev server needs eval for Fast Refresh; production never does.
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],

    // Tailwind ships a stylesheet, but React and next/font still emit inline
    // <style> elements that carry no nonce, so this cannot be tightened without
    // breaking rendering.
    'style-src': ["'self'", "'unsafe-inline'"],

    // `blob:` covers object URLs for a generated image before it is uploaded;
    // Supabase Storage serves the persisted ones.
    'img-src': ["'self'", 'data:', 'blob:', SUPABASE_ORIGIN],
    'font-src': ["'self'", 'data:'],

    // The only backend a browser may reach. Gemini and the Meta Graph API are
    // deliberately absent: those calls belong to Edge Functions, and a browser
    // that could reach them directly would mean a key had leaked.
    'connect-src': ["'self'", SUPABASE_ORIGIN, SUPABASE_REALTIME],

    'media-src': ["'self'", 'blob:', SUPABASE_ORIGIN],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],

    // Clickjacking: no one may frame this app, and it frames no one.
    'frame-ancestors': ["'none'"],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],

    // Stops an injected <base> from re-pointing every relative URL, and stops a
    // form from posting credentials to another origin.
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };

  const policy = Object.entries(directives)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ');

  return isDev ? policy : `${policy}; upgrade-insecure-requests`;
}

/** Headers that never vary per request. */
export const STATIC_SECURITY_HEADERS: Array<{ key: string; value: string }> = [
  // Two years, subdomains included, preload-eligible. Vercel terminates TLS, so
  // this is only meaningful in production.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },

  // No MIME sniffing: an uploaded asset served with the wrong type must not be
  // reinterpreted as a script.
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  // Legacy companion to frame-ancestors, for browsers that predate CSP 2.
  { key: 'X-Frame-Options', value: 'DENY' },

  // Never leak a path — which can contain a post or brand id — to another site.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  // The app needs none of these, so they are switched off rather than left to
  // whatever a future dependency decides to ask for.
  {
    key: 'Permissions-Policy',
    value: [
      'accelerometer=()',
      'autoplay=()',
      'camera=()',
      'display-capture=()',
      'encrypted-media=()',
      'geolocation=()',
      'gyroscope=()',
      'microphone=()',
      'midi=()',
      'payment=()',
      'usb=()',
      'interest-cohort=()',
    ].join(', '),
  },

  // Isolates this origin from other tabs and from cross-origin popups.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },

  // Blocks the DNS-prefetch side channel on outbound links.
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
];
