# 🔍 DIAGNOSTIC: Même Utilisateur - Total 0 F CFA

## 🎯 Situation Confirmée

Vous êtes connecté avec le **même compte** qui a créé les recettes, mais le total affiche quand même **0 F CFA**.

Le problème vient donc du **mapping des colonnes** ou du **parsing des données**.

---

## ⚡ SOLUTION EXPRESS (5 minutes)

### Étape 1: Vérifier les Logs dans la Console

1. **Ouvrez votre application** (`localhost:3000/accueil`)
2. **Ouvrez la Console du navigateur** (F12 > Console)
3. **Rafraîchissez la page** (Ctrl + R)
4. **Cherchez ces messages:**

```
🔄 Rechargement des recettes depuis Supabase...
📊 Données brutes de Supabase: (132) [...]
✅ Recettes chargées depuis Supabase: 132
🧮 Total calculé: ???
```

**Question Clé:** Quelle est la valeur après "🧮 Total calculé:" ?

#### Si Total calculé = 0 :
```
❌ PROBLÈME: Toutes les recettes ont un montant de 0!
🔍 Données brutes de la première recette: {...}
🔍 Colonnes disponibles: [...]
```

➡️ **Continuez à l'Étape 2**

#### Si Total calculé > 0 (ex: 2064006) :
Le problème est ailleurs, pas dans le mapping.

➡️ **Passez à l'Étape 3**

---

### Étape 2: Vérifier les Colonnes de la Base de Données

**Dans Supabase Dashboard > SQL Editor**, exécutez :

```sql
-- Voir la structure exacte de la table
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'recettes' 
ORDER BY ordinal_position;
```

**Résultat Attendu:** Cherchez une colonne qui contient les montants.

Les noms possibles :
- ✅ `amount` (type: numeric ou float)
- ✅ `montant` (type: numeric ou float)
- ❌ Autre nom ?

**Puis vérifiez les données:**

```sql
-- Voir les 3 premières recettes
SELECT 
    id,
    description,
    amount,
    montant,
    solde_disponible
FROM recettes 
WHERE user_id = auth.uid()
LIMIT 3;
```

📸 **Faites une capture d'écran du résultat**

---

### Étape 3: Exécuter le Script de Diagnostic SQL

**Dans Supabase SQL Editor**, exécutez tout le contenu de :
```
diagnostic_mapping_colonnes.sql
```

Ce script va afficher :
1. ✅ La structure de la table
2. ✅ Les données brutes
3. ✅ Les statistiques sur les montants
4. ✅ Les types de données
5. ✅ Une simulation de la requête de l'app

**📸 Faites une capture d'écran des résultats**

---

### Étape 4: Utiliser l'Outil de Debug HTML

1. **Ouvrez le fichier** : `test-debug-recettes-console.html` dans votre navigateur

2. **Remplissez les champs** :
   - URL Supabase : `https://VOTRE_PROJET.supabase.co`
   - Clé Anon : `votre_cle_publique`

3. **Cliquez sur** : "▶️ Tout Exécuter"

4. **Regardez les résultats** dans la section noire

Cet outil va :
- ✅ Vérifier l'authentification
- ✅ Récupérer les recettes brutes
- ✅ Tester le mapping
- ✅ Calculer le total
- ✅ **Identifier précisément où ça bloque**

---

## 🔧 Solutions Possibles selon le Diagnostic

### Problème A: La colonne s'appelle autrement

**Symptôme:** Dans SQL, la colonne s'appelle `montant_recette` au lieu de `amount` ou `montant`

**Solution:** Modifier le mapping dans `src/contexts/recette-context-direct.tsx`

```typescript
// Ligne 68 - AVANT
montant: parseFloat(recette.amount || recette.montant || 0),

// APRÈS (remplacez NOM_REEL par le vrai nom)
montant: parseFloat(recette.NOM_REEL || recette.amount || recette.montant || 0),
```

---

### Problème B: Les montants sont stockés en texte

**Symptôme:** La colonne est de type `text` au lieu de `numeric`

**Solution SQL:** Convertir la colonne

```sql
-- Sauvegarder d'abord
CREATE TABLE recettes_backup AS SELECT * FROM recettes;

-- Convertir la colonne
ALTER TABLE recettes 
ALTER COLUMN amount TYPE numeric 
USING amount::numeric;
```

---

### Problème C: Les valeurs sont NULL

**Symptôme:** Toutes les valeurs dans `amount` ou `montant` sont NULL

**Solution SQL:** Vérifier d'où viennent les vraies données

```sql
-- Voir toutes les colonnes numériques
SELECT * FROM recettes LIMIT 1;
```

Puis mettre à jour le mapping selon la colonne correcte.

---

### Problème D: Les montants sont dans une autre table

**Symptôme:** La table `recettes` n'a pas de colonne de montant

**Solution:** Faire une jointure

```typescript
// Dans src/contexts/recette-context-direct.tsx
const { data, error } = await supabase
  .from('recettes')
  .select(`
    *,
    montants:recette_montants(amount)
  `)
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
```

---

## 🎯 Procédure de Correction

Une fois le problème identifié :

### 1. Si c'est un problème de nom de colonne :

Modifiez `src/contexts/recette-context-direct.tsx` ligne 68 :

```typescript
montant: parseFloat(recette.VRAIE_COLONNE || 0),
```

### 2. Si c'est un problème de type de données :

Exécutez la correction SQL puis rafraîchissez l'app.

### 3. Redémarrez l'application :

```bash
# Arrêtez le serveur (Ctrl + C)
pnpm dev
```

### 4. Vérifiez le résultat :

- Ouvrez `localhost:3000/accueil`
- Regardez la console (F12)
- Le total devrait maintenant s'afficher correctement

---

## 📊 Checklist de Debug

- [ ] Logs de la console vérifiés
- [ ] Structure de la table vérifiée (SQL)
- [ ] Script `diagnostic_mapping_colonnes.sql` exécuté
- [ ] Outil `test-debug-recettes-console.html` utilisé
- [ ] Problème identifié (A, B, C, ou D)
- [ ] Solution appliquée
- [ ] Application redémarrée
- [ ] Total affiché correctement

---

## 🆘 Si le Problème Persiste

**Envoyez-moi ces informations:**

1. **Capture d'écran des logs de la console** (après rafraîchissement)
2. **Résultat de cette requête SQL:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'recettes';
   ```
3. **Résultat de cette requête SQL:**
   ```sql
   SELECT * FROM recettes WHERE user_id = auth.uid() LIMIT 1;
   ```
4. **Screenshot du résultat de `test-debug-recettes-console.html`**

Avec ces infos, je pourrai identifier le problème exact !

---

## 💡 Explication Technique

Le problème typique est :

```typescript
// Le code essaie de lire
montant: parseFloat(recette.amount || recette.montant || 0)

// Mais dans la base, la colonne s'appelle différemment
// Par exemple: "transaction_amount" ou "recette_montant"

// Résultat:
recette.amount = undefined
recette.montant = undefined
parseFloat(undefined || undefined || 0) = 0 ❌
```

**Solution:** Trouver le vrai nom de la colonne et l'ajouter au mapping.

---

**Créé le:** 2025-10-29  
**Pour:** Diagnostic après confirmation même utilisateur



