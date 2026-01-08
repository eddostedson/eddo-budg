# 🏛️ Architecture de l'Application EDDO-BUDG

## 📊 Vue d'ensemble

EDDO-BUDG est une application de **gestion budgétaire et bancaire complète** construite avec une architecture moderne **Next.js 15 + Supabase**.

---

## 🎯 Diagramme d'Architecture Logicielle

```
┌─────────────────────────────────────────────────────────────────────┐
│                           EDDO-BUDG                                  │
│                     Application de Gestion Budgétaire                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         COUCHE PRÉSENTATION                          │
│                         (Frontend - Next.js 15)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Pages      │  │  Components  │  │   Layouts    │              │
│  │   (Routes)   │  │     UI       │  │              │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│         │                  │                  │                      │
│         └──────────────────┴──────────────────┘                      │
│                            │                                         │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      COUCHE LOGIQUE MÉTIER                           │
│                     (Contexts + Services)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    CONTEXTS (État Global)                    │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  • RecetteContext      • DepenseContext                      │   │
│  │  • CompteBancaireCtx   • ReceiptContext                      │   │
│  │  • TransferContext     • NotesContext                        │   │
│  │  • NotificationContext • CategoryContext                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                            │                                         │
│                            ▼                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    SERVICES (Logique)                        │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  • AuthService         • BackupService                       │   │
│  │  • TransferService     • ExportService                       │   │
│  │  • FacblService        • SharedFundsService                  │   │
│  │  • ActivityLogService  • BudgetSalaireService                │   │
│  │  • NotesService        • AIService                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                            │                                         │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       COUCHE API / CLIENT                            │
│                      (Supabase Client)                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Auth API    │  │  Database    │  │   Storage    │              │
│  │              │  │   API        │  │     API      │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│         │                  │                  │                      │
│         └──────────────────┴──────────────────┘                      │
│                            │                                         │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      COUCHE BASE DE DONNÉES                          │
│                    (Supabase PostgreSQL)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    TABLES PRINCIPALES                        │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  • recettes                 • depenses                       │   │
│  │  • comptes_bancaires        • transactions_bancaires        │   │
│  │  • transferts               • receipts                       │   │
│  │  • notes                    • budgets                        │   │
│  │  • backup_recettes          • backup_depenses               │   │
│  │  • activity_logs            • categories                     │   │
│  │  • facbl_proformas          • facbl_historique              │   │
│  │  • shared_funds             • budget_salaire                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              SÉCURITÉ & AUTOMATISATION                       │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  • Row Level Security (RLS)                                  │   │
│  │  • Triggers (mise à jour soldes)                             │   │
│  │  • Functions (recalcul, backup)                              │   │
│  │  • Indexes (performance)                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Structure Détaillée par Couche

### 1️⃣ COUCHE PRÉSENTATION (Frontend)

#### **Pages Principales** (`src/app/`)
```
├── (protected)/                     # Zone protégée (authentification requise)
│   ├── accueil/                     # Dashboard principal
│   ├── comptes-bancaires/           # Gestion des comptes bancaires
│   │   └── [id]/                    # Détail d'un compte
│   ├── recettes/                    # Gestion des recettes
│   │   ├── [id]/                    # Détail d'une recette
│   │   └── corbeille/               # Recettes supprimées (soft delete)
│   ├── depenses/                    # Gestion des dépenses
│   │   └── [id]/                    # Détail d'une dépense
│   ├── receipts/                    # Gestion des reçus (Cité Kennedy)
│   ├── facbl/                       # Module FACBL (Proformas)
│   └── budget-salaire/              # Budget mensuel salarial
│
├── auth/                            # Authentification
│   ├── page.tsx                     # Login
│   └── reset-password/              # Réinitialisation mot de passe
│
└── api/                             # API Routes Next.js
    ├── diagnostic-data/             # Données de diagnostic
    ├── ensure-profile/              # Création profil utilisateur
    └── test-notes/                  # Tests notes
```

#### **Composants** (`src/components/`)
```
├── ui/                              # Composants UI de base (shadcn)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   └── ...
│
├── Formulaires de création/modification
│   ├── recette-form-dialog.tsx     # Formulaire recettes
│   ├── depense-form-dialog.tsx     # Formulaire dépenses
│   ├── transaction-form-dialog.tsx  # Formulaire transactions bancaires
│   ├── compte-form-dialog.tsx       # Formulaire comptes bancaires
│   └── receipt-form-dialog.tsx      # Formulaire reçus
│
├── Affichage & Visualisation
│   ├── recette-card-enhanced.tsx    # Carte recette
│   ├── activity-log.tsx             # Journal d'activité
│   ├── sync-indicator.tsx           # Indicateur de synchronisation
│   └── modern-chart.tsx             # Graphiques
│
└── Utilitaires
    ├── auth-guard.tsx               # Protection des routes
    ├── navigation.tsx               # Navigation principale
    └── sidebar.tsx                  # Menu latéral
