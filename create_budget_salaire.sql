-- Module Budget Salaire / Budgets mensuels autonomes
-- Ce module est indépendant des comptes bancaires.

-- TABLE 1 : budgets mensuels (un enregistrement par mois)
create table if not exists public.budget_salaire_mois (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  annee integer not null,
  mois integer not null check (mois between 1 and 12),
  libelle text not null,
  revenu_mensuel numeric(18,2) not null,
  montant_depense_total numeric(18,2) not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (user_id, annee, mois)
);

-- TABLE 2 : rubriques de dépenses pour un budget mensuel
create table if not exists public.budget_salaire_rubriques (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  budget_mois_id uuid not null references public.budget_salaire_mois(id) on delete cascade,
  nom text not null,
  montant_budgete numeric(18,2) not null,
  montant_depense numeric(18,2) not null default 0,
  type_depense text not null check (type_depense in ('progressive', 'unique')),
  statut text not null default 'en_cours' check (statut in ('en_cours', 'terminee', 'annulee')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- TABLE 3 : mouvements (dépenses réelles) sur une rubrique
create table if not exists public.budget_salaire_mouvements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  rubrique_id uuid not null references public.budget_salaire_rubriques(id) on delete cascade,
  date_operation timestamp with time zone not null default now(),
  montant numeric(18,2) not null,
  description text,
  created_at timestamp with time zone default now()
);

-- Index pour accélérer les recherches
create index if not exists idx_budget_salaire_mois_user
  on public.budget_salaire_mois(user_id, annee, mois);

create index if not exists idx_budget_salaire_rubriques_budget
  on public.budget_salaire_rubriques(budget_mois_id);

create index if not exists idx_budget_salaire_mouvements_rubrique
  on public.budget_salaire_mouvements(rubrique_id);

-- Activer la RLS
alter table public.budget_salaire_mois enable row level security;
alter table public.budget_salaire_rubriques enable row level security;
alter table public.budget_salaire_mouvements enable row level security;

-- Politiques simple : chaque utilisateur ne voit que ses propres enregistrements
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'budget_salaire_mois' and policyname = 'budget_salaire_mois_user_is_owner'
  ) then
    create policy budget_salaire_mois_user_is_owner
      on public.budget_salaire_mois
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'budget_salaire_rubriques' and policyname = 'budget_salaire_rubriques_user_is_owner'
  ) then
    create policy budget_salaire_rubriques_user_is_owner
      on public.budget_salaire_rubriques
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'budget_salaire_mouvements' and policyname = 'budget_salaire_mouvements_user_is_owner'
  ) then
    create policy budget_salaire_mouvements_user_is_owner
      on public.budget_salaire_mouvements
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;


