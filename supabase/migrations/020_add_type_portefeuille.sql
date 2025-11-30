-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 020 : Ajout du type de portefeuille aux comptes bancaires
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Cette migration ajoute le champ type_portefeuille pour différencier :
-- - Compte bancaire
-- - Mobile Money
-- - Espèces
-- - Autres types de portefeuilles
--
-- ═══════════════════════════════════════════════════════════════════════════

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

-- 4. COMMENTAIRES
COMMENT ON COLUMN comptes_bancaires.type_portefeuille IS 'Type de portefeuille: compte_bancaire, mobile_money, especes, autre';

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 020 terminée avec succès !';
  RAISE NOTICE '💼 Type de portefeuille ajouté aux comptes bancaires';
END $$;












