# 🔧 Guide de Dépannage - Création de Recettes

## 🎯 Problème Identifié
Quand vous créez une recette et que vous validez, ça ne valide pas et il n'y a aucun message d'erreur.

## 🔍 Étapes de Diagnostic

### 1. **Exécuter le Diagnostic Simple**
```sql
-- Exécuter le contenu de diagnostic_simple_recettes.sql
```
**Résultat attendu :** Structure de la table, nombre de recettes existantes, test d'insertion.

### 2. **Exécuter le Test de Création**
```sql
-- Exécuter le contenu de test_creation_recette_sql.sql
```
**Résultat attendu :** Simulation complète de la création de recette avec messages détaillés.

### 3. **Vérifier les Logs de l'Application**
1. Ouvrir la console du navigateur (F12)
2. Aller sur la page des recettes
3. Essayer de créer une recette
4. Regarder les messages dans la console

## 🚨 Problèmes Courants et Solutions

### **Problème 1 : Erreur d'Authentification**
```
❌ Erreur d'authentification
```
**Solution :**
- Vérifier que vous êtes connecté
- Rafraîchir la page
- Se reconnecter si nécessaire

### **Problème 2 : Contraintes de Base de Données**
```
❌ Les données ne respectent pas les contraintes de validation
```
**Solutions :**
- Vérifier que le montant est positif
- Vérifier que le libellé n'est pas vide
- Vérifier que le statut est valide ('reçue', 'attendue', 'retardée', 'annulée')

### **Problème 3 : Triggers Bloquants**
```
❌ Erreur lors de la création de la recette
```
**Solutions :**
- Vérifier les triggers actifs avec le diagnostic
- Désactiver temporairement les triggers problématiques
- Ajuster les données pour respecter les règles des triggers

### **Problème 4 : Politiques RLS (Row Level Security)**
```
❌ Erreur de permissions
```
**Solutions :**
- Vérifier les politiques RLS
- S'assurer que l'utilisateur a les bonnes permissions
- Vérifier que l'utilisateur est bien connecté

## 🛠️ Solutions par Type d'Erreur

### **Erreur 23505 : Violation de contrainte unique**
```sql
-- Vérifier les doublons
SELECT libelle, COUNT(*) 
FROM recettes 
GROUP BY libelle 
HAVING COUNT(*) > 1;
```

### **Erreur 23514 : Violation de contrainte de vérification**
```sql
-- Vérifier les contraintes
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'recettes'::regclass;
```

### **Erreur 42501 : Permissions insuffisantes**
```sql
-- Vérifier les politiques RLS
SELECT policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'recettes';
```

## 🧪 Tests de Validation

### **Test 1 : Données Minimales**
```javascript
// Dans la console du navigateur
const testData = {
    libelle: "Test Simple",
    montant: 1000,
    date: "2025-01-27",
    statut: "reçue"
};
```

### **Test 2 : Données Complètes**
```javascript
const testData = {
    libelle: "Test Complet",
    montant: 50000,
    date: "2025-01-27",
    statut: "reçue",
    description: "Description de test"
};
```

### **Test 3 : Données Invalides (pour tester les erreurs)**
```javascript
const testData = {
    libelle: "", // Libellé vide
    montant: -1000, // Montant négatif
    date: "2025-01-27",
    statut: "invalid" // Statut invalide
};
```

## 📊 Messages de Debug

### **Messages Attendus dans la Console :**
```
🔄 Tentative de création de recette: {libelle: "...", montant: ..., ...}
✅ Recette créée avec succès: [ID]
```

### **Messages d'Erreur Spécifiques :**
```
❌ Le libellé est obligatoire
❌ Le montant doit être positif
❌ Une recette avec ce libellé existe déjà
❌ Les données ne respectent pas les contraintes de validation
❌ Erreur de base de données: [détails]
```

## 🔄 Processus de Dépannage Complet

1. **Exécuter les scripts de diagnostic SQL**
2. **Vérifier les logs de l'application**
3. **Tester avec des données simples**
4. **Identifier le type d'erreur**
5. **Appliquer la solution correspondante**
6. **Retester la création**

## 📞 Support

Si le problème persiste après avoir suivi ce guide :
1. Copier les messages d'erreur de la console
2. Copier les résultats des scripts de diagnostic
3. Fournir ces informations pour un diagnostic plus approfondi


