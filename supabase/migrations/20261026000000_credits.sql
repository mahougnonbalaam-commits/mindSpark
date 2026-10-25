-- MindSpark AI : comptes utilisateurs et crédits
--
-- Le solde n'est JAMAIS modifiable depuis le navigateur : seules les fonctions
-- ci-dessous (appelées par l'Edge Function avec la clé service_role, ou à la main
-- depuis le SQL Editor) peuvent débiter ou créditer un compte.

-- Crédits offerts à l'inscription (modifier ici, puis réappliquer la fonction handle_new_user)
create or replace function public.signup_credits() returns integer
language sql immutable as $$ select 0 $$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  credits integer not null default 0 check (credits >= 0),
  created_at timestamptz not null default now()
);

create table public.credit_transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta integer not null,            -- négatif = consommation, positif = achat / ajout / remboursement
  reason text not null,              -- ex : 'generation:video_prompts', 'refund:video_prompts', 'purchase', 'manual'
  balance_after integer not null,
  created_at timestamptz not null default now()
);

create index credit_transactions_user_idx on public.credit_transactions (user_id, created_at desc);

-- Lecture seule de ses propres données ; aucune écriture possible côté client
alter table public.profiles enable row level security;
alter table public.credit_transactions enable row level security;

create policy "Lire son profil" on public.profiles
  for select using (auth.uid() = id);

create policy "Lire ses transactions" on public.credit_transactions
  for select using (auth.uid() = user_id);

-- Création automatique du profil à l'inscription
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, credits)
  values (new.id, new.email, public.signup_credits());

  if public.signup_credits() > 0 then
    insert into public.credit_transactions (user_id, delta, reason, balance_after)
    values (new.id, public.signup_credits(), 'signup_bonus', public.signup_credits());
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Débit atomique : échoue (retourne null) si le solde est insuffisant
create or replace function public.consume_credits(p_user_id uuid, p_amount integer, p_reason text)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  new_balance integer;
begin
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  update public.profiles
     set credits = credits - p_amount
   where id = p_user_id and credits >= p_amount
  returning credits into new_balance;

  if new_balance is null then
    return null;
  end if;

  insert into public.credit_transactions (user_id, delta, reason, balance_after)
  values (p_user_id, -p_amount, p_reason, new_balance);
  return new_balance;
end;
$$;

-- Crédit (achat, ajout manuel, remboursement après une erreur de génération)
create or replace function public.add_credits(p_user_id uuid, p_amount integer, p_reason text)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  new_balance integer;
begin
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  update public.profiles
     set credits = credits + p_amount
   where id = p_user_id
  returning credits into new_balance;

  if new_balance is null then
    raise exception 'unknown user %', p_user_id;
  end if;

  insert into public.credit_transactions (user_id, delta, reason, balance_after)
  values (p_user_id, p_amount, p_reason, new_balance);
  return new_balance;
end;
$$;

-- Ces fonctions ne doivent pas être appelables depuis le navigateur
revoke execute on function public.consume_credits(uuid, integer, text) from public, anon, authenticated;
revoke execute on function public.add_credits(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.consume_credits(uuid, integer, text) to service_role;
grant execute on function public.add_credits(uuid, integer, text) to service_role;
