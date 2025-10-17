-- Script de correction pour supprimer la contrainte problématique
-- sur la table recettes

-- 1. Supprimer la contrainte qui empêche les valeurs négatives
ALTER TABLE recettes DROP CONSTRAINT IF EXISTS recettes_solde_disponible_check;

-- 2. Vérifier que la contrainte a été supprimée
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.recettes'::regclass 
  AND contype = 'c'
  AND conname = 'recettes_solde_disponible_check';

-- 3. Message de confirmation
SELECT 'Contrainte recettes_solde_disponible_check supprimée avec succès!' AS status;







