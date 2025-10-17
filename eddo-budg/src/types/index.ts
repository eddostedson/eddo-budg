// ✅ TYPES CORRIGÉS - Correspondent maintenant à la structure réelle de la base de données

export interface Budget {
  id: string
  user_id?: string
  name: string
  description: string
  amount: number
  spent: number
  remaining: number
  period: string
  color: string
  source: string
  type: 'principal' | 'secondaire'
  created_at: string
  updated_at: string
  createdAt: Date
}

export interface Transaction {
  id: number
  user_id?: string
  budget_id?: string
  date: string
  description: string
  category: string
  amount: number
  type: 'income' | 'expense'
  status: 'completed' | 'pending' | 'cancelled'
  created_at?: string
  updated_at?: string
  budgetId?: string
}

export interface Category {
  id: string
  user_id?: string
  name: string
  color: string
  created_at?: string
  createdAt: Date
}

export interface BudgetTransfer {
  id: string
  fromBudgetId: string
  toBudgetId: string
  amount: number
  date: string
  description: string
  status: 'pending' | 'completed' | 'refunded'
  createdAt: Date
}

// Types pour les résumés et statistiques
export interface BudgetSummary {
  budget: Budget
  totalIncome: number
  totalExpenses: number
  remaining: number
  transactionCount: number
}

export interface TransactionSummary {
  total: number
  byCategory: Record<string, number>
  byType: Record<'income' | 'expense', number>
}
