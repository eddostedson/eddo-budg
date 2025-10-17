// Données partagées entre les pages
export interface Budget {
  id: string
  userId?: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: number
  date: string
  description: string
  category: string
  amount: number
  type: 'income' | 'expense'
  status: 'completed' | 'pending' | 'cancelled'
  budgetId?: string
}

export interface Category {
  id: string
  name: string
  color: string
  createdAt: Date
}

// ✅ Interface pour les transferts entre budgets
export interface BudgetTransfer {
  id: string
  fromBudgetId: string
  toBudgetId: string
  amount: number
  date: string
  description: string
  status: 'pending' | 'completed' | 'refunded' // pending = prêt non remboursé, refunded = remboursé
  createdAt: Date
}

// ✅ Interface pour les RECETTES (Revenus)
export interface Recette {
  id: string
  userId?: string
  libelle: string
  description: string
  montant: number
  soldeDisponible: number
  statutCloture: 'active' | 'cloturee' // Nouveau: statut de clôture
  source: string // Salaire, Prime, Freelance, etc.
  periodicite: 'unique' | 'mensuelle' | 'hebdomadaire' | 'annuelle'
  dateReception: string
  categorie: string
  statut: 'attendue' | 'reçue' | 'retardée' | 'annulée'
  receiptUrl?: string // URL du reçu uploadé
  receiptFileName?: string // Nom du fichier reçu original
  validationBancaire?: boolean // Nouveau: validation de conformité bancaire
  dateValidationBancaire?: string // Nouveau: date de validation bancaire
  createdAt: string
  updatedAt: string
}

// ✅ Interface pour les DÉPENSES
export interface Depense {
  id: number
  userId?: string
  recetteId?: string
  libelle: string
  montant: number
  date: string
  description: string
  categorie?: string
  receiptUrl?: string // Nouveau: URL du reçu uploadé
  receiptFileName?: string // Nouveau: nom du fichier reçu
  createdAt: string
  updatedAt: string
}

// ✅ Interface pour les ALLOCATIONS (Recettes → Budgets)
export interface Allocation {
  id: number
  userId?: string
  recetteId: string
  budgetId: string
  montant: number
  dateAllocation: string
  createdAt: string
}

// Budgets par défaut
export const defaultBudgets: Budget[] = [
  {
    id: '1',
    name: 'ACCD-PRINCIPAL',
    description: 'COMPTE PRINCIPAL',
    amount: 2865336,
    spent: 0,
    remaining: 2232122,
    period: 'Objectif',
    color: 'bg-green-500',
    source: 'REMISE & PRET',
    type: 'principal',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Budget Personnel',
    description: 'Le plus brillant de cette année !!!',
    amount: 2500,
    spent: 800,
    remaining: 1700,
    period: 'Mensuel',
    color: 'bg-purple-500',
    source: 'Salaire',
    type: 'secondaire',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    createdAt: new Date('2024-01-01')
  },
  {
    id: '3',
    name: 'Budget Vacances',
    description: 'Planification voyage Europe',
    amount: 3000,
    spent: 1200,
    remaining: 1800,
    period: 'Objectif',
    color: 'bg-blue-600',
    source: 'Épargne',
    type: 'secondaire',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    createdAt: new Date('2024-01-02')
  },
  {
    id: '4',
    name: 'Budget Professionnel',
    description: 'Gestion des revenus et investissements',
    amount: 50000,
    spent: 15000,
    remaining: 35000,
    period: 'Annuel',
    color: 'bg-green-500',
    source: 'Revenus professionnels',
    type: 'principal',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    createdAt: new Date('2024-01-03')
  },
  {
    id: '5',
    name: 'Budget Familial',
    description: 'Dépenses du foyer et enfants',
    amount: 3500,
    spent: 2100,
    remaining: 1400,
    period: 'Mensuel',
    color: 'bg-orange-500',
    source: 'Salaire',
    type: 'secondaire',
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z',
    createdAt: new Date('2024-01-04')
  },
  {
    id: '6',
    name: 'Budget Épargne',
    description: 'Objectifs d\'épargne et investissements',
    amount: 15000,
    spent: 5000,
    remaining: 10000,
    period: 'Annuel',
    color: 'bg-indigo-500',
    source: 'Épargne',
    type: 'secondaire',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z',
    createdAt: new Date('2024-01-05')
  }
]

// Transactions par défaut
export const defaultTransactions: Transaction[] = [
  {
    id: 1,
    date: '2024-01-15',
    description: 'Salaire Janvier',
    category: 'Revenus',
    amount: 3500.00,
    type: 'income',
    status: 'completed'
  },
  {
    id: 2,
    date: '2024-01-16',
    description: 'Courses Carrefour',
    category: 'Alimentation',
    amount: -89.50,
    type: 'expense',
    status: 'completed',
    budgetId: '1' // Lié au Budget Personnel
  },
  {
    id: 3,
    date: '2024-01-17',
    description: 'Essence',
    category: 'Transport',
    amount: -65.00,
    type: 'expense',
    status: 'completed',
    budgetId: '1' // Lié au Budget Personnel
  },
  {
    id: 4,
    date: '2024-01-18',
    description: 'Restaurant',
    category: 'Loisirs',
    amount: -45.00,
    type: 'expense',
    status: 'completed',
    budgetId: '2' // Lié au Budget Vacances
  }
]
