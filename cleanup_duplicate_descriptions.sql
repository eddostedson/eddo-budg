-- Script pour nettoyer les descriptions qui sont des sous-chaînes du libellé
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. D'abord, voir les données problématiques avant nettoyage
SELECT 
    id,
    libelle,
    description,
    CASE 
        WHEN libelle LIKE description || '%' THEN 'DESCRIPTION EST PREFIXE DU LIBELLE'
        WHEN libelle = description THEN 'IDENTIQUE'
        ELSE 'DIFFERENT'
    END as relation
FROM depenses 
WHERE description IS NOT NULL 
  AND description != ''
  AND (libelle LIKE description || '%' OR libelle = description)
ORDER BY created_at DESC;

-- 2. Nettoyer les descriptions qui sont des préfixes du libellé
UPDATE depenses
SET description = NULL
WHERE description IS NOT NULL
  AND description != ''
  AND libelle LIKE description || '%'
  AND libelle != description;

-- 3. Nettoyer les descriptions identiques au libellé
UPDATE depenses
SET description = NULL
WHERE description IS NOT NULL
  AND libelle = description;

-- 4. Vérifier le résultat après nettoyage
SELECT 
    id,
    libelle,
    description,
    created_at
FROM depenses 
WHERE description IS NOT NULL 
  AND description != ''
ORDER BY created_at DESC
LIMIT 10;





















