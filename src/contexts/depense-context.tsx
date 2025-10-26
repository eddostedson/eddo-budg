'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Depense } from '@/lib/shared-data'
import { DepenseService } from '@/lib/supabase/database'
import { FastDepenseService } from '@/lib/supabase/fast-depense-service'
import { OfflineDepenseService } from '@/lib/supabase/offline-depense-service'
import { RecetteService } from '@/lib/supabase/database'
import { activityLogService } from '@/lib/activity-log-service'

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

  // Fonction pour mettre à jour le solde disponible d'une recette (VERSION AMÉLIORÉE)
  const updateRecetteSoldeDisponible = async (recetteId: string) => {
    try {
      console.log('🔍 Début de la mise à jour du solde pour la recette:', recetteId)
      
      // 1. RÉCUPÉRER LES DONNÉES FRAÎCHES DE LA BASE (sans cache)
      console.log('🔄 Récupération des données fraîches depuis la base...')
      
      // Récupérer toutes les dépenses liées à cette recette depuis la base
      const toutesDepenses = await DepenseService.getDepenses()
      const depensesLiees = toutesDepenses.filter(d => d.recetteId === recetteId)
      console.log('📊 Dépenses liées trouvées:', depensesLiees.length)
      console.log('💰 Détail des dépenses:', depensesLiees.map(d => ({ 
        id: d.id, 
        libelle: d.libelle, 
        montant: d.montant,
        date: d.date 
      })))
      
      const totalDepenses = depensesLiees.reduce((sum, depense) => sum + depense.montant, 0)
      console.log('💸 Total des dépenses calculé:', totalDepenses)
      
      // Récupérer toutes les recettes pour trouver celle qui nous intéresse
      const recettes = await RecetteService.getRecettes()
      const recette = recettes.find(r => r.id === recetteId)
      
      if (!recette) {
        console.warn('⚠️ Recette non trouvée:', recetteId)
        return
      }
      
      console.log('📋 Recette trouvée:', { 
        id: recette.id,
        libelle: recette.libelle, 
        montant: recette.montant, 
        soldeActuel: recette.soldeDisponible 
      })
      
      // 2. CALCULER LE NOUVEAU SOLDE
      const nouveauSolde = recette.montant - totalDepenses
      console.log(`🧮 Calcul détaillé:`)
      console.log(`   - Montant initial: ${recette.montant}`)
      console.log(`   - Total dépenses: ${totalDepenses}`)
      console.log(`   - Nouveau solde: ${nouveauSolde}`)
      console.log(`   - Ancien solde: ${recette.soldeDisponible}`)
      console.log(`   - Différence: ${nouveauSolde - recette.soldeDisponible}`)
      
      // 3. METTRE À JOUR LE SOLDE DISPONIBLE EN BASE
      console.log('💾 Mise à jour en base de données...')
      const result = await RecetteService.updateRecette(recetteId, {
        soldeDisponible: nouveauSolde
      })
      
      if (result) {
        console.log(`✅ Solde disponible mis à jour avec succès: ${nouveauSolde}`)
        console.log('💡 Le cache local des recettes sera mis à jour lors du prochain rafraîchissement')
      } else {
        console.error('❌ Échec de la mise à jour du solde en base')
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du solde:', error)
    }
  }

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
          // Logger l'activité
          activityLogService.logDepenseCreate(newDepense)
          
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
      
      // 3. METTRE À JOUR LE SOLDE DISPONIBLE DE LA RECETTE (APPROCHE DIRECTE)
      if (depense.recetteId) {
        try {
          console.log('🔄 Mise à jour du solde disponible pour la recette:', depense.recetteId)
          console.log('💰 Montant de la dépense créée:', depense.montant)
          
          // Récupérer toutes les dépenses liées à cette recette
          const toutesDepenses = await DepenseService.getDepenses()
          const depensesLiees = toutesDepenses.filter(d => d.recetteId === depense.recetteId)
          const totalDepenses = depensesLiees.reduce((sum, d) => sum + d.montant, 0)
          
          // Récupérer la recette
          const recettes = await RecetteService.getRecettes()
          const recette = recettes.find(r => r.id === depense.recetteId)
          
          if (recette) {
            const nouveauSolde = recette.montant - totalDepenses
            console.log(`🧮 Calcul direct: ${recette.montant} - ${totalDepenses} = ${nouveauSolde}`)
            
            // Mettre à jour directement en base
            await RecetteService.updateRecette(depense.recetteId, {
              soldeDisponible: nouveauSolde
            })
            
            console.log(`✅ Solde mis à jour directement: ${nouveauSolde}`)
          }
        } catch (soldeError) {
          console.warn('⚠️ Erreur lors de la mise à jour du solde:', soldeError)
        }
      }
      
      return tempDepense
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de la dépense:', error)
      throw error
    }
  }

  const updateDepense = async (id: number, updates: Partial<Depense>) => {
    // Récupérer l'ancienne dépense pour le logging
    const oldDepense = depenses.find(d => d.id === id)
    const recetteId = oldDepense?.recetteId
    
    const success = await DepenseService.updateDepense(id, updates)
    if (success) {
      // Récupérer la nouvelle dépense après mise à jour
      const updatedDepenses = await DepenseService.getDepenses()
      const newDepense = updatedDepenses.find(d => d.id === id)
      
      // Logger l'activité
      if (oldDepense && newDepense) {
        activityLogService.logDepenseUpdate(id.toString(), oldDepense, newDepense)
      }
      
      // METTRE À JOUR LE SOLDE DISPONIBLE DE LA RECETTE (APPROCHE DIRECTE)
      if (recetteId) {
        try {
          console.log('🔄 Mise à jour du solde disponible après modification pour la recette:', recetteId)
          
          // Récupérer toutes les dépenses liées à cette recette
          const toutesDepenses = await DepenseService.getDepenses()
          const depensesLiees = toutesDepenses.filter(d => d.recetteId === recetteId)
          const totalDepenses = depensesLiees.reduce((sum, d) => sum + d.montant, 0)
          
          // Récupérer la recette
          const recettes = await RecetteService.getRecettes()
          const recette = recettes.find(r => r.id === recetteId)
          
          if (recette) {
            const nouveauSolde = recette.montant - totalDepenses
            console.log(`🧮 Calcul direct après modification: ${recette.montant} - ${totalDepenses} = ${nouveauSolde}`)
            
            // Mettre à jour directement en base
            await RecetteService.updateRecette(recetteId, {
              soldeDisponible: nouveauSolde
            })
            
            console.log(`✅ Solde mis à jour directement après modification: ${nouveauSolde}`)
          }
        } catch (soldeError) {
          console.warn('⚠️ Erreur lors de la mise à jour du solde après modification:', soldeError)
        }
      }
      
      await refreshDepenses()
    }
  }

  // Supprimer une dépense (SUPPRESSION SYNCHRONE)
  const deleteDepense = async (id: number) => {
    console.log('🗑️ Suppression de la dépense:', id)
    
    try {
      // 1. Récupérer les infos de la dépense avant suppression pour mettre à jour le solde
      const depenseToDelete = depenses.find(d => d.id === id)
      const recetteId = depenseToDelete?.recetteId
      
      // 2. Suppression IMMÉDIATE de l'interface (pas de clignotement)
      setDepenses(prev => {
        const filtered = prev.filter(d => d.id !== id)
        console.log(`✅ Dépense ${id} supprimée de l'interface. Avant: ${prev.length}, Après: ${filtered.length}`)
        return filtered
      })
      
      // 3. Suppression en base de données (ATTENDRE LA FIN)
      const success = await DepenseService.deleteDepense(id)
      
      if (success) {
        console.log('✅ Dépense supprimée en base de données')
        
        // Logger l'activité
        if (depenseToDelete) {
          activityLogService.logDepenseDelete(depenseToDelete)
        }
        
        // 4. METTRE À JOUR LE SOLDE DISPONIBLE DE LA RECETTE (APPROCHE DIRECTE)
        if (recetteId) {
          try {
            console.log('🔄 Mise à jour du solde disponible après suppression pour la recette:', recetteId)
            
            // Récupérer toutes les dépenses liées à cette recette
            const toutesDepenses = await DepenseService.getDepenses()
            const depensesLiees = toutesDepenses.filter(d => d.recetteId === recetteId)
            const totalDepenses = depensesLiees.reduce((sum, d) => sum + d.montant, 0)
            
            // Récupérer la recette
            const recettes = await RecetteService.getRecettes()
            const recette = recettes.find(r => r.id === recetteId)
            
            if (recette) {
              const nouveauSolde = recette.montant - totalDepenses
              console.log(`🧮 Calcul direct: ${recette.montant} - ${totalDepenses} = ${nouveauSolde}`)
              
              // Mettre à jour directement en base
              await RecetteService.updateRecette(recetteId, {
                soldeDisponible: nouveauSolde
              })
              
              console.log(`✅ Solde mis à jour directement: ${nouveauSolde}`)
            }
          } catch (soldeError) {
            console.warn('⚠️ Erreur lors de la mise à jour du solde après suppression:', soldeError)
          }
        }
        
        console.log('✅ Suppression traitée avec succès')
      } else {
        console.warn('⚠️ Échec de la suppression en base, rafraîchissement...')
        // Rafraîchir silencieusement en cas d'échec
        await refreshDepenses()
        throw new Error('Échec de la suppression en base de données')
      }
    } catch (error) {
      console.error('❌ Erreur critique lors de la suppression:', error)
      // En cas d'erreur critique, rafraîchir pour restaurer la cohérence
      await refreshDepenses()
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

