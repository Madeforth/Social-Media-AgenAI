/**
 * Verifies the HMAC signature the Creative Engine V2 Edge Function attaches
 * to a render request. The renderer never sees a provider key or the
 * Supabase service-role key — only this shared signing secret — so a leaked
 * renderer URL cannot be used to forge composites or reach anything
 * privileged. Mirror of the signing half in
 * `supabase/functions/_shared/creative-v2.ts`.
 */

const encoder = new TextEncoder();

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return hex(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
}

export async function signRenderBody(secret: string, timestamp: string, body: string): Promise<string> {
  return hmac(secret, `${timestamp}.${body}`);
}

export async function verifyRenderBody(
  secret: string,
  timestamp: string,
  body: string,
  suppliedSignature: string,
  maxClockSkewSeconds = 60,
): Promise<boolean> {
  const millis = Number(timestamp);
  if (!Number.isFinite(millis) || Math.abs(Date.now() - millis) > maxClockSkewSeconds * 1000) return false;
  const expected = await signRenderBody(secret, timestamp, body);
  if (expected.length !== suppliedSignature.length) return false;
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ suppliedSignature.charCodeAt(i);
  return difference === 0;
}