```

---

### 2️⃣ COUCHE LOGIQUE MÉTIER

#### **Contexts** (`src/contexts/`)
Gestion de l'état global de l'application avec React Context API

```typescript
📦 Contexts Principaux
├── recette-context-direct.tsx       # État des recettes
├── depense-context-direct.tsx       # État des dépenses
├── compte-bancaire-context.tsx      # État des comptes bancaires
├── receipt-context.tsx              # État des reçus
├── transfer-context.tsx             # État des transferts
├── notes-context.tsx                # État des notes
├── notification-context.tsx         # Notifications
└── ultra-modern-toast-context.tsx   # Toasts modernes
```

**Responsabilités** :
- ✅ Gestion de l'état global
- ✅ Appels aux services
- ✅ Cache local (optimisation)
- ✅ Synchronisation avec Supabase

#### **Services** (`src/lib/supabase/`)
Logique métier et accès aux données

```typescript
📦 Services
├── auth-service.ts                  # Authentification utilisateur
├── direct-service.ts                # Service générique CRUD
├── transfer-service.ts              # Transferts entre comptes
├── backup-service.ts                # Sauvegardes automatiques
├── export-service.ts                # Export CSV/PDF
├── facbl-service.ts                 # Module FACBL
├── shared-funds-service.ts          # Fonds partagés
├── budget-salaire-service.ts        # Budget salarial
├── notes-service.ts                 # Notes
└── activity-log-service.ts          # Journal d'activité
```

**Responsabilités** :
- ✅ Logique métier complexe
- ✅ Validation des données
- ✅ Interactions avec Supabase
- ✅ Gestion des erreurs

---

### 3️⃣ COUCHE API / CLIENT

#### **Supabase Client**
```typescript
📦 Configuration
├── browser.ts                       # Client côté navigateur
└── server.ts                        # Client côté serveur
```

**Fonctionnalités** :
- ✅ Authentication (JWT)
- ✅ Real-time subscriptions
- ✅ Row Level Security (RLS)
- ✅ Storage (fichiers/reçus)

---

### 4️⃣ COUCHE BASE DE DONNÉES

#### **Tables Principales**

```sql
📊 Modules Financiers
├── recettes                         # Recettes/revenus
├── depenses                         # Dépenses
├── comptes_bancaires                # Comptes bancaires
├── transactions_bancaires           # Historique transactions
├── transferts                       # Transferts entre comptes
└── receipts                         # Reçus (loyers Cité Kennedy)

📊 Modules Auxiliaires
├── notes                            # Notes/mémos
├── budgets                          # Budgets projet
├── categories                       # Catégories personnalisées
├── facbl_proformas                  # Proformas FACBL
├── facbl_historique                 # Historique FACBL
├── shared_funds                     # Fonds partagés
└── budget_salaire                   # Budget mensuel salarial

📊 Système & Backup
├── backup_recettes                  # Sauvegarde recettes
├── backup_depenses                  # Sauvegarde dépenses
├── backup_history                   # Historique sauvegardes
└── activity_logs                    # Journal d'activité
```

#### **Sécurité & Performance**

```sql
🔒 Row Level Security (RLS)
- Toutes les tables sont protégées
- L'utilisateur voit uniquement SES données
- Politique : auth.uid() = user_id

⚡ Triggers Automatiques
- update_solde_compte()              # Mise à jour soldes automatique
- update_updated_at_column()         # Timestamp modification
- log_activity()                     # Journal d'activité

🔧 Functions PostgreSQL
- recalculate_compte_solde()         # Recalcul soldes
- backup_tables()                    # Backup automatique
- restore_backup()                   # Restauration
```

---

## 🎨 Technologies & Stack

### **Frontend**
- ⚛️ **Next.js 15** (App Router)
- ⚛️ **React 19**
- 🎨 **TailwindCSS** + **Shadcn UI**
- 🎭 **Framer Motion** (animations)
- 📊 **Recharts** (graphiques)
- 🔔 **Sonner** (toasts)

### **Backend**
- 🗄️ **Supabase** (BaaS)
- 🐘 **PostgreSQL** (base de données)
- 🔐 **Supabase Auth** (authentification)
- 📦 **Supabase Storage** (fichiers)

### **Dev Tools**
- 📘 **TypeScript**
- 🧪 **ESLint**
- 🎯 **PNPM** (gestionnaire de paquets)

---

## ✅ Points Forts de l'Architecture

### 1. **Séparation des responsabilités**
✅ Chaque couche a un rôle bien défini  
✅ Couplage faible, cohésion forte  
✅ Facilité de maintenance

### 2. **Sécurité robuste**
✅ Row Level Security (RLS) sur toutes les tables  
✅ Authentification JWT avec Supabase Auth  
✅ Validation des données côté client ET serveur  
✅ Protection CSRF automatique (Next.js)

### 3. **Performance optimisée**
✅ Server Components par défaut (Next.js 15)  
✅ Cache local dans les contexts  
✅ Indexes sur les colonnes fréquemment requêtées  
✅ Lazy loading des composants

### 4. **Scalabilité**
✅ Architecture modulaire  
✅ Services indépendants  
✅ Base de données PostgreSQL (scalable)  
✅ Possibilité d'ajouter des microservices

### 5. **Expérience développeur**
✅ TypeScript pour la sécurité des types  
✅ Structure claire et organisée  
✅ Composants réutilisables  
✅ Documentation inline

---

## 🔄 Flux de Données Typique

### Exemple : Créer une transaction bancaire

```
1. 👤 Utilisateur
   └─> Clique sur "Créditer le compte"
        │
