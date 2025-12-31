# 📎 Guide d'Upload de Reçus pour les Transactions

## ✅ Fonctionnalité Ajoutée

L'upload de reçus est maintenant disponible pour **tous les débits** (dépenses) dans l'application, que ce soit lors de la **création** ou de la **modification** d'une transaction.

---

## 🗄️ 1. Configuration de la Base de Données

### Exécuter le Script SQL

Avant d'utiliser cette fonctionnalité, vous devez ajouter les colonnes nécessaires à la table `transactions_bancaires` :

1. Ouvrez **Supabase Dashboard** → **SQL Editor**
2. Exécutez le fichier : `add_receipt_columns_transactions.sql`

Ce script va :
- ✅ Ajouter les colonnes `receipt_url` et `receipt_file_name`
- ✅ Créer des index pour optimiser les requêtes
- ✅ Ajouter des commentaires de documentation

### Vérifier la Configuration du Bucket

Assurez-vous que le bucket `receipts` est correctement configuré dans Supabase Storage :

```sql
-- Vérifier que le bucket existe
SELECT * FROM storage.buckets WHERE name = 'receipts';
```

Si le bucket n'existe pas, exécutez le script : `configurer_bucket_receipts.sql`

---

## 📱 2. Utilisation dans l'Application

### A. Créer un Débit avec un Reçu

1. Ouvrez un **compte bancaire**
2. Cliquez sur **"Débiter"**
3. Remplissez le formulaire :
   - Montant
   - Libellé
   - Description
   - Catégorie (optionnel)
   - Date
4. **Nouveau** : Section "Reçu (optionnel)"
   - Cliquez sur la zone de téléchargement ou glissez-déposez un fichier
   - Formats acceptés : JPG, PNG, WebP, PDF
   - Taille max : 5 MB
5. Cliquez sur **"✅ Débiter"**

### B. Modifier une Transaction et Ajouter/Modifier un Reçu

1. Dans la liste des transactions, cliquez sur **"Modifier"** pour un débit
2. Le modal de modification s'ouvre
3. **Nouveau** : Section "Reçu (optionnel)" (uniquement pour les débits)
   - Si un reçu existe déjà, il est affiché
   - Vous pouvez le supprimer et en uploader un nouveau
   - Ou ajouter un reçu si aucun n'existe
4. Cliquez sur **"Enregistrer"**

---

## 🔧 3. Modifications Techniques

### Fichiers Modifiés

#### A. Base de Données
- ✅ **`add_receipt_columns_transactions.sql`** (nouveau)
  - Script SQL pour ajouter les colonnes

#### B. Types TypeScript
- ✅ **`src/lib/shared-data.ts`**
  - Interface `TransactionBancaire` mise à jour avec :
    ```typescript
    receiptUrl?: string
    receiptFileName?: string
    ```

#### C. Contexte Comptes Bancaires
- ✅ **`src/contexts/compte-bancaire-context.tsx`**
  - Fonction `debiterCompte()` : ajout des paramètres `receiptUrl` et `receiptFileName`
  - Fonction `updateTransaction()` : gestion des champs `receipt_url` et `receipt_file_name`

#### D. Formulaire de Transaction
- ✅ **`src/components/transaction-form-dialog.tsx`**
  - Import du composant `ReceiptUpload`
  - Ajout des états `receiptUrl` et `receiptFileName`
  - Section d'upload de reçu pour les débits
  - Passage des valeurs à `debiterCompte()`

#### E. Page Détail Compte
- ✅ **`src/app/(protected)/comptes-bancaires/[id]/page.tsx`**
  - Import du composant `ReceiptUpload`
  - Ajout des champs `receiptUrl` et `receiptFileName` dans `editForm`
  - Section d'upload dans le modal de modification (débits uniquement)
  - Passage des valeurs à `updateTransaction()`

---

## 🎯 4. Fonctionnalités

### ✅ Ce qui Fonctionne

- **Upload de reçus** lors de la création d'un débit
- **Upload de reçus** lors de la modification d'un débit
- **Visualisation** du reçu actuel (si existant)
- **Suppression** du reçu actuel
- **Formats supportés** : JPG, PNG, WebP, PDF
- **Limite de taille** : 5 MB
- **Stockage sécurisé** dans Supabase Storage (bucket `receipts`)
- **Authentification** : seuls les utilisateurs connectés peuvent uploader

### ❌ Limitations

- Les **crédits** n'ont pas d'upload de reçu (uniquement les débits)
- Les reçus ne sont **pas affichés** dans la liste des transactions (à implémenter si nécessaire)

---

## 🔍 5. Vérification

### Tester l'Upload

1. Créez un débit avec un reçu
2. Vérifiez dans Supabase :

```sql
-- Voir les transactions avec reçus
SELECT 
  id,
  libelle,
  montant,
  receipt_url,
  receipt_file_name,
  date_transaction
FROM transactions_bancaires
WHERE receipt_url IS NOT NULL
ORDER BY date_transaction DESC;
```

3. Vérifiez dans Supabase Storage :
   - Dashboard → Storage → `receipts`
   - Vous devriez voir les fichiers uploadés

### Tester la Modification

1. Modifiez une transaction existante
2. Ajoutez ou modifiez le reçu
3. Vérifiez que les changements sont sauvegardés

---

## 🚀 6. Prochaines Étapes (Optionnel)

### Améliorations Possibles

1. **Affichage des reçus dans la liste**
   - Ajouter une icône 📎 pour les transactions avec reçu
   - Cliquer pour prévisualiser le reçu

2. **Upload pour les crédits**
   - Si nécessaire, ajouter la même fonctionnalité pour les crédits

3. **Galerie de reçus**
   - Page dédiée pour voir tous les reçus
   - Filtres par date, montant, catégorie

4. **OCR (Reconnaissance de texte)**
   - Extraire automatiquement le montant et la date du reçu
   - Pré-remplir le formulaire

---

## 📝 7. Notes Importantes

- Les reçus sont stockés dans le bucket `receipts` de Supabase Storage
- Le chemin de stockage : `{user_id}/{timestamp}-{random}.{extension}`
- Les URLs sont publiques mais sécurisées par l'authentification
- Les reçus sont automatiquement supprimés si la transaction est supprimée (via RLS)

---

## ✅ Résumé

✅ Upload de reçus pour tous les débits (création + modification)  
✅ Stockage sécurisé dans Supabase Storage  
✅ Interface utilisateur intuitive avec drag & drop  
✅ Formats multiples supportés (images + PDF)  
✅ Prévisualisation et suppression des reçus  

**La fonctionnalité est prête à être utilisée !** 🎉

