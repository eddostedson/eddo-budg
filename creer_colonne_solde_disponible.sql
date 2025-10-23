-- CRÉER LA COLONNE SOLDE_DISPONIBLE MANQUANTE
-- À exécuter dans Supabase SQL Editor

-- 1. AJOUTER LA COLONNE SOLDE_DISPONIBLE
ALTER TABLE recettes 
ADD COLUMN solde_disponible NUMERIC DEFAULT 0;

-- 2. CALCULER LE SOLDE DISPONIBLE POUR CHAQUE RECETTE
UPDATE recettes 
SET solde_disponible = amount - COALESCE((
    SELECT SUM(d.montant) 
    FROM depenses d 
    WHERE d.recette_id = recettes.id
), 0);

-- 3. VÉRIFIER LA STRUCTURE APRÈS AJOUT
SELECT 
    'STRUCTURE APRÈS AJOUT' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'recettes'
ORDER BY ordinal_position;

-- 4. VÉRIFIER LES DONNÉES APRÈS CALCUL
SELECT 
    'SOLDE DISPONIBLE CALCULÉ' as info,
    description,
    amount as montant_initial,
    solde_disponible,
    (amount - solde_disponible) as depenses_calculees
FROM recettes 
ORDER BY amount DESC;
