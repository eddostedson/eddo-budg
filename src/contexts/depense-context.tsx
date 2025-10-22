'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Depense } from '@/lib/shared-data'
import { DepenseService } from '@/lib/supabase/database'

interface DepenseContextType {
  depenses: Depense[]
  addDepense: (depense: Omit<Depense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateDepense: (id: number, updates: Partial<Depense>) => Promise<void>
  deleteDepense: (id: number) => Promise<void>
  getDepensesByBudget: (budgetId: string) => Depense[]
  getTotalDepensesByBudget: (budgetId: string) => number
  refreshDepenses: () => Promise<void>
  libelles: string[]
}

const DepenseContext = createContext<DepenseContextType | undefined>(undefined)

export function DepenseProvider({ children }: { children: ReactNode }) {
  const [depenses, setDepenses] = useState<Depense[]>([])
  const [libelles, setLibelles] = useState<string[]>([])

  // Fonction pour recharger les dépenses depuis Supabase
  const refreshDepenses = async () => {
    try {
      console.log('🔄 Rechargement des dépenses depuis Supabase...')
      const supabaseDepenses = await DepenseService.getDepenses()
      const supabaseLibelles = await DepenseService.getLibellesDistincts()
      
      console.log('✅ Dépenses rechargées depuis Supabase:', supabaseDepenses.length)
      setDepenses(supabaseDepenses)
      setLibelles(supabaseLibelles)
      
      // Mettre à jour localStorage avec les nouvelles données
      if (typeof window !== 'undefined') {
        if (supabaseDepenses.length > 0) {
          localStorage.setItem('depenses', JSON.stringify(supabaseDepenses))
        } else {
          localStorage.removeItem('depenses')
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du rechargement des dépenses:', error)
      // Fallback vers localStorage en cas d'erreur
      if (typeof window !== 'undefined') {
        const savedDepenses = localStorage.getItem('depenses')
        if (savedDepenses) {
          setDepenses(JSON.parse(savedDepenses))
        }
      }
    }
  }

  // Charger les dépenses au démarrage
  useEffect(() => {
    refreshDepenses()
  }, [])

  // Ajouter une dépense
  const addDepense = async (depense: Omit<Depense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const contextStart = performance.now()
    console.log('⏱️ [CONTEXT] Début addDepense...')
    
    const serviceStart = performance.now()
    const newDepense = await DepenseService.createDepense(depense)
    console.log(`⏱️ [CONTEXT] DepenseService.createDepense terminé (${Math.round(performance.now() - serviceStart)}ms)`)
    
    if (newDepense) {
      // Ajouter immédiatement à l'état local pour un feedback instantané
      setDepenses(prev => [newDepense, ...prev])
      console.log(`⏱️ [CONTEXT] ✅ addDepense terminé (${Math.round(performance.now() - contextStart)}ms)`)
      
      // Rafraîchir en arrière-plan (ne pas attendre)
      setTimeout(() => {
        refreshDepenses().catch(error => {
          console.error('❌ Erreur lors du rafraîchissement en arrière-plan:', error)
        })
      }, 500)
      
      return newDepense
    } else {
      console.error('❌ Échec de la création de la dépense')
      throw new Error('Échec de la création de la dépense en base de données')
    }
  }

  const updateDepense = async (id: number, updates: Partial<Depense>) => {
    const success = await DepenseService.updateDepense(id, updates)
    if (success) {
      await refreshDepenses()
    }
  }

  // Supprimer une dépense
  const deleteDepense = async (id: number) => {
    try {
      console.log('🗑️ Suppression de la dépense:', id)
      const success = await DepenseService.deleteDepense(id)
      
      if (success) {
        console.log('✅ Dépense supprimée avec succès:', id)
        await refreshDepenses()
      } else {
        console.error('❌ Échec de la suppression de la dépense')
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la dépense:', error)
      throw error
    }
  }

  // Obtenir les dépenses d'un budget spécifique
  const getDepensesByBudget = (budgetId: string) => {
    return depenses.filter(depense => depense.budgetId === budgetId)
  }

  // Calculer le total des dépenses d'un budget
  const getTotalDepensesByBudget = (budgetId: string) => {
    return depenses
      .filter(depense => depense.budgetId === budgetId)
      .reduce((total, depense) => total + depense.montant, 0)
  }

  return (
    <DepenseContext.Provider
      value={{
        depenses,
        addDepense,
        updateDepense,
        deleteDepense,
        getDepensesByBudget,
        getTotalDepensesByBudget,
        refreshDepenses,
        libelles
      }}
    >
      {children}
    </DepenseContext.Provider>
  )
}

export function useDepenses() {
  const context = useContext(DepenseContext)
  if (context === undefined) {
    throw new Error('useDepenses must be used within a DepenseProvider')
  }
  return context
}

