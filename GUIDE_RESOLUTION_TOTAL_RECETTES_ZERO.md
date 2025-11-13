# 🔍 GUIDE DE RÉSOLUTION: Total Recettes = 0 F CFA

## 📋 Problème Identifié

**Symptôme:** L'interface affiche "Total Recettes: 0 F CFA" alors que la table `recettes` dans Supabase contient des données.

**Cause Racine:** Le **Row Level Security (RLS)** filtre les recettes selon le `user_id`. L'utilisateur actuellement connecté dans l'application n'est **pas le même** que celui qui a créé les recettes dans la base de données.

---

## 🎯 Explication Technique

### Architecture de Sécurité (RLS)

La table `recettes` a des politiques RLS activées :

```sql
CREATE POLICY "Users can view their own recettes"
  ON recettes FOR SELECT
  USING (auth.uid() = user_id);
```

Cela signifie que **chaque utilisateur ne peut voir QUE ses propres recettes**.

### Flux de Données

```
1. Application charge les recettes: useRecettes()
   ↓
2. Requête Supabase: SELECT * FROM recettes WHERE user_id = auth.uid()
   ↓
3. RLS filtre automatiquement les résultats
   ↓
4. Si auth.uid() ≠ user_id des recettes → Résultat vide → Total = 0 F CFA
```

### Code Concerné

**Fichier:** `src/contexts/recette-context-direct.tsx` (lignes 48-52)

```typescript
const { data, error } = await supabase
  .from('recettes')
  .select('*')
  .eq('user_id', user.id)  // ← Filtre par user_id
  .order('created_at', { ascending: false })
```

**Fichier:** `src/app/accueil/page.tsx` (lignes 29-31)

```typescript
const totalRecettes = useMemo(() => {
  return recettes.reduce((sum, r) => sum + (r.montant || 0), 0)  // ← Si recettes = [], alors sum = 0
}, [recettes])
```

---

## 🛠️ Solution en 3 Étapes

### Étape 1: Diagnostiquer le Problème

Exécutez le script `diagnostic_user_mismatch.sql` dans l'éditeur SQL de Supabase :

```bash
# Ouvrir Supabase Dashboard > SQL Editor > Exécuter le script
diagnostic_user_mismatch.sql
```

Ce script vous montrera :
- ✅ Tous les utilisateurs existants
- ✅ Toutes les recettes et leur `user_id`
- ✅ Distribution des recettes par utilisateur

**Résultat Attendu:**

| user_id | user_email | nombre_recettes |
|---------|------------|----------------|
| UUID_1  | eddostedson@gmail.com | 0 |
| UUID_2  | ancien@email.com | 132 |

☝️ Cela confirme que les recettes appartiennent à `ancien@email.com` mais vous êtes connecté avec `eddostedson@gmail.com`.

---

### Étape 2: Choisir une Solution

#### **Option A: Se Connecter avec le Bon Compte** ✅ Recommandé si vous avez accès

1. Déconnectez-vous de l'application
2. Reconnectez-vous avec l'email qui possède les recettes (voir résultat de l'Étape 1)
3. Rafraîchissez la page → Les recettes apparaîtront

**Avantages:**
- ✅ Aucune modification de la base de données
- ✅ Conserve l'intégrité des données
- ✅ Solution instantanée

---

#### **Option B: Réassigner les Recettes au Nouvel Utilisateur** ⚠️ Modifications permanentes

**Quand utiliser cette option:**
- L'ancien compte n'existe plus ou est inaccessible
- Vous voulez migrer toutes les données vers un nouveau compte
- Vous êtes sûr qu'il n'y a qu'un seul utilisateur légitime

**Commandes:**

1. Exécutez `fix_user_recettes.sql` dans Supabase SQL Editor

Ce script va :
- ✅ Désactiver temporairement RLS
- ✅ Réassigner **TOUTES** les recettes à `eddostedson@gmail.com`
- ✅ Réassigner **TOUTES** les dépenses à `eddostedson@gmail.com`
- ✅ Réactiver RLS
- ✅ Vérifier le résultat

**⚠️ ATTENTION:**
- Cette opération est **IRRÉVERSIBLE**
- Toutes les recettes seront transférées à un seul utilisateur
- Si vous avez plusieurs utilisateurs légitimes, **NE PAS UTILISER** cette solution

---

#### **Option C: Réassignation Manuelle et Ciblée** 🎯 Pour cas complexes

Si vous avez plusieurs utilisateurs et voulez garder la séparation des données :

