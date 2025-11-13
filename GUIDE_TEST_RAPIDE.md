# 🧪 GUIDE DE TEST RAPIDE - APPLICATION EDDO-BUDG

## ✅ CORRECTION APPLIQUÉE

**Problème** : `DialogFooter` n'existait pas dans le composant Dialog
**Solution** : Remplacement du Dialog personnalisé par un Dialog Radix UI complet

---

## 🚀 ÉTAPES DE TEST

### 1️⃣ **Accéder à l'application**

Ouvrez votre navigateur et allez sur :
```
http://localhost:3001
```

Vous devriez être automatiquement redirigé vers :
```
http://localhost:3001/auth
```

---

### 2️⃣ **Se connecter**

#### **Option A : Compte existant**
- Entrez votre email et mot de passe
- Cliquez sur "Se connecter"

#### **Option B : Créer un nouveau compte**
1. Cliquez sur "S'inscrire" (ou changez le mode)
2. Entrez un email et mot de passe (min. 6 caractères)
3. Confirmez le mot de passe
4. Cliquez sur "S'inscrire"
5. Vérifiez votre boîte mail (si demandé)

#### **Option C : Vérifier les comptes existants**
Dans **Supabase SQL Editor**, exécutez :
```sql
SELECT email, created_at 
FROM auth.users 
ORDER BY created_at DESC;
```

---

### 3️⃣ **Tester la CRÉATION de RECETTE**

1. Après connexion, vous êtes sur `/accueil`
2. Naviguez vers **"Recettes"** (dans le menu latéral ou en allant sur `http://localhost:3001/recettes`)
3. Cliquez sur le bouton **"Nouvelle Recette"** (en haut à droite)
4. **Un dialog doit s'ouvrir** avec le formulaire :
   - Libellé : `Test Recette - Premier essai`
   - Montant : `85000`
   - Date : (Sélectionnez la date d'aujourd'hui)
   - Description : `Ceci est un test de création de recette`
5. Cliquez sur **"✅ Créer la recette"**
6. **Vérifications** :
   - ✅ Toast de succès : "✅ Recette créée avec succès !"
   - ✅ Le dialog se ferme automatiquement
   - ✅ La nouvelle recette apparaît dans la liste
   - ✅ Les statistiques en haut se mettent à jour

---

### 4️⃣ **Tester la CRÉATION de DÉPENSE**

