# 🚀 Guide Rapide : Statuts des Transactions

## 📋 3 Types de Statuts

| Statut | Icône | Affichage | Affecte le solde ? |
|--------|-------|-----------|-------------------|
| **Exécutée** | ✅ | Fond gris normal | ✅ **OUI** |
| **Planifiée** | 📅 | Fond bleu | ❌ **NON** |
| **Annulée** | ❌ | Fond gris transparent | ❌ **NON** |

---

## 🎯 Utilisation en 3 étapes

### **1. Créer une transaction planifiée**
```
Budget "Salaire Septembre" : 270,000 FCFA

➡️ Nouvelle transaction :
   Description : "Loyer octobre"
   Montant : 50,000 FCFA
   Date : 10/10/2025
   Statut : 📅 Planifiée

Résultat :
✅ Transaction visible dans la liste
✅ Fond bleu pour la distinguer
❌ Solde INCHANGÉ : 270,000 FCFA
```

### **2. Exécuter la transaction**
```
Le 10/10, vous payez le loyer

➡️ Cliquez sur ✓ ou modifiez le statut :
   Statut : ✅ Exécutée

Résultat :
✅ Solde mis à jour : 220,000 FCFA
✅ Badge "✅ Exécutée"
✅ Fond normal
```

### **3. (Optionnel) Annuler si besoin**
```
Finalement, vous n'avez pas besoin de cette dépense

➡️ Modifiez le statut :
   Statut : ❌ Annulée

Résultat :
✅ Transaction grisée
❌ N'affecte pas le solde
✅ Reste dans l'historique
```

---

## 💡 Cas d'usage concrets

### **Dépenses récurrentes**
- 📅 Loyer (1er du mois)
- 📅 Électricité (15 du mois)
- 📅 Internet (20 du mois)
- 📅 Assurances (25 du mois)

**Avantage** : Vous voyez d'un coup d'œil toutes vos obligations futures !

### **Dépenses prévues**
- 📅 Courses de la semaine
- 📅 Plein d'essence prévu
- 📅 Sortie restaurant planifiée

**Avantage** : Vous anticipez vos dépenses avant de les faire !

---

## 📊 Différence Solde Actuel vs Prévisionnel

```
Budget : 500,000 FCFA

Transactions exécutées :
✅ Courses : -50,000 FCFA
✅ Essence : -30,000 FCFA

Transactions planifiées :
📅 Loyer : -200,000 FCFA
📅 Électricité : -40,000 FCFA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Solde ACTUEL : 420,000 FCFA
(seulement les exécutées)

Solde PRÉVISIONNEL : 180,000 FCFA
(après les planifiées)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎨 Aperçu visuel

### **Transaction exécutée**
```
┌─────────────────────────────────────┐
│ 🔴 Courses              -50,000 XOF │
│    04/10/2025 • Alimentation        │
│    ✅ Exécutée                      │
│    [✏️ Modifier] [🗑️ Supprimer]    │
└─────────────────────────────────────┘
```

### **Transaction planifiée**
```
┌─────────────────────────────────────┐
│ 🔵 FOND BLEU CLAIR                  │
│ 🔴 Loyer 📅            -200,000 XOF │
│    10/10/2025 • Logement            │
│    📅 À venir                       │
│    [✓ Exécuter] [✏️] [🗑️]         │
└─────────────────────────────────────┘
```

### **Transaction annulée**
```
┌─────────────────────────────────────┐
│ ⬜ FOND GRIS (transparent)          │
│ 🔴 Restaurant ❌        -15,000 XOF │
│    12/10/2025 • Loisirs             │
│    ❌ Annulée                       │
│    [✏️ Modifier] [🗑️ Supprimer]    │
└─────────────────────────────────────┘
```

---

## ⚡ Raccourcis

| Action | Bouton | Résultat |
|--------|--------|----------|
| Exécuter rapidement | ✓ | Change le statut en "Exécutée" |
| Modifier | ✏️ | Ouvre le formulaire de modification |
| Supprimer | 🗑️ | Supprime définitivement |

---

## 🎯 Résumé en 1 phrase

> **Créez vos dépenses futures en "Planifiée", elles n'affectent pas le solde. Quand vous les payez, cliquez sur ✓ pour les marquer "Exécutée" et mettre à jour le solde automatiquement ! 🚀**

---

## 📞 Besoin d'aide ?

Consultez le guide complet : `FONCTIONNALITE_STATUTS_TRANSACTIONS.md`

