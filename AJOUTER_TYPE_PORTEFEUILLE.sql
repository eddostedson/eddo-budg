-- ═══════════════════════════════════════════════════════════════════════════
-- SCRIPT SIMPLE POUR AJOUTER LE TYPE DE PORTEFEUILLE
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- COPIEZ-COLLEZ CE SCRIPT DANS SUPABASE SQL EDITOR ET EXÉCUTEZ-LE
--

-- 1. AJOUTER LA COLONNE TYPE_PORTEFEUILLE
ALTER TABLE comptes_bancaires 
ADD COLUMN IF NOT EXISTS type_portefeuille VARCHAR(50) DEFAULT 'compte_bancaire' 
CHECK (type_portefeuille IN ('compte_bancaire', 'mobile_money', 'especes', 'autre'));

-- 2. METTRE À JOUR LES COMPTES EXISTANTS
UPDATE comptes_bancaires 
SET type_portefeuille = 'compte_bancaire' 
WHERE type_portefeuille IS NULL;

-- 3. CRÉER UN INDEX POUR LE TYPE DE PORTEFEUILLE
CREATE INDEX IF NOT EXISTS idx_comptes_bancaires_type_portefeuille 
ON comptes_bancaires(type_portefeuille);

-- 4. VÉRIFICATION
SELECT 
    '✅ Colonne type_portefeuille ajoutée avec succès !' as message,
    COUNT(*) as nombre_comptes
FROM comptes_bancaires;



