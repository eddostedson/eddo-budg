# 🏠 Guide du Système de Reçus de Loyer Automatique

## 🎯 Vue d'ensemble

Le système de reçus de loyer automatique permet de :
- **Détecter automatiquement** les recettes de loyer dans votre application
- **Extraire le mois et l'année** depuis le libellé de la recette
- **Lier automatiquement** les recettes aux propriétés et locataires
- **Générer automatiquement** des reçus de loyer professionnels

## 🚀 Installation

### 1. Exécuter le script principal
```sql
-- Dans Supabase SQL Editor
-- Exécuter le contenu de rental-receipt-system.sql
```

### 2. Tester le système
```sql
-- Dans Supabase SQL Editor
-- Exécuter le contenu de test-rental-receipt-system.sql
```

## 📋 Prérequis

Avant d'utiliser le système, vous devez avoir :
1. **Des propriétés** créées dans la table `properties`
2. **Des locataires** créés dans la table `tenants`
3. **Des contrats de location** actifs dans la table `rental_contracts`

## 🔧 Utilisation

### 1. Création automatique de reçus

Le système fonctionne automatiquement quand vous créez une recette avec un libellé contenant des mots-clés de loyer :

#### ✅ Libellés qui déclenchent la génération automatique :
- `"Loyer Appartement Kennedy - Janvier 2025"`
- `"Loyer Villa Cocody - Février 2025"`
- `"Location Bureau Plateau - Mars 2025"`
- `"Loyer Décembre 2024"`
- `"Rent Apartment - January 2025"`

#### ❌ Libellés qui ne déclenchent PAS la génération :
- `"Salaire Janvier 2025"`
- `"Prime de fin d'année"`
- `"Vente de produits"`

### 2. Format des libellés recommandés

Pour une détection optimale, utilisez ce format :
```
Loyer [Nom Propriété] - [Mois] [Année]
```

**Exemples :**
- `"Loyer Appartement Kennedy - Janvier 2025"`
- `"Loyer Villa Cocody - Février 2025"`
- `"Loyer Bureau Plateau - Mars 2025"`

### 3. Mots-clés reconnus

Le système reconnaît ces mots-clés pour identifier les loyers :
- `loyer`
- `rent`
- `location`
- `appartement`
- `villa`
- `bureau`
- `commerce`

### 4. Mois reconnus

Le système extrait automatiquement le mois depuis le libellé :
- **Français complet :** janvier, février, mars, avril, mai, juin, juillet, août, septembre, octobre, novembre, décembre
- **Français abrégé :** jan, fév, mar, avr, mai, jun, jul, aoû, sep, oct, nov, déc
- **Numérique :** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12

## 📊 Fonctionnalités

### 1. Détection automatique
- Le système analyse chaque nouvelle recette
- Si le libellé contient des mots-clés de loyer, la recette est marquée comme `is_rental = TRUE`
- Les informations de période sont extraites automatiquement

### 2. Liaison automatique
- Le système tente de lier la recette à une propriété et un locataire
- Si plusieurs correspondances existent, la première est utilisée
- Les IDs sont stockés dans la recette et dans la table de liaison

### 3. Génération de reçus
- Un reçu est généré automatiquement avec :
  - Numéro de reçu unique
  - Informations de la propriété
  - Informations du locataire
  - Période de location
  - Montant du loyer
  - Date de paiement

### 4. Fonctions de requête

#### Récupérer toutes les recettes de loyer avec détails :
```sql
SELECT * FROM get_rental_income_with_details(auth.uid());
```

#### Générer un reçu manuellement :
```sql
SELECT generate_manual_rental_receipt(
  'recette_id',
  'property_id', 
  'tenant_id',
  'contract_id'
);
```

## 🗂️ Structure des données

### Table `recettes` (modifiée)
Nouvelles colonnes ajoutées :
- `is_rental` : Boolean indiquant si c'est un loyer
- `property_id` : ID de la propriété
- `tenant_id` : ID du locataire
- `contract_id` : ID du contrat
- `rental_month` : Mois au format YYYY-MM
- `rental_year` : Année
- `rental_period_start` : Date de début de période
- `rental_period_end` : Date de fin de période

