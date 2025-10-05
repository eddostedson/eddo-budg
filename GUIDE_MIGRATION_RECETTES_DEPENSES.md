# 🚀 GUIDE DE MIGRATION : RECETTES → BUDGETS → DÉPENSES

## 📋 Vue d'ensemble

Cette migration transforme votre application en un système comptable complet avec 3 niveaux :

```
1. RECETTES (Revenus)
   ↓ Alimentent
2. BUDGETS (Enveloppes)
   ↓ Financent
3. DÉPENSES (Sorties)
```

---

## ✅ CE QUI A ÉTÉ CRÉÉ

### **1. Base de données**
- ✅ Table `recettes` : Vos sources de revenus
- ✅ Table `depenses` : Vos sorties d'argent
- ✅ Table `allocations` : Lien entre recettes et budgets
- ✅ Triggers SQL automatiques

### **2. Backend**
- ✅ `RecetteService` : CRUD recettes
- ✅ `DepenseService` : CRUD dépenses
- ✅ `AllocationService` : CRUD allocations

### **3. Contexts React**
- ✅ `RecetteContext` : Gestion des recettes
- ✅ `DepenseContext` : Gestion des dépenses

### **4. Pages**
- ✅ `/recettes` : Gérer vos revenus
- ✅ `/depenses` : Gérer vos dépenses avec formulaire spécial

### **5. Navigation**
- ✅ Sidebar mise à jour

---

## 📋 ÉTAPES D'APPLICATION

### **Étape 1 : Appliquer la migration SQL**

1. **Ouvrez Supabase** :
   - Allez sur https://supabase.com
   - Connectez-vous
   - Ouvrez votre projet

2. **Ouvrez le SQL Editor** :
   - Cliquez sur "SQL Editor" dans le menu de gauche
   - Cliquez sur "New query"

3. **Copiez et exécutez** :
   - Ouvrez le fichier : `supabase/migrations/005_create_recettes_depenses.sql`
   - Copiez **TOUT** le contenu
   - Collez dans Supabase SQL Editor
   - Cliquez sur "Run" (F5)
   - Acceptez l'avertissement "destructive operation"

4. **Vérifiez le résultat** :
   ```
   ✅ Migration 005 terminée avec succès !
   📊 Tables créées : recettes, depenses, allocations
   🔒 RLS activé sur toutes les tables
   ⚡ Triggers automatiques configurés
   ```

---

### **Étape 2 : Tester l'application**

1. **Démarrez l'application** :
   ```bash
   npm run dev
   ```

2. **Testez les recettes** :
   - Allez sur `/recettes`
   - Créez une nouvelle recette (ex: Salaire Janvier 2025, 500,000 FCFA)
   - Vérifiez qu'elle apparaît dans la liste

3. **Testez les budgets** :
   - Allez sur `/` (Budgets)
   - Vos budgets existants sont toujours là
   - Créez un nouveau budget si nécessaire

4. **Testez les dépenses** :
   - Allez sur `/depenses`
   - Créez une nouvelle dépense :
     - Sélectionnez un budget
     - Vous verrez le montant disponible s'afficher en haut
     - Saisissez le libellé (avec auto-complétion)
     - Saisissez le montant
     - En bas, vous verrez toutes les recettes avec leurs soldes
   - Créez la dépense
   - Vérifiez que le budget a été mis à jour automatiquement

---

## 🎨 NOUVELLE INTERFACE

### **Page /recettes**
```
┌─────────────────────────────────────┐
│ 💰 Recettes                         │
│ Gérez vos sources de revenus        │
│                     [➕ Nouvelle recette] │
├─────────────────────────────────────┤
│ Total : 600,000 FCFA                │
│ Disponible : 600,000 FCFA           │
│ Nombre : 2                          │
├─────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐  │
│ │ Salaire      │ │ Prime        │  │
│ │ 500,000 FCFA │ │ 100,000 FCFA │  │
│ └──────────────┘ └──────────────┘  │
└─────────────────────────────────────┘
```

