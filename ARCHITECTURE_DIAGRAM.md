# 🎨 Diagrammes d'Architecture EDDO-BUDG

## 📊 Diagramme 1 : Vue d'ensemble (Style de l'image fournie)

```mermaid
graph TD
    A[Frontend - Next.js 15 + React 19] --> B[Couche API]
    B --> C[Auth Service]
    B --> D[Context Layer]
    B --> E[Services Layer]
    D --> F[Database - Supabase PostgreSQL]
    E --> F
    C --> F
    
    style A fill:#e3f2fd
    style B fill:#fff3e0
    style C fill:#f3e5f5
    style D fill:#e8f5e9
    style E fill:#e8f5e9
    style F fill:#fce4ec
```

---

## 📊 Diagramme 2 : Architecture Détaillée Multi-Couches

```mermaid
graph TB
    subgraph "🎨 COUCHE PRÉSENTATION"
        A1[Pages Routes]
        A2[Components UI]
        A3[Layouts]
    end
    
    subgraph "🧠 COUCHE LOGIQUE MÉTIER"
        B1[Contexts<br/>État Global]
        B2[Services<br/>Logique Métier]
        B3[Hooks Custom]
    end
    
    subgraph "🌐 COUCHE API"
        C1[Supabase Client]
        C2[Auth API]
        C3[Storage API]
        C4[Database API]
    end
    
    subgraph "🗄️ COUCHE DATA"
        D1[(PostgreSQL)]
        D2[RLS Policies]
        D3[Triggers]
        D4[Functions]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    
    B1 --> B2
    B1 --> B3
    B2 --> C1
    B3 --> C1
    
    C1 --> C2
    C1 --> C3
    C1 --> C4
    
    C2 --> D1
    C3 --> D1
    C4 --> D1
    
    D1 --> D2
    D1 --> D3
    D1 --> D4
    
    style A1 fill:#e3f2fd
    style A2 fill:#e3f2fd
    style A3 fill:#e3f2fd
    style B1 fill:#fff3e0
    style B2 fill:#fff3e0
    style B3 fill:#fff3e0
    style C1 fill:#f3e5f5
    style C2 fill:#f3e5f5
    style C3 fill:#f3e5f5
    style C4 fill:#f3e5f5
    style D1 fill:#fce4ec
    style D2 fill:#fce4ec
    style D3 fill:#fce4ec
    style D4 fill:#fce4ec
```

---

## 📊 Diagramme 3 : Flux de Données (Exemple Transaction)

```mermaid
sequenceDiagram
    participant U as 👤 Utilisateur
    participant C as 🎨 Component
    participant CTX as 🧠 Context
    participant S as 🔧 Service
    participant API as 🌐 Supabase API
    participant DB as 🗄️ PostgreSQL
    
    U->>C: Clique "Créditer"
    C->>C: Validation formulaire
    C->>CTX: crediterCompte()
    CTX->>S: Logique métier
    S->>API: INSERT transaction
    API->>DB: Stockage
    DB->>DB: TRIGGER: update_solde
    DB-->>API: Confirmation
    API-->>S: Succès
    S-->>CTX: Mise à jour état
    CTX-->>C: Re-render
    C-->>U: Affichage mis à jour ✅
```

---

## 📊 Diagramme 4 : Modules Fonctionnels

```mermaid
graph LR
    subgraph "💰 Module Financier"
        M1[Recettes]
        M2[Dépenses]
        M3[Comptes Bancaires]
        M4[Transactions]
        M5[Transferts]
    end
    
    subgraph "🧾 Module Documents"
        M6[Reçus<br/>Cité Kennedy]
        M7[FACBL<br/>Proformas]
        M8[Export<br/>CSV/PDF]
    end
    
    subgraph "⚙️ Module Système"
        M9[Backup &<br/>Restore]
        M10[Activity<br/>Logs]
        M11[Notes]
    end
    
    subgraph "💼 Module Budgets"
        M12[Budget<br/>Salarial]
        M13[Fonds<br/>Partagés]
    end
    
    M1 -->|Lie| M2
    M3 -->|Contient| M4
    M4 -->|Crée| M6
    M9 -->|Protège| M1
    M9 -->|Protège| M2
    
    style M1 fill:#c8e6c9
    style M2 fill:#ffccbc
    style M3 fill:#b3e5fc
    style M4 fill:#b3e5fc
    style M5 fill:#b3e5fc
    style M6 fill:#f8bbd0
    style M7 fill:#f8bbd0
    style M8 fill:#f8bbd0
    style M9 fill:#e1bee7
    style M10 fill:#e1bee7
    style M11 fill:#e1bee7
    style M12 fill:#fff9c4
    style M13 fill:#fff9c4
```

---

## 📊 Diagramme 5 : Structure des Dossiers

