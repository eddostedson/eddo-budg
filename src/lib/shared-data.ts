// Données partagées entre les pages
export interface Budget {
  id: string
  name: string
  description: string
  amount: number
  spent: number
  remaining: number
  period: string
  color: string
  source: string // ✅ Nouveau champ pour la source du montant
  createdAt: Date
}

export interface Transaction {
  id: number
  date: string
  description: string
  category: string
  amount: number
  type: 'income' | 'expense'
  status: 'completed' | 'pending'
  budgetId?: string
}

export interface Category {
  id: string
  name: string
  color: string
  createdAt: Date
}

// Budgets par défaut
export const defaultBudgets: Budget[] = [
  {
    id: '1',
    name: 'Budget Personnel',
    description: 'Le plus brillant de cette année !!!',
    amount: 2500,
    spent: 800,
    remaining: 1700,
    period: 'Mensuel',
    color: 'bg-purple-500',
    source: 'Salaire',
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Budget Vacances',
    description: 'Planification voyage Europe',
    amount: 3000,
    spent: 1200,
    remaining: 1800,
    period: 'Objectif',
    color: 'bg-blue-600',
    source: 'Épargne',
    createdAt: new Date('2024-01-02')
  },
  {
    id: '3',
    name: 'Budget Professionnel',
    description: 'Gestion des revenus et investissements',
    amount: 50000,
    spent: 15000,
    remaining: 35000,
    period: 'Annuel',
    color: 'bg-green-500',
    source: 'Revenus professionnels',
    createdAt: new Date('2024-01-03')
  },
  {
    id: '4',
    name: 'Budget Familial',
    description: 'Dépenses du foyer et enfants',
    amount: 3500,
    spent: 2100,
    remaining: 1400,
    period: 'Mensuel',
    color: 'bg-orange-500',
    source: 'Salaire',
    createdAt: new Date('2024-01-04')
  },
  {
    id: '5',
    name: 'Budget Épargne',
    description: 'Objectifs d\'épargne et investissements',
    amount: 15000,
    spent: 5000,
    remaining: 10000,
    period: 'Annuel',
    color: 'bg-indigo-500',
    source: 'Épargne',
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
