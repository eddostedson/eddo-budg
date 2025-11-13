# 📊 GUIDE D'EXTRACTION ET ANALYSE DES DONNÉES

## 🎯 OBJECTIF
Extraire toutes les données brutes de Supabase pour comprendre l'état actuel des liaisons entre recettes et dépenses.

---

## 🚀 ÉTAPE 1 : VÉRIFICATION RAPIDE (2 minutes)

### ✅ Exécuter le script de vérification

1. **Ouvrir Supabase Dashboard** → **SQL Editor**
2. **Ouvrir le fichier** : `verification_recette_id.sql`
3. **Copier tout le contenu** et le coller dans l'éditeur SQL
4. **Cliquer sur Run** ▶️

### 📋 Ce que vous devez vérifier :

- ✅ La colonne `recette_id` existe-t-elle ?
- 📊 Combien de dépenses ont un `recette_id` ?
- 🔗 Les `recette_id` existants pointent-ils vers des recettes valides ?

**⚠️ IMPORTANT** : Prenez une capture d'écran des résultats !

---

## 🔍 ÉTAPE 2 : EXTRACTION COMPLÈTE (5 minutes)

### ✅ Exécuter le script d'extraction

1. **Ouvrir le fichier** : `extraction_donnees_brutes.sql`
2. **Copier tout le contenu** et le coller dans l'éditeur SQL
3. **Cliquer sur Run** ▶️

### 📊 Résultats attendus :

Le script va vous montrer :

1. **Structure des tables** (colonnes disponibles)
2. **Toutes les recettes** avec leurs montants et soldes
3. **Toutes les dépenses** avec leur statut de liaison
4. **Résumé par recette** (dépenses attendues vs dépenses liées)
5. **Export JSON** (pour sauvegarde)

---

## 💾 ÉTAPE 3 : EXPORT CSV (OPTIONNEL)

Si vous voulez analyser les données dans Excel/Google Sheets :

1. **Ouvrir le fichier** : `export_csv_complet.sql`
2. **Exécuter chaque requête UNE PAR UNE**
3. **Copier les résultats** dans Excel/Sheets

### 📋 Fichiers à créer :

- **RECETTES.csv** : Toutes les recettes
- **DEPENSES.csv** : Toutes les dépenses  
- **VUE_COMBINEE.csv** : Recettes + Dépenses
- **RESUME.csv** : Résumé par recette

---

## 🔧 ÉTAPE 4 : ANALYSE DES RÉSULTATS

### ✅ Cas 1 : `recette_id` existe ET contient des données

**Scénario** : Certaines dépenses sont déjà liées à des recettes

**Action** :
```sql
-- Vérifier si les liaisons sont correctes
SELECT 
    d.libelle,
    d.montant,
    r.description as recette,
    r.amount as montant_recette
FROM depenses d
JOIN recettes r ON d.recette_id = r.id
ORDER BY r.receipt_date DESC;
```

**Si les liaisons sont correctes** : Parfait ! On garde tout
**Si les liaisons sont incorrectes** : On va les corriger

---

### ⚠️ Cas 2 : `recette_id` existe MAIS est NULL partout

**Scénario** : Aucune dépense n'est liée (ce qui semble être votre cas)

**Action** : On va créer les liaisons automatiquement avec le script de correction

---

### ❌ Cas 3 : `recette_id` n'existe PAS

**Scénario** : La colonne n'existe pas dans la table

**Action** : On doit d'abord créer la colonne
```sql
ALTER TABLE depenses 
ADD COLUMN IF NOT EXISTS recette_id UUID REFERENCES recettes(id);
```

---

## 🎯 PROCHAINES ÉTAPES SELON LES RÉSULTATS

### Si `recette_id` existe mais est vide partout :
➡️ **Exécuter** `correction_liaisons_intelligente.sql` pour lier automatiquement

### Si certaines liaisons existent mais sont incorrectes :
➡️ **Me partager les résultats** pour créer un script de correction ciblé

### Si la colonne n'existe pas :
➡️ **Créer la colonne** puis exécuter le script de correction

---

## 💡 COMMENCEZ ICI !

**🔥 EXÉCUTEZ D'ABORD** : `verification_recette_id.sql`

**📸 PARTAGEZ-MOI** : Une capture d'écran des résultats

**🚀 ENSUITE** : Je vous guiderai pour la correction !

---

## 📝 NOTES IMPORTANTES

- ✅ Tous les scripts sont **SAFE** (lecture seule sauf indication contraire)
- 📊 Les exports JSON peuvent être sauvegardés pour backup
- 🔧 On ne modifiera rien avant d'avoir analysé les résultats
- 💾 Vous pouvez exporter les données avant toute modification

---

**Prêt ? Commencez par `verification_recette_id.sql` ! 🚀**


