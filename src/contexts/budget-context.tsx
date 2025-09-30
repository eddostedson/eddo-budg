'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Budget } from '@/lib/shared-data'
import { BudgetService } from '@/lib/supabase/database'

interface BudgetContextType {
  budgets: Budget[]
  setBudgets: (budgets: Budget[] | ((prev: Budget[]) => Budget[])) => void
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt'>) => void
  updateBudget: (id: string, updates: Partial<Budget>) => void
  deleteBudget: (id: string) => void
  getBudgetById: (id: string) => Budget | undefined
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined)

export function BudgetProvider({ children }: { children: ReactNode }) {
  // ✅ État vide par défaut - pas de données fictives
  const [budgets, setBudgets] = useState<Budget[]>([])

  // Charger les budgets sauvegardés au démarrage
  useEffect(() => {
    const loadBudgets = async () => {
      try {
        // Essayer de charger depuis Supabase
        const supabaseBudgets = await BudgetService.getBudgets()
        if (supabaseBudgets.length > 0) {
          setBudgets(supabaseBudgets)
        } else {
          // Fallback vers localStorage si pas de données Supabase
          if (typeof window !== 'undefined') {
            const savedBudgets = localStorage.getItem('budgets')
            if (savedBudgets) {
              const parsedBudgets = JSON.parse(savedBudgets)
              const budgetsWithDates = parsedBudgets.map((budget: Budget & { createdAt: string }) => ({
                ...budget,
                createdAt: new Date(budget.createdAt)
              }))
              setBudgets(budgetsWithDates)
            } else {
              // ✅ Pas de données - état vide, pas de données fictives
              setBudgets([])
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des budgets:', error)
        // Fallback vers localStorage
        if (typeof window !== 'undefined') {
          const savedBudgets = localStorage.getItem('budgets')
          if (savedBudgets) {
            const parsedBudgets = JSON.parse(savedBudgets)
            const budgetsWithDates = parsedBudgets.map((budget: Budget & { createdAt: string }) => ({
              ...budget,
              createdAt: new Date(budget.createdAt)
            }))
            setBudgets(budgetsWithDates)
          } else {
            // ✅ Pas de données - état vide, pas de données fictives
            setBudgets([])
          }
        }
      }
    }

    loadBudgets()
  }, [])

  // Sauvegarder dans LocalStorage à chaque changement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('budgets', JSON.stringify(budgets))
    }
  }, [budgets])

  const addBudget = async (budgetData: Omit<Budget, 'id' | 'createdAt'>) => {
    try {
      // Essayer de sauvegarder dans Supabase
      const newBudget = await BudgetService.createBudget(budgetData)
      if (newBudget) {
        setBudgets(prev => [newBudget, ...prev])
      } else {
        // Fallback vers localStorage
        const fallbackBudget: Budget = {
          ...budgetData,
          id: Date.now().toString(),
          createdAt: new Date()
        }
        setBudgets(prev => [fallbackBudget, ...prev])
      }
    } catch (error) {
      console.error('Erreur lors de la création du budget:', error)
      // Fallback vers localStorage
      const fallbackBudget: Budget = {
        ...budgetData,
        id: Date.now().toString(),
        createdAt: new Date()
      }
      setBudgets(prev => [fallbackBudget, ...prev])
    }
  }

  const updateBudget = (id: string, updates: Partial<Budget>) => {
    setBudgets(prev => 
      prev.map(budget => 
        budget.id === id ? { ...budget, ...updates } : budget
      )
    )
  }

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(budget => budget.id !== id))
  }

  const getBudgetById = (id: string) => {
    return budgets.find(budget => budget.id === id)
  }

  const value: BudgetContextType = {
    budgets,
    setBudgets,
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgetById
  }

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  )
}

export function useBudgets() {
  const context = useContext(BudgetContext)
  if (context === undefined) {
    throw new Error('useBudgets must be used within a BudgetProvider')
  }
  return context
}
