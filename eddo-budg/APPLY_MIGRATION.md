# 📋 GUIDE D'APPLICATION DE LA MIGRATION SQL

## ✅ MÉTHODE SIMPLE (Recommandée)

### Étape 1 : Connectez-vous à Supabase Dashboard

1. Allez sur : **https://supabase.com/dashboard**
2. Connectez-vous avec votre compte
3. Sélectionnez votre projet **eddo-budg**

### Étape 2 : Ouvrez l'Éditeur SQL

1. Dans le menu de gauche, cliquez sur **"SQL Editor"**
2. Cliquez sur **"New query"** (Nouvelle requête)

### Étape 3 : Copiez-Collez la Migration

Ouvrez le fichier : `supabase/migrations/003_fix_data_consistency.sql`

Copiez TOUT le contenu et collez-le dans l'éditeur SQL

### Étape 4 : Exécutez la Migration

1. Cliquez sur **"Run"** (Exécuter) en bas à droite
2. Attendez 5-10 secondes
3. Vous devriez voir : **"Success. No rows returned"**

### Étape 5 : Vérification

Exécutez cette requête pour vérifier :

```sql
-- Vérifier que les budgets ont le champ type
SELECT id, name, type, spent, remaining FROM budgets LIMIT 5;

-- Vérifier que les triggers existent
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'transactions';
```

✅ **Si vous voyez des résultats, c'est bon !**

---

## 🆘 EN CAS D'ERREUR

Si vous voyez une erreur du type :

```
relation "budgets" already exists
```

C'est **NORMAL** ! Cela signifie que la table existe déjà.

La migration contient des `CREATE IF NOT EXISTS` qui ignorent les tables existantes.

---

## ✅ MIGRATION APPLIQUÉE !

Une fois la migration exécutée, passez à l'étape suivante : **TESTER L'APPLICATION**