### **Page /depenses**
```
┌─────────────────────────────────────┐
│ 💸 Dépenses                         │
│ Gérez vos sorties d'argent          │
│                     [➕ Nouvelle dépense]│
├─────────────────────────────────────┤
│ Budget concerné : [▼ Alimentation]  │
│ → Disponible : 250,000 FCFA ✅      │
├─────────────────────────────────────┤
│ Libellé : [Courses_____________▼]   │
│   └─ Suggestions : Courses, Essence │
├─────────────────────────────────────┤
│ Date : [2025-01-04]                 │
│ Montant : [25000]                   │
├─────────────────────────────────────┤
│ 📊 RECETTES DISPONIBLES             │
│ ├─ Salaire : 500,000 FCFA          │
│ └─ Prime : 100,000 FCFA            │
└─────────────────────────────────────┘
```

---

## 🔄 FLUX COMPTABLE

### **Scénario complet**

**1. Créer une recette** :
```
Salaire Janvier 2025
Montant : 500,000 FCFA
Source : Salaire mensuel
Périodicité : Mensuelle
```

**2. Créer des budgets** :
```
Budget Alimentation : 150,000 FCFA
Budget Transport : 80,000 FCFA
Budget Logement : 200,000 FCFA
Budget Épargne : 70,000 FCFA
```

**3. Créer des dépenses** :
```
Dépense 1 :
- Budget : Alimentation
- Libellé : Courses Carrefour
- Montant : 45,000 FCFA
→ Budget Alimentation : 150,000 - 45,000 = 105,000 FCFA

Dépense 2 :
- Budget : Transport
- Libellé : Essence
- Montant : 15,000 FCFA
→ Budget Transport : 80,000 - 15,000 = 65,000 FCFA
```

---

## 🎯 AVANTAGES DE LA NOUVELLE ARCHITECTURE

### **1. Séparation claire**
- ✅ Les revenus sont dans "Recettes"
- ✅ Les enveloppes sont dans "Budgets"
- ✅ Les sorties sont dans "Dépenses"

### **2. Formulaire intelligent**
- ✅ Affichage du solde disponible
- ✅ Auto-complétion des libellés
- ✅ Liste des recettes en temps réel

### **3. Calculs automatiques**
- ✅ Triggers SQL : Tout est calculé automatiquement
- ✅ Pas besoin de rafraîchir manuellement
- ✅ Cohérence garantie

### **4. Comptabilité professionnelle**
- ✅ Architecture classique RECETTES → BUDGETS → DÉPENSES
- ✅ Traçabilité complète
- ✅ Prêt pour l'analyse IA

---

## 🔧 MIGRATION DES DONNÉES EXISTANTES

Si vous avez déjà des données :

### **Option 1 : Garder l'ancien système**
- ✅ Vos anciens budgets restent intacts
- ✅ Vous pouvez continuer à utiliser "Transactions"
- ✅ Le nouveau système (Recettes/Dépenses) est additionnel

### **Option 2 : Migrer progressivement**
1. Créez de nouvelles recettes
2. Créez de nouveaux budgets
3. Utilisez "Dépenses" pour les nouvelles sorties
4. Gardez "Transactions" pour l'historique

---

## 🚨 POINTS IMPORTANTS

### **1. RLS (Row Level Security)**
- ✅ Chaque utilisateur voit seulement SES données
- ✅ Pas de risque de fuite de données

### **2. Triggers SQL**
- ✅ Les budgets se mettent à jour automatiquement
- ✅ Les soldes des recettes sont recalculés automatiquement

### **3. Validation**
- ✅ On peut créer une dépense même si le budget est insuffisant (avec confirmation)
- ✅ Tous les montants sont positifs

---

## 📞 BESOIN D'AIDE ?

**Si quelque chose ne fonctionne pas** :
1. Vérifiez que la migration SQL s'est bien exécutée
2. Vérifiez que vous êtes authentifié
3. Ouvrez la console (F12) pour voir les erreurs
4. Rechargez la page (F5)
5. Videz le cache : `localStorage.clear()` + `window.location.reload()`

---

## 🎉 RÉSULTAT FINAL

**Vous avez maintenant une application comptable complète avec** :

- ✅ Gestion des revenus (Recettes)
- ✅ Gestion des budgets (Enveloppes)
- ✅ Gestion des dépenses (Sorties)
- ✅ Calculs automatiques
- ✅ Interface intuitive
- ✅ Architecture professionnelle

**Félicitations ! Votre application est prête pour une utilisation professionnelle ! 🚀**

