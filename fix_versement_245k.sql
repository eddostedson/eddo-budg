-- Script pour corriger la recette de 245 000 FCFA
-- Ce script ajoute le versement de 45 000 FCFA dans la description

-- 1. DIAGNOSTIC - Voir toutes vos recettes
SELECT 
    'DIAGNOSTIC COMPLET' as etat,
    r.id,
    r.libelle,
    r.montant,
    r.solde_disponible,
    r.description,
    r.created_at,
    r.updated_at
FROM recettes r
WHERE r.user_id = auth.uid()
ORDER BY r.created_at DESC;

-- 2. CORRIGER LA RECETTE DE 245 000 FCFA
-- Ajouter le versement de 45 000 FCFA dans la description
UPDATE recettes 
SET description = COALESCE(description, '') || 
    CASE 
        WHEN description IS NULL OR description = '' THEN ''
        ELSE '\n\n'
    END ||
    'Versement ajouté: 45 000 FCFA - Versement rétroactif (montant initial: 200 000 FCFA)'
WHERE user_id = auth.uid()
  AND montant = 245000
  AND (description IS NULL OR description NOT LIKE '%Versement ajouté%');

-- 3. VÉRIFICATION - Voir la recette corrigée
SELECT 
    'RECETTE CORRIGÉE' as etat,
    r.id,
    r.libelle,
    r.montant,
    r.solde_disponible,
    r.description,
    'Versement de 45 000 FCFA ajouté' as statut
FROM recettes r
WHERE r.user_id = auth.uid()
  AND r.montant = 245000;

-- 4. AFFICHER TOUTES LES RECETTES AVEC VERSEMENTS
SELECT 
    'RECETTES AVEC VERSEMENTS' as etat,
    r.id,
    r.libelle,
    r.montant,
    r.solde_disponible,
    r.description
FROM recettes r
WHERE r.user_id = auth.uid()
  AND r.description LIKE '%Versement ajouté%'
ORDER BY r.created_at DESC;






















