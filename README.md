# 💰 Eddo-Budg - Gestionnaire de Budget Moderne

Une application moderne de gestion budgétaire développée avec Next.js 15, React 19, TypeScript, TailwindCSS et Supabase.

## ✨ Fonctionnalités

- 📊 **Dashboard complet** avec statistiques en temps réel
- 💰 **Gestion des recettes** avec suivi des soldes
- 💸 **Gestion des dépenses** avec filtres avancés
- 🤖 **Assistant IA** pour analyses financières
- 📱 **Design 100% responsive** (mobile, tablet, desktop)
- 🔔 **Notifications modernes** (remplace les alertes natives)
- 🎨 **Interface moderne** avec animations fluides
- 🔒 **Authentification sécurisée** avec Supabase

## 🚀 Technologies

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS 4, CSS moderne
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Déploiement**: Vercel
- **Package Manager**: pnpm

## 📱 Responsive Design

- **Mobile** (< 640px): Menu hamburger, layout vertical
- **Tablet** (640px - 768px): Grilles 2 colonnes
- **Desktop** (768px+): Sidebar fixe, layout complet
- **Large screens** (1024px+): Grilles 3+ colonnes

## 🛠️ Installation

```bash
# Cloner le projet
git clone <repository-url>
cd eddo-budg

# Installer les dépendances
pnpm install

# Configurer les variables d'environnement
cp env.example .env.local

# Démarrer en développement
pnpm dev
```

## 🔧 Configuration

### Variables d'environnement

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Base de données

Les migrations Supabase sont dans le dossier `supabase/migrations/`. Exécutez-les dans l'ordre :

1. `001_create_tables.sql`
2. `002_add_budget_type.sql`
3. `003_complete_schema.sql`
4. etc.

## 📦 Scripts

```bash
# Développement
pnpm dev

# Build de production
pnpm build

# Démarrer en production
pnpm start

# Linting
pnpm lint
```

## 🚀 Déploiement

### Vercel (Recommandé)

1. **Connecter à GitHub** :
   - Pousser le code sur GitHub
   - Connecter le repository à Vercel

2. **Variables d'environnement** :
   - Ajouter les variables Supabase dans Vercel
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Déploiement automatique** :
   - Chaque push sur `main` déclenche un déploiement
   - Les pull requests créent des previews

### Autres options

- **Netlify** : Alternative excellente
- **Railway** : Pour les applications avec base de données
- **Render** : Solution simple et efficace

## 📁 Structure du projet

```
src/
├── app/                    # Pages Next.js (App Router)
│   ├── accueil/            # Page d'accueil
│   ├── depenses/           # Gestion des dépenses
│   ├── recettes/           # Gestion des recettes
│   ├── ai-insights/        # Assistant IA
│   └── ...
├── components/             # Composants réutilisables
│   ├── modern-*.tsx        # Composants modernes
│   ├── mobile-nav.tsx      # Navigation mobile
│   └── ui/                 # Composants UI de base
├── contexts/               # Contextes React
├── hooks/                  # Hooks personnalisés
├── lib/                    # Utilitaires et configuration
└── types/                  # Types TypeScript
```

## 🎨 Design System

- **Couleurs** : Palette moderne avec dégradés
- **Typographie** : Geist Sans (Google Fonts)
- **Animations** : Transitions fluides avec TailwindCSS
- **Composants** : Design system cohérent et moderne

## 🔒 Sécurité

- **Authentification** : Supabase Auth avec RLS
- **Validation** : TypeScript strict + validation côté client
- **Sécurité** : Variables d'environnement, HTTPS obligatoire

## 📈 Performance

- **Next.js 15** : App Router, Server Components
- **Optimisations** : Images, fonts, CSS
- **CDN** : Vercel Edge Network
- **Bundle** : Optimisation automatique

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add some AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Contacter l'équipe de développement

---

**Développé avec ❤️ par l'équipe Eddo-Budg**