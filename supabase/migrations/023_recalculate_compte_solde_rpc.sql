-- Recalculer les soldes d'un compte (solde_actuel + soldes avant/après des transactions)
-- en une seule opération SQL (performance).
--
-- Sécurité:
-- - SECURITY DEFINER mais vérifie que auth.uid() est présent.
-- - Ne recalcule que pour l'utilisateur courant.

create or replace function public.recalculate_compte_solde(p_compte_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Mettre à jour solde_avant / solde_apres avec une somme cumulée.
  with tx as (
    select
      t.id,
      t.user_id,
      t.compte_id,
      t.date_transaction,
      t.created_at,
      case
        when t.type_transaction = 'credit' then t.montant
        else -t.montant
      end as signed_amount
    from transactions_bancaires t
    where t.user_id = v_user_id
      and t.compte_id = p_compte_id
  ),
  calc as (
    select
      tx.id,
      tx.signed_amount,
      sum(tx.signed_amount) over (
        order by tx.date_transaction asc, tx.created_at asc, tx.id asc
        rows between unbounded preceding and current row
      ) as running_sum
    from tx
  )
  update transactions_bancaires t
  set
    solde_apres = cb.solde_initial + c.running_sum,
    solde_avant = cb.solde_initial + (c.running_sum - c.signed_amount)
  from calc c
  join comptes_bancaires cb
    on cb.id = p_compte_id
   and cb.user_id = v_user_id
  where t.id = c.id
    and t.user_id = v_user_id;

  -- Mettre à jour solde_actuel du compte.
  update comptes_bancaires cb
  set solde_actuel = cb.solde_initial + coalesce((
    select sum(
      case when t.type_transaction = 'credit' then t.montant else -t.montant end
    )
    from transactions_bancaires t
    where t.user_id = v_user_id
      and t.compte_id = p_compte_id
  ), 0)
  where cb.id = p_compte_id
    and cb.user_id = v_user_id;
end;
$$;



















