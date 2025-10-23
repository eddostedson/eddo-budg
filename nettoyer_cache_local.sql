-- 🧹 NETTOYER LE CACHE LOCAL DE L'APPLICATION
-- À exécuter dans Supabase SQL Editor

-- 1. FORCER LA MISE À JOUR DES TIMESTAMPS POUR DÉCLENCHER LE REFRESH
UPDATE recettes 
SET updated_at = NOW() + INTERVAL '1 second';

UPDATE depenses 
SET updated_at = NOW() + INTERVAL '1 second';

-- 2. VÉRIFIER LES DONNÉES ACTUELLES
SELECT 
    'DONNÉES ACTUELLES' as info,
    (SELECT COUNT(*) FROM recettes) as nb_recettes,
    (SELECT COUNT(*) FROM depenses) as nb_depenses,
    (SELECT SUM(amount) FROM recettes) as total_recettes,
    (SELECT SUM(montant) FROM depenses) as total_depenses,
    (SELECT SUM(solde_disponible) FROM recettes) as solde_disponible_total;

-- 3. AFFICHER LES DÉPENSES LIÉES À PBF AHOKOKRO
SELECT 
    'DÉPENSES PBF AHOKOKRO' as info,
    d.id,
    d.libelle,
    d.montant,
    d.date,
    r.description as recette_source
FROM depenses d
JOIN recettes r ON d.recette_id = r.id
WHERE r.description LIKE '%PBF Ahokokro%'
ORDER BY d.created_at DESC;
