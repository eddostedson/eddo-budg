-- =====================================================
-- 🧪 TEST DU SYSTÈME DE RECEIPTS DE LOYER
-- =====================================================
-- Ce script teste le système de génération automatique de reçus de loyer

-- =====================================================
-- 1. PRÉPARATION DES DONNÉES DE TEST
-- =====================================================

-- Nettoyer les données de test existantes
DELETE FROM receipts WHERE receipt_type = 'loyer' AND (notes LIKE '%TEST%' OR notes LIKE '%test%');
DELETE FROM rental_income_links WHERE recette_id IN (SELECT id FROM recettes WHERE libelle LIKE '%TEST%');
DELETE FROM recettes WHERE libelle LIKE '%TEST%';
DELETE FROM rental_contracts WHERE contract_notes LIKE '%TEST%';
DELETE FROM tenants WHERE first_name LIKE '%TEST%';
DELETE FROM properties WHERE property_name LIKE '%TEST%';

-- Créer une propriété de test
INSERT INTO properties (
  user_id, property_name, property_type, address, city, 
  rent_amount, currency, description, is_active
) VALUES (
  auth.uid(),
  'Appartement TEST Kennedy',
  'appartement',
  'Rue Kennedy, Cocody',
  'Abidjan',
  120000,
  'F CFA',
  'Appartement de test pour le système de reçus',
  true
);

-- Créer un locataire de test
INSERT INTO tenants (
  user_id, first_name, last_name, email, phone, 
  address, city, occupation, is_active
) VALUES (
  auth.uid(),
  'Jean',
  'DUPONT TEST',
  'jean.dupont.test@email.com',
  '+225 07 12 34 56 78',
  'Rue Kennedy, Cocody',
  'Abidjan',
  'Ingénieur',
  true
);

-- Créer un contrat de location de test
INSERT INTO rental_contracts (
  user_id, property_id, tenant_id, contract_number,
  start_date, end_date, monthly_rent, deposit_amount,
  payment_due_day, contract_status, contract_notes
) VALUES (
  auth.uid(),
  (SELECT id FROM properties WHERE property_name = 'Appartement TEST Kennedy' LIMIT 1),
  (SELECT id FROM tenants WHERE last_name = 'DUPONT TEST' LIMIT 1),
  '2025-001',
  '2025-01-01',
  '2025-12-31',
  120000,
  240000,
  1,
  'active',
  'Contrat de test pour le système de reçus'
);

-- =====================================================
-- 2. TESTS DES FONCTIONS UTILITAIRES
-- =====================================================

-- Test 1: Détection des recettes de loyer
SELECT 
  'Test 1: Détection des recettes de loyer' as test_name,
  is_rental_income('Loyer Appartement Kennedy - Janvier 2025', 'Loyer mensuel') as result_1,
  is_rental_income('Salaire Janvier 2025', 'Salaire mensuel') as result_2,
  is_rental_income('Location Bureau Mars', 'Location commerciale') as result_3;

-- Test 2: Extraction de la période du libellé
SELECT 
  'Test 2: Extraction de la période' as test_name,
  * 
FROM extract_rental_period_from_libelle('Loyer Appartement Kennedy - Janvier 2025');

-- Test 3: Extraction avec année différente
SELECT 
  'Test 3: Extraction avec année 2024' as test_name,
  * 
FROM extract_rental_period_from_libelle('Loyer Appartement Kennedy - Décembre 2024');

-- =====================================================
-- 3. TESTS DE GÉNÉRATION AUTOMATIQUE
-- =====================================================

-- Test 4: Création d'une recette de loyer (déclenchera le trigger)
INSERT INTO recettes (
  user_id, libelle, description, montant, date_reception, 
  source, periodicite, statut
) VALUES (
  auth.uid(),
  'Loyer Appartement TEST Kennedy - Janvier 2025',
  'Loyer mensuel pour l''appartement Kennedy - TEST',
  120000,
  CURRENT_DATE,
  'Location',
  'mensuelle',
  'reçue'
);

