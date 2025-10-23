-- 🔧 CORRECTION SOLDE PBF AHOKOKRO À 11,000 FCFA
-- Mettre à jour le solde_disponible pour refléter le montant correct

-- 1. Vérifier l'état actuel
SELECT 
    'AVANT CORRECTION' as info,
    libelle,
    amount as montant_initial,
    solde_disponible as solde_actuel,
    (amount - solde_disponible) as total_depenses_calcule
FROM recettes 
WHERE libelle LIKE '%PBF Ahokokro%';

-- 2. Calculer le total des dépenses réelles
SELECT 
    'DÉPENSES RÉELLES' as info,
    COUNT(*) as nombre_depenses,
    SUM(montant) as total_depenses_reelles
FROM depenses d
JOIN recettes r ON d.recette_id = r.id
WHERE r.libelle LIKE '%PBF Ahokokro%';

-- 3. Corriger le solde_disponible
UPDATE recettes 
SET 
    solde_disponible = 11000.00,
    updated_at = NOW()
WHERE libelle LIKE '%PBF Ahokokro%';

-- 4. Vérifier après correction
SELECT 
    'APRÈS CORRECTION' as info,
    libelle,
    amount as montant_initial,
    solde_disponible as solde_corrige,
    (amount - solde_disponible) as total_depenses_calcule,
    updated_at
FROM recettes 
WHERE libelle LIKE '%PBF Ahokokro%';

-- 5. Vérification finale
SELECT 
    'VÉRIFICATION FINALE' as info,
    r.libelle,
    r.amount as montant_initial,
    COALESCE(SUM(d.montant), 0) as total_depenses_reelles,
    r.solde_disponible as solde_actuel,
    (r.amount - COALESCE(SUM(d.montant), 0)) as solde_correct_calcule
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
WHERE r.libelle LIKE '%PBF Ahokokro%'
GROUP BY r.id, r.libelle, r.amount, r.solde_disponible;