```sql
-- Identifier l'utilisateur cible
SELECT id FROM auth.users WHERE email = 'eddostedson@gmail.com';

-- Réassigner uniquement certaines recettes
UPDATE recettes 
SET user_id = 'NEW_USER_ID'
WHERE id IN (
    'ID_RECETTE_1',
    'ID_RECETTE_2',
    'ID_RECETTE_3'
);
```

---

### Étape 3: Vérifier la Correction

Après avoir appliqué une solution, vérifiez :

#### **A. Dans Supabase (SQL Editor)**

```sql
-- Voir les recettes de l'utilisateur connecté
SELECT 
    COUNT(*) as nombre_recettes,
    SUM(amount) as total_montant,
    SUM(solde_disponible) as total_solde
FROM recettes
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'eddostedson@gmail.com');
```

#### **B. Dans l'Application**

1. Rafraîchissez la page d'accueil (`localhost:3000/accueil`)
2. Ouvrez la console du navigateur (F12)
3. Vérifiez les logs :

```
🔄 Rechargement des recettes depuis Supabase...
📊 Données brutes de Supabase: (132) [...]
🔍 Nombre de recettes: 132
✅ Recettes chargées depuis Supabase: 132
```

4. Le dashboard devrait maintenant afficher le bon total

---

## 🔎 Debugging Avancé

### Vérifier l'Utilisateur Connecté

Ouvrez la console du navigateur et exécutez :

```javascript
// Récupérer l'utilisateur connecté
const { createClient } = await import('@/lib/supabase/browser')
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
console.log('Utilisateur connecté:', user?.email, user?.id)

// Récupérer les recettes visibles
const { data: recettes } = await supabase
  .from('recettes')
  .select('*')
console.log('Recettes visibles:', recettes?.length)
```

### Vérifier les Politiques RLS

```sql
-- Lister toutes les politiques actives sur recettes
SELECT 
    policyname,
    cmd as operation,
    qual as condition
FROM pg_policies 
WHERE tablename = 'recettes';
```

### Désactiver Temporairement RLS (TEST UNIQUEMENT)

```sql
-- ⚠️ DÉVELOPPEMENT UNIQUEMENT - Ne pas faire en production
ALTER TABLE recettes DISABLE ROW LEVEL SECURITY;

-- Maintenant, toutes les recettes sont visibles par tous
SELECT COUNT(*) FROM recettes;

-- Réactiver immédiatement après test
ALTER TABLE recettes ENABLE ROW LEVEL SECURITY;
```

---

## 📊 Prévention Future

### Créer des Comptes de Test Cohérents

**Fichier:** `.env.local`

```env
# Utilisateur de test
TEST_USER_EMAIL=eddostedson@gmail.com
TEST_USER_PASSWORD=VotreMotDePasse123
```

### Script de Bootstrap des Données

Créez un script qui :
1. Crée un utilisateur de test
2. Insère des données avec le bon `user_id`
3. Vérifie la cohérence

---

## ✅ Checklist de Résolution

- [ ] Exécuté `diagnostic_user_mismatch.sql`
- [ ] Identifié l'utilisateur propriétaire des recettes
- [ ] Choisi une solution (A, B, ou C)
- [ ] Appliqué la solution
- [ ] Vérifié dans Supabase SQL Editor
- [ ] Vérifié dans l'application
- [ ] Logs de la console corrects
- [ ] Dashboard affiche le bon total

---

## 🆘 Support

Si le problème persiste après avoir suivi ce guide :

1. **Vérifier les logs Supabase:**
   - Supabase Dashboard > Logs > Explorer
   - Filtrer par `recettes`

2. **Vérifier les erreurs réseau:**
   - Console Navigateur > Network Tab
   - Rechercher les requêtes vers `/rest/v1/recettes`

3. **Vérifier l'authentification:**
   ```javascript
   const { data: { session } } = await supabase.auth.getSession()
   console.log('Session active:', session !== null)
   ```

---

## 📝 Résumé

**Problème:** Total Recettes = 0 F CFA malgré des données dans la base  
**Cause:** RLS filtre les recettes selon `user_id` (utilisateur connecté ≠ propriétaire des données)  
**Solution Rapide:** Se connecter avec le bon compte  
**Solution Alternative:** Réassigner les recettes avec `fix_user_recettes.sql`  
**Prévention:** Utiliser des comptes de test cohérents et des scripts de bootstrap  

---

**Créé le:** 2025-10-29  
**Dernière mise à jour:** 2025-10-29