-- Vérifier que la recette a été marquée comme loyer
SELECT 
  'Test 4: Vérification recette marquée comme loyer' as test_name,
  id, libelle, is_rental, rental_month, rental_year, 
  rental_period_start, rental_period_end,
  property_id, tenant_id, contract_id
FROM recettes 
WHERE libelle LIKE '%TEST%';

-- Vérifier que le lien a été créé
SELECT 
  'Test 4: Vérification lien créé' as test_name,
  id, recette_id, property_id, tenant_id, contract_id,
  rental_month, rental_year, amount, receipt_generated
FROM rental_income_links 
WHERE recette_id IN (SELECT id FROM recettes WHERE libelle LIKE '%TEST%');

-- Vérifier que le reçu a été généré
SELECT 
  'Test 4: Vérification reçu généré' as test_name,
  r.id, r.receipt_number, r.receipt_type, r.amount,
  r.period_start, r.period_end, r.payment_date,
  p.property_name, CONCAT(t.first_name, ' ', t.last_name) as tenant_name
FROM receipts r
LEFT JOIN properties p ON p.id = r.property_id
LEFT JOIN tenants t ON t.id = r.tenant_id
WHERE r.recette_id IN (SELECT id FROM recettes WHERE libelle LIKE '%TEST%');

-- =====================================================
-- 4. TESTS AVEC DIFFÉRENTS MOIS
-- =====================================================

-- Test 5: Recette pour Février 2025
INSERT INTO recettes (
  user_id, libelle, description, montant, date_reception, 
  source, periodicite, statut
) VALUES (
  auth.uid(),
  'Loyer Appartement TEST Kennedy - Février 2025',
  'Loyer mensuel pour l''appartement Kennedy - TEST',
  120000,
  CURRENT_DATE,
  'Location',
  'mensuelle',
  'reçue'
);

-- Test 6: Recette pour Mars 2025
INSERT INTO recettes (
  user_id, libelle, description, montant, date_reception, 
  source, periodicite, statut
) VALUES (
  auth.uid(),
  'Loyer Appartement TEST Kennedy - Mars 2025',
  'Loyer mensuel pour l''appartement Kennedy - TEST',
  120000,
  CURRENT_DATE,
  'Location',
  'mensuelle',
  'reçue'
);

-- =====================================================
-- 5. TEST DE LA FONCTION DE REQUÊTE
-- =====================================================

-- Test 7: Récupération des recettes de loyer avec détails
SELECT 
  'Test 7: Récupération des recettes de loyer' as test_name,
  *
FROM get_rental_income_with_details(auth.uid())
WHERE libelle LIKE '%TEST%'
ORDER BY date_reception DESC;

-- =====================================================
-- 6. TEST DE GÉNÉRATION MANUELLE
-- =====================================================

-- Créer une recette de loyer sans génération automatique
INSERT INTO recettes (
  user_id, libelle, description, montant, date_reception, 
  source, periodicite, statut, is_rental, rental_month,
  rental_year, rental_period_start, rental_period_end,
  property_id, tenant_id, contract_id
) VALUES (
  auth.uid(),
  'Loyer Appartement TEST Kennedy - Avril 2025',
  'Loyer mensuel pour l''appartement Kennedy - TEST MANUEL',
  120000,
  CURRENT_DATE,
  'Location',
  'mensuelle',
  'reçue',
  true,
  '2025-04',
  2025,
  '2025-04-01',
  '2025-04-30',
  (SELECT id FROM properties WHERE property_name = 'Appartement TEST Kennedy' LIMIT 1),
  (SELECT id FROM tenants WHERE last_name = 'DUPONT TEST' LIMIT 1),
  (SELECT id FROM rental_contracts WHERE contract_number = '2025-001' LIMIT 1)
);

-- Créer le lien manuellement
INSERT INTO rental_income_links (
  user_id, recette_id, property_id, tenant_id, contract_id,
  rental_month, rental_year, period_start, period_end, amount
) VALUES (
  auth.uid(),
  (SELECT id FROM recettes WHERE libelle = 'Loyer Appartement TEST Kennedy - Avril 2025' LIMIT 1),
  (SELECT id FROM properties WHERE property_name = 'Appartement TEST Kennedy' LIMIT 1),
  (SELECT id FROM tenants WHERE last_name = 'DUPONT TEST' LIMIT 1),
  (SELECT id FROM rental_contracts WHERE contract_number = '2025-001' LIMIT 1),
  '2025-04',
  2025,
  '2025-04-01',
  '2025-04-30',
  120000
);

