// 🚀 ARCHITECTURE DIRECTE - CONTEXTE DÉPENSE SIMPLIFIÉ
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Depense } from '@/lib/shared-data'
import { createClient } from '@/lib/supabase/browser'
import { notifySuccess, notifyError, notifyCreated, notifyUpdated, notifyDeleted } from '@/lib/notify'

const supabase = createClient()

interface DepenseContextType {
  depenses: Depense[]
  loading: boolean
  refreshDepenses: () => Promise<void>
  createDepense: (depense: Omit<Depense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>
  updateDepense: (id: number, updates: Partial<Depense>) => Promise<boolean>
  deleteDepense: (id: number) => Promise<boolean>
  getDepensesByBudget: (budgetId: string) => Depense[]
}

const DepenseContext = createContext<DepenseContextType | undefined>(undefined)

export const useDepenses = () => {
  const context = useContext(DepenseContext)
  if (!context) {
    throw new Error('useDepenses must be used within a DepenseProvider')
  }
  return context
}

export const DepenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [depenses, setDepenses] = useState<Depense[]>([])
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  // 🔄 RECHARGER LES DÉPENSES DEPUIS LA BASE (ARCHITECTURE DIRECTE)
  const refreshDepenses = async () => {
    try {
      setLoading(true)
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        notifyError('Erreur d\'authentification')
        setDepenses([])
        return
      }

      const { data, error } = await supabase
        .from('depenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        notifyError('Erreur lors du chargement des dépenses')
        setDepenses([])
        return
      }

      console.log('📊 [REFRESH] Données brutes Supabase:', data?.length || 0, 'dépenses')
      console.log('📊 [REFRESH] Détails:', data?.map(d => ({ id: d.id, libelle: d.libelle, montant: d.montant })))

      const mappedDepenses = (data || []).map(depense => ({
        id: depense.id,
        userId: depense.user_id,
        recetteId: depense.recette_id || undefined,
        libelle: depense.libelle,
        montant: parseFloat(depense.montant),
        date: depense.date,
        description: depense.description || '',
        categorie: depense.categorie || undefined,
        receiptUrl: depense.receipt_url || undefined,
        receiptFileName: depense.receipt_file_name || undefined,
        createdAt: depense.created_at,
        updatedAt: depense.updated_at
      }))

      setDepenses(mappedDepenses)
      setVersion(v => v + 1) // Forcer un re-render
      
    } catch (error) {
      console.error('❌ Erreur lors du rechargement des dépenses:', error)
      setDepenses([])
    } finally {
      setLoading(false)
    }
  }

  // ➕ CRÉER UNE DÉPENSE (DIRECT)
  const createDepense = async (depense: Omit<Depense, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        notifyError('Erreur d\'authentification')
        return false
      }

      const { data: insertedData, error } = await supabase
        .from('depenses')
        .insert({
          user_id: user.id,
          libelle: depense.libelle,
          montant: depense.montant,
          date: depense.date,
          description: depense.description,
          recette_id: depense.recetteId,
          categorie: depense.categorie,
          receipt_url: depense.receiptUrl,
          receipt_file_name: depense.receiptFileName
        })
        .select()
        .single()

      if (error) {
        notifyError(`Erreur lors de la création de la dépense: ${error.message || 'Erreur inconnue'}`)
        return false
      }

      // Mapper la dépense créée
      const newDepense: Depense = {
        id: insertedData.id,
        userId: insertedData.user_id,
        recetteId: insertedData.recette_id || undefined,
        libelle: insertedData.libelle,
        montant: parseFloat(insertedData.montant),
        date: insertedData.date,
        description: insertedData.description || '',
        categorie: insertedData.categorie || undefined,
        receiptUrl: insertedData.receipt_url || undefined,
        receiptFileName: insertedData.receipt_file_name || undefined,
        createdAt: insertedData.created_at,
        updatedAt: insertedData.updated_at
      }

      // Ajouter la nouvelle dépense au state immédiatement
      setDepenses(prev => [newDepense, ...prev])
      setVersion(v => v + 1)

      // Attendre un peu puis recharger toutes les dépenses pour être sûr
      await new Promise(resolve => setTimeout(resolve, 500))
      await refreshDepenses()
      
      // Notification de succès
      notifyCreated('Dépense')
      
      // Émettre un événement pour que le contexte recettes se rafraîchisse aussi
      window.dispatchEvent(new CustomEvent('depense-created', { 
        detail: { recetteId: depense.recetteId } 
      }))
      
      return true
    } catch (error) {
      notifyError('Erreur inattendue lors de la création de la dépense')
      return false
    }
  }

  // ✏️ MODIFIER UNE DÉPENSE (DIRECT)
  const updateDepense = async (id: number, updates: Partial<Depense>): Promise<boolean> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        notifyError('Erreur d\'authentification')
        return false
      }

      const updateData: Record<string, any> = {}
      if (updates.libelle !== undefined) updateData.libelle = updates.libelle
      if (updates.montant !== undefined) updateData.montant = updates.montant
      if (updates.date !== undefined) updateData.date = updates.date
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.categorie !== undefined) updateData.categorie = updates.categorie
      if (updates.receiptUrl !== undefined) updateData.receipt_url = updates.receiptUrl
      if (updates.receiptFileName !== undefined) updateData.receipt_file_name = updates.receiptFileName

      const { error } = await supabase
        .from('depenses')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        notifyError(`Erreur lors de la modification de la dépense: ${error.message || 'Erreur inconnue'}`)
        return false
      }

      // Attendre que Supabase finalise
      await new Promise(resolve => setTimeout(resolve, 300))
      
      await refreshDepenses()
      
      // Notification de succès
      notifyUpdated('Dépense')
      
      window.dispatchEvent(new CustomEvent('depense-updated'))
      
      return true
    } catch (error) {
      notifyError('Erreur inattendue lors de la modification de la dépense')
      return false
    }
  }

  // 🗑️ SUPPRIMER UNE DÉPENSE (DIRECT)
  const deleteDepense = async (id: number): Promise<boolean> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        notifyError('Erreur d\'authentification')
        return false
      }

      const { error } = await supabase
        .from('depenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Erreur lors de la suppression de la dépense:', error)
        return false
      }

      // Attendre que Supabase finalise
      await new Promise(resolve => setTimeout(resolve, 300))
      
      await refreshDepenses()
      window.dispatchEvent(new CustomEvent('depense-deleted'))
      
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return false
    }
  }

  // 📊 OBTENIR LES DÉPENSES D'UN BUDGET (DIRECT)
  const getDepensesByBudget = (budgetId: string) => {
    return depenses.filter(depense => depense.recetteId === budgetId)
  }

  // 🔄 CHARGER LES DÉPENSES AU DÉMARRAGE
  useEffect(() => {
    refreshDepenses()
  }, [])

  const value: DepenseContextType = {
    depenses,
    loading,
    refreshDepenses,
    createDepense,
    updateDepense,
    deleteDepense,
    getDepensesByBudget
  }

  return (
    <DepenseContext.Provider value={value}>
      {children}
    </DepenseContext.Provider>
  )
}
