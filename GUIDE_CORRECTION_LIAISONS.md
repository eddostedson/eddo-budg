# 🎯 GUIDE DE CORRECTION DES LIAISONS DÉPENSES-RECETTES

## ✅ SITUATION ACTUELLE
- ✅ **Total Recettes** : 8,421,891 F CFA *(affichage correct)*
- ✅ **Total Dépenses** : 2,034,006 F CFA *(affichage correct)*
- ❌ **Problème** : Les dépenses ne sont pas associées aux bonnes recettes

---

## 🚀 ÉTAPES DE CORRECTION

### 📋 ÉTAPE 1 : DIAGNOSTIC
**Objectif** : Comprendre l'état actuel des liaisons

1. Ouvrir **Supabase Dashboard** → **SQL Editor**
2. Copier/Coller le contenu du fichier : `diagnostic_liaisons_actuelles.sql`
3. Cliquer sur **Run** (▶️)
4. Analyser les résultats :
   - Nombre de dépenses liées vs non liées
   - Dépenses actuellement liées aux recettes
   - Suggestions de liaison automatique

---

### 🔧 ÉTAPE 2 : CORRECTION AUTOMATIQUE
**Objectif** : Lier automatiquement les dépenses aux bonnes recettes

1. Ouvrir **Supabase Dashboard** → **SQL Editor**
2. Copier/Coller le contenu du fichier : `correction_liaisons_intelligente.sql`
3. **⚠️ IMPORTANT** : Ce script va :
   - Réinitialiser toutes les liaisons existantes
   - Lier automatiquement les dépenses en utilisant 3 stratégies :
     - **Stratégie 1** : Match exact de montant
     - **Stratégie 2** : Match par mots-clés (Kennedy, Ahokokro, N'Doumi)
     - **Stratégie 3** : Match par proximité de date et montant
4. Cliquer sur **Run** (▶️)
5. Vérifier le rapport final

---

### ✅ ÉTAPE 3 : VÉRIFICATION DANS L'APPLICATION

1. Ouvrir l'application : `http://localhost:3001`
2. Aller sur la page **Recettes**
3. Cliquer sur une recette pour voir ses détails
4. Vérifier que les dépenses affichées correspondent bien à cette recette
5. Répéter pour plusieurs recettes

---

## 📊 RÉSULTATS ATTENDUS

### Exemples de liaisons correctes attendues :

| Recette | Montant Recette | Dépense Liée | Montant Dépense |
|---------|----------------|--------------|-----------------|
| **Loyer Kennedy : Novembre 2025** | 120,000 F | Namory | 30,000 F |
| **Loyer Kennedy : Mois de Octobre 2025** | ? | Abbatage d'arbre Maison Kennedy | 30,300 F |

---

## ⚠️ EN CAS DE PROBLÈME

### Problème 1 : Certaines dépenses ne sont pas liées
**Solution** : Les dépenses non liées automatiquement peuvent nécessiter une liaison manuelle

### Problème 2 : Certaines dépenses sont mal liées
**Solution** : Exécuter à nouveau le script `correction_liaisons_intelligente.sql`

### Problème 3 : L'application ne se met pas à jour
**Solution** :
```bash
# Rafraîchir la page (F5)
# OU redémarrer le serveur
cd C:\Users\rise\Desktop\CURSOR_PROJECTS\eddo-budg
pnpm run dev
```

---

## 🎯 PROCHAINES ÉTAPES

1. **Maintenant** : Exécuter le diagnostic
2. **Ensuite** : Exécuter la correction
3. **Enfin** : Vérifier dans l'application

---

## 📝 NOTES IMPORTANTES

- ⚠️ Le script de correction **réinitialise toutes les liaisons** avant de les recréer
- ✅ C'est normal et voulu pour garantir la cohérence
- 📊 Le rapport final montre le taux de réussite de la liaison automatique
- 🔧 Si nécessaire, nous pourrons créer un script de liaison manuelle pour les cas spécifiques

---

**💬 Prêt à commencer ? Exécutez d'abord le diagnostic !**


