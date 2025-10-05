# 🧪 Guide de Test CRUD - Recettes

## 📋 Tests à Effectuer

### ✅ **Test 1: Création de Recette**

1. **Aller sur la page Recettes**
   - URL: `http://localhost:3000/recettes`
   - Vérifier que la page se charge correctement

2. **Créer une recette de test**
   - Cliquer sur "Créer une recette"
   - Remplir le formulaire :
     ```
     Libellé: "Salaire Test"
     Description: "Test de création"
     Montant: 250000
     Source: "Test Source"
     Date: [Date actuelle]
     Statut: "Reçue"
     ```
   - Cliquer sur "Créer"

3. **Vérifier le résultat**
   - ✅ La recette apparaît dans la liste
   - ✅ Les statistiques se mettent à jour
   - ✅ Aucune erreur dans la console

---

### ✏️ **Test 2: Modification de Recette**

1. **Survoler une carte de recette**
   - Passer la souris sur une carte existante
   - ✅ Les boutons ✏️ et 🗑️ apparaissent

2. **Modifier la recette**
   - Cliquer sur le bouton ✏️ (crayon)
   - ✅ Le modal s'ouvre avec les données pré-remplies
   - Modifier le libellé : "Salaire Test - Modifié"
   - Modifier le montant : 300000
   - Cliquer sur "Enregistrer"

3. **Vérifier le résultat**
   - ✅ Les modifications sont sauvegardées
   - ✅ La carte affiche les nouvelles valeurs
   - ✅ Les statistiques se mettent à jour

---

### 🗑️ **Test 3: Suppression de Recette**

1. **Survoler une carte de recette**
   - Passer la souris sur une carte existante
   - ✅ Les boutons d'action sont visibles

2. **Supprimer la recette**
   - Cliquer sur le bouton 🗑️ (poubelle)
   - ✅ Une confirmation apparaît : "Êtes-vous sûr de vouloir supprimer cette recette ?"
   - Cliquer sur "OK"

3. **Vérifier le résultat**
   - ✅ La recette disparaît de la liste
   - ✅ Les statistiques se mettent à jour
   - ✅ Aucune erreur dans la console

---

## 🔍 **Vérifications Backend**

### **Console du Navigateur (F12)**
Vérifier que les logs suivants apparaissent :
```
✅ Recette créée avec succès: [ID]
✅ Recette mise à jour avec succès: [ID]
✅ Recette supprimée avec succès: [ID]
```

### **Base de Données Supabase**
1. Aller sur Supabase Dashboard
2. Table Editor > `recettes`
3. Vérifier que les données sont cohérentes

---

## 🚨 **Dépannage**

### **Problème: Boutons d'action non visibles**
**Solution:**
- Vérifier que vous êtes connecté
- Survoler complètement la carte (pas seulement le texte)
- Attendre l'animation d'apparition

### **Problème: Erreur lors de la modification**
**Solution:**
- Vérifier la console pour les erreurs
- S'assurer que tous les champs requis sont remplis
- Vérifier la connexion à Supabase

### **Problème: Suppression ne fonctionne pas**
**Solution:**
- Vérifier les permissions RLS dans Supabase
- S'assurer que l'utilisateur est bien authentifié
- Vérifier les logs dans la console

---

## 📊 **Tests de Performance**

### **Test de Charge**
- Créer 5-10 recettes rapidement
- ✅ L'interface reste réactive
- ✅ Toutes les recettes apparaissent

### **Test de Modification en Masse**
- Modifier plusieurs recettes
- ✅ Les changements sont persistants
- ✅ L'interface se met à jour

### **Test de Suppression en Masse**
- Supprimer plusieurs recettes
- ✅ L'interface se met à jour correctement
- ✅ Les statistiques sont recalculées

---

## ✅ **Checklist de Validation**

- [ ] Création de recette fonctionne
- [ ] Boutons d'édition et suppression visibles au survol
- [ ] Modification sauvegarde les changements
- [ ] Suppression retire la recette de la liste
- [ ] Interface se met à jour en temps réel
- [ ] Données cohérentes avec la base de données
- [ ] Aucune erreur dans la console
- [ ] Authentification fonctionne correctement

---

## 🎯 **Résultat Attendu**

Après tous les tests, vous devriez avoir :
- ✅ Une interface fonctionnelle pour créer, modifier et supprimer des recettes
- ✅ Des boutons d'action visibles au survol
- ✅ Une synchronisation parfaite avec la base de données
- ✅ Aucune erreur dans la console
- ✅ Des statistiques qui se mettent à jour automatiquement

---

## 🔧 **Tests Automatisés (Optionnel)**

Pour des tests plus avancés, vous pouvez :

1. **Ouvrir la console du navigateur (F12)**
2. **Copier-coller le contenu de `test-automated-crud.js`**
3. **Appuyer sur Entrée**

Cela lancera des tests automatisés qui vérifieront toutes les fonctionnalités.

---

## 📞 **Support**

Si vous rencontrez des problèmes :
1. Vérifiez la console du navigateur pour les erreurs
2. Vérifiez que vous êtes bien connecté
3. Vérifiez la connexion à Supabase
4. Relancez l'application si nécessaire

