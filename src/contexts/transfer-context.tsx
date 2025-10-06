'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Transfert, TransfertFormData } from '@/types/transfer'
import { TransfertService } from '@/lib/supabase/transfer-service'

interface TransfertContextType {
  transferts: Transfert[]
  addTransfert: (transfert: TransfertFormData) => Promise<void>
  deleteTransfert: (id: string) => Promise<void>
  refreshTransferts: () => Promise<void>
  getTransfertsByRecette: (recetteId: string) => Transfert[]
}

const TransfertContext = createContext<TransfertContextType | undefined>(undefined)

export function TransfertProvider({ children }: { children: ReactNode }) {
  const [transferts, setTransferts] = useState<Transfert[]>([])

  // Fonction pour recharger les transferts depuis Supabase
  const refreshTransferts = async () => {
    try {
      console.log('🔄 Rechargement des transferts depuis Supabase...')
      const supabaseTransferts = await TransfertService.getTransferts()
      
      console.log('✅ Transferts rechargés depuis Supabase:', supabaseTransferts.length)
      
      setTransferts(supabaseTransferts)
      
      // Mettre à jour localStorage
      if (typeof window !== 'undefined') {
        if (supabaseTransferts.length > 0) {
          localStorage.setItem('transferts', JSON.stringify(supabaseTransferts))
          console.log('💾 localStorage mis à jour avec les nouveaux transferts')
        } else {
          localStorage.removeItem('transferts')
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du rechargement des transferts:', error)
      setTransferts([])
    }
  }

  // Charger les transferts au montage du composant
  useEffect(() => {
    refreshTransferts()
  }, [])

  // Créer un nouveau transfert
  const addTransfert = async (transfertData: TransfertFormData) => {
    try {
      console.log('➕ Création d\'un nouveau transfert:', transfertData)
      
      const newTransfert = await TransfertService.createTransfert({
        recetteSourceId: transfertData.recetteSourceId,
        recetteDestinationId: transfertData.recetteDestinationId,
        montant: transfertData.montant,
        description: transfertData.description,
        dateTransfert: transfertData.dateTransfert
      })

      if (newTransfert) {
        console.log('✅ Transfert créé avec succès:', newTransfert.id)
        await refreshTransferts()
        
        // Notifier les autres composants qu'un transfert a été effectué
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('transfertEffectue', { 
            detail: { 
              transfert: newTransfert,
              recetteSourceId: transfertData.recetteSourceId,
              recetteDestinationId: transfertData.recetteDestinationId,
              montant: transfertData.montant
            }
          }))
        }
        
        return newTransfert
      } else {
        throw new Error('Échec de la création du transfert')
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du transfert:', error)
      throw error
    }
  }

  // Supprimer un transfert
  const deleteTransfert = async (id: string) => {
    try {
      console.log('🗑️ Suppression du transfert:', id)
      
      const success = await TransfertService.deleteTransfert(id)
      
      if (success) {
        console.log('✅ Transfert supprimé avec succès:', id)
        await refreshTransferts()
        
        // Notifier les autres composants qu'un transfert a été supprimé
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('transfertSupprime', { 
            detail: { transfertId: id }
          }))
        }
      } else {
        throw new Error('Échec de la suppression du transfert')
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du transfert:', error)
      throw error
    }
  }

  // Récupérer les transferts d'une recette spécifique
  const getTransfertsByRecette = (recetteId: string) => {
    return transferts.filter(t => 
      t.recetteSourceId === recetteId || t.recetteDestinationId === recetteId
    )
  }

  const value: TransfertContextType = {
    transferts,
    addTransfert,
    deleteTransfert,
    refreshTransferts,
    getTransfertsByRecette
  }

  return (
    <TransfertContext.Provider value={value}>
      {children}
    </TransfertContext.Provider>
  )
}

export function useTransferts() {
  const context = useContext(TransfertContext)
  if (context === undefined) {
    throw new Error('useTransferts must be used within a TransfertProvider')
  }
  return context
}