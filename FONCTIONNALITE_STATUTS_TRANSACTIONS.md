# 📋 Nouvelle Fonctionnalité : Statuts des Transactions

## 🎯 Vue d'ensemble

Le système de statuts pour les transactions permet de gérer **3 types de transactions** :

1. ✅ **Exécutée** (completed)
2. 📅 **Planifiée** (pending)
3. ❌ **Annulée** (cancelled)

---

## 💡 Cas d'usage

### **Scénario 1 : Transaction planifiée**

Vous savez que vous devez payer **50,000 FCFA** de loyer le 10 octobre 2025.

**Action** :
- Créez une transaction avec le statut **"Planifiée"**
- Date : 10/10/2025
- Montant : 50,000 FCFA

**Résultat** :
- ✅ La transaction apparaît dans la liste avec un badge **"📅 Planifiée"**
- ✅ Le **solde actuel** reste **inchangé** (270,000 FCFA)
- ✅ Vous pouvez voir que vous avez une dépense future
- ✅ La transaction est affichée avec un **fond bleu** pour la distinguer

---

### **Scénario 2 : Exécution de la transaction**

Le 10 octobre arrive, vous payez effectivement le loyer.

**Action** :
- Cliquez sur le bouton **✓** (valider) sur la transaction planifiée
- OU modifiez la transaction et changez le statut en **"Exécutée"**

**Résultat** :
- ✅ Le **solde est mis à jour** : 270,000 - 50,000 = **220,000 FCFA**
- ✅ Le badge change en **"✅ Exécutée"**
- ✅ La date d'exécution est enregistrée
- ✅ Les **statistiques du budget** sont recalculées automatiquement

---

### **Scénario 3 : Annulation**

Finalement, vous n'avez pas besoin de faire cette dépense.

**Action** :
- Modifiez la transaction et changez le statut en **"Annulée"**

**Résultat** :
- ✅ La transaction reste visible mais avec un badge **"❌ Annulée"**
- ✅ Elle apparaît **grisée** dans la liste
- ✅ Elle **n'affecte pas** le solde du budget

---

## 🎨 Affichage visuel

### **Transaction exécutée (completed)**
```
┌─────────────────────────────────────────────────┐
│ 🔴 Alimentation                 -50,000 FCFA    │
│    04/10/2025 • Courses         ✅ Exécutée     │
│    [✏️] [🗑️]                                   │
└─────────────────────────────────────────────────┘
```

### **Transaction planifiée (pending)**
```
┌─────────────────────────────────────────────────┐
│ 🔵 FOND BLEU                                    │
│ 🔴 Loyer 📅 Planifiée           -50,000 FCFA    │
│    10/10/2025 • Logement        📅 À venir      │
│    [✓] [✏️] [🗑️]                               │
└─────────────────────────────────────────────────┘
```

### **Transaction annulée (cancelled)**
```
┌─────────────────────────────────────────────────┐
│ ⬜ FOND GRIS (OPACITÉ 60%)                      │
│ 🔴 Abonnement ❌ Annulée        -10,000 FCFA    │
│    15/10/2025 • Services        ❌ Annulée      │
│    [✏️] [🗑️]                                   │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Comment utiliser

### **1. Créer une transaction planifiée**

1. Ouvrez un budget
2. Cliquez sur **"+ Ajouter une transaction"**
3. Remplissez les champs :
   - Description : "Loyer octobre"
   - Type : Dépense
   - Catégorie : Logement
   - Montant : 50000
   - Date : 10/10/2025
   - **Statut : 📅 Planifiée**
4. Cliquez sur **"Créer la transaction"**

### **2. Marquer comme exécutée**

**Option A (Bouton rapide)** :
- Cliquez sur le bouton **✓** à côté de la transaction planifiée

**Option B (Modification complète)** :
- Cliquez sur **✏️** (Modifier)
- Changez le statut en **"✅ Exécutée"**
- Modifiez la date si nécessaire (date d'exécution réelle)
- Cliquez sur **"Modifier la transaction"**

### **3. Annuler une transaction**

- Cliquez sur **✏️** (Modifier)
- Changez le statut en **"❌ Annulée"**
- Cliquez sur **"Modifier la transaction"**

---

## 📊 Impact sur les statistiques

### **Transactions EXÉCUTÉES (completed)**
- ✅ **Affectent** le solde du budget
- ✅ **Comptent** dans les statistiques "Dépensé"
- ✅ **Réduisent** le montant "Restant"

### **Transactions PLANIFIÉES (pending)**
- ❌ **N'affectent PAS** le solde actuel
- ❌ **Ne comptent PAS** dans "Dépensé"
- ✅ **Visibles** dans la liste pour planification
- ℹ️ **Peuvent être converties** en "Exécutées" quand réalisées

### **Transactions ANNULÉES (cancelled)**
- ❌ **N'affectent PAS** le solde
- ❌ **Ne comptent PAS** dans "Dépensé"
- ℹ️ **Restent visibles** pour l'historique
- ℹ️ **Apparaissent grisées** pour indiquer qu'elles sont inactives

---

## 🔄 Flux de travail complet

```
1. CRÉATION
   │
   ├─> Statut : Planifiée (pending)
   │   ├─> Solde : INCHANGÉ
   │   ├─> Affichage : Fond bleu
   │   └─> Badge : 📅 Planifiée
   │
   ↓
