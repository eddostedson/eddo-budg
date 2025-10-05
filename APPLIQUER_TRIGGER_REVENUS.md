# 🔧 Application du trigger avec gestion des revenus

## 🎯 Ce que cette migration fait

### **AVANT (problème)**
- ✅ Les dépenses diminuaient le budget
- ❌ Les revenus n'affectaient PAS le budget

### **APRÈS (corrigé)**
- ✅ Les dépenses diminuent le budget
- ✅ Les revenus augmentent le budget

**Formule :** `Restant = Montant initial + Revenus - Dépenses`

---

## 📋 Comment appliquer

### **Étape 1 : Ouvrez Supabase**
1. Allez sur https://supabase.com
2. Connectez-vous
3. Ouvrez votre projet

### **Étape 2 : Ouvrez le SQL Editor**
1. Cliquez sur **"SQL Editor"** dans le menu de gauche
2. Cliquez sur **"New query"**

### **Étape 3 : Copiez le script**
Ouvrez le fichier : `supabase/migrations/004_fix_trigger_with_incomes.sql`

**Copiez TOUT le contenu** (du début à la fin)

### **Étape 4 : Collez et exécutez**
1. Collez dans l'éditeur SQL de Supabase
2. Cliquez sur **"Run"** (ou F5)
3. Acceptez l'avertissement "destructive operation"

---

## 🎉 Résultat attendu

Vous verrez des messages comme :
```
🔄 Recalcul de tous les budgets avec revenus et dépenses...
✅ Budget xxx - Initial: 2000000, Revenus: 200000, Dépenses: 0, Restant: 2200000
🎉 Recalcul terminé !
```

---

## ✅ Vérification

Après l'application :

### **Dans votre application :**
1. Rechargez la page (F5)
2. Vous devriez voir :
   - **Montant total** : 2,000,000 FCFA (inchangé)
   - **Restant** : 2,200,000 FCFA (initial + revenus)
   - **Dépensé** : 0 FCFA

### **Test complet :**
```
Budget initial : 2,000,000 FCFA

+ Ajoutez un revenu : 200,000 FCFA
  → Restant : 2,200,000 FCFA ✅

- Ajoutez une dépense : 50,000 FCFA
  → Restant : 2,150,000 FCFA ✅

Formule : 2,000,000 + 200,000 - 50,000 = 2,150,000 ✅
```

---

## 🔄 Après l'application

1. **Rechargez votre application** (F5)
2. **Videz le cache** :
   ```javascript
   localStorage.clear()
   window.location.reload()
   ```
3. **Testez** en ajoutant un revenu et une dépense

---

## 💡 Nouvelle logique

| Type | Impact sur le budget |
|------|---------------------|
| **Revenu** | ➕ Augmente le restant |
| **Dépense** | ➖ Diminue le restant |

**Exemple concret :**
```
Budget "Salaire" : 500,000 FCFA

Transactions :
+ Salaire principal : 500,000 FCFA (revenu)
+ Prime : 100,000 FCFA (revenu)
- Loyer : 200,000 FCFA (dépense)
- Courses : 50,000 FCFA (dépense)

Calcul :
= 500,000 (initial) + 600,000 (revenus) - 250,000 (dépenses)
= 850,000 FCFA restant ✅
```

---

## 🎯 Avantages

1. ✅ **Gestion complète** : Revenus et dépenses
2. ✅ **Calcul automatique** : Via trigger SQL
3. ✅ **En temps réel** : Mise à jour instantanée
4. ✅ **Cohérence** : Toujours synchronisé

---

**Appliquez maintenant le script dans Supabase ! 🚀**

