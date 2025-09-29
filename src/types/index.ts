export interface Budget {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  budget_id: string
  name: string
  type: 'income' | 'expense'
  created_at: string
  updated_at: string
}

export interface Income {
  id: string
  budget_id: string
  category_id: string
  name: string
  amount: number
  date: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  budget_id: string
  income_id: string
  category_id: string
  name: string
  amount: number
  date: string
  description?: string
  created_at: string
  updated_at: string
}

export interface BudgetSummary {
  budget: Budget
  totalIncome: number
  totalExpenses: number
  remaining: number
  categories: {
    income: Category[]
    expense: Category[]
  }
}

export interface IncomeSummary {
  income: Income
  totalExpenses: number
  remaining: number
  expenses: Expense[]
}
