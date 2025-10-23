// 🚀 ARCHITECTURE DIRECTE - CONTEXTE DÉPENSE SIMPLIFIÉ
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Depense } from '@/lib/shared-data'
import { createClient } from '@/lib/supabase/browser'

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

  // 🔄 RECHARGER LES DÉPENSES DEPUIS LA BASE (ARCHITECTURE DIRECTE)
  const refreshDepenses = async () => {
    try {
      setLoading(true)
      console.log('🔄 Rechargement des dépenses depuis Supabase...')
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        setDepenses([])
        return
      }

      // Requête directe vers la base de données
      const { data, error } = await supabase
        .from('depenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erreur lors du chargement des dépenses:', error)
        setDepenses([])
        return
      }

      // Mapper les données directement
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

      console.log('✅ Dépenses chargées depuis Supabase:', mappedDepenses.length)
      setDepenses(mappedDepenses)
      
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
        console.error('❌ Erreur d\'authentification:', authError)
        return false
      }

      const { error } = await supabase
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

      if (error) {
        console.error('❌ Erreur lors de la création de la dépense:', error)
        return false
      }

      console.log('✅ Dépense créée avec succès')
      await refreshDepenses() // Recharger depuis la base
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return false
    }
  }

  // ✏️ MODIFIER UNE DÉPENSE (DIRECT)
  const updateDepense = async (id: number, updates: Partial<Depense>): Promise<boolean> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
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
        console.error('❌ Erreur lors de la modification de la dépense:', error)
        return false
      }

      console.log('✅ Dépense modifiée avec succès')
      await refreshDepenses() // Recharger depuis la base
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return false
    }
  }

  // 🗑️ SUPPRIMER UNE DÉPENSE (DIRECT)
  const deleteDepense = async (id: number): Promise<boolean> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
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

      console.log('✅ Dépense supprimée avec succès')
      await refreshDepenses() // Recharger depuis la base
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
