-- Script de debug pour analyser les données de dépenses
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. Voir toutes les dépenses avec leurs libellés et descriptions
SELECT 
    id,
    libelle,
    description,
    montant,
    date,
    created_at,
    updated_at
FROM depenses 
ORDER BY created_at DESC
LIMIT 10;

-- 2. Rechercher les dépenses qui contiennent "48" dans le libellé
SELECT 
    id,
    libelle,
    description,
    montant,
    date
FROM depenses 
WHERE libelle ILIKE '%48%'
ORDER BY created_at DESC;

-- 3. Vérifier s'il y a des doublons exacts
SELECT 
    libelle,
    description,
    COUNT(*) as count
FROM depenses 
GROUP BY libelle, description
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 4. Vérifier les dépenses avec des descriptions identiques aux libellés
SELECT 
    id,
    libelle,
    description,
    CASE 
        WHEN libelle = description THEN 'IDENTIQUE'
        WHEN libelle ILIKE '%' || description || '%' THEN 'LIBELLE CONTIENT DESCRIPTION'
        WHEN description ILIKE '%' || libelle || '%' THEN 'DESCRIPTION CONTIENT LIBELLE'
        ELSE 'DIFFERENT'
    END as relation
FROM depenses 
WHERE description IS NOT NULL AND description != ''
ORDER BY created_at DESC;







