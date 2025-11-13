# 🔧 DÉPANNAGE : ERREUR DE CRÉATION DE RECETTE

## ❌ PROBLÈME IDENTIFIÉ

**Erreur** : `Erreur lors de la création de la recette: ()`

**Cause** : Mauvais mapping des colonnes entre l'application et la base de données Supabase.

---

## ✅ CORRECTION APPLIQUÉE

### **Fichier modifié** : `src/contexts/recette-context-direct.tsx`

**Changements** :
- ❌ `date: recette.date` → ✅ `receipt_date: recette.date`
- ✅ Ajout de fallbacks pour `libelle` et `description`

---

## 🧪 ÉTAPES DE VÉRIFICATION

### **1️⃣ Vérifier la structure de la table dans Supabase**

Exécutez dans **Supabase SQL Editor** :

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'recettes'
ORDER BY ordinal_position;
```

**Colonnes attendues** :
- `id` (uuid)
- `user_id` (uuid)
- `libelle` (text)
- `description` (text)
- `amount` (numeric)
- `solde_disponible` (numeric)
- `receipt_date` (date)
- `statut` (text)
- `receipt_url` (text)
- `receipt_file_name` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

---

### **2️⃣ Tester la création manuellement dans Supabase**

Trouvez d'abord votre `user_id` :

```sql
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 1;
```

Puis testez l'insertion (⚠️ **REMPLACEZ** `YOUR_USER_ID`) :

```sql
INSERT INTO recettes (
    user_id,
    libelle,
    description,
    amount,
    solde_disponible,
    receipt_date,
    statut
) VALUES (
    'YOUR_USER_ID',
    'Test SQL',
    'Test depuis SQL',
    50000,
    50000,
    CURRENT_DATE,
    'Reçue'
) RETURNING *;
```

**Si ça échoue** : L'erreur SQL vous indiquera exactement quelle colonne pose problème.

---

### **3️⃣ Tester dans l'application**

1. **Rafraîchissez votre navigateur** (F5 ou Ctrl+F5)
2. Allez sur `http://localhost:3001/recettes`
3. Cliquez sur **"Nouvelle Recette"**
4. Remplissez le formulaire :
   - **Libellé** : `Test Application`
   - **Montant** : `60000`
   - **Date** : (Aujourd'hui)
   - **Description** : `Test de création`
5. Cliquez sur **"✅ Créer la recette"**

---

### **4️⃣ Vérifier les logs dans la console**

Ouvrez **F12** → **Console** et cherchez :

#### **✅ Succès** :
```
✅ Recette créée avec succès
🔄 Rechargement des recettes depuis Supabase...
✅ Recettes chargées depuis Supabase: X
```

#### **❌ Erreur** :
```
❌ Erreur lors de la création de la recette: { code: '...', message: '...', details: '...' }
```

**L'erreur détaillée** vous dira exactement quel est le problème (colonne manquante, contrainte violée, etc.)

---

## 🔍 ERREURS COURANTES

### **Erreur 1 : `column "date" does not exist`**
**Solution** : ✅ Déjà corrigé ! Nous utilisons maintenant `receipt_date`

### **Erreur 2 : `null value in column "..." violates not-null constraint`**
**Cause** : Une colonne obligatoire n'a pas de valeur

**Solution** :
1. Identifiez la colonne dans l'erreur
2. Vérifiez si le formulaire envoie cette valeur
3. Ajoutez une valeur par défaut dans le contexte

**Exemple** :
```typescript
receipt_date: recette.date || new Date().toISOString().split('T')[0]
```

### **Erreur 3 : `permission denied for table recettes`**
**Cause** : RLS (Row Level Security) bloque l'insertion

**Solution** : Vérifiez les politiques RLS dans Supabase :
```sql
SELECT * FROM pg_policies WHERE tablename = 'recettes';
```

Créez une politique d'insertion si nécessaire :
```sql
CREATE POLICY "Users can insert their own recettes" 
ON recettes FOR INSERT 
WITH CHECK (auth.uid() = user_id);
```

### **Erreur 4 : `new row violates check constraint "..."`**
**Cause** : Une contrainte CHECK est violée (ex: montant > 0)

**Solution** : Vérifiez les contraintes :
```sql
SELECT 
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'recettes' AND con.contype = 'c';
```

---

## 🚀 APRÈS LA CORRECTION

### **Test Final**

1. **Rafraîchissez** le navigateur (Ctrl+F5)
2. **Créez une recette** avec le formulaire
3. **Vérifiez dans Supabase** :

```sql
SELECT * FROM recettes ORDER BY created_at DESC LIMIT 1;
```

4. **Vérifiez dans l'application** : La recette doit apparaître dans la liste

---

## 📞 SI LE PROBLÈME PERSISTE

### **Récupérez les logs détaillés**

Dans la console du navigateur (F12), tapez :

```javascript
// Activer les logs détaillés
localStorage.setItem('debug', 'true');
location.reload();
```

Puis retentez la création et **copiez TOUT le message d'erreur** qui apparaît.

---

## ✅ CHECKLIST DE VÉRIFICATION

- [ ] Structure de la table vérifiée
- [ ] Colonnes `receipt_date`, `amount`, `solde_disponible` existent
- [ ] User est bien connecté (token valide)
- [ ] RLS autorise l'insertion
- [ ] Pas de contraintes CHECK violées
- [ ] Le serveur Next.js tourne sur port 3001
- [ ] Le navigateur est rafraîchi (pas de cache)
- [ ] Les logs de la console sont vérifiés

---

## 🎉 SUCCÈS !

Si la création fonctionne, vous verrez :
1. ✅ **Toast vert** : "Recette créée avec succès !"
2. ✅ **Dialog se ferme** automatiquement
3. ✅ **Nouvelle recette** apparaît en haut de la liste
4. ✅ **Statistiques** mises à jour

---

**📝 Exécutez le script `test_creation_recette_diagnostic.sql` dans Supabase pour un diagnostic complet !**

