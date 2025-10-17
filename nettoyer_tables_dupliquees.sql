-- Nettoyer les tables dupliquées

-- Voir ce qu'il y a dans expenses (ancienne table)
SELECT 'CONTENU DE EXPENSES (ancienne)' as info, COUNT(*) as nombre, COALESCE(SUM(amount), 0) as total
FROM expenses;

-- Voir ce qu'il y a dans depenses (nouvelle table)
SELECT 'CONTENU DE DEPENSES (nouvelle)' as info, COUNT(*) as nombre, COALESCE(SUM(montant), 0) as total
FROM depenses;

-- Si vous voulez supprimer la table expenses (DÉCOMMENTER SI NÉCESSAIRE)
-- DROP TABLE IF EXISTS expenses CASCADE;

-- Vérifier le contenu de depenses après
SELECT 
    id,
    libelle,
    montant,
    date,
    description,
    created_at
FROM depenses
ORDER BY created_at DESC;
























