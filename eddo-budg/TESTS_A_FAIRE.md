# 🧪 TESTS À FAIRE MAINTENANT

## ✅ **Le serveur tourne sur : http://localhost:3002**

---

## 🎯 **TEST 1 : PAGE RECETTES**

### **1. Ouvrez la page**
```
http://localhost:3002/recettes
```

### **2. Créez votre première recette**
- Cliquez sur **"➕ Nouvelle recette"**
- Remplissez le formulaire :
  - **Libellé** : Salaire Janvier 2025
  - **Montant** : 500000
  - **Source** : Salaire mensuel
  - **Périodicité** : Mensuelle
  - **Date** : (garder la date actuelle)
  - **Statut** : Reçue
- Cliquez sur **"Créer la recette"**

### **3. Vérifiez**
✅ La recette apparaît dans la liste
✅ Les statistiques en haut sont mises à jour
✅ Le solde disponible = montant (500,000 FCFA)

---

## 🎯 **TEST 2 : PAGE DÉPENSES**

### **1. Ouvrez la page**
```
http://localhost:3002/depenses
```

### **2. Créez un budget d'abord**
- Retournez sur : http://localhost:3002/
- Créez un budget :
  - **Nom** : Alimentation
  - **Montant** : 150000
  - **Description** : Budget courses mensuel
  - **Période** : Mensuel
  - **Couleur** : (choisissez une couleur)
  - **Source** : Salaire

### **3. Créez une dépense**
- Retournez sur : http://localhost:3002/depenses
- Cliquez sur **"➕ Nouvelle dépense"**
- Remplissez :
  - **Budget concerné** : Alimentation
  - → Vous devez voir : **"Disponible : 150,000 FCFA"** ✅
  - **Libellé** : Courses Carrefour
  - **Date** : (garder la date actuelle)
  - **Montant** : 45000
  - **En bas, vous verrez la liste des recettes avec leurs soldes** ✅
- Cliquez sur **"Créer la dépense"**

### **4. Vérifiez**
✅ La dépense apparaît dans la liste
✅ Le budget Alimentation passe à : 105,000 FCFA restant

---

## 🎯 **TEST 3 : CALCUL AUTOMATIQUE**

### **1. Retournez sur la page Budgets**
```
http://localhost:3002/
```

### **2. Vérifiez**
✅ Le budget "Alimentation" affiche : 105,000 FCFA restant
✅ Le calcul est fait automatiquement par le trigger SQL !

---

## 📸 **FAITES CES TESTS ET DITES-MOI :**

1. ✅ La page /recettes fonctionne ?
2. ✅ La page /depenses fonctionne ?
3. ✅ Les calculs sont automatiques ?
4. ❌ Y a-t-il des erreurs ?

**Ouvrez la console (F12) pour voir les logs !** 🔍

