import { createClient } from './browser'
import { Recette, Depense, Allocation, Transaction, Category, Budget } from '@/lib/shared-data'

const supabase = createClient()

// Service pour la persistance des BUDGETS (nouvelle logique)
export class BudgetService {
  static async getBudgets(): Promise<Budget[]> {
    const { data, error } = await supabase.from('budgets').select('*').order('created_at', { ascending: false })
    if (error) {
      console.error("Erreur getBudgets:", error)
      return []
    }
    return data
  }

  static async createBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget | null> {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('budgets').insert({ ...budget, user_id: user?.id }).select().single()
    if (error) {
      console.error("Erreur createBudget:", error)
      return null
    }
    return data
  }

  static async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget | null> {
    const { data, error } = await supabase.from('budgets').update(updates).eq('id', id).select().single()
    if (error) {
      console.error("Erreur updateBudget:", error)
      return null
    }
    return data
  }

  static async deleteBudget(id: string): Promise<boolean> {
    const { error } = await supabase.from('budgets').delete().eq('id', id)
    if (error) {
      console.error("Erreur deleteBudget:", error)
      return false
    }
    return true
  }
}

// Service pour la persistance des TRANSACTIONS
export class TransactionService {
  // Récupérer toutes les transactions de l'utilisateur
  static async getTransactions(): Promise<Transaction[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      let query = supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })

      if (user) {
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query
      if (error) throw error
      
      return (data || []).map(t => ({ ...t, budgetId: t.budget_id }))
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions:', error)
      return []
    }
  }

  // Créer une nouvelle transaction
  static async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...transaction,
          user_id: user?.id,
          budget_id: transaction.budgetId
        })
        .select()
        .single()

      if (error) throw error
      return { ...data, budgetId: data.budget_id }
    } catch (error) {
      console.error('Erreur lors de la création de la transaction:', error)
      return null
    }
  }

  // Mettre à jour une transaction
  static async updateTransaction(id: number, updates: Partial<Transaction>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      let query = supabase.from('transactions').update({ ...updates, budget_id: updates.budgetId }).eq('id', id)
      if(user) {
        query = query.eq('user_id', user.id)
      }
      const { error } = await query
      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la transaction:', error)
      return false
    }
  }

  // Supprimer une transaction
  static async deleteTransaction(id: number): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      let query = supabase.from('transactions').delete().eq('id', id)
       if(user) {
        query = query.eq('user_id', user.id)
      }
      const { error } = await query
      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur lors de la suppression de la transaction:', error)
      return false
    }
  }
}

// Service pour la persistance des CATEGORIES
export class CategoryService {
  // Récupérer toutes les catégories
  static async getCategories(): Promise<Category[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      let query = supabase.from('categories').select('*')
      if (user) {
        query = query.eq('user_id', user.id)
      }
      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error)
      return []
    }
  }

  // Créer une nouvelle catégorie
  static async createCategory(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('categories')
        .insert({ ...category, user_id: user?.id })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur lors de la création de la catégorie:', error)
      return null
    }
  }

  // Supprimer une catégorie
  static async deleteCategory(id: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      let query = supabase.from('categories').delete().eq('id', id)
      if(user) {
        query = query.eq('user_id', user.id)
      }
      const { error } = await query
      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur lors de la suppression de la catégorie:', error)
      return false
    }
  }
}

// Service pour la persistance des RECETTES
export class RecetteService {
  // Récupérer toutes les recettes de l'utilisateur
  static async getRecettes(): Promise<Recette[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        return []
      }

      console.log('🔄 Récupération des recettes depuis la base de données...')