2. EXÉCUTION
   │
   ├─> Statut : Exécutée (completed)
   │   ├─> Solde : MIS À JOUR
   │   ├─> Affichage : Fond gris normal
   │   └─> Badge : ✅ Exécutée
   │
   ↓ (optionnel)
3. ANNULATION
   │
   └─> Statut : Annulée (cancelled)
       ├─> Solde : INCHANGÉ
       ├─> Affichage : Fond gris + opacité
       └─> Badge : ❌ Annulée
```

---

## 🚀 Avantages

### **1. Planification budgétaire**
- Visualisez vos **dépenses futures**
- Anticipez les **flux de trésorerie**
- Évitez les **mauvaises surprises**

### **2. Gestion flexible**
- Créez des transactions **à l'avance**
- Modifiez ou **annulez** si nécessaire
- **Historique complet** de toutes les opérations

### **3. Statistiques précises**
- Solde actuel **exact** (sans les transactions planifiées)
- Solde prévisionnel **calculable** (avec les planifiées)
- **Séparation claire** entre réalisé et prévisionnel

---

## 🎯 Exemples concrets

### **Budget mensuel typique**

```
Budget "Vie courante" : 500,000 FCFA
├─ Exécutées :
│  ├─ ✅ Courses (04/10) : -50,000 FCFA
│  └─ ✅ Essence (06/10) : -30,000 FCFA
│
├─ Planifiées :
│  ├─ 📅 Loyer (10/10) : -200,000 FCFA
│  ├─ 📅 Électricité (15/10) : -40,000 FCFA
│  └─ 📅 Internet (20/10) : -25,000 FCFA
│
└─ Annulées :
   └─ ❌ Sortie restaurant (12/10) : -15,000 FCFA

Solde actuel : 420,000 FCFA
Solde après planifiées : 155,000 FCFA
```

---

## 💡 Conseils d'utilisation

1. ✅ **Planifiez toutes vos dépenses récurrentes** (loyer, factures)
2. ✅ **Marquez comme exécutée** dès que vous payez
3. ✅ **N'annulez que si vraiment nécessaire** (pour garder l'historique)
4. ✅ **Utilisez la date réelle d'exécution** quand vous validez
5. ✅ **Vérifiez régulièrement** vos transactions planifiées

---

## 🛠️ Technique : Impact sur la base de données

### **Trigger SQL**
Le trigger `update_budget_spent()` ne prend en compte que les transactions avec :
- `status = 'completed'`
- `type = 'expense'`

**Code** :
```sql
UPDATE budgets
SET 
  spent = (
    SELECT COALESCE(SUM(ABS(amount)), 0)
    FROM transactions
    WHERE budget_id = target_budget_id
      AND type = 'expense'
      AND status = 'completed'  ← Uniquement les exécutées
  )
```

---

## 📝 Notes importantes

1. ⚠️ **Les transactions planifiées N'AFFECTENT PAS le trigger SQL**
2. ⚠️ **Seules les transactions exécutées modifient les statistiques**
3. ℹ️ **Les transactions annulées restent en base pour l'historique**
4. ℹ️ **Vous pouvez modifier le statut à tout moment**

---

## 🎉 Résumé

Cette fonctionnalité transforme votre application en un **véritable outil de planification budgétaire** :

- 📅 **Planifiez** vos dépenses futures
- ✅ **Validez** quand elles sont réalisées
- ❌ **Annulez** si nécessaire
- 📊 **Visualisez** clairement votre situation réelle et future

**Votre budget devient dynamique et prévisionnel ! 🚀**