2. 🎨 Component
   └─> <TransactionFormDialog />
        │
3. 📝 Validation
   └─> Vérifie les champs requis
        │
4. 🧠 Context
   └─> compte-bancaire-context.tsx
        │  └─> crediterCompte()
        │
5. 🔧 Service (optionnel)
   └─> Logique complexe si nécessaire
        │
6. 🌐 Supabase Client
   └─> INSERT INTO transactions_bancaires
        │
7. 🗄️ PostgreSQL
   └─> Stockage des données
        │  └─> TRIGGER : update_solde_compte()
        │       └─> Met à jour le solde automatiquement
        │
8. 🔔 Real-time (optionnel)
   └─> Notification aux autres clients
        │
9. ✅ Retour au Context
   └─> Mise à jour de l'état local
        │
10. 🎨 Re-render Components
    └─> Affichage mis à jour
```

---

## 📊 Modules Fonctionnels

### **Module Comptes Bancaires** 🏦
- Gestion multi-comptes
- Transactions (crédit/débit)
- Transferts entre comptes
- Historique détaillé
- Export CSV/PDF

### **Module Recettes/Dépenses** 💰
- Gestion des recettes
- Suivi des dépenses
- Liaison recettes-dépenses
- Calcul solde disponible
- Soft delete (corbeille)

### **Module Reçus (Cité Kennedy)** 🧾
- Génération automatique de reçus
- Upload de fichiers (PDF, images)
- Historique des paiements
- Filtres par locataire/période

### **Module FACBL** 📄
- Création de proformas
- Historique complet
- Export PDF professionnel

### **Module Budget Salarial** 💼
- Budget mensuel fixe
- Suivi des dépenses
- Alertes de dépassement

### **Module Sauvegarde** 💾
- Backup automatique
- Restauration point dans le temps
- Historique des sauvegardes

---

## 🚀 Recommandations pour l'Évolution

### **Court terme** (1-3 mois)
1. ✅ **Tests automatisés** (Vitest + Playwright)
2. ✅ **CI/CD** (GitHub Actions + Vercel)
3. ✅ **Monitoring** (Sentry pour les erreurs)

### **Moyen terme** (3-6 mois)
1. 📱 **Application mobile** (React Native)
2. 📊 **Dashboard analytique avancé** (BI)
3. 🤖 **IA pour catégorisation automatique**

### **Long terme** (6-12 mois)
1. 🌍 **Multi-tenancy** (gestion multi-entreprises)
2. 🔗 **Intégration bancaire API** (agrégation comptes)
3. 📈 **Prédictions financières** (ML)

---

## ✅ Validation de la Structure

### ✅ **Architecture bien structurée**
- Séparation claire des responsabilités
- Modularité et réutilisabilité
- Scalabilité à long terme

### ✅ **Bonnes pratiques respectées**
- TypeScript pour la sécurité
- Validation des données
- Gestion des erreurs
- Sécurité (RLS)

### ✅ **Performance optimisée**
- Server Components
- Cache local
- Indexes base de données

---

## 📝 Conclusion

L'application **EDDO-BUDG** suit une **architecture moderne et robuste** basée sur :
- ✅ **Next.js 15** (App Router)
- ✅ **Supabase** (BaaS)
- ✅ **PostgreSQL** (Database)
- ✅ **TypeScript** (Type Safety)

L'architecture est **bien structurée**, **scalable**, et **maintenable**. Elle suit les meilleures pratiques de l'industrie et est prête pour évoluer selon les besoins futurs.

---

**📅 Document créé le** : 3 janvier 2026  
**✍️ Créé par** : Assistant IA (Claude)  
**🔄 Dernière mise à jour** : 3 janvier 2026