      const { data, error } = await supabase
        .from('recettes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erreur lors de la récupération des recettes:', error)
        return []
      }

      const recettes = (data || []).map(recette => {
        const recetteData = {
          id: recette.id,
          userId: recette.user_id,
          libelle: recette.libelle,
          description: recette.description || '',
          montant: parseFloat(recette.montant),
          soldeDisponible: parseFloat(recette.solde_disponible),
          source: recette.source || '',
          periodicite: recette.periodicite || 'unique',
          dateReception: recette.date_reception,
          categorie: recette.categorie || '',
          statut: recette.statut || 'reçue',
          validationBancaire: Boolean(recette.validation_bancaire),
          dateValidationBancaire: recette.date_validation_bancaire || undefined,
          createdAt: recette.created_at,
          updatedAt: recette.updated_at
        }
        
        // Log pour débogage
        if (recette.libelle.includes('RELIQUAT PRET SUR REMISE')) {
          console.log('🔍 Recette RELIQUAT trouvée:', {
            id: recette.id,
            libelle: recette.libelle,
            montant: recette.montant,
            solde_disponible: recette.solde_disponible,
            validation_bancaire: recette.validation_bancaire,
            date_validation_bancaire: recette.date_validation_bancaire
          })
        }
        
        return recetteData
      })

      console.log('✅ Recettes récupérées:', recettes.length)
      return recettes
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return []
    }
  }

  // Créer une nouvelle recette
  static async createRecette(recette: Omit<Recette, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recette | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        return null
      }

      const { data, error } = await supabase
        .from('recettes')
        .insert({
          user_id: user.id,
          libelle: recette.libelle,
          description: recette.description,
          montant: recette.montant,
          solde_disponible: recette.montant, // Initialement, tout le montant est disponible
          source: recette.source,
          periodicite: recette.periodicite || 'unique',
          date_reception: recette.dateReception || new Date().toISOString().split('T')[0],
          categorie: recette.categorie || '',
          statut: recette.statut || 'reçue'
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur création recette:', error.message)
        return null
      }

      console.log('✅ Recette créée:', data.id)
      return {
        id: data.id,
        userId: data.user_id,
        libelle: data.libelle,
        description: data.description || '',
        montant: parseFloat(data.montant),
        soldeDisponible: parseFloat(data.solde_disponible),
        source: data.source || '',
        periodicite: data.periodicite || 'unique',
        dateReception: data.date_reception,
        categorie: data.categorie || '',
        statut: data.statut || 'reçue',
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return null
    }
  }

  // Mettre à jour une recette
  static async updateRecette(id: string, updates: Partial<Recette>): Promise<Recette | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        return null
      }

      const updateData: Record<string, string | number> = {}
      if (updates.libelle !== undefined) updateData.libelle = updates.libelle
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.montant !== undefined) updateData.montant = updates.montant
      if (updates.source !== undefined) updateData.source = updates.source
      if (updates.periodicite !== undefined) updateData.periodicite = updates.periodicite
      if (updates.dateReception !== undefined) updateData.date_reception = updates.dateReception
      if (updates.categorie !== undefined) updateData.categorie = updates.categorie
      if (updates.statut !== undefined) updateData.statut = updates.statut

      const { data, error } = await supabase
        .from('recettes')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur lors de la mise à jour de la recette:', error)
        return null
      }

      console.log('✅ Recette mise à jour avec succès:', id)
      return {
        id: data.id,
        userId: data.user_id,
        libelle: data.libelle,
        description: data.description || '',
        montant: parseFloat(data.montant),
        soldeDisponible: parseFloat(data.solde_disponible),
        source: data.source || '',
        periodicite: data.periodicite || 'unique',
        dateReception: data.date_reception,
        categorie: data.categorie || '',
        statut: data.statut || 'reçue',
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return null
    }
  }

  // Supprimer une recette
  static async deleteRecette(id: string): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        return false
      }

      // 1. Récupérer les informations de la recette pour supprimer le reçu
      const { data: recette, error: fetchError } = await supabase
        .from('recettes')
        .select('receipt_url')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        console.error('❌ Erreur lors de la récupération de la recette:', fetchError)
        return false
      }

      // 2. Supprimer le fichier reçu du stockage si il existe
      if (recette?.receipt_url) {
        try {
          // Extraire le chemin du fichier depuis l'URL
          const urlParts = recette.receipt_url.split('/')
          const fileName = urlParts[urlParts.length - 1]
          const filePath = `${user.id}/${fileName}`

          console.log('🗑️ Suppression du fichier reçu:', filePath)
          
          const { error: storageError } = await supabase.storage
            .from('receipts')
            .remove([filePath])

          if (storageError) {
            console.warn('⚠️ Erreur lors de la suppression du fichier reçu (peut être déjà supprimé):', storageError)
            // On continue même si la suppression du fichier échoue
          } else {
            console.log('✅ Fichier reçu supprimé avec succès:', filePath)
          }
        } catch (storageError) {
          console.warn('⚠️ Erreur lors de la suppression du fichier reçu:', storageError)
          // On continue même si la suppression du fichier échoue
        }
      }

      // 3. Supprimer l'enregistrement de la recette
      const { error } = await supabase
        .from('recettes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Erreur lors de la suppression de la recette:', error)
        return false
      }

      console.log('✅ Recette supprimée avec succès:', id)
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return false
    }
  }

  // Valider la conformité bancaire d'une recette
  static async validateBankConformity(recetteId: string): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        return false
      }

      const { error } = await supabase
        .from('recettes')
        .update({
          validation_bancaire: true,
          date_validation_bancaire: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', recetteId)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Erreur lors de la validation bancaire:', error)
        return false
      }

      console.log('✅ Validation bancaire activée pour la recette:', recetteId)
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return false
    }
  }

  // Invalider la conformité bancaire d'une recette
  static async invalidateBankConformity(recetteId: string): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        return false
      }

      const { error } = await supabase
        .from('recettes')
        .update({
          validation_bancaire: false,
          date_validation_bancaire: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', recetteId)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Erreur lors de l\'invalidation bancaire:', error)
        return false
      }

      console.log('✅ Validation bancaire désactivée pour la recette:', recetteId)
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return false
    }
  }

  // Toggle de la validation bancaire
  static async toggleBankValidation(recetteId: string, isValidated: boolean): Promise<boolean> {
    if (isValidated) {
      return await this.validateBankConformity(recetteId)
    } else {
      return await this.invalidateBankConformity(recetteId)
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Service pour la persistance des DÉPENSES
// ═══════════════════════════════════════════════════════════════════════════
export class DepenseService {
  // Récupérer toutes les dépenses de l'utilisateur
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
        console.error('❌ Erreur lors de la récupération des dépenses:', error)
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

  // Récupérer les dépenses d'un budget spécifique
  static async getDepensesByBudget(budgetId: string): Promise<Depense[]> {
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
        .eq('budget_id', budgetId)
        .order('date', { ascending: false })

      if (error) {
        console.error('❌ Erreur lors de la récupération des dépenses du budget:', error)
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

  // Créer une nouvelle dépense
  static async createDepense(depense: Omit<Depense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Depense | null> {
    try {
      console.log('🚀 === DÉBUT CRÉATION DÉPENSE ===')
      console.log('🔐 Vérification de l\'authentification...')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('❌ Erreur d\'authentification:', authError)
        throw new Error("Erreur d'authentification: " + authError.message)
      }
      
      if (!user) {
        console.error('❌ Utilisateur non authentifié')
        throw new Error("Utilisateur non authentifié")
      }
      
      console.log('✅ Utilisateur authentifié:', user.id)
      console.log('📦 Création dépense:', depense.libelle)

      const insertData: Record<string, string | number> = {
        user_id: user.id,
        libelle: depense.libelle,
        montant: depense.montant,
        date: depense.date,
        description: depense.description
      }

      // Ajouter recette_id si présent
      if (depense.recetteId) {
        insertData.recette_id = depense.recetteId
      }

      // Ajouter catégorie si présente
      if (depense.categorie) {
        insertData.categorie = depense.categorie
      }

      // Ajouter les champs du reçu si présents
      if (depense.receiptUrl) {
        insertData.receipt_url = depense.receiptUrl
      }
      if (depense.receiptFileName) {
        insertData.receipt_file_name = depense.receiptFileName
      }
      
      const { data, error } = await supabase
        .from('depenses')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur création dépense:', error.message)
        console.error('🔍 Données qui ont causé l\'erreur:', insertData)
        
        // Afficher l'erreur dans une alerte pour l'utilisateur
        alert(`Erreur Supabase: ${error.message}\nCode: ${error.code}\nDétails: ${error.details}`)
        
        throw error
      }
      
      console.log('✅ Dépense créée dans Supabase avec succès!')
      console.log('✅ Données retournées:', data)
      console.log('🔍 ID de la dépense créée:', data.id)
      console.log('🚀 === FIN CRÉATION DÉPENSE ===')
      
      // Mapper les données pour le format de l'application
      const result = {
        id: data.id,
        userId: data.user_id,
        recetteId: data.recette_id || undefined,
        libelle: data.libelle,
        montant: parseFloat(data.montant),
        date: data.date,
        description: data.description || '',
        categorie: data.categorie || undefined,
        receiptUrl: data.receipt_url || undefined,
        receiptFileName: data.receipt_file_name || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
      
      console.log('✅ Dépense mappée:', result)
      return result
    } catch (error) {
      console.error('❌ ERREUR INATTENDUE DANS createDepense:', error)
      console.error('❌ Type d\'erreur:', typeof error)
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'Pas de stack trace')
      
      // Afficher l'erreur dans une alerte pour l'utilisateur
      alert(`Erreur inattendue: ${error instanceof Error ? error.message : String(error)}`)
      
      return null
    }
  }

  // Mettre à jour une dépense
  static async updateDepense(id: number, updates: Partial<Depense>): Promise<Depense | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        return null
      }

      const updateData: Record<string, string | number> = {}
      if (updates.libelle !== undefined) updateData.libelle = updates.libelle
      if (updates.montant !== undefined) updateData.montant = updates.montant
      if (updates.date !== undefined) updateData.date = updates.date
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.categorie !== undefined) updateData.categorie = updates.categorie
      if (updates.receiptUrl !== undefined) updateData.receipt_url = updates.receiptUrl
      if (updates.receiptFileName !== undefined) updateData.receipt_file_name = updates.receiptFileName

      const { data, error } = await supabase
        .from('depenses')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur lors de la mise à jour de la dépense:', error)
        return null
      }

      console.log('✅ Dépense mise à jour avec succès:', id)
      return {
        id: data.id,
        userId: data.user_id,
        recetteId: data.recette_id || undefined,
        libelle: data.libelle,
        montant: parseFloat(data.montant),
        date: data.date,
        description: data.description || '',
        categorie: data.categorie || undefined,
        receiptUrl: data.receipt_url || undefined,
        receiptFileName: data.receipt_file_name || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return null
    }
  }

  // Supprimer une dépense
  static async deleteDepense(id: number): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        return false
      }

      // 1. Récupérer les informations de la dépense pour supprimer le reçu
      const { data: depense, error: fetchError } = await supabase
        .from('depenses')
        .select('receipt_url')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        console.error('❌ Erreur lors de la récupération de la dépense:', fetchError)
        return false
      }

      // 2. Supprimer le fichier reçu du stockage si il existe
      if (depense?.receipt_url) {
        try {
          // Extraire le chemin du fichier depuis l'URL
          const urlParts = depense.receipt_url.split('/')
          const fileName = urlParts[urlParts.length - 1]
          const filePath = `${user.id}/${fileName}`

          console.log('🗑️ Suppression du fichier reçu:', filePath)
          
          const { error: storageError } = await supabase.storage
            .from('receipts')
            .remove([filePath])

          if (storageError) {
            console.warn('⚠️ Erreur lors de la suppression du fichier reçu (peut être déjà supprimé):', storageError)
            // On continue même si la suppression du fichier échoue
          } else {
            console.log('✅ Fichier reçu supprimé avec succès:', filePath)
          }
        } catch (storageError) {
          console.warn('⚠️ Erreur lors de la suppression du fichier reçu:', storageError)
          // On continue même si la suppression du fichier échoue
        }
      }

      // 3. Supprimer l'enregistrement de la dépense
      const { error } = await supabase
        .from('depenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Erreur lors de la suppression de la dépense:', error)
        return false
      }

      console.log('✅ Dépense supprimée avec succès:', id)
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return false
    }
  }

  // Récupérer tous les libellés distincts (pour le combobox)
  static async getLibellesDistincts(): Promise<string[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return []
      }

      const { data, error } = await supabase
        .from('depenses')
        .select('libelle')
        .eq('user_id', user.id)
        .order('libelle')

      if (error) {
        console.error('❌ Erreur lors de la récupération des libellés:', error)
        return []
      }

      // Retourner les libellés uniques
      const libelles = [...new Set(data.map(d => d.libelle))]
      return libelles
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return []
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Service pour la persistance des ALLOCATIONS
// ═══════════════════════════════════════════════════════════════════════════
export class AllocationService {
  // Récupérer toutes les allocations
  static async getAllocations(): Promise<Allocation[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        return []
      }

