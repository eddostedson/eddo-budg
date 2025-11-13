-- ═══════════════════════════════════════════════════════════════════════════
-- 📋 LISTE SIMPLE DE TOUTES LES RECETTES AVEC LEURS SOLDES
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    ROW_NUMBER() OVER (ORDER BY receipt_date DESC) as num,
    description as recette,
    amount as montant,
    solde_disponible as solde,
    (amount - solde_disponible) as depenses_attendues,
    TO_CHAR(receipt_date, 'DD/MM/YYYY') as date
FROM recettes
ORDER BY receipt_date DESC;


