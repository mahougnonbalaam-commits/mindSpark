// Code partagé par les fonctions "payments" et "fedapay-webhook".
//
// Secrets requis (supabase secrets set ...) :
//   FEDAPAY_SECRET_KEY      clé secrète FedaPay (sk_sandbox_... ou sk_live_...)
//   FEDAPAY_WEBHOOK_SECRET  secret de l'endpoint webhook (wh_sandbox_... ou wh_live_...)
//   FEDAPAY_ENV             "sandbox" (par défaut) ou "live"
//   APP_URL                 adresse publique de l'app, ex. https://mindspark.vercel.app

import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';

// Grille tarifaire (fait foi). PROVISOIRE : à remplacer par les vrais prix,
// puis reporter les mêmes valeurs dans src/services/pricing.ts (affichage).
export const CREDIT_PACKS = {
  starter: { credits: 20, amount: 1000, currency: 'XOF', label: 'Pack Starter' },
  pro: { credits: 60, amount: 2500, currency: 'XOF', label: 'Pack Pro' },
  max: { credits: 150, amount: 5000, currency: 'XOF', label: 'Pack Max' }
} as const;

export type PackId = keyof typeof CREDIT_PACKS;

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
}

const API_BASE = Deno.env.get('FEDAPAY_ENV') === 'live'
  ? 'https://api.fedapay.com/v1'
  : 'https://sandbox-api.fedapay.com/v1';

export async function fedapay(path: string, init: { method: 'GET' | 'POST'; body?: unknown }): Promise<any> {
  const secret = Deno.env.get('FEDAPAY_SECRET_KEY');
  if (!secret) throw new Error('FEDAPAY_SECRET_KEY manquante');

  const res = await fetch(`${API_BASE}${path}`, {
    method: init.method,
    headers: {
      'Authorization': `Bearer ${secret}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`FedaPay ${init.method} ${path} -> HTTP ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data;
}

// The API may return the object directly or wrapped in a "v1/transaction" key
export function unwrapTransaction(data: any): any {
  return data?.['v1/transaction'] ?? data?.transaction ?? data;
}

/**
 * Re-reads the transaction from FedaPay (never trusts the webhook body or the browser redirect)
 * and credits the matching payment exactly once if it is approved.
 */
export async function settleTransaction(
  admin: SupabaseClient,
  transactionId: number
): Promise<{ status: string; credits: number | null }> {
  const tx = unwrapTransaction(await fedapay(`/transactions/${transactionId}`, { method: 'GET' }));
  const status: string = tx?.status ?? 'unknown';

  if (status === 'approved' || status === 'transferred') {
    const { data: balance, error } = await admin.rpc('credit_payment', {
      p_transaction_id: transactionId,
      p_amount_paid: Number(tx.amount)
    });
    if (error) throw new Error(`credit_payment: ${error.message}`);
    return { status: 'approved', credits: balance ?? null };
  }

  if (status === 'declined' || status === 'canceled' || status === 'refunded') {
    await admin.rpc('fail_payment', { p_transaction_id: transactionId });
  }
  return { status, credits: null };
}
