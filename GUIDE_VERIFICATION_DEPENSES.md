# 🔍 Guide de Vérification et Nettoyage des Dépenses

## 📋 Objectif
Diagnostiquer pourquoi le **Solde Disponible** (3.200.000 FCFA) est différent du **Total Recettes** (4.065.336 FCFA) alors qu'aucune dépense n'est visible dans l'interface.

**Différence mystérieuse : 865.336 FCFA**

---

## 🚀 Étapes de Diagnostic

### **Étape 1 : Exécuter le script de diagnostic**

1. **Allez sur Supabase Dashboard**
2. **SQL Editor**
3. **Copiez-collez le contenu** de `supabase/migrations/009_verifier_et_nettoyer_depenses.sql`
4. **Cliquez sur "Run"**

### **Étape 2 : Analyser les résultats**

Le script va afficher plusieurs tableaux :

#### **Tableau 1 : Liste des dépenses**
```sql
id | user_id | libelle | montant | date | recette_id | created_at
```
- ✅ **Si vide** : Aucune dépense dans la base (normal)
- ❌ **Si rempli** : Il y a des dépenses "fantômes"

#### **Tableau 2 : Nombre et total des dépenses**
```sql
nombre_depenses | total_depenses
```
- ✅ **Si 0 et 0** : Aucune dépense
- ❌ **Si > 0** : Il y a des dépenses à nettoyer

#### **Tableau 3 : Recettes et leurs soldes**
```sql
libelle | montant_initial | solde_disponible | montant_utilise
```
- Vérifier que `montant_utilise = 0` si aucune dépense

#### **Tableau 4 : Incohérences**
```sql
recette_libelle | recette_montant | recette_solde | total_depenses_liees | solde_calcule | difference
```
- Ce tableau montre les recettes dont le solde ne correspond pas aux dépenses réelles

---

## 🔧 Solutions selon le Diagnostic

### **Cas 1 : Il y a des dépenses fantômes dans la base**

**Solution : Supprimer toutes les dépenses**

1. Dans le script `009_verifier_et_nettoyer_depenses.sql`
2. **Décommentez** la section PHASE 5 :
   ```sql
   DELETE FROM depenses;
   UPDATE recettes SET solde_disponible = montant;
   ```
3. Réexécutez le script

### **Cas 2 : Les soldes sont incorrects mais pas de dépenses**

**Solution : Réinitialiser les soldes**

1. Dans le script `009_verifier_et_nettoyer_depenses.sql`
2. **Décommentez** la section PHASE 4 :
   ```sql
   UPDATE recettes r
   SET solde_disponible = r.montant - COALESCE(
       (SELECT SUM(d.montant) 
        FROM depenses d 
        WHERE d.recette_id = r.id::text),
       0
   );
   ```
3. Réexécutez le script

### **Cas 3 : Tout est correct**

Si le diagnostic montre que tout est cohérent, le problème vient peut-être du calcul côté frontend.

---

## 📊 Script Rapide pour Tout Nettoyer

Si vous voulez **tout réinitialiser** et repartir à zéro avec les dépenses :

```sql
-- Supprimer toutes les dépenses
DELETE FROM depenses;

-- Réinitialiser tous les soldes au montant initial
UPDATE recettes
SET solde_disponible = montant;

-- Vérifier le résultat
SELECT 
    libelle,
    montant as montant_initial,
    solde_disponible,
    (montant - solde_disponible) as difference
FROM recettes;
```

**Résultat attendu** : 
- `difference` devrait être 0 pour toutes les recettes
- `solde_disponible` = `montant_initial`

---

## ✅ Vérification Finale

Après avoir appliqué la correction :

1. **Rafraîchissez l'application** (F5)
2. **Allez sur `/recettes`**
3. **Vérifiez les statistiques** :
   - Total Recettes : 4.065.336 FCFA
   - Total Dépensé : **0 FCFA** ✅
   - Solde Disponible : **4.065.336 FCFA** ✅

4. **Vérifiez chaque recette** :
   - Le montant et le solde disponible doivent être identiques

---

## 🎯 Résumé Visuel

### **Avant la correction :**
```
Total Recettes     : 4.065.336 FCFA
Solde Disponible   : 3.200.000 FCFA
Différence         : 865.336 FCFA ❌ (d'où vient-elle ?)
```

### **Après la correction :**
```
Total Recettes     : 4.065.336 FCFA
Total Dépensé      : 0 FCFA ✅
Solde Disponible   : 4.065.336 FCFA ✅
```

---

## 📞 Que faire ensuite ?

1. **Exécutez le diagnostic** et copiez-moi les résultats
2. Je vous dirai **quelle section décommenter** pour corriger
3. Vous réexécutez le script avec la correction

**Commencez par exécuter le script de diagnostic et dites-moi ce que vous voyez !** 🔍



































