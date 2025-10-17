# 🚀 Guide de Déploiement - Budget Manager

## 📋 Étapes de Déploiement

### 1. 🐙 Créer un Repository GitHub

```bash
# Initialiser Git si pas déjà fait
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit: Budget Manager app"

# Créer un repository sur GitHub (via interface web)
# Puis connecter le repository local
git remote add origin https://github.com/votre-username/budget-manager.git
git branch -M main
git push -u origin main
```

### 2. 🚀 Déploiement sur Vercel

#### Option A: Via Interface Web (Recommandé)
1. Aller sur [vercel.com](https://vercel.com)
2. Se connecter avec GitHub
3. Cliquer "New Project"
4. Importer le repository GitHub
5. Vercel détecte automatiquement Next.js
6. Configurer les variables d'environnement
7. Cliquer "Deploy"

#### Option B: Via CLI
```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter à Vercel
vercel login

# Déployer
vercel

# Pour les mises à jour
vercel --prod
```

### 3. 🔧 Configuration des Variables d'Environnement

Dans Vercel Dashboard → Project Settings → Environment Variables :

```
NEXT_PUBLIC_SUPABASE_URL = votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY = votre_cle_supabase
```

### 4. 🗄️ Configuration Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Aller dans Settings → API
4. Copier l'URL et la clé anonyme
5. Aller dans SQL Editor
6. Exécuter le script de migration (supabase/migrations/001_create_tables.sql)

### 5. 🔄 Déploiement Automatique

Une fois configuré :
- Chaque push sur GitHub → Déploiement automatique
- Branche `main` → Production
- Autres branches → Preview

## 🌐 URLs de Déploiement

- **Production** : `https://votre-app.vercel.app`
- **Preview** : `https://votre-app-git-branch.vercel.app`

## 🔧 Commandes Utiles

```bash
# Développement local
pnpm dev

# Build de production
pnpm build

# Déploiement manuel
vercel --prod

# Voir les logs
vercel logs
```

## 📱 Accès Mobile

L'application sera accessible sur :
- **Ordinateur** : URL Vercel
- **Mobile** : Même URL (responsive)
- **PWA** : Peut être installée comme app mobile

## 🔄 Workflow de Développement

1. **Développement local** : `pnpm dev`
2. **Commit** : `git add . && git commit -m "feature"`
3. **Push** : `git push origin main`
4. **Déploiement automatique** : Vercel déploie automatiquement
5. **Test en production** : Vérifier sur l'URL Vercel

## 🛠️ Maintenance

- **Logs** : Vercel Dashboard → Functions → Logs
- **Analytics** : Vercel Dashboard → Analytics
- **Domaine personnalisé** : Vercel Dashboard → Domains
- **Variables d'env** : Vercel Dashboard → Settings → Environment Variables
