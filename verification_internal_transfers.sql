-- 🔍 Diagnostic : vérifier les montants susceptibles d'être comptés deux fois
-- Usage: exécuter ce script après la migration 028 pour identifier
--        les paires crédit/débit qui n'ont pas encore été marquées
--        comme transferts internes.

with candidates as (
  select
    c.id as credit_id,
    d.id as debit_id,
    c.user_id,
    c.compte_id as compte_credit_id,
    d.compte_id as compte_debit_id,
    c.montant,
    c.date_transaction as credit_date,
    d.date_transaction as debit_date,
    abs(extract(epoch from c.date_transaction - d.date_transaction)) as delta_seconds,
    c.is_internal_transfer as credit_flag,
    d.is_internal_transfer as debit_flag,
    coalesce(c.transfer_group_id, d.transfer_group_id) as transfer_group_id,
    c.libelle as credit_libelle,
    d.libelle as debit_libelle
  from public.transactions_bancaires c
  join public.transactions_bancaires d
    on d.user_id = c.user_id
   and d.type_transaction = 'debit'
   and c.type_transaction = 'credit'
   and abs(d.montant - c.montant) < 0.01
   and d.id <> c.id
   and c.compte_id <> d.compte_id
)
select
  user_id,
  montant,
  credit_id,
  debit_id,
  compte_credit_id,
  compte_debit_id,
  credit_libelle,
  debit_libelle,
  credit_date,
  debit_date,
  delta_seconds,
  credit_flag,
  debit_flag,
  transfer_group_id
from candidates
where not (credit_flag and debit_flag)
order by delta_seconds asc, montant desc
limit 200;




