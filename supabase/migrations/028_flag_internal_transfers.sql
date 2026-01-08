-- 🚦 Marquer les transferts internes pour éviter le double comptage

-- 1) Ajouter les nouvelles colonnes
alter table public.transactions_bancaires
  add column if not exists is_internal_transfer boolean not null default false;

alter table public.transactions_bancaires
  add column if not exists transfer_group_id uuid null;

comment on column public.transactions_bancaires.is_internal_transfer
  is 'Indique si la transaction fait partie d''un transfert interne (débit/credit entre comptes).';

comment on column public.transactions_bancaires.transfer_group_id
  is 'Identifiant commun aux deux écritures d''un transfert interne.';

create index if not exists idx_transactions_bancaires_internal_flag
  on public.transactions_bancaires (is_internal_transfer);

create index if not exists idx_transactions_bancaires_transfer_group
  on public.transactions_bancaires (transfer_group_id)
  where transfer_group_id is not null;

-- 2) Backfill : identifier les paires existantes (débit/credit mêmes montants marqués "Transfert")
with credits as (
  select
    id,
    user_id,
    montant,
    date_transaction,
    row_number() over (
      partition by user_id, montant
      order by date_transaction, id
    ) as rn
  from public.transactions_bancaires
  where type_transaction = 'credit'
    and (categorie = 'Transfert' or libelle ilike 'transfert%')
),
debits as (
  select
    id,
    user_id,
    montant,
    date_transaction,
    row_number() over (
      partition by user_id, montant
      order by date_transaction, id
    ) as rn
  from public.transactions_bancaires
  where type_transaction = 'debit'
    and (categorie = 'Transfert' or libelle ilike 'transfert%')
),
paired as (
  select
    d.id as debit_id,
    c.id as credit_id,
    gen_random_uuid() as grp_id
  from debits d
  join credits c
    on c.user_id = d.user_id
   and c.montant = d.montant
   and c.rn = d.rn
   and c.id <> d.id
),
flagged as (
  select debit_id as tx_id, grp_id from paired
  union all
  select credit_id as tx_id, grp_id from paired
)
update public.transactions_bancaires t
set is_internal_transfer = true,
    transfer_group_id = coalesce(t.transfer_group_id, flagged.grp_id)
from flagged
where t.id = flagged.tx_id;

-- 3) Supprimer les éventuels groupes orphelins (deux fois la même écriture)
update public.transactions_bancaires
set transfer_group_id = null,
    is_internal_transfer = false
where transfer_group_id is not null
  and (
    select count(*)
    from public.transactions_bancaires t2
    where t2.transfer_group_id = public.transactions_bancaires.transfer_group_id
  ) < 2;




