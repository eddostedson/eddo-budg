'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Budget, defaultBudgets } from '@/lib/shared-data'

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
  // ✅ Charger depuis LocalStorage au démarrage
  const [budgets, setBudgets] = useState<Budget[]>(defaultBudgets)

  // Charger les budgets sauvegardés au démarrage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedBudgets = localStorage.getItem('budgets')
      if (savedBudgets) {
        try {
          const parsedBudgets = JSON.parse(savedBudgets)
          // Convertir les dates string en objets Date
          const budgetsWithDates = parsedBudgets.map((budget: any) => ({
            ...budget,
            createdAt: new Date(budget.createdAt)
          }))
          setBudgets(budgetsWithDates)
        } catch (error) {
          console.error('Erreur lors du chargement des budgets:', error)
        }
      }
    }
  }, [])

  // Sauvegarder dans LocalStorage à chaque changement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('budgets', JSON.stringify(budgets))
    }
  }, [budgets])

  const addBudget = (budgetData: Omit<Budget, 'id' | 'createdAt'>) => {
    const newBudget: Budget = {
      ...budgetData,
      id: Date.now().toString(),
      createdAt: new Date()
    }
    setBudgets(prev => [newBudget, ...prev])
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
