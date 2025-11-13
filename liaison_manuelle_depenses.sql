-- Script de liaison manuelle des dépenses aux recettes
-- Utilisez ce script pour lier manuellement les dépenses aux bonnes recettes

-- EXEMPLE DE LIAISON MANUELLE :
-- Remplacez les IDs par les vrais IDs de vos données

-- 1. Lier "Namory" à "Loyer Kennedy : Novembre 2025"
-- UPDATE depenses 
-- SET recette_id = (SELECT id FROM recettes WHERE description = 'Loyer Kennedy : Novembre 2025' AND user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19')
-- WHERE libelle = 'Namory' AND user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19';

-- 2. Lier "Abbatage d'arbre Miason Kennedy" à "Loyer Kennedy : Mois de Octobre 2025"
-- UPDATE depenses 
-- SET recette_id = (SELECT id FROM recettes WHERE description = 'Loyer Kennedy : Mois de Octobre 2025' AND user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19')
-- WHERE libelle = 'Abbatage d''arbre Miason Kennedy' AND user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19';

-- 3. Lier d'autres dépenses selon vos besoins...

-- SCRIPT POUR VOIR LES DONNÉES DISPONIBLES
SELECT 
    'RECETTES_DISPONIBLES' as type,
    id,
    description,
    amount as montant,
    solde_disponible,
    (amount - solde_disponible) as depense_attendue
FROM recettes 
WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
ORDER BY amount DESC;

SELECT 
    'DEPENSES_DISPONIBLES' as type,
    id,
    libelle,
    montant,
    recette_id,
    CASE 
        WHEN recette_id IS NULL THEN 'NON_LIEE'
        ELSE 'LIEE'
    END as statut
FROM depenses 
WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
ORDER BY montant DESC;


