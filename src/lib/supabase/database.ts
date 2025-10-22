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
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification lors de la création de catégorie:', authError)
        return null
      }
      
      const { data, error } = await supabase
        .from('categories')
        .insert({ ...category, user_id: user.id })
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur Supabase lors de la création de catégorie:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        return null
      }
      
      console.log('✅ Catégorie créée avec succès:', data.id)
      return data
    } catch (error) {
      console.error('❌ Erreur inattendue lors de la création de la catégorie:', error)
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

      // Debug: Afficher la structure des données reçues
      console.log('🔍 Structure des données reçues de Supabase:', data?.[0])
      console.log('🔍 Colonnes disponibles:', data?.[0] ? Object.keys(data[0]) : 'Aucune donnée')
      
      const recettes = (data || []).map(recette => {
        // Debug: Afficher les données de chaque recette
        console.log('🔍 Recette brute de Supabase:', recette)
        
        // Utiliser les nouvelles colonnes de la table
        const recetteData = {
          id: recette.id,
          userId: recette.user_id,
          libelle: recette.description || '', // description -> libelle (correction)
          description: recette.description || '',
          montant: parseFloat(recette.amount || 0), // amount -> montant (correction)
          soldeDisponible: parseFloat(recette.amount || 0), // amount -> soldeDisponible (correction)
          source: '', // Colonne n'existe pas dans la nouvelle structure
          periodicite: 'unique', // Colonne n'existe pas dans la nouvelle structure
          dateReception: recette.receipt_date, // receipt_date -> dateReception (correction)
          categorie: '', // Colonne n'existe pas dans la nouvelle structure
          statut: 'reçue', // Colonne n'existe pas dans la nouvelle structure
          validationBancaire: false, // Colonne n'existe pas dans la nouvelle structure
          dateValidationBancaire: undefined, // Colonne n'existe pas dans la nouvelle structure
          createdAt: recette.created_at,
          updatedAt: recette.updated_at
        }

        // Log pour débogage ciblé
        if (recetteData.libelle.includes('RELIQUAT PRET SUR REMISE')) {
          console.log('🔍 Recette RELIQUAT trouvée:', {
            id: recette.id,
            libelle: recetteData.libelle,
            montant: recetteData.montant,
            solde_disponible: recetteData.soldeDisponible,
            validation_bancaire: recetteData.validationBancaire,
            date_validation_bancaire: recetteData.dateValidationBancaire
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
          description: recette.libelle, // libelle -> description (correction)
          amount: recette.montant, // montant -> amount (correction)
          receipt_date: recette.dateReception || new Date().toISOString().split('T')[0] // dateReception -> receipt_date (correction)
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
        libelle: data.description || '', // description -> libelle (correction)
        description: data.description || '',
        montant: parseFloat(data.amount || 0), // amount -> montant (correction)
        soldeDisponible: parseFloat(data.amount || 0), // amount -> soldeDisponible (correction)
        source: '', // Colonne n'existe pas dans la nouvelle structure
        periodicite: 'unique', // Colonne n'existe pas dans la nouvelle structure
        dateReception: data.receipt_date, // receipt_date -> dateReception (correction)
        categorie: '', // Colonne n'existe pas dans la nouvelle structure
        statut: 'reçue', // Colonne n'existe pas dans la nouvelle structure
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
      if (updates.libelle !== undefined) updateData.description = updates.libelle // libelle -> description (correction)
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.montant !== undefined) updateData.amount = updates.montant // montant -> amount (correction)
      if (updates.dateReception !== undefined) updateData.receipt_date = updates.dateReception // dateReception -> receipt_date (correction)

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
        libelle: data.description || '', // description -> libelle (correction)
        description: data.description || '',
        montant: parseFloat(data.amount || 0), // amount -> montant (correction)
        soldeDisponible: parseFloat(data.amount || 0), // amount -> soldeDisponible (correction)
        source: '', // Colonne n'existe pas dans la nouvelle structure
        periodicite: 'unique', // Colonne n'existe pas dans la nouvelle structure
        dateReception: data.receipt_date, // receipt_date -> dateReception (correction)
        categorie: '', // Colonne n'existe pas dans la nouvelle structure
        statut: 'reçue', // Colonne n'existe pas dans la nouvelle structure
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
          const startTime = performance.now()
          console.log('⏱️ [1/4] Début création dépense...')
          
          const authStart = performance.now()
          const { data: { user }, error: authError } = await supabase.auth.getUser()
          const authTime = Math.round(performance.now() - authStart)
          
          if (authTime > 5000) {
            console.error('🚨 PROBLÈME AUTH: L\'authentification a pris plus de 5 secondes!')
          }
          
          if (authError) {
            console.error('❌ Erreur d\'authentification:', authError)
            throw new Error("Erreur d'authentification: " + authError.message)
          }
          
          if (!user) {
            console.error('❌ Utilisateur non authentifié')
            throw new Error("Utilisateur non authentifié")
          }
          
          console.log(`⏱️ [2/4] Auth OK (${authTime}ms)`)

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
      
          console.log(`⏱️ [3/4] Insertion dans Supabase...`)
          console.log('📦 Données à insérer:', insertData)
          const insertStart = performance.now()
          
          // Test simple sans mise à jour du solde
          console.log('🧪 Test d\'insertion simple sans mise à jour du solde...')
          
          const { data, error } = await supabase
            .from('depenses_test')  // Utiliser la table de test sans triggers
            .insert(insertData)
            .select()
            .single()
          
          const insertTime = Math.round(performance.now() - insertStart)
          const totalTime = Math.round(performance.now() - startTime)
          
          console.log(`⏱️ [4/4] Insertion terminée en ${insertTime}ms`)
          console.log(`⏱️ 🎯 TOTAL: ${totalTime}ms`)
          
          if (insertTime > 5000) {
            console.error('🚨 PROBLÈME INSERTION: L\'insertion a pris plus de 5 secondes!')
            console.error('💡 Cause probable: Problème réseau ou configuration Supabase')
          } else if (insertTime > 2000) {
            console.warn('⚠️ L\'insertion est lente (>2s) mais acceptable')
          } else {
            console.log('✅ Insertion rapide!')
          }

      if (error) {
        console.error('❌ Erreur création dépense:', error.message)
        throw error
      }
      
      // Mapper les données pour le format de l'application
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
      console.error('❌ Erreur createDepense:', error)
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
      const deleteStart = performance.now()
      console.log('⏱️ [DELETE] Début suppression dépense', id)
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        return false
      }
      console.log(`⏱️ [DELETE] Auth OK (${Math.round(performance.now() - deleteStart)}ms)`)

      // 1. Récupérer les informations de la dépense pour supprimer le reçu
      const fetchStart = performance.now()
      const { data: depense, error: fetchError } = await supabase
        .from('depenses')
        .select('receipt_url')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()
      console.log(`⏱️ [DELETE] Fetch info (${Math.round(performance.now() - fetchStart)}ms)`)

      if (fetchError) {
        console.error('❌ Erreur lors de la récupération de la dépense:', fetchError)
        return false
      }

      // 2. Supprimer le fichier reçu du stockage si il existe
      if (depense?.receipt_url) {
        const storageStart = performance.now()
        try {
          const urlParts = depense.receipt_url.split('/')
          const fileName = urlParts[urlParts.length - 1]
          const filePath = `${user.id}/${fileName}`
          
          const { error: storageError } = await supabase.storage
            .from('receipts')
            .remove([filePath])

          console.log(`⏱️ [DELETE] Suppression fichier (${Math.round(performance.now() - storageStart)}ms)`)
          
          if (storageError) {
            console.warn('⚠️ Erreur suppression fichier (continué):', storageError)
          }
        } catch (storageError) {
          console.warn('⚠️ Erreur suppression fichier:', storageError)
        }
      }

      // 3. Supprimer l'enregistrement de la dépense
      console.log('⏱️ [DELETE] Suppression en BDD...')
      const dbDeleteStart = performance.now()
      
      const { error } = await supabase
        .from('depenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      
      const dbDeleteTime = Math.round(performance.now() - dbDeleteStart)
      const totalTime = Math.round(performance.now() - deleteStart)
      
      console.log(`⏱️ [DELETE] Suppression BDD terminée en ${dbDeleteTime}ms`)
      console.log(`⏱️ [DELETE] 🎯 TOTAL: ${totalTime}ms`)
      
      if (dbDeleteTime > 5000) {
        console.error('🚨 PROBLÈME: La suppression BDD a pris plus de 5 secondes!')
        console.error('💡 Cause probable: Trigger en base de données')
      }

      if (error) {
        console.error('❌ Erreur lors de la suppression de la dépense:', error)
        return false
      }

      console.log('✅ Dépense supprimée avec succès')
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
