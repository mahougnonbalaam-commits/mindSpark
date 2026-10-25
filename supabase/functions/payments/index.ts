// Edge Function "payments" (appelée par l'app, utilisateur connecté)
//   { action: 'create', pack_id }       -> crée la transaction FedaPay, renvoie { url } de paiement
//   { action: 'sync', transaction_id }  -> au retour de FedaPay : vérifie le paiement et crédite si besoin

import {
  CREDIT_PACKS,
  PackId,
  adminClient,
  corsHeaders,
  fedapay,
  json,
  settleTransaction,
  unwrapTransaction
} from '../_shared/fedapay.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const admin = adminClient();

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { error: 'not_authenticated' });
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return json(401, { error: 'not_authenticated' });
  const user = userData.user;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  try {
    if (body?.action === 'create') {
      const packId = body.pack_id as PackId;
      if (!(packId in CREDIT_PACKS)) return json(400, { error: 'unknown_pack' });
      const pack = CREDIT_PACKS[packId];

      const appUrl = (Deno.env.get('APP_URL') ?? '').replace(/\/+$/, '');
      if (!appUrl) throw new Error('APP_URL manquante');

      // FedaPay sends the buyer back here with ?id=<transaction>&status=...
      const created = unwrapTransaction(await fedapay('/transactions', {
        method: 'POST',
        body: {
          description: `MindSpark AI - ${pack.label} (${pack.credits} crédits)`,
          amount: pack.amount,
          currency: { iso: pack.currency },
          callback_url: `${appUrl}/?payment=return`,
          customer: user.email ? { email: user.email } : undefined,
          custom_metadata: { user_id: user.id, pack_id: packId }
        }
      }));
      const transactionId = Number(created?.id);
      if (!transactionId) throw new Error('Réponse FedaPay sans identifiant de transaction');

      const { error: insertError } = await admin.from('payments').insert({
        user_id: user.id,
        fedapay_transaction_id: transactionId,
        pack_id: packId,
        credits: pack.credits,
        amount: pack.amount,
        currency: pack.currency
      });
      if (insertError) throw new Error(`insert payment: ${insertError.message}`);

      const tokenData = await fedapay(`/transactions/${transactionId}/token`, { method: 'POST' });
      if (!tokenData?.url) throw new Error('Réponse FedaPay sans lien de paiement');
      return json(200, { url: tokenData.url, transaction_id: transactionId });
    }

    if (body?.action === 'sync') {
      const transactionId = Number(body.transaction_id);
      if (!transactionId) return json(400, { error: 'invalid_transaction' });

      // Only the buyer can sync their own payment
      const { data: payment } = await admin
        .from('payments')
        .select('user_id')
        .eq('fedapay_transaction_id', transactionId)
        .maybeSingle();
      if (!payment || payment.user_id !== user.id) return json(404, { error: 'payment_not_found' });

      const result = await settleTransaction(admin, transactionId);
      const { data: profile } = await admin.from('profiles').select('credits').eq('id', user.id).single();
      return json(200, { status: result.status, credits: profile?.credits ?? null });
    }

    return json(400, { error: 'unknown_action' });
  } catch (err) {
    console.error('payments error', err);
    return json(502, { error: 'payment_provider_error' });
  }
});