```mermaid
graph TD
    ROOT[eddo-budg/]
    
    ROOT --> SRC[src/]
    ROOT --> SUPA[supabase/]
    ROOT --> PUBLIC[public/]
    
    SRC --> APP[app/]
    SRC --> COMP[components/]
    SRC --> CTX[contexts/]
    SRC --> LIB[lib/]
    SRC --> HOOKS[hooks/]
    
    APP --> PROT[(protected)/]
    APP --> AUTH[auth/]
    APP --> API[api/]
    
    PROT --> ACCUEIL[accueil/]
    PROT --> COMPTES[comptes-bancaires/]
    PROT --> RECETTES[recettes/]
    PROT --> DEPENSES[depenses/]
    PROT --> RECEIPTS[receipts/]
    PROT --> FACBL[facbl/]
    
    COMP --> UI[ui/]
    COMP --> FORMS[forms/]
    COMP --> CARDS[cards/]
    
    CTX --> RCTX[recette-context]
    CTX --> DCTX[depense-context]
    CTX --> CCTX[compte-context]
    
    LIB --> SLIB[supabase/]
    LIB --> UTILS[utils/]
    
    SUPA --> MIG[migrations/]
    
    style ROOT fill:#1976d2,color:#fff
    style SRC fill:#43a047,color:#fff
    style SUPA fill:#e65100,color:#fff
    style APP fill:#f57c00
    style COMP fill:#c2185b
    style CTX fill:#7b1fa2
    style LIB fill:#303f9f
```

---

## 📊 Diagramme 6 : Sécurité & Authentification

```mermaid
graph TD
    A[👤 Utilisateur Non Authentifié] --> B{Login Page}
    B -->|Email/Password| C[Supabase Auth]
    C -->|Succès| D[JWT Token]
    D --> E[✅ Utilisateur Authentifié]
    
    E --> F[Accès aux Routes Protégées]
    F --> G[Auth Guard]
    G --> H{Token Valide ?}
    H -->|OUI| I[Accès autorisé]
    H -->|NON| J[Redirect Login]
    
    I --> K[Requête Database]
    K --> L[Row Level Security RLS]
    L --> M{user_id = auth.uid ?}
    M -->|OUI| N[✅ Données utilisateur]
    M -->|NON| O[❌ Accès refusé]
    
    style A fill:#ffccbc
    style E fill:#c8e6c9
    style I fill:#c8e6c9
    style N fill:#c8e6c9
    style J fill:#ef9a9a
    style O fill:#ef9a9a
```

---

## 📊 Diagramme 7 : Performance & Cache

```mermaid
graph LR
    subgraph "🎨 Frontend"
        A[Component]
        B[Context<br/>Cache Local]
    end
    
    subgraph "🌐 API"
        C[Supabase Client]
    end
    
    subgraph "🗄️ Backend"
        D[(PostgreSQL)]
        E[Indexes]
    end
    
    A -->|1️⃣ Demande données| B
    B -->|2️⃣ Cache HIT| A
    B -->|3️⃣ Cache MISS| C
    C -->|4️⃣ Query optimisée| E
    E -->|5️⃣ Données| D
    D -->|6️⃣ Résultat| C
    C -->|7️⃣ Mise à jour cache| B
    B -->|8️⃣ Données| A
    
    style A fill:#e3f2fd
    style B fill:#fff3e0
    style C fill:#f3e5f5
    style D fill:#fce4ec
    style E fill:#c8e6c9
```

---

## 📊 Diagramme 8 : Backup & Restore

```mermaid
graph TD
    A[Application Active] --> B{Backup Automatique}
    B -->|Quotidien| C[backup_recettes]
    B -->|Quotidien| D[backup_depenses]
    B -->|Quotidien| E[backup_history]
    
    C --> F[(Stockage Sécurisé)]
    D --> F
    E --> F
    
    G[🔥 Problème Données] --> H{Restore}
    H -->|Sélection backup| F
    F -->|Restauration| I[restore_backup]
    I -->|Récupération| J[recettes]
    I -->|Récupération| K[depenses]
    
    J --> L[✅ Données Restaurées]
    K --> L
    
    style A fill:#c8e6c9
    style G fill:#ef9a9a
    style F fill:#fff3e0
    style L fill:#c8e6c9
```

---

## 🎯 Légende des Couleurs

| Couleur | Signification |
|---------|---------------|
| 🔵 Bleu | Frontend / UI |
| 🟠 Orange | Logique Métier / Contexts |
| 🟣 Violet | API / Services |
| 🔴 Rose | Base de données |
| 🟢 Vert | Succès / Validation |
| ⚫ Gris | Système / Infrastructure |

---

## 📝 Conclusion

Ces diagrammes illustrent une **architecture moderne, robuste et évolutive** :

✅ **Séparation claire des responsabilités**  
✅ **Flux de données unidirectionnel**  
✅ **Sécurité à tous les niveaux**  
✅ **Performance optimisée**  
✅ **Scalabilité garantie**

L'application **EDDO-BUDG** est **bien structurée** et prête pour une utilisation en production ! 🚀





