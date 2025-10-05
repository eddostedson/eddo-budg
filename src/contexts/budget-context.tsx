'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Budget } from '@/lib/shared-data'
import { BudgetService } from '@/lib/supabase/database'

interface BudgetContextType {
  budgets: Budget[]
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
  refreshBudgets: () => Promise<void>
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined)

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [budgets, setBudgets] = useState<Budget[]>([])

  const refreshBudgets = async () => {
    try {
      const data = await BudgetService.getBudgets()
      setBudgets(data)
      if (data.length > 0) {
        localStorage.setItem('budgets', JSON.stringify(data))
      } else {
        localStorage.removeItem('budgets')
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des budgets:', error)
      // Fallback to localStorage
      const stored = localStorage.getItem('budgets')
      if (stored) {
        setBudgets(JSON.parse(stored))
      }
    }
  }

  useEffect(() => {
    refreshBudgets()
  }, [])

  const addBudget = async (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newBudget = await BudgetService.createBudget(budget)
      if (newBudget) {
        await refreshBudgets()
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du budget:', error)
      throw error
    }
  }

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    try {
      const updatedBudget = await BudgetService.updateBudget(id, updates)
      if (updatedBudget) {
        await refreshBudgets()
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du budget:', error)
      throw error
    }
  }

  const deleteBudget = async (id: string) => {
    try {
      const success = await BudgetService.deleteBudget(id)
      if (success) {
        await refreshBudgets()
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du budget:', error)
      throw error
    }
  }

  return (
    <BudgetContext.Provider value={{ budgets, addBudget, updateBudget, deleteBudget, refreshBudgets }}>
      {children}
    </BudgetContext.Provider>
  )
}

export function useBudgets() {
  const context = useContext(BudgetContext)
  if (context === undefined) {
    throw new Error('useBudgets doit être utilisé à l\'intérieur d\'un BudgetProvider')
  }
  return context
}


