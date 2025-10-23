-- CORRECTION DES MONTANTS DES RECETTES BASÉE SUR LE CSV
-- À exécuter dans Supabase SQL Editor

-- 1. CORRIGER BSIC REVERSEMENT SUR PRECOMPTE : NUMERAIRE
-- Montant actuel: 43,000.00 → Montant correct: 430,000.00
UPDATE recettes 
SET amount = 430000.00,
    updated_at = NOW()
WHERE description = 'BSIC REVERSEMENT SUR PRECOMPTE : NUMERAIRE'
  AND amount = 43000.00;

-- 2. CORRIGER EXPERTISE : Budget de Fonctionnement Juillet 2025
-- Montant actuel: 46,200.00 → Montant correct: 462,000.00
UPDATE recettes 
SET amount = 462000.00,
    updated_at = NOW()
WHERE description = 'EXPERTISE : Budget de Fonctionnement Juillet 2025'
  AND amount = 46200.00;

-- 3. VÉRIFIER LES CORRECTIONS
SELECT 
    'RECETTES CORRIGÉES' as info,
    id,
    description,
    amount as montant_actuel,
    updated_at
FROM recettes 
WHERE description = 'BSIC REVERSEMENT SUR PRECOMPTE : NUMERAIRE'
   OR description = 'EXPERTISE : Budget de Fonctionnement Juillet 2025'
ORDER BY description;

-- 4. VÉRIFIER LE TOTAL APRÈS CORRECTION
SELECT 
    'TOTAL APRÈS CORRECTION' as info,
    COUNT(*) as nb_recettes,
    SUM(amount) as total_montants,
    AVG(amount) as moyenne_montants
FROM recettes;