1. Naviguez vers **"Dépenses"** (dans le menu ou `http://localhost:3001/depenses`)
2. Cliquez sur le bouton **"Nouvelle Dépense"** (en haut à droite)
3. **Un dialog doit s'ouvrir** avec le formulaire :
   - Libellé : `Achat matériel`
   - Montant : `25000`
   - Date : (Aujourd'hui)
   - **Lier à une recette** : Sélectionnez "Test Recette - Premier essai" dans la liste
   - Catégorie : `Fournitures`
   - Description : `Test de dépense liée`
4. Cliquez sur **"✅ Créer la dépense"**
5. **Vérifications** :
   - ✅ Toast de succès : "✅ Dépense créée avec succès !"
   - ✅ Le dialog se ferme
   - ✅ La nouvelle dépense apparaît dans la liste
   - ✅ Elle indique qu'elle est liée à "Test Recette - Premier essai"

---

### 5️⃣ **Vérifier la LIAISON Recette → Dépense**

1. Retournez sur **"Recettes"**
2. Trouvez "Test Recette - Premier essai"
3. **Vérifications** :
   - ✅ Montant initial : `85 000 F CFA`
   - ✅ Solde disponible : `60 000 F CFA` (85000 - 25000)
   - ✅ Statut : "Utilisée" (badge orange)

---

### 6️⃣ **Tester la SUPPRESSION**

#### **Supprimer une Dépense**
1. Sur la page **Dépenses**
2. Trouvez "Achat matériel"
3. Cliquez sur **"Supprimer"**
4. Confirmez dans la popup
5. **Vérifications** :
   - ✅ Toast : "✅ Dépense supprimée avec succès !"
   - ✅ La dépense disparaît de la liste
   - ✅ Retournez sur Recettes → le solde est recalculé (85000 F CFA)

#### **Supprimer une Recette**
1. Sur la page **Recettes**
2. Trouvez "Test Recette - Premier essai"
3. Cliquez sur **"Supprimer"**
4. Confirmez (⚠️ toutes les dépenses liées seront supprimées)
5. **Vérifications** :
   - ✅ Toast : "✅ Recette supprimée avec succès !"
   - ✅ La recette disparaît
   - ✅ Les statistiques se mettent à jour

---

## 🔍 **VÉRIFICATION DANS LA BASE DE DONNÉES**

### **Voir les Recettes créées**
```sql
SELECT 
    id,
    description,
    amount,
    solde_disponible,
    receipt_date,
    created_at
FROM recettes
ORDER BY created_at DESC
LIMIT 10;
```

### **Voir les Dépenses et leurs liaisons**
```sql
SELECT 
    d.id,
    d.libelle,
    d.montant,
    d.date,
    d.recette_id,
    r.description as recette_liee
FROM depenses d
LEFT JOIN recettes r ON d.recette_id = r.id
ORDER BY d.created_at DESC
LIMIT 10;
```

### **Vérifier les Soldes**
```sql
SELECT 
    r.description as recette,
    r.amount as montant_initial,
    r.solde_disponible,
    COUNT(d.id) as nb_depenses,
    COALESCE(SUM(d.montant), 0) as total_depenses
FROM recettes r
LEFT JOIN depenses d ON d.recette_id = r.id
GROUP BY r.id, r.description, r.amount, r.solde_disponible
ORDER BY r.created_at DESC;
```

---

## ❌ **EN CAS D'ERREUR**

### **Erreur : "Auth session missing!"**
- **Solution** : Déconnectez-vous et reconnectez-vous
- Allez sur `http://localhost:3001/auth`

### **Erreur : "Cannot read properties of undefined"**
- **Solution** : Vérifiez que vous êtes bien connecté
- Rafraîchissez la page (F5)

### **Le Dialog ne s'ouvre pas**
- **Solution** : Ouvrez la console (F12)
- Vérifiez s'il y a des erreurs JavaScript
- Redémarrez le serveur : `pnpm run dev`

### **Les données ne s'affichent pas**
- **Solution** : Vérifiez que la table existe dans Supabase
- Exécutez la requête de vérification ci-dessus
- Vérifiez les RLS (Row Level Security)

---

## ✅ **CHECKLIST COMPLÈTE**

- [ ] Connexion réussie
- [ ] Navigation entre les pages fonctionne
- [ ] Bouton "Nouvelle Recette" ouvre un dialog
- [ ] Création de recette réussie
- [ ] Recette apparaît dans la liste
- [ ] Bouton "Nouvelle Dépense" ouvre un dialog
- [ ] Sélection d'une recette fonctionne
- [ ] Création de dépense réussie
- [ ] Dépense apparaît dans la liste
- [ ] Solde de la recette est mis à jour
- [ ] Suppression de dépense fonctionne
- [ ] Suppression de recette fonctionne
- [ ] Toasts de confirmation apparaissent
- [ ] Les statistiques se mettent à jour

---

## 📞 **SUPPORT**

Si vous rencontrez un problème :
1. Ouvrez la console du navigateur (F12)
2. Copiez l'erreur complète
3. Vérifiez le terminal où tourne `pnpm run dev`
4. Partagez les logs

---

## 🎉 **FÉLICITATIONS !**

Si tous les tests passent, votre application est **100% fonctionnelle** pour le CRUD de base !

**Prochaines étapes** :
- Implémenter la modification (Edit)
- Ajouter l'upload de reçus
- Créer des graphiques de statistiques
- Ajouter des filtres avancés

