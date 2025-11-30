-- Création des tables pour gérer les "fonds partagés" entre comptes bancaires
-- Cette fonctionnalité permet de recevoir un montant sur un compte A
-- tout en le rendant disponible (virtuellement) pour un ou plusieurs autres comptes.

-- Table principale : fonds partagés
create table if not exists public.shared_funds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  source_compte_id uuid not null references public.comptes_bancaires(id) on delete cascade,
  -- Optionnel : compte "principal" cible (par exemple un deuxième compte concerné)
  primary_compte_id uuid references public.comptes_bancaires(id) on delete set null,
  transaction_source_id uuid references public.transactions_bancaires(id) on delete set null,
  libelle text not null,
  description text,
  montant_initial numeric(18,2) not null,
  montant_restant numeric(18,2) not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Historique détaillé de tous les mouvements imputés sur un fonds partagé
create table if not exists public.shared_fund_movements (
  id uuid primary key default gen_random_uuid(),
  shared_fund_id uuid not null references public.shared_funds(id) on delete cascade,
  user_id uuid not null,
  compte_id uuid not null references public.comptes_bancaires(id) on delete cascade,
  -- sens du mouvement par rapport au fonds (debit = on consomme le fonds)
  type text not null check (type in ('debit', 'credit')),
  montant numeric(18,2) not null,
  -- optionnel : lien avec une transaction bancaire classique
  transaction_id uuid references public.transactions_bancaires(id) on delete set null,
  libelle text,
  created_at timestamp with time zone default now()
);

-- Index utiles pour les recherches
create index if not exists idx_shared_funds_user_id on public.shared_funds(user_id);
create index if not exists idx_shared_funds_source_compte on public.shared_funds(source_compte_id);
create index if not exists idx_shared_fund_movements_fund on public.shared_fund_movements(shared_fund_id);
create index if not exists idx_shared_fund_movements_compte on public.shared_fund_movements(compte_id);

-- RLS (à adapter selon la politique du projet)
alter table public.shared_funds enable row level security;
alter table public.shared_fund_movements enable row level security;

-- Autoriser l'utilisateur authentifié à voir uniquement ses propres fonds
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'shared_funds' and policyname = 'shared_funds_user_is_owner'
  ) then
    create policy shared_funds_user_is_owner
      on public.shared_funds
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'shared_fund_movements' and policyname = 'shared_fund_movements_user_is_owner'
  ) then
    create policy shared_fund_movements_user_is_owner
      on public.shared_fund_movements
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;






