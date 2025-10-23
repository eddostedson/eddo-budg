'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Depense } from '@/lib/shared-data'
import { DepenseService } from '@/lib/supabase/database'
import { FastDepenseService } from '@/lib/supabase/fast-depense-service'
import { OfflineDepenseService } from '@/lib/supabase/offline-depense-service'

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

  // Ajouter une dépense (MODE HYBRIDE OPTIMISÉ - RAPIDE + FIABLE)
  const addDepense = async (depense: Omit<Depense, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // 1. AJOUT IMMÉDIAT À L'INTERFACE (UI instantanée)
      const tempId = Date.now()
      const tempDepense: Depense = {
        id: tempId,
        userId: '',
        libelle: depense.libelle,
        montant: depense.montant,
        date: depense.date,
        description: depense.description || '',
        recetteId: depense.recetteId,
        categorie: depense.categorie,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // Ajouter IMMÉDIATEMENT à l'interface
      setDepenses(prev => [tempDepense, ...prev])
      setLibelles(prev => [...new Set([...prev, depense.libelle])])
      
      console.log('✅ Dépense ajoutée instantanément à l\'interface')
      
      // 2. SYNCHRONISATION OPTIMISÉE (timeout augmenté)
      const syncPromise = DepenseService.createDepense(depense)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout de synchronisation')), 15000) // 15 secondes au lieu de 5
      )
      
      try {
        const newDepense = await Promise.race([syncPromise, timeoutPromise]) as any
        
        if (newDepense && newDepense.id) {
          // Remplacer la dépense temporaire par la vraie
          setDepenses(prev => prev.map(d => 
            d.id === tempId ? newDepense : d
          ))
          console.log('✅ Dépense synchronisée:', newDepense.id)
        } else {
          console.warn('⚠️ newDepense est null ou invalide, conservation de la dépense temporaire')
          // Ne pas lancer d'erreur, juste garder la dépense temporaire
        }
      } catch (syncError) {
        console.error('❌ Erreur de synchronisation:', syncError)
        // Garder la dépense temporaire mais marquer comme non synchronisée
        console.warn('⚠️ Dépense temporaire conservée - synchronisation échouée')
      }
      
      return tempDepense
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de la dépense:', error)
      throw error
    }
  }

  const updateDepense = async (id: number, updates: Partial<Depense>) => {
    const success = await DepenseService.updateDepense(id, updates)
    if (success) {
      await refreshDepenses()
    }
  }

  // Supprimer une dépense (SUPPRESSION INSTANTANÉE)
  const deleteDepense = async (id: number) => {
    console.log('🗑️ Suppression de la dépense:', id)
    
    // 1. Suppression IMMÉDIATE de l'interface (pas de clignotement)
    setDepenses(prev => {
      const filtered = prev.filter(d => d.id !== id)
      console.log(`✅ Dépense ${id} supprimée de l'interface. Avant: ${prev.length}, Après: ${filtered.length}`)
      return filtered
    })
    
    // 2. Suppression en base de données en arrière-plan (silencieuse)
    DepenseService.deleteDepense(id)
      .then(success => {
        if (success) {
          console.log('✅ Dépense supprimée en base de données')
        } else {
          console.warn('⚠️ Échec de la suppression en base, rafraîchissement...')
          // Rafraîchir silencieusement en cas d'échec
          setTimeout(() => refreshDepenses(), 1000)
        }
      })
      .catch(error => {
        console.warn('⚠️ Erreur suppression en base:', error)
        // Rafraîchir silencieusement en cas d'erreur
        setTimeout(() => refreshDepenses(), 1000)
      })
    
    console.log('✅ Suppression traitée avec succès')
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

