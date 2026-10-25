// Edge Function "fedapay-webhook" : reçoit les événements FedaPay.
// À déployer SANS vérification JWT (FedaPay n'envoie pas de jeton Supabase) :
//   supabase functions deploy fedapay-webhook --no-verify-jwt
// L'authenticité est garantie par la signature X-FEDAPAY-SIGNATURE.

import { adminClient, settleTransaction } from '../_shared/fedapay.ts';

const TOLERANCE_SECONDS = 300; // same default as the official FedaPay libraries

const encoder = new TextEncoder();

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Header format: "t=<unix timestamp>,s=<hex signature>[,s=<...>]", signed string: "<t>.<raw body>"
async function verifySignature(rawBody: string, header: string | null, secret: string): Promise<boolean> {
  if (!header) return false;
  let timestamp = -1;
  const signatures: string[] = [];
  for (const part of header.split(',')) {
    const [key, value] = part.split('=', 2).map(s => s?.trim());
    if (key === 't') timestamp = parseInt(value, 10);
    if (key === 's' && value) signatures.push(value);
  }
  if (timestamp < 0 || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE_SECONDS) return false;

  const expected = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  return signatures.some(sig => timingSafeEqual(sig, expected));
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  const secret = Deno.env.get('FEDAPAY_WEBHOOK_SECRET');
  if (!secret) {
    console.error('FEDAPAY_WEBHOOK_SECRET manquante');
    return new Response('not configured', { status: 500 });
  }

  // The signature covers the exact raw body: read it before any parsing
  const rawBody = await req.text();
  if (!(await verifySignature(rawBody, req.headers.get('x-fedapay-signature'), secret))) {
    return new Response('invalid signature', { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  const name: string = event?.name ?? '';
  if (!name.startsWith('transaction.')) {
    return new Response(JSON.stringify({ received: true, ignored: name }), { status: 200 });
  }

  const transactionId = Number(event?.entity?.id ?? event?.object_id ?? event?.data?.id);
  if (!transactionId) {
    console.error('webhook without transaction id', name);
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  try {
    const result = await settleTransaction(adminClient(), transactionId);
    return new Response(JSON.stringify({ received: true, status: result.status }), { status: 200 });
  } catch (err) {
    // A 5xx makes FedaPay retry the delivery later
    console.error('webhook settle failed', transactionId, err);
    return new Response('settle failed', { status: 500 });
  }
});