      const { data, error } = await supabase
        .from('allocations')
        .select('*')
        .eq('user_id', user.id)
        .order('date_allocation', { ascending: false })

      if (error) {
        console.error('❌ Erreur lors de la récupération des allocations:', error)
        return []
      }

      return (data || []).map(allocation => ({
        id: allocation.id,
        userId: allocation.user_id,
        recetteId: allocation.recette_id,
        budgetId: allocation.budget_id,
        montant: parseFloat(allocation.montant),
        dateAllocation: allocation.date_allocation,
        createdAt: allocation.created_at
      }))
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return []
    }
  }

  // Créer une nouvelle allocation
  static async createAllocation(allocation: Omit<Allocation, 'id' | 'createdAt'>): Promise<Allocation | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        return null
      }

      const { data, error } = await supabase
        .from('allocations')
        .insert({
          user_id: user.id,
          recette_id: allocation.recetteId,
          budget_id: allocation.budgetId,
          montant: allocation.montant
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur lors de la création de l\'allocation:', error)
        return null
      }

      console.log('✅ Allocation créée avec succès:', data.id)
      return {
        id: data.id,
        userId: data.user_id,
        recetteId: data.recette_id,
        budgetId: data.budget_id,
        montant: parseFloat(data.montant),
        dateAllocation: data.date_allocation,
        createdAt: data.created_at
      }
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return null
    }
  }

  // Supprimer une allocation
  static async deleteAllocation(id: number): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        return false
      }

      const { error } = await supabase
        .from('allocations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Erreur lors de la suppression de l\'allocation:', error)
        return false
      }

      console.log('✅ Allocation supprimée avec succès:', id)
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return false
    }
  }
}
