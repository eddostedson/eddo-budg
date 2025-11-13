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
  restoreRecette: (id: string) => Promise<boolean>
  permanentlyDeleteRecette: (id: string) => Promise<boolean>
  getDeletedRecettes: () => Promise<Recette[]>
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
      // Essayer d'abord avec le filtre deleted_at, sinon sans filtre (si la colonne n'existe pas encore)
      let query = supabase
        .from('recettes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      // Essayer d'ajouter le filtre deleted_at (si la colonne existe)
      let { data, error } = await query.is('deleted_at', null)
      
      // Si erreur liée à la colonne deleted_at, réessayer sans le filtre
      if (error && (error.message?.includes('deleted_at') || error.code === 'PGRST116')) {
        console.log('⚠️ Colonne deleted_at non trouvée, chargement sans filtre...')
        const retryQuery = supabase
          .from('recettes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        const retryResult = await retryQuery
        data = retryResult.data
        error = retryResult.error
      }

      console.log('📊 Données brutes de Supabase:', data)
      console.log('🔍 Nombre de recettes:', data?.length || 0)

      if (error) {
        console.error('❌ Erreur lors du chargement des recettes:', error)
        setRecettes([])
        return
      }

      // Mapper les données directement et filtrer les recettes supprimées (si deleted_at existe)
      const mappedRecettes = (data || [])
        .filter(recette => !recette.deleted_at) // Filtrer côté client si la colonne existe
        .map(recette => {
          // Dans la base, 'description' sert de libellé principal
          // On mappe description vers libelle, et on garde aussi description pour permettre modification
          const libelle = recette.description || recette.libelle || 'Sans titre'
          return {
            id: recette.id,
            userId: recette.user_id,
            libelle: libelle,
            montant: parseFloat(recette.amount || recette.montant || 0),
            soldeDisponible: parseFloat(recette.solde_disponible || recette.soldeDisponible || 0),
            description: recette.description || '', // Garder la description pour permettre modification
            date: recette.receipt_date || recette.date || recette.created_at,
            statut: recette.statut || 'Reçue',
            receiptUrl: recette.receipt_url || undefined,
            receiptFileName: recette.receipt_file_name || undefined,
            createdAt: recette.created_at,
            updatedAt: recette.updated_at
          }
        })

      console.log('✅ Recettes chargées depuis Supabase:', mappedRecettes.length)
      console.log('💰 Détails des recettes:', mappedRecettes)
      console.log('📈 Premier élément:', mappedRecettes[0])
      
      // 🔍 DEBUG: Vérifier les montants
      if (mappedRecettes.length > 0) {
        const totalTest = mappedRecettes.reduce((sum, r) => sum + (r.montant || 0), 0)
        console.log('🧮 Total calculé:', totalTest)
        console.log('🔍 Première recette - montant:', mappedRecettes[0]?.montant, 'type:', typeof mappedRecettes[0]?.montant)
        
        // Vérifier si tous les montants sont à 0
        const montantsNonZero = mappedRecettes.filter(r => r.montant > 0)
        console.log('📊 Recettes avec montant > 0:', montantsNonZero.length, '/', mappedRecettes.length)
        
        if (montantsNonZero.length === 0 && mappedRecettes.length > 0) {
          console.error('❌ PROBLÈME: Toutes les recettes ont un montant de 0!')
          console.error('🔍 Données brutes de la première recette:', data[0])
          console.error('🔍 Colonnes disponibles:', Object.keys(data[0]))
          console.error('🔍 Vérifier si les colonnes "amount" ou "montant" existent')
        }
      }
      
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

      // ✅ Utiliser UNIQUEMENT les colonnes qui existent dans la table
      const insertData: Record<string, any> = {
        user_id: user.id,
        description: recette.description || recette.libelle || 'Sans description',
        amount: recette.montant,
        solde_disponible: recette.montant, // Solde initial = montant
        receipt_date: recette.date
      }

      console.log('📝 Données à insérer:', insertData)

      const { error } = await supabase
        .from('recettes')
        .insert(insertData)

      if (error) {
        console.error('❌ Erreur lors de la création de la recette:', error)
        console.error('❌ Code erreur:', error.code)
        console.error('❌ Message:', error.message)
        console.error('❌ Détails:', error.details)
        console.error('❌ Hint:', error.hint)
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
      console.log('🔄 [updateRecette] Début de la modification:', { id, updates })
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ [updateRecette] Erreur d\'authentification:', authError)
        return false
      }

      const updateData: Record<string, any> = {}
      
      // Mapper les champs vers les colonnes de la base de données
      // Dans la base, 'description' sert de libellé principal
      if (updates.libelle !== undefined && updates.libelle !== '') {
        updateData.description = updates.libelle
        console.log('📝 [updateRecette] Libellé mappé vers description:', updates.libelle)
      }
      
      if (updates.date !== undefined && updates.date !== '') {
        // S'assurer que la date est au bon format
        const dateValue = updates.date instanceof Date 
          ? updates.date.toISOString().split('T')[0] 
          : updates.date
        updateData.receipt_date = dateValue
        console.log('📅 [updateRecette] Date:', dateValue)
      }
      
      // Ne pas mettre à jour statut si la colonne n'existe pas dans la base
      // if (updates.statut !== undefined && updates.statut !== '') {
      //   updateData.statut = updates.statut
      //   console.log('📊 [updateRecette] Statut:', updates.statut)
      // }
      
      if (updates.receiptUrl !== undefined) updateData.receipt_url = updates.receiptUrl
      if (updates.receiptFileName !== undefined) updateData.receipt_file_name = updates.receiptFileName
      
      // Si le montant est modifié, recalculer le solde disponible en tenant compte des dépenses existantes
      if (updates.montant !== undefined) {
        updateData.amount = updates.montant
        console.log('💰 [updateRecette] Montant:', updates.montant)
        
        // Récupérer le total des dépenses liées pour recalculer le solde
        const { data: depensesData, error: depensesError } = await supabase
          .from('depenses')
          .select('montant')
          .eq('recette_id', id)
          .eq('user_id', user.id)
        
        if (depensesError) {
          console.error('❌ [updateRecette] Erreur lors de la récupération des dépenses:', depensesError)
        }
        
        const totalDepenses = depensesData?.reduce((sum, d) => sum + (parseFloat(d.montant) || 0), 0) || 0
        const nouveauSolde = updates.montant - totalDepenses
        
        updateData.solde_disponible = Math.max(0, nouveauSolde) // S'assurer que le solde n'est pas négatif
        console.log('💵 [updateRecette] Solde recalculé:', { totalDepenses, nouveauSolde, soldeFinal: updateData.solde_disponible })
      }

      // Vérifier qu'il y a des données à mettre à jour
      if (Object.keys(updateData).length === 0) {
        console.warn('⚠️ [updateRecette] Aucune donnée à mettre à jour')
        return false
      }

      console.log('📤 [updateRecette] Données à mettre à jour:', updateData)
      console.log('📤 [updateRecette] ID recette:', id)
      console.log('📤 [updateRecette] User ID:', user.id)

      const { data, error } = await supabase
        .from('recettes')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()

      if (error) {
        console.error('❌ [updateRecette] Erreur lors de la modification de la recette:', error)
        console.error('❌ [updateRecette] Détails complets:', JSON.stringify(error, null, 2))
        console.error('❌ [updateRecette] Code:', error.code)
        console.error('❌ [updateRecette] Message:', error.message)
        console.error('❌ [updateRecette] Details:', error.details)
        console.error('❌ [updateRecette] Hint:', error.hint)
        return false
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ [updateRecette] Aucune ligne mise à jour (peut-être un problème de permissions RLS)')
        return false
      }

      console.log('✅ [updateRecette] Recette modifiée avec succès dans la base:', data[0])
      return true
    } catch (error) {
      console.error('❌ [updateRecette] Erreur inattendue:', error)
      return false
    }
  }

  // 🗑️ SUPPRIMER UNE RECETTE (SOFT DELETE - CORBEILLE)
  const deleteRecette = async (id: string): Promise<boolean> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        return false
      }

      // Essayer d'abord le soft delete (si la colonne deleted_at existe)
      const { error: softDeleteError } = await supabase
        .from('recettes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .is('deleted_at', null) // S'assurer qu'elle n'est pas déjà supprimée

      // Si le soft delete fonctionne, c'est bon
      if (!softDeleteError) {
        console.log('✅ Recette déplacée dans la corbeille')
        await refreshRecettes()
        return true
      }

      // Si erreur liée à la colonne deleted_at (n'existe pas), faire une suppression définitive
      if (softDeleteError && (softDeleteError.message?.includes('deleted_at') || softDeleteError.code === 'PGRST116')) {
        console.log('⚠️ Colonne deleted_at non trouvée, suppression définitive...')
        
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

        // 2. Supprimer définitivement la recette
        const { error: deleteError } = await supabase
          .from('recettes')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)

        if (deleteError) {
          console.error('❌ Erreur lors de la suppression définitive:', deleteError)
          return false
        }

        console.log('✅ Recette supprimée définitivement')
        await refreshRecettes()
        return true
      }

      // Autre erreur
      console.error('❌ Erreur lors de la suppression de la recette:', softDeleteError)
      return false
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return false
    }
  }

  // ♻️ RESTAURER UNE RECETTE SUPPRIMÉE
  const restoreRecette = async (id: string): Promise<boolean> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        return false
      }

      // Restaurer la recette en supprimant deleted_at
      const { error } = await supabase
        .from('recettes')
        .update({ deleted_at: null })
        .eq('id', id)
        .eq('user_id', user.id)
        .not('deleted_at', 'is', null) // S'assurer qu'elle est bien supprimée

      if (error) {
        console.error('❌ Erreur lors de la restauration de la recette:', error)
        return false
      }

      console.log('✅ Recette restaurée avec succès')
      await refreshRecettes() // Recharger depuis la base
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return false
    }
  }

  // 🗑️ SUPPRIMER DÉFINITIVEMENT UNE RECETTE (VIDAGE DE LA CORBEILLE)
  const permanentlyDeleteRecette = async (id: string): Promise<boolean> => {
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

      // 2. Supprimer définitivement la recette
      const { error } = await supabase
        .from('recettes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .not('deleted_at', 'is', null) // S'assurer qu'elle est bien dans la corbeille

      if (error) {
        console.error('❌ Erreur lors de la suppression définitive:', error)
        return false
      }

      console.log('✅ Recette supprimée définitivement')
      await refreshRecettes() // Recharger depuis la base
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return false
    }
  }

  // 📋 RÉCUPÉRER LES RECETTES SUPPRIMÉES (CORBEILLE)
  const getDeletedRecettes = async (): Promise<Recette[]> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        return []
      }

      const { data, error } = await supabase
        .from('recettes')
        .select('*')
        .eq('user_id', user.id)
        .not('deleted_at', 'is', null) // Seulement les recettes supprimées
        .order('deleted_at', { ascending: false })

      if (error) {
        console.error('❌ Erreur lors du chargement des recettes supprimées:', error)
        return []
      }

      return (data || []).map(recette => ({
        id: recette.id,
        userId: recette.user_id,
        libelle: recette.description || recette.libelle || 'Sans titre',
        montant: parseFloat(recette.amount || recette.montant || 0),
        soldeDisponible: parseFloat(recette.solde_disponible || recette.soldeDisponible || 0),
        description: recette.description || recette.libelle || '',
        date: recette.receipt_date || recette.date || recette.created_at,
        statut: recette.statut || 'Reçue',
        receiptUrl: recette.receipt_url || undefined,
        receiptFileName: recette.receipt_file_name || undefined,
        createdAt: recette.created_at,
        updatedAt: recette.updated_at
      }))
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return []
    }
  }

  // 📊 CALCULER LE TOTAL DISPONIBLE (DIRECT)
  const getTotalDisponible = () => {
    return recettes.reduce((total, recette) => total + recette.soldeDisponible, 0)
  }

  // 🔄 CHARGER LES RECETTES AU DÉMARRAGE
  useEffect(() => {
    refreshRecettes()
    
    // Écouter les événements de modification des dépenses pour rafraîchir les soldes
    const handleDepenseChange = () => refreshRecettes()
    
    window.addEventListener('depense-created', handleDepenseChange)
    window.addEventListener('depense-updated', handleDepenseChange)
    window.addEventListener('depense-deleted', handleDepenseChange)
    
    return () => {
      window.removeEventListener('depense-created', handleDepenseChange)
      window.removeEventListener('depense-updated', handleDepenseChange)
      window.removeEventListener('depense-deleted', handleDepenseChange)
    }
  }, [])

  const value: RecetteContextType = {
    recettes,
    loading,
    refreshRecettes,
    createRecette,
    updateRecette,
    deleteRecette,
    restoreRecette,
    permanentlyDeleteRecette,
    getDeletedRecettes,
    getTotalDisponible
  }

  return (
    <RecetteContext.Provider value={value}>
      {children}
    </RecetteContext.Provider>
  )
}
