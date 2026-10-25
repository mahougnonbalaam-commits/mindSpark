-- MindSpark AI : achats de crédits via FedaPay
--
-- Une ligne par transaction FedaPay. Les crédits ne sont ajoutés qu'une seule fois,
-- par credit_payment(), après vérification du statut "approved" auprès de l'API FedaPay
-- (déclenché par le webhook ou par le retour de l'utilisateur sur l'app).

create table public.payments (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  fedapay_transaction_id bigint unique,
  pack_id text not null,
  credits integer not null check (credits > 0),
  amount integer not null check (amount > 0),   -- montant attendu, en unités de la devise (XOF)
  currency text not null default 'XOF',
  status text not null default 'pending' check (status in ('pending', 'credited', 'failed')),
  created_at timestamptz not null default now(),
  credited_at timestamptz
);

create index payments_user_idx on public.payments (user_id, created_at desc);

alter table public.payments enable row level security;

create policy "Lire ses paiements" on public.payments
  for select using (auth.uid() = user_id);

-- Crédite un paiement une seule fois. Retourne le nouveau solde, ou null si le paiement
-- est inconnu, déjà crédité, ou si le montant payé ne correspond pas au montant attendu.
create or replace function public.credit_payment(p_transaction_id bigint, p_amount_paid integer)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid;
  v_credits integer;
begin
  update public.payments
     set status = 'credited', credited_at = now()
   where fedapay_transaction_id = p_transaction_id
     and status = 'pending'
     and amount = p_amount_paid
  returning user_id, credits into v_user_id, v_credits;

  if v_user_id is null then
    return null;
  end if;

  return public.add_credits(v_user_id, v_credits, 'purchase:fedapay:' || p_transaction_id);
end;
$$;

-- Marque un paiement refusé / annulé (sans effet s'il a déjà été crédité)
create or replace function public.fail_payment(p_transaction_id bigint)
returns void
language sql security definer set search_path = public as $$
  update public.payments
     set status = 'failed'
   where fedapay_transaction_id = p_transaction_id and status = 'pending';
$$;

revoke execute on function public.credit_payment(bigint, integer) from public, anon, authenticated;
revoke execute on function public.fail_payment(bigint) from public, anon, authenticated;
grant execute on function public.credit_payment(bigint, integer) to service_role;
grant execute on function public.fail_payment(bigint) to service_role;
