// Prices shown in the UI. Display only: the real values are enforced server-side, keep them in sync:
//   - CREDIT_COSTS -> supabase/functions/generate/index.ts
//   - CREDIT_PACKS -> supabase/functions/_shared/fedapay.ts
export const CREDIT_COSTS = {
  video_prompts: 1
} as const;

// PROVISOIRE : grille à remplacer par les vrais prix
export const CREDIT_PACKS = [
  { id: 'starter', label: 'Pack Starter', credits: 20, amount: 1000, currency: 'XOF' },
  { id: 'pro', label: 'Pack Pro', credits: 60, amount: 2500, currency: 'XOF' },
  { id: 'max', label: 'Pack Max', credits: 150, amount: 5000, currency: 'XOF' }
] as const;

export type CreditPack = (typeof CREDIT_PACKS)[number];

export function formatPrice(amount: number, currency: string): string {
  return `${amount.toLocaleString('fr-FR')} ${currency === 'XOF' ? 'FCFA' : currency}`;
}