-- Test 8: Génération manuelle de reçu
SELECT 
  'Test 8: Génération manuelle de reçu' as test_name,
  generate_manual_rental_receipt(
    (SELECT id FROM recettes WHERE libelle = 'Loyer Appartement TEST Kennedy - Avril 2025' LIMIT 1),
    (SELECT id FROM properties WHERE property_name = 'Appartement TEST Kennedy' LIMIT 1),
    (SELECT id FROM tenants WHERE last_name = 'DUPONT TEST' LIMIT 1),
    (SELECT id FROM rental_contracts WHERE contract_number = '2025-001' LIMIT 1)
  ) as receipt_id;

-- =====================================================
-- 7. RÉSULTATS FINAUX
-- =====================================================

-- Résumé des recettes de loyer créées
SELECT 
  'RÉSUMÉ: Recettes de loyer créées' as summary,
  COUNT(*) as total_recettes,
  SUM(montant) as total_montant
FROM recettes 
WHERE libelle LIKE '%TEST%';

-- Résumé des liens créés
SELECT 
  'RÉSUMÉ: Liens créés' as summary,
  COUNT(*) as total_liens,
  COUNT(CASE WHEN receipt_generated THEN 1 END) as reçus_générés
FROM rental_income_links 
WHERE recette_id IN (SELECT id FROM recettes WHERE libelle LIKE '%TEST%');

-- Résumé des reçus générés
SELECT 
  'RÉSUMÉ: Reçus générés' as summary,
  COUNT(*) as total_reçus,
  SUM(amount) as total_montant_reçus
FROM receipts 
WHERE recette_id IN (SELECT id FROM recettes WHERE libelle LIKE '%TEST%');

-- Détail complet des reçus
SELECT 
  'DÉTAIL: Reçus générés' as detail,
  r.receipt_number,
  r.receipt_type,
  r.amount,
  r.period_start,
  r.period_end,
  r.payment_date,
  p.property_name,
  CONCAT(t.first_name, ' ', t.last_name) as tenant_name,
  c.contract_number,
  rec.libelle as recette_libelle
FROM receipts r
LEFT JOIN properties p ON p.id = r.property_id
LEFT JOIN tenants t ON t.id = r.tenant_id
LEFT JOIN rental_contracts c ON c.id = r.contract_id
LEFT JOIN recettes rec ON rec.id = r.recette_id
WHERE r.recette_id IN (SELECT id FROM recettes WHERE libelle LIKE '%TEST%')
ORDER BY r.payment_date DESC;

-- =====================================================
-- 8. NETTOYAGE (OPTIONNEL)
-- =====================================================

-- Décommentez les lignes suivantes pour nettoyer les données de test
/*
DELETE FROM receipts WHERE recette_id IN (SELECT id FROM recettes WHERE libelle LIKE '%TEST%');
DELETE FROM rental_income_links WHERE recette_id IN (SELECT id FROM recettes WHERE libelle LIKE '%TEST%');
DELETE FROM recettes WHERE libelle LIKE '%TEST%';
DELETE FROM rental_contracts WHERE contract_notes LIKE '%TEST%';
DELETE FROM tenants WHERE last_name = 'DUPONT TEST';
DELETE FROM properties WHERE property_name = 'Appartement TEST Kennedy';
*/

-- =====================================================
-- FIN DU SCRIPT DE TEST
-- =====================================================
-- Ce script teste toutes les fonctionnalités du système de reçus de loyer :
-- 1. Détection automatique des recettes de loyer
-- 2. Extraction de la période depuis le libellé
-- 3. Liaison avec propriétés et locataires
-- 4. Génération automatique de reçus
-- 5. Génération manuelle de reçus
-- 6. Fonctions de requête pour l'interface
