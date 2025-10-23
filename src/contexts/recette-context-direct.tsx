// 🚀 ARCHITECTURE DIRECTE - CONTEXTE RECETTE SIMPLIFIÉ
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Recette } from '@/lib/shared-data'
import { createClient } from '@/lib/supabase/browser'

const supabase = createClient()

interface RecetteContextType {
  recettes: Recette[]
  loading: boolean
  refreshRecettes: () => Promise<void>
  createRecette: (recette: Omit<Recette, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>
  updateRecette: (id: string, updates: Partial<Recette>) => Promise<boolean>
  deleteRecette: (id: string) => Promise<boolean>
  getTotalDisponible: () => number
}

const RecetteContext = createContext<RecetteContextType | undefined>(undefined)

export const useRecettes = () => {
  const context = useContext(RecetteContext)
  if (!context) {
    throw new Error('useRecettes must be used within a RecetteProvider')
  }
  return context
}

export const RecetteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recettes, setRecettes] = useState<Recette[]>([])
  const [loading, setLoading] = useState(true)

  // 🔄 RECHARGER LES RECETTES DEPUIS LA BASE (ARCHITECTURE DIRECTE)
  const refreshRecettes = async () => {
    try {
      setLoading(true)
      console.log('🔄 Rechargement des recettes depuis Supabase...')
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        setRecettes([])
        return
      }

      // Requête directe vers la base de données
      const { data, error } = await supabase
        .from('recettes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erreur lors du chargement des recettes:', error)
        setRecettes([])
        return
      }

      // Mapper les données directement
      const mappedRecettes = (data || []).map(recette => ({
        id: recette.id,
        userId: recette.user_id,
        libelle: recette.libelle,
        montant: parseFloat(recette.amount || 0),
        soldeDisponible: parseFloat(recette.solde_disponible || 0),
        description: recette.description || '',
        date: recette.date,
        statut: recette.statut || 'Reçue',
        receiptUrl: recette.receipt_url || undefined,
        receiptFileName: recette.receipt_file_name || undefined,
        createdAt: recette.created_at,
        updatedAt: recette.updated_at
      }))

      console.log('✅ Recettes chargées depuis Supabase:', mappedRecettes.length)
      setRecettes(mappedRecettes)
      
    } catch (error) {
      console.error('❌ Erreur lors du rechargement des recettes:', error)
      setRecettes([])
    } finally {
      setLoading(false)
    }
  }

  // ➕ CRÉER UNE RECETTE (DIRECT)
  const createRecette = async (recette: Omit<Recette, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        return false
      }

      const { error } = await supabase
        .from('recettes')
        .insert({
          user_id: user.id,
          libelle: recette.libelle,
          amount: recette.montant,
          solde_disponible: recette.montant, // Solde initial = montant
          description: recette.description,
          date: recette.date,
          statut: recette.statut,
          receipt_url: recette.receiptUrl,
          receipt_file_name: recette.receiptFileName
        })

      if (error) {
        console.error('❌ Erreur lors de la création de la recette:', error)
        return false
      }

      console.log('✅ Recette créée avec succès')
      await refreshRecettes() // Recharger depuis la base
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return false
    }
  }

  // ✏️ MODIFIER UNE RECETTE (DIRECT)
  const updateRecette = async (id: string, updates: Partial<Recette>): Promise<boolean> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        return false
      }

      const updateData: Record<string, any> = {}
      if (updates.libelle !== undefined) updateData.libelle = updates.libelle
      if (updates.montant !== undefined) {
        updateData.amount = updates.montant
        updateData.solde_disponible = updates.montant // Recalculer le solde
      }
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.date !== undefined) updateData.date = updates.date
      if (updates.statut !== undefined) updateData.statut = updates.statut
      if (updates.receiptUrl !== undefined) updateData.receipt_url = updates.receiptUrl
      if (updates.receiptFileName !== undefined) updateData.receipt_file_name = updates.receiptFileName

      const { error } = await supabase
        .from('recettes')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Erreur lors de la modification de la recette:', error)
        return false
      }

      console.log('✅ Recette modifiée avec succès')
      await refreshRecettes() // Recharger depuis la base
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return false
    }
  }

  // 🗑️ SUPPRIMER UNE RECETTE (DIRECT)
  const deleteRecette = async (id: string): Promise<boolean> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        return false
      }

      // 1. Supprimer les dépenses liées d'abord
      const { error: deleteDepensesError } = await supabase
        .from('depenses')
        .delete()
        .eq('recette_id', id)
        .eq('user_id', user.id)

      if (deleteDepensesError) {
        console.error('❌ Erreur lors de la suppression des dépenses liées:', deleteDepensesError)
        return false
      }

      // 2. Supprimer la recette
      const { error } = await supabase
        .from('recettes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Erreur lors de la suppression de la recette:', error)
        return false
      }

      console.log('✅ Recette supprimée avec succès')
      await refreshRecettes() // Recharger depuis la base
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return false
    }
  }

  // 📊 CALCULER LE TOTAL DISPONIBLE (DIRECT)
  const getTotalDisponible = () => {
    return recettes.reduce((total, recette) => total + recette.soldeDisponible, 0)
  }

  // 🔄 CHARGER LES RECETTES AU DÉMARRAGE
  useEffect(() => {
    refreshRecettes()
  }, [])

  const value: RecetteContextType = {
    recettes,
    loading,
    refreshRecettes,
    createRecette,
    updateRecette,
    deleteRecette,
    getTotalDisponible
  }

  return (
    <RecetteContext.Provider value={value}>
      {children}
    </RecetteContext.Provider>
  )
}
