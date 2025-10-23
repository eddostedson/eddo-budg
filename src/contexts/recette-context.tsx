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
  getTotalCertified: () => number
  getTotalCertifiedAmount: () => number
  getCertifiedRecettes: () => Recette[]
  toggleBankValidation: (recetteId: string, isValidated: boolean) => Promise<void>
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
      
      // S'assurer que les recettes sont triées par date de création (plus récentes en haut)
      const sortedRecettes = supabaseRecettes.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      
      // Debug: Afficher les dates de création pour vérifier le tri
      console.log('🔍 Tri des recettes par date de création:')
      sortedRecettes.forEach((recette, index) => {
        console.log(`${index + 1}. ${recette.libelle} - Créé le: ${new Date(recette.createdAt).toLocaleString('fr-FR')}`)
      })
      
      setRecettes(sortedRecettes)
      
      // Mettre à jour localStorage avec les nouvelles données
      if (typeof window !== 'undefined') {
        if (sortedRecettes.length > 0) {
          localStorage.setItem('recettes', JSON.stringify(sortedRecettes))
          console.log('💾 localStorage mis à jour avec les nouvelles recettes triées')
        } else {
          localStorage.removeItem('recettes')
        }
      }
      
      // Forcer un re-render des composants qui utilisent les recettes
      setTimeout(() => {
        console.log('🔄 Forçage du re-render des composants...')
        setRecettes(prev => [...prev])
      }, 100)
      
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
    try {
      console.log('➕ Ajout d\'une nouvelle recette:', recetteData.libelle)
      const newRecette = await RecetteService.createRecette(recetteData)
      
      if (newRecette) {
        console.log('✅ Recette créée avec succès:', newRecette.id)
        
        // Ajouter immédiatement à l'état local pour un feedback instantané
        setRecettes(prev => {
          const updated = [newRecette, ...prev]
          // S'assurer que le tri par date de création est maintenu
          return updated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        })
        
        // Rafraîchir en arrière-plan pour s'assurer de la cohérence
        refreshRecettes().catch(error => {
          console.error('❌ Erreur lors du rafraîchissement en arrière-plan:', error)
        })
        
        return newRecette
      } else {
        console.error('❌ Échec de la création de la recette - createRecette a retourné null')
        throw new Error('Échec de la création de la recette en base de données')
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de la recette:', error)
      throw error
    }
  }
  
  const updateRecette = async (id: string, updates: Partial<Recette>) => {
    const updatedRecette = await RecetteService.updateRecette(id, updates)
    if (updatedRecette) {
      setRecettes(prev => prev.map(r => r.id === id ? updatedRecette : r))
    }
  }

  const deleteRecette = async (id: string) => {
    try {
      console.log('🗑️ Suppression de la recette:', id)
      
      // 1. Tentative de suppression en base de données D'ABORD
      const success = await RecetteService.deleteRecette(id)
      
      if (success) {
        console.log('✅ Recette supprimée avec succès en base de données')
        
        // 2. Suppression de l'état local seulement si succès en base
        setRecettes(prev => {
          const filtered = prev.filter(r => r.id !== id)
          console.log(`✅ Recette supprimée de l'état local. Avant: ${prev.length}, Après: ${filtered.length}`)
          return filtered
        })
        
        // 3. Rafraîchissement de vérification après un délai
        setTimeout(async () => {
          console.log('🔄 Rafraîchissement de vérification...')
          await refreshRecettes()
        }, 1000)
      } else {
        console.error('❌ Échec de la suppression en base de données')
        throw new Error('Échec de la suppression')
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error)
      // En cas d'erreur, rafraîchir pour synchroniser avec la base
      await refreshRecettes()
      throw error
    }
  }

  // Calculer le total des recettes
  const getTotalRecettes = () => {
    return recettes.reduce((total, recette) => total + recette.montant, 0)
  }

  // Calculer le total disponible (SIMPLE)
  const getTotalDisponible = () => {
    return recettes.reduce((total, recette) => total + recette.soldeDisponible, 0)
  }

  // Calculer le solde disponible des recettes certifiées
  const getTotalCertified = () => {
    return recettes
      .filter(recette => recette.validationBancaire === true)
      .reduce((total, recette) => total + recette.soldeDisponible, 0)
  }

  // Obtenir les recettes certifiées
  const getCertifiedRecettes = () => {
    return recettes.filter(recette => recette.validationBancaire === true)
  }

  // Calculer le montant total des recettes certifiées (pour les statistiques)
  const getTotalCertifiedAmount = () => {
    return recettes
      .filter(recette => recette.validationBancaire === true)
      .reduce((total, recette) => total + recette.montant, 0)
  }

  // Toggle de la validation bancaire
  const toggleBankValidation = async (recetteId: string, isValidated: boolean) => {
    try {
      const success = await RecetteService.toggleBankValidation(recetteId, isValidated)
      if (success) {
        // Mettre à jour l'état local
        setRecettes(prev => prev.map(recette => 
          recette.id === recetteId 
            ? { 
                ...recette, 
                validationBancaire: isValidated,
                dateValidationBancaire: isValidated ? new Date().toISOString() : undefined
              }
            : recette
        ))
        
        // Forcer un rafraîchissement complet pour s'assurer de la cohérence
        setTimeout(() => {
          refreshRecettes()
        }, 500)
      }
    } catch (error) {
      console.error('❌ Erreur lors du toggle de validation bancaire:', error)
      throw error
    }
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
        getTotalDisponible,
        getTotalCertified,
        getTotalCertifiedAmount,
        getCertifiedRecettes,
        toggleBankValidation
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

