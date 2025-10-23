# 🔍 VÉRIFICATION DE LA SYNCHRONISATION

## Comment vérifier que vos dépenses sont bien en base de données :

### 1. **Test simple dans l'application :**
1. Créez une nouvelle dépense
2. **Rafraîchissez** la page avec **F5**
3. Si la dépense **reste visible** = ✅ **Synchronisée**
4. Si la dépense **disparaît** = ❌ **Pas synchronisée**

### 2. **Vérification SQL directe :**
Exécutez dans Supabase SQL Editor :
```sql
SELECT COUNT(*) as total_depenses FROM depenses;
```

### 3. **Vérification des dépenses récentes :**
```sql
SELECT 
    libelle,
    montant,
    created_at
FROM depenses 
ORDER BY created_at DESC 
LIMIT 5;
```

### 4. **Indicateurs visuels :**
- **ID > 1,000,000,000,000** = Dépense temporaire (en cours de sync)
- **ID < 1,000,000,000,000** = Dépense synchronisée (en base)

## 🎯 **Résultat attendu :**
Après 2-3 secondes, toutes les dépenses devraient avoir des ID "normaux" et être visibles après rafraîchissement.
