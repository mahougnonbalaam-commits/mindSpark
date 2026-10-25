import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

async function invokePayments(body: Record<string, unknown>): Promise<any> {
  if (!supabase) throw new Error('Le paiement n\'est pas encore disponible sur cette installation.');
  const { data, error } = await supabase.functions.invoke('payments', { body });
  if (error) {
    const payload = error instanceof FunctionsHttpError ? await error.context.json().catch(() => ({})) : {};
    if (payload.error === 'not_authenticated') throw new Error('Connectez-vous pour acheter des crédits.');
    throw new Error('Le service de paiement est momentanément indisponible. Réessayez plus tard.');
  }
  return data;
}

export const paymentService = {
  // Creates the FedaPay transaction server-side and sends the buyer to the hosted payment page
  async startCheckout(packId: string): Promise<void> {
    const data = await invokePayments({ action: 'create', pack_id: packId });
    if (!data?.url) throw new Error('Lien de paiement indisponible.');
    window.location.href = data.url;
  },

  // Called when FedaPay sends the buyer back: the server checks the real status and credits once
  async syncPayment(transactionId: string): Promise<{ status: string; credits: number | null }> {
    return invokePayments({ action: 'sync', transaction_id: Number(transactionId) });
  }
};

// FedaPay appends ?id=<transaction>&status=<...> to our callback URL (?payment=return)
export function readPaymentReturn(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('payment') === 'return' ? params.get('id') : null;
}

export function clearPaymentReturn(): void {
  window.history.replaceState(null, '', window.location.pathname);
}
