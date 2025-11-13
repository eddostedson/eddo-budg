-- 🔍 DIAGNOSTIC: Vérifier le mapping des colonnes de la table recettes
-- Si l'utilisateur est le bon, le problème peut venir du nom des colonnes

-- ========================================
-- 1. STRUCTURE EXACTE DE LA TABLE RECETTES
-- ========================================
SELECT 
    '1. STRUCTURE TABLE' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'recettes' 
ORDER BY ordinal_position;

-- ========================================
-- 2. VÉRIFIER LES DONNÉES BRUTES
-- ========================================
-- Afficher les 5 premières recettes avec TOUTES les colonnes
SELECT 
    '2. DONNÉES BRUTES' as section,
    id,
    user_id,
    -- Colonnes possibles pour le libellé
    COALESCE(description, libelle, 'N/A') as libelle_ou_description,
    -- Colonnes possibles pour le montant
    COALESCE(amount::text, montant::text, 'N/A') as amount_ou_montant,
    -- Colonne pour le solde
    COALESCE(solde_disponible::text, 'N/A') as solde,
    -- Date
    COALESCE(receipt_date::text, date::text, date_reception::text, 'N/A') as date_field,
    created_at
FROM recettes 
WHERE user_id = auth.uid()
ORDER BY created_at DESC 
LIMIT 5;

-- ========================================
-- 3. VÉRIFIER QUE LES MONTANTS NE SONT PAS NULL
-- ========================================
SELECT 
    '3. STATISTIQUES MONTANTS' as section,
    COUNT(*) as total_recettes,
    COUNT(amount) as recettes_avec_amount,
    COUNT(montant) as recettes_avec_montant,
    SUM(COALESCE(amount, 0)) as somme_amount,
    SUM(COALESCE(montant, 0)) as somme_montant,
    SUM(COALESCE(solde_disponible, 0)) as somme_solde
FROM recettes 
WHERE user_id = auth.uid();

-- ========================================
-- 4. VÉRIFIER LES TYPES DE DONNÉES
-- ========================================
SELECT 
    '4. TYPES DE DONNÉES' as section,
    pg_typeof(amount) as type_amount,
    pg_typeof(montant) as type_montant,
    pg_typeof(solde_disponible) as type_solde
FROM recettes 
WHERE user_id = auth.uid()
LIMIT 1;

-- ========================================
-- 5. TEST: Simuler la requête de l'application
-- ========================================
SELECT 
    '5. SIMULATION REQUÊTE APP' as section,
    id,
    user_id,
    description,
    amount,
    solde_disponible,
    receipt_date,
    created_at
FROM recettes
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- 6. VÉRIFIER S'IL Y A DES COLONNES MANQUANTES
-- ========================================
DO $$
DECLARE
    has_amount BOOLEAN;
    has_montant BOOLEAN;
    has_description BOOLEAN;
    has_libelle BOOLEAN;
BEGIN
    -- Vérifier la présence des colonnes
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recettes' AND column_name = 'amount'
    ) INTO has_amount;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recettes' AND column_name = 'montant'
    ) INTO has_montant;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recettes' AND column_name = 'description'
    ) INTO has_description;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recettes' AND column_name = 'libelle'
    ) INTO has_libelle;
    
    RAISE NOTICE '6. COLONNES EXISTANTES:';
    RAISE NOTICE '   - amount: %', has_amount;
    RAISE NOTICE '   - montant: %', has_montant;
    RAISE NOTICE '   - description: %', has_description;
    RAISE NOTICE '   - libelle: %', has_libelle;
END $$;



