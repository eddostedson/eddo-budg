-- Script pour ajouter rétroactivement les versements dans la description des recettes
-- Ce script identifie les recettes qui ont des versements non tracés et les ajoute dans la description

-- 1. DIAGNOSTIC - Identifier les recettes avec des versements non tracés
SELECT 
    'DIAGNOSTIC' as etat,
    r.id,
    r.libelle,
    r.montant,
    r.solde_disponible,
    r.description,
    CASE 
        WHEN r.description LIKE '%Versement ajouté%' THEN 'Déjà tracé'
        WHEN r.montant > r.solde_disponible THEN 'Versement probable'
        ELSE 'Pas de versement'
    END as statut_versement
FROM recettes r
WHERE r.user_id = auth.uid()
ORDER BY r.created_at DESC;

-- 2. CORRECTION - Ajouter les versements manquants dans la description
-- Pour les recettes qui ont un montant > solde_disponible mais pas de trace dans la description
UPDATE recettes 
SET description = COALESCE(description, '') || 
    CASE 
        WHEN description IS NULL OR description = '' THEN ''
        ELSE '\n\n'
    END ||
    'Versement ajouté: ' || 
    TO_CHAR(montant - solde_disponible, 'FM999,999,999') || ' FCFA - Versement rétroactif ajouté le ' || 
    TO_CHAR(updated_at, 'DD/MM/YYYY à HH24:MI')
WHERE user_id = auth.uid()
  AND montant > solde_disponible 
  AND (description IS NULL OR description NOT LIKE '%Versement ajouté%')
  AND montant - solde_disponible > 0;

-- 3. VÉRIFICATION - Voir les recettes corrigées
SELECT 
    'APRÈS CORRECTION' as etat,
    r.id,
    r.libelle,
    r.montant,
    r.solde_disponible,
    r.description,
    'Versement ajouté dans description' as statut
FROM recettes r
WHERE r.user_id = auth.uid()
  AND r.description LIKE '%Versement ajouté%'
ORDER BY r.created_at DESC;

-- 4. RÉSUMÉ DES MODIFICATIONS
SELECT 
    'RÉSUMÉ' as info,
    COUNT(*) as recettes_modifiees,
    SUM(montant - solde_disponible) as total_versements_ajoutes
FROM recettes 
WHERE user_id = auth.uid()
  AND description LIKE '%Versement ajouté%'
  AND montant > solde_disponible;

