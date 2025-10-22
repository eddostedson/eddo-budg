# 🧾 Fonctionnalité d'Upload de Reçus

## 📋 Vue d'ensemble

La fonctionnalité d'upload de reçus permet aux utilisateurs d'ajouter des justificatifs (reçus, factures, tickets) à leurs dépenses de manière optionnelle. Cette fonctionnalité améliore la traçabilité et la gestion des dépenses.

## ✨ Fonctionnalités

### 🔧 Fonctionnalités principales

- **Upload optionnel** : Le champ reçu est complètement optionnel
- **Affichage conditionnel** : Le champ n'apparaît que si l'utilisateur clique sur "Ajouter un reçu"
- **Support multi-format** : Images (JPG, PNG, WebP) et PDF
- **Taille limitée** : Maximum 5MB par fichier
- **Stockage sécurisé** : Utilisation de Supabase Storage avec RLS
- **Interface intuitive** : Drag & drop et sélection de fichier
- **Prévisualisation** : Affichage du reçu dans la liste des dépenses

### 🎯 Conditions d'affichage

Le champ reçu s'affiche uniquement quand :
- L'utilisateur clique sur le bouton "Ajouter un reçu"
- Le bouton devient "Masquer" pour permettre de cacher le champ

## 🛠️ Configuration technique

### 📁 Fichiers modifiés

1. **Interface des données** (`src/lib/shared-data.ts`)
   - Ajout de `receiptUrl?: string`
   - Ajout de `receiptFileName?: string`

2. **Composant d'upload** (`src/components/receipt-upload.tsx`)
   - Composant réutilisable pour l'upload
   - Gestion du drag & drop
   - Validation des types et tailles de fichiers
   - Interface de prévisualisation

3. **Formulaire des dépenses** (`src/app/depenses/page.tsx`)
   - Ajout du champ reçu avec affichage conditionnel
   - Intégration dans le processus de création/modification
   - Affichage dans la liste des dépenses

4. **Service de base de données** (`src/lib/supabase/database.ts`)
   - Support des nouveaux champs dans les opérations CRUD
   - Mapping des données pour l'interface

### 🗄️ Configuration Supabase

#### Script SQL à exécuter (`setup_receipts_storage.sql`)

```sql
-- 1. Créer le bucket pour les reçus
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
);

-- 2. Ajouter les colonnes à la table depenses
ALTER TABLE depenses 
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS receipt_file_name TEXT;

-- 3. Créer les politiques RLS pour le stockage
-- (voir le fichier complet pour les détails)
```

## 🚀 Utilisation

### 📝 Créer une dépense avec reçu

1. Aller sur la page **Dépenses**
2. Cliquer sur **"✨ Nouvelle Dépense"**
3. Remplir les informations de base
4. Cliquer sur **"Ajouter un reçu"** (optionnel)
5. Glisser-déposer un fichier ou cliquer pour sélectionner
6. Sauvegarder la dépense

### 👁️ Consulter un reçu

1. Dans la liste des dépenses, regarder la colonne **"Reçu"**
2. Si un reçu existe, cliquer sur **"Voir"**
3. Le reçu s'ouvre dans un nouvel onglet

### ✏️ Modifier une dépense avec reçu

1. Cliquer sur **"Modifier"** dans la liste des dépenses
2. Le champ reçu s'affiche automatiquement si un reçu existe
3. Modifier ou supprimer le reçu selon besoin
4. Sauvegarder les modifications

## 🔒 Sécurité

### 🛡️ Mesures de sécurité

- **RLS activé** : Chaque utilisateur ne peut accéder qu'à ses propres reçus
- **Validation des types** : Seuls les formats autorisés sont acceptés
- **Limite de taille** : Maximum 5MB par fichier
- **Noms de fichiers uniques** : Prévention des conflits
- **Authentification requise** : Seuls les utilisateurs connectés peuvent uploader

### 🔐 Politiques RLS

```sql
-- Upload autorisé pour les utilisateurs authentifiés
CREATE POLICY "Users can upload receipts" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Lecture autorisée pour le propriétaire
CREATE POLICY "Users can view receipts" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 🎨 Interface utilisateur

### 🖼️ Composant ReceiptUpload

- **Zone de drag & drop** avec feedback visuel
- **Sélection de fichier** par clic
- **Prévisualisation** du fichier uploadé
- **Boutons d'action** : Voir, Supprimer
- **Indicateurs de statut** : Upload en cours, erreurs

### 📊 Affichage dans la liste

- **Colonne dédiée** "Reçu" dans le tableau
- **Lien direct** vers le reçu
- **Icône de document** pour l'identification visuelle
- **État vide** affiché comme "-" quand aucun reçu

## 🧪 Tests

### ✅ Tests à effectuer

1. **Upload de fichier**
   - Tester différents formats (JPG, PNG, PDF)
   - Vérifier la limite de taille (5MB)
   - Tester le drag & drop

2. **Affichage conditionnel**
   - Vérifier que le champ n'apparaît que sur demande
   - Tester le bouton "Masquer"

3. **Persistance des données**
   - Créer une dépense avec reçu
   - Vérifier la sauvegarde
   - Tester la modification

4. **Sécurité**
   - Vérifier l'accès aux reçus
   - Tester l'isolation des utilisateurs

## 🚨 Limitations connues

- **Taille maximale** : 5MB par fichier
- **Formats supportés** : Images et PDF uniquement
- **Stockage** : Dépend de la limite Supabase Storage
- **Performance** : Upload synchrone (peut être amélioré)

## 🔮 Améliorations futures

- **Compression automatique** des images
- **Prévisualisation** dans l'interface
- **Recherche** par contenu de reçu
- **Export** des reçus en PDF
- **API** pour l'intégration externe

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs de la console
2. Contrôler la configuration Supabase
3. Vérifier les permissions RLS
4. Tester avec différents formats de fichiers