### Table `rental_income_links` (nouvelle)
Table de liaison entre recettes et propriétés/locataires :
- `recette_id` : ID de la recette
- `property_id` : ID de la propriété
- `tenant_id` : ID du locataire
- `contract_id` : ID du contrat
- `rental_month` : Mois de location
- `receipt_generated` : Boolean indiquant si un reçu a été généré
- `receipt_id` : ID du reçu généré

### Table `receipts` (existante)
Les reçus générés sont stockés dans cette table avec :
- `receipt_type = 'loyer'`
- `property_id` : ID de la propriété
- `tenant_id` : ID du locataire
- `contract_id` : ID du contrat
- `period_start` et `period_end` : Période de location

## 🔍 Surveillance et maintenance

### Vérifier les recettes de loyer
```sql
SELECT 
  r.libelle,
  r.montant,
  r.date_reception,
  r.rental_month,
  p.property_name,
  CONCAT(t.first_name, ' ', t.last_name) as tenant_name,
  r.receipt_generated
FROM recettes r
LEFT JOIN properties p ON p.id = r.property_id
LEFT JOIN tenants t ON t.id = r.tenant_id
WHERE r.is_rental = TRUE
ORDER BY r.date_reception DESC;
```

### Vérifier les reçus générés
```sql
SELECT 
  r.receipt_number,
  r.amount,
  r.period_start,
  r.period_end,
  p.property_name,
  CONCAT(t.first_name, ' ', t.last_name) as tenant_name
FROM receipts r
LEFT JOIN properties p ON p.id = r.property_id
LEFT JOIN tenants t ON t.id = r.tenant_id
WHERE r.receipt_type = 'loyer'
ORDER BY r.payment_date DESC;
```

## 🚨 Dépannage

### Problème : Les reçus ne se génèrent pas automatiquement
**Solutions :**
1. Vérifiez que le libellé contient des mots-clés de loyer
2. Vérifiez qu'il y a des propriétés et locataires dans la base
3. Vérifiez qu'il y a des contrats de location actifs

### Problème : Mauvaise extraction du mois
**Solutions :**
1. Utilisez le format recommandé : `"Loyer [Propriété] - [Mois] [Année]"`
2. Vérifiez l'orthographe du mois
3. Utilisez les abréviations reconnues

### Problème : Liaison incorrecte avec propriété/locataire
**Solutions :**
1. Vérifiez qu'il n'y a qu'un seul contrat actif par propriété
2. Créez des contrats de location pour chaque propriété
3. Utilisez la génération manuelle si nécessaire

## 📈 Exemples d'utilisation

### Exemple 1 : Recette de loyer simple
```sql
INSERT INTO recettes (user_id, libelle, description, montant, date_reception)
VALUES (
  auth.uid(),
  'Loyer Appartement Kennedy - Janvier 2025',
  'Loyer mensuel pour l''appartement Kennedy',
  120000,
  CURRENT_DATE
);
-- → Génère automatiquement un reçu
```

### Exemple 2 : Recette avec année différente
```sql
INSERT INTO recettes (user_id, libelle, description, montant, date_reception)
VALUES (
  auth.uid(),
  'Loyer Villa Cocody - Décembre 2024',
  'Loyer mensuel pour la villa Cocody',
  200000,
  CURRENT_DATE
);
-- → Génère automatiquement un reçu pour décembre 2024
```

### Exemple 3 : Génération manuelle
```sql
-- Si la génération automatique a échoué
SELECT generate_manual_rental_receipt(
  'recette_id_ici',
  'property_id_ici',
  'tenant_id_ici',
  'contract_id_ici'
);
```

## 🎉 Avantages

1. **Automatisation complète** : Plus besoin de créer manuellement les reçus
2. **Cohérence des données** : Liaison automatique entre recettes, propriétés et locataires
3. **Traçabilité** : Historique complet des paiements de loyer
4. **Flexibilité** : Possibilité de génération manuelle si nécessaire
5. **Intégration** : S'intègre parfaitement avec le système existant

## 🔄 Mise à jour

Pour mettre à jour le système :
1. Sauvegardez vos données importantes
2. Exécutez les nouveaux scripts SQL
3. Testez avec les données de test
4. Vérifiez que tout fonctionne correctement

---

**Support :** Si vous rencontrez des problèmes, consultez les logs de la base de données ou contactez l'équipe de développement.





