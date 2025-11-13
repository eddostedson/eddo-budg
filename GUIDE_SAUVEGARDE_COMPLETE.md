# 💾 GUIDE SAUVEGARDE COMPLÈTE - EDDO-BUDG

## 🎯 OBJECTIF
Sauvegarder **TOUTES** les données de Supabase vers votre ordinateur local.

---

## 📋 **MÉTHODE 1 : EXPORT JSON VIA SQL** ⭐ (Recommandé)

### ✅ **ÉTAPE 1 : Exécuter le script**

1. Ouvrir **Supabase Dashboard** → **SQL Editor**
2. Ouvrir le fichier : `export_sauvegarde_complete.sql`
3. **Copier tout le contenu** (Ctrl+A, Ctrl+C)
4. **Coller dans Supabase SQL Editor**
5. **Run** ▶️

### ✅ **ÉTAPE 2 : Sauvegarder les RECETTES**

1. Dans les résultats, trouver la section **"recettes_export"**
2. **Copier le JSON complet** (tout le contenu)
3. Créer un fichier dans votre projet : `C:\Users\rise\Desktop\CURSOR_PROJECTS\eddo-budg\backups\recettes_backup.json`
4. **Coller le JSON** et sauvegarder

### ✅ **ÉTAPE 3 : Sauvegarder les DÉPENSES**

1. Dans les résultats, trouver la section **"depenses_export"**
2. **Copier le JSON complet**
3. Créer un fichier : `C:\Users\rise\Desktop\CURSOR_PROJECTS\eddo-budg\backups\depenses_backup.json`
4. **Coller le JSON** et sauvegarder

---

## 📋 **MÉTHODE 2 : EXPORT CSV VIA SUPABASE UI** (Visuel)

### ✅ **Pour chaque table :**

1. Ouvrir **Supabase Dashboard** → **Table Editor**
2. Sélectionner la table **"recettes"**
3. Cliquer sur le bouton **"Export"** (en haut à droite)
4. Choisir **"CSV"**
5. Télécharger le fichier
6. Répéter pour la table **"depenses"**

---

## 📋 **MÉTHODE 3 : SAUVEGARDE SQL DIRECTE DANS SUPABASE**

### ✅ **Créer des tables de sauvegarde :**

```sql
-- Sauvegarder RECETTES
CREATE TABLE recettes_backup_complete AS
SELECT * FROM recettes;

-- Sauvegarder DÉPENSES
CREATE TABLE depenses_backup_complete AS
SELECT * FROM depenses;

-- Vérifier
SELECT 
    'recettes' as table_name, 
    COUNT(*) as nb_lignes 
FROM recettes_backup_complete
UNION ALL
SELECT 
    'depenses' as table_name, 
    COUNT(*) as nb_lignes 
FROM depenses_backup_complete;
```

**Avantage** : Les données restent dans Supabase et peuvent être restaurées facilement.

---

## 🔄 **RESTAURATION DES DONNÉES**

### **Depuis JSON (Méthode 1) :**

Si vous avez les fichiers JSON, vous pouvez les réimporter via un script Node.js ou directement dans Supabase.

### **Depuis Tables de Backup (Méthode 3) :**

```sql
-- Restaurer RECETTES
TRUNCATE recettes;
INSERT INTO recettes SELECT * FROM recettes_backup_complete;

-- Restaurer DÉPENSES
TRUNCATE depenses;
INSERT INTO depenses SELECT * FROM depenses_backup_complete;
```

⚠️ **ATTENTION** : N'exécutez ces commandes de restauration que si nécessaire !

---

## 📁 **STRUCTURE DES FICHIERS DE SAUVEGARDE**

```
eddo-budg/
├── backups/
│   ├── recettes_backup.json       ← Toutes les recettes
│   ├── depenses_backup.json       ← Toutes les dépenses
│   └── backup_info.txt            ← Infos (date, nb lignes, etc.)
```

---

## ✅ **APRÈS LA SAUVEGARDE**

Une fois la sauvegarde créée, vous pouvez **exécuter en toute sécurité** :
- `correction_intelligente_finale.sql`

En cas de problème, vous pourrez toujours restaurer vos données !

---

## 🎯 **RECOMMANDATION**

1. **Utilisez Méthode 1 (JSON)** pour une sauvegarde locale complète
2. **OU Méthode 3 (Tables SQL)** si vous voulez garder la sauvegarde dans Supabase
3. **Puis exécutez** le script de correction

---

**Bonne sauvegarde ! 💾**


