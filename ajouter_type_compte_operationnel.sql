-- ═══════════════════════════════════════════════════════════════════════════
-- AJOUTER LE TYPE DE COMPTE "operationnel" POUR LES DÉPENSES COURANTES
-- ═══════════════════════════════════════════════════════════════════════════
--
-- À exécuter dans le SQL Editor de Supabase AVANT d'utiliser
-- le nouveau type "Compte Opérationnel (Dépenses Courantes)" dans l'application.
--
-- 1. Supprimer l'ancienne contrainte de vérification sur type_compte
ALTER TABLE comptes_bancaires
  DROP CONSTRAINT IF EXISTS comptes_bancaires_type_compte_check;

-- 2. Créer une nouvelle contrainte incluant le type "operationnel"
ALTER TABLE comptes_bancaires
  ADD CONSTRAINT comptes_bancaires_type_compte_check
  CHECK (type_compte IN ('courant', 'epargne', 'entreprise', 'operationnel'));

-- 3. Vérification rapide
SELECT DISTINCT type_compte FROM comptes_bancaires ORDER BY type_compte;








