'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Recette } from '@/lib/shared-data'
import { RecetteService } from '@/lib/supabase/database'

interface RecetteContextType {
  recettes: Recette[]
  addRecette: (recette: Omit<Recette, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateRecette: (id: string, updates: Partial<Recette>) => Promise<void>
  deleteRecette: (id: string) => Promise<void>
  refreshRecettes: () => Promise<void>
  getTotalRecettes: () => number
  getTotalDisponible: () => number
}

const RecetteContext = createContext<RecetteContextType | undefined>(undefined)

export function RecetteProvider({ children }: { children: ReactNode }) {
  const [recettes, setRecettes] = useState<Recette[]>([])

  // Fonction pour recharger les recettes depuis Supabase
  const refreshRecettes = async () => {
    try {
      console.log('🔄 Rechargement des recettes depuis Supabase...')
      const supabaseRecettes = await RecetteService.getRecettes()
      
      console.log('✅ Recettes rechargées depuis Supabase:', supabaseRecettes.length)
      console.log('📊 Détails des recettes:', supabaseRecettes.map(r => ({
        libelle: r.libelle,
        montant: r.montant,
        soldeDisponible: r.soldeDisponible
      })))
      
      setRecettes(supabaseRecettes)
      
      // Mettre à jour localStorage avec les nouvelles données
      if (typeof window !== 'undefined') {
        if (supabaseRecettes.length > 0) {
          localStorage.setItem('recettes', JSON.stringify(supabaseRecettes))
          console.log('💾 localStorage mis à jour avec les nouvelles recettes')
        } else {
          localStorage.removeItem('recettes')
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du rechargement des recettes:', error)
      // NE PAS utiliser localStorage en fallback - forcer le rechargement
      console.warn('⚠️ Impossible de charger depuis Supabase - état vide')
      setRecettes([])
    }
  }

  // Charger les recettes au démarrage
  useEffect(() => {
    refreshRecettes()
  }, [])

  // Ajouter une recette
  const addRecette = async (recetteData: Omit<Recette, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRecette = await RecetteService.createRecette(recetteData)
    if (newRecette) {
      setRecettes(prev => [newRecette, ...prev])
    }
  }
  
  const updateRecette = async (id: string, updates: Partial<Recette>) => {
    const updatedRecette = await RecetteService.updateRecette(id, updates)
    if (updatedRecette) {
      setRecettes(prev => prev.map(r => r.id === id ? updatedRecette : r))
    }
  }

  const deleteRecette = async (id: string) => {
    const success = await RecetteService.deleteRecette(id)
    if (success) {
      setRecettes(prev => prev.filter(r => r.id !== id))
    }
  }

  // Calculer le total des recettes
  const getTotalRecettes = () => {
    return recettes.reduce((total, recette) => total + recette.montant, 0)
  }

  // Calculer le total disponible
  const getTotalDisponible = () => {
    return recettes.reduce((total, recette) => total + recette.soldeDisponible, 0)
  }

  return (
    <RecetteContext.Provider
      value={{
        recettes,
        addRecette,
        updateRecette,
        deleteRecette,
        refreshRecettes,
        getTotalRecettes,
        getTotalDisponible
      }}
    >
      {children}
    </RecetteContext.Provider>
  )
}

export function useRecettes() {
  const context = useContext(RecetteContext)
  if (context === undefined) {
    throw new Error('useRecettes must be used within a RecetteProvider')
  }
  return context
}

