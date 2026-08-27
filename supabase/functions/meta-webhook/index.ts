// `meta-webhook`: the signature-verification half of docs/SECURITY.md's "Not
// yet addressed — Instagram webhook signature verification" item.
//
// GET handles Meta's subscription handshake (hub.challenge). POST verifies
// every payload's X-Hub-Signature-256 against META_APP_SECRET before
// touching the body at all — an unsigned or mis-signed payload is rejected
// with 401 and never parsed. What happens with a verified payload (comment
// ingestion into an Inbox feature) is out of scope here; this function's job
// ends at "prove Meta sent this."

const encoder = new TextEncoder();

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const verifyToken = Deno.env.get('META_WEBHOOK_VERIFY_TOKEN');
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    if (!verifyToken || mode !== 'subscribe' || token !== verifyToken || !challenge) {
      return new Response('verification failed', { status: 403 });
    }
    return new Response(challenge, { status: 200 });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405 });
  }

  const appSecret = Deno.env.get('META_APP_SECRET');
  if (!appSecret) {
    return new Response(JSON.stringify({ error: 'META_APP_SECRET not configured' }), {
      status: 503,
    });
  }

  const signatureHeader = req.headers.get('X-Hub-Signature-256');
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return new Response(JSON.stringify({ error: 'missing signature' }), { status: 401 });
  }

  const rawBody = await req.text();
  const expected = await hmacSha256Hex(appSecret, rawBody);
  const provided = signatureHeader.slice('sha256='.length);
  if (!timingSafeEqual(expected, provided)) {
    return new Response(JSON.stringify({ error: 'signature mismatch' }), { status: 401 });
  }

  // Signature verified. Ingestion (Inbox) is a separate, not-yet-built feature —
  // acknowledge so Meta does not retry, without acting on the payload.
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
