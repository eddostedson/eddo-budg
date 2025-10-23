-- Script pour vérifier les contraintes sur la table recettes

-- 1. Vérifier les contraintes de vérification (CHECK constraints)
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.recettes'::regclass 
  AND contype = 'c';

-- 2. Vérifier la structure de la table recettes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'recettes' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Vérifier les données actuelles des recettes
SELECT 
    id,
    libelle,
    montant,
    solde_disponible,
    (montant - solde_disponible) as difference
FROM recettes
ORDER BY created_at DESC
LIMIT 5;




























