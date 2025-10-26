-- Script de correction des soldes
-- Réinitialise tous les soldes_disponibles au montant initial

-- AVANT LA CORRECTION - Voir l'état actuel
SELECT 
    'AVANT CORRECTION' as etat,
    libelle,
    montant,
    solde_disponible,
    (montant - solde_disponible) as difference
FROM recettes
ORDER BY created_at;

-- APPLIQUER LA CORRECTION
UPDATE recettes
SET solde_disponible = montant
WHERE montant != solde_disponible;

-- APRÈS LA CORRECTION - Vérifier
SELECT 
    'APRÈS CORRECTION' as etat,
    libelle,
    montant,
    solde_disponible,
    (montant - solde_disponible) as difference
FROM recettes
ORDER BY created_at;

-- VÉRIFICATION FINALE
SELECT 
    'VÉRIFICATION FINALE' as info,
    COUNT(*) as nombre_recettes,
    SUM(montant) as total_recettes,
    SUM(solde_disponible) as total_solde_disponible,
    SUM(montant - solde_disponible) as difference_totale
FROM recettes;



































