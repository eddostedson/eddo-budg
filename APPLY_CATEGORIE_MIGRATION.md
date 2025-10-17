# 🚀 Migration : Ajouter les colonnes manquantes à la table depenses

## ❌ Problème détecté
```
Erreur Supabase: Could not find the 'categorie' column of 'depenses' 
in the schema cache
Code: PGRST204
```

## ✅ Solution
Plusieurs colonnes essentielles manquent dans la table `depenses`. Une migration a été créée pour ajouter :
- **`categorie`** : Pour classer les dépenses par type (Alimentation, Transport, etc.)
- **`receipt_url`** : Pour stocker les reçus uploadés
- **`receipt_file_name`** : Pour conserver le nom original du fichier

---

## 📋 Instructions pour appliquer la migration

### Méthode 1 : Via l'interface Supabase (Recommandé)

1. **Ouvrir le SQL Editor** dans votre dashboard Supabase :
   - Aller sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sélectionner votre projet
   - Cliquer sur **"SQL Editor"** dans le menu de gauche

2. **Copier-coller le contenu** du fichier suivant :
   ```
   supabase/migrations/016_add_categorie_to_depenses.sql
   ```

3. **Exécuter la migration** :
   - Cliquer sur **"Run"** (ou Ctrl + Enter)
   - Vérifier les messages de succès dans la console

4. **Vérifier que tout fonctionne** :
   ```sql
   -- Vérifier que la colonne existe
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'depenses' AND column_name = 'categorie';
   
   -- Compter les dépenses
   SELECT COUNT(*) as total_depenses FROM depenses;
   ```

---

### Méthode 2 : Via Supabase CLI (Si installé)

```bash
# Appliquer la migration
npx supabase db push

# Ou si Supabase CLI est installé globalement
supabase db push
```

---

## 📊 Ce que fait la migration

1. ✅ Ajoute la colonne **`categorie`** (VARCHAR 100) à la table `depenses`
   - Met à jour les dépenses existantes avec "Non catégorisé" par défaut
   - Crée un index `idx_depenses_categorie` pour optimiser les requêtes

2. ✅ Ajoute la colonne **`receipt_url`** (TEXT) à la table `depenses`
   - Permet de stocker l'URL des reçus uploadés dans Supabase Storage

3. ✅ Ajoute la colonne **`receipt_file_name`** (VARCHAR 255) à la table `depenses`
   - Conserve le nom original du fichier du reçu

4. ✅ Crée des index pour optimiser les performances
   - `idx_depenses_categorie` : Pour les recherches par catégorie
   - `idx_depenses_receipt` : Pour les dépenses avec reçu

5. ✅ Ajoute des commentaires descriptifs sur toutes les nouvelles colonnes

---

## 🔍 Vérification post-migration

Après avoir exécuté la migration, vérifiez que tout fonctionne :

```sql
-- 1. Vérifier la structure de la table
\d depenses

-- 2. Vérifier que les nouvelles colonnes existent
SELECT 
  id, 
  libelle, 
  montant, 
  categorie,
  receipt_url,
  receipt_file_name,
  date
FROM depenses 
LIMIT 5;

-- 3. Compter les dépenses par catégorie
SELECT 
  categorie, 
  COUNT(*) as nombre_depenses,
  SUM(montant) as total_montant
FROM depenses 
GROUP BY categorie
ORDER BY nombre_depenses DESC;
```

---

## 🎯 Résultat attendu

Après l'application de la migration :
- ✅ Les colonnes `categorie`, `receipt_url` et `receipt_file_name` seront disponibles
- ✅ L'erreur PGRST204 disparaîtra complètement
- ✅ Le formulaire de dépense fonctionnera correctement
- ✅ Vous pourrez créer des dépenses avec des catégories
- ✅ Vous pourrez joindre des reçus à vos dépenses
- ✅ Les dépenses existantes auront "Non catégorisé" comme catégorie par défaut

---

## 🆘 Dépannage

### Si l'erreur persiste après la migration :

1. **Rafraîchir le cache du schéma Supabase** :
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

2. **Redémarrer votre application Next.js** :
   ```bash
   # Arrêter le serveur (Ctrl + C)
   # Puis relancer
   pnpm dev
   ```

3. **Vider le cache du navigateur** :
   - Ouvrir les DevTools (F12)
   - Faire un **hard refresh** : `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)

---

## 📝 Note importante

Cette migration est **idempotente** : vous pouvez l'exécuter plusieurs fois sans risque. 
Si la colonne existe déjà, elle ne sera pas recréée.

---

## ✅ Checklist

- [ ] Migration exécutée dans Supabase SQL Editor
- [ ] Aucune erreur affichée dans la console
- [ ] Colonnes `categorie`, `receipt_url` et `receipt_file_name` visibles dans la structure de la table
- [ ] Index créés avec succès
- [ ] Dépenses existantes mises à jour avec "Non catégorisé"
- [ ] Application Next.js redémarrée (`pnpm dev`)
- [ ] Cache navigateur vidé (Ctrl + Shift + R)
- [ ] Formulaire de dépense testé et fonctionnel
- [ ] Upload de reçu testé et fonctionnel

---

**Besoin d'aide ?** Consultez la documentation Supabase : https://supabase.com/docs/guides/database/migrations

