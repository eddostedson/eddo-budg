// 🚀 ARCHITECTURE DIRECTE - SERVICE UNIQUE ET SIMPLE
import { createClient } from './browser'
import { Recette, Depense } from '@/lib/shared-data'

const supabase = createClient()

// 🏗️ SERVICE DIRECT - CONNEXION DIRECTE À LA BASE DE DONNÉES
export class DirectService {
  
  // ========================================
  // 📊 RECETTES - OPÉRATIONS DIRECTES
  // ========================================
  
  static async getRecettes(): Promise<Recette[]> {
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
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erreur lors du chargement des recettes:', error)
        return []
      }

      return (data || []).map(recette => ({
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
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return []
    }
  }

  static async createRecette(recette: Omit<Recette, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
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

      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return false
    }
  }

  static async updateRecette(id: string, updates: Partial<Recette>): Promise<boolean> {
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

      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return false
    }
  }

  static async deleteRecette(id: string): Promise<boolean> {
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

      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return false
    }
  }

  // ========================================
  // 💰 DÉPENSES - OPÉRATIONS DIRECTES
  // ========================================
  
  static async getDepenses(): Promise<Depense[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        return []
      }

      const { data, error } = await supabase
        .from('depenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erreur lors du chargement des dépenses:', error)
        return []
      }

      return (data || []).map(depense => ({
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
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return []
    }
  }

  static async createDepense(depense: Omit<Depense, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
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

      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return false
    }
  }

  static async updateDepense(id: number, updates: Partial<Depense>): Promise<boolean> {
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

      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return false
    }
  }

  static async deleteDepense(id: number): Promise<boolean> {
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

      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return false
    }
  }

  // ========================================
  // 📊 CALCULS - OPÉRATIONS DIRECTES
  // ========================================
  
  static async getTotalDisponible(): Promise<number> {
    try {
      // Calculer le solde disponible en temps réel (plus fiable)
      const recettes = await this.getRecettes()
      const depenses = await this.getDepenses()
      
      return recettes.reduce((total, recette) => {
        const depensesLiees = depenses.filter(d => d.recetteId === recette.id)
        const totalDepenses = depensesLiees.reduce((sum, depense) => sum + depense.montant, 0)
        const soldeReel = recette.montant - totalDepenses
        return total + soldeReel
      }, 0)
    } catch (error) {
      console.error('❌ Erreur lors du calcul du total disponible:', error)
      return 0
    }
  }

  static async getTotalDepenses(): Promise<number> {
    try {
      const depenses = await this.getDepenses()
      return depenses.reduce((total, depense) => total + depense.montant, 0)
    } catch (error) {
      console.error('❌ Erreur lors du calcul du total des dépenses:', error)
      return 0
    }
  }

  static async getSoldeRecette(recetteId: string): Promise<number> {
    try {
      const recettes = await this.getRecettes()
      const depenses = await this.getDepenses()
      
      const recette = recettes.find(r => r.id === recetteId)
      if (!recette) return 0
      
      const depensesLiees = depenses.filter(d => d.recetteId === recetteId)
      const totalDepenses = depensesLiees.reduce((total, depense) => total + depense.montant, 0)
      
      return recette.montant - totalDepenses
    } catch (error) {
      console.error('❌ Erreur lors du calcul du solde de la recette:', error)
      return 0
    }
  }
}
