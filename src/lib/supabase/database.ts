import { createClient } from './browser'
import { Budget, Transaction, Category } from '@/lib/shared-data'

const supabase = createClient()

// Service pour la persistance des budgets
export class BudgetService {
  // Récupérer tous les budgets de l'utilisateur
  static async getBudgets(): Promise<Budget[]> {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des budgets:', error)
      return []
    }

    return data.map(budget => ({
      ...budget,
      createdAt: new Date(budget.created_at),
      amount: parseFloat(budget.amount),
      spent: parseFloat(budget.spent),
      remaining: parseFloat(budget.remaining)
    }))
  }

  // Créer un nouveau budget
  static async createBudget(budget: Omit<Budget, 'id' | 'createdAt'>): Promise<Budget | null> {
    const { data, error } = await supabase
      .from('budgets')
      .insert({
        name: budget.name,
        description: budget.description,
        amount: budget.amount,
        spent: budget.spent,
        remaining: budget.remaining,
        period: budget.period,
        color: budget.color,
        source: budget.source
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la création du budget:', error)
      return null
    }

    return {
      ...data,
      createdAt: new Date(data.created_at),
      amount: parseFloat(data.amount),
      spent: parseFloat(data.spent),
      remaining: parseFloat(data.remaining)
    }
  }

  // Mettre à jour un budget
  static async updateBudget(id: string, updates: Partial<Budget>): Promise<boolean> {
    const { error } = await supabase
      .from('budgets')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Erreur lors de la mise à jour du budget:', error)
      return false
    }

    return true
  }

  // Supprimer un budget
  static async deleteBudget(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur lors de la suppression du budget:', error)
      return false
    }

    return true
  }
}

// Service pour la persistance des transactions
export class TransactionService {
  // Récupérer toutes les transactions de l'utilisateur
  static async getTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des transactions:', error)
      return []
    }

    return data.map(transaction => ({
      ...transaction,
      amount: parseFloat(transaction.amount)
    }))
  }

  // Récupérer les transactions d'un budget spécifique
  static async getTransactionsByBudget(budgetId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('budget_id', budgetId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des transactions du budget:', error)
      return []
    }

    return data.map(transaction => ({
      ...transaction,
      amount: parseFloat(transaction.amount)
    }))
  }

  // Créer une nouvelle transaction
  static async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        budget_id: transaction.budgetId,
        date: transaction.date,
        description: transaction.description,
        category: transaction.category,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la création de la transaction:', error)
      return null
    }

    return {
      ...data,
      amount: parseFloat(data.amount)
    }
  }

  // Supprimer une transaction
  static async deleteTransaction(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur lors de la suppression de la transaction:', error)
      return false
    }

    return true
  }
}

// Service pour la persistance des catégories
export class CategoryService {
  // Récupérer toutes les catégories de l'utilisateur
  static async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des catégories:', error)
      return []
    }

    return data.map(category => ({
      ...category,
      createdAt: new Date(category.created_at)
    }))
  }

  // Créer une nouvelle catégorie
  static async createCategory(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: category.name,
        color: category.color
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la création de la catégorie:', error)
      return null
    }

    return {
      ...data,
      createdAt: new Date(data.created_at)
    }
  }

  // Supprimer une catégorie
  static async deleteCategory(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur lors de la suppression de la catégorie:', error)
      return false
    }

    return true
  }
}
