-- Ajouter la persistance DB pour "Exclure du total des soldes"

alter table public.comptes_bancaires
add column if not exists exclude_from_total boolean not null default false;

create index if not exists idx_comptes_bancaires_exclude_from_total
on public.comptes_bancaires(exclude_from_total);







