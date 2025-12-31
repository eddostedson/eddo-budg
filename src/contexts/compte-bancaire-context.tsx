'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { CompteBancaire, TransactionBancaire } from '@/lib/shared-data'
import { createClient } from '@/lib/supabase/browser'
import { notifySuccess, notifyError, notifyCreated, notifyUpdated, notifyDeleted } from '@/lib/notify'

const supabase = createClient()

interface CompteBancaireContextType {
  comptes: CompteBancaire[]
  transactions: TransactionBancaire[]
  loading: boolean
  refreshComptes: () => Promise<void>
  refreshTransactions: (compteId?: string) => Promise<void>
  createCompte: (compte: Omit<CompteBancaire, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>
  updateCompte: (id: string, updates: Partial<CompteBancaire>) => Promise<boolean>
  bulkSetExcludeFromTotal: (ids: string[], exclude: boolean) => Promise<boolean>
  deleteCompte: (id: string) => Promise<boolean>
  crediterCompte: (compteId: string, montant: number, libelle: string, description?: string, reference?: string, categorie?: string, dateTransaction?: string) => Promise<string | null>
  debiterCompte: (compteId: string, montant: number, libelle: string, description?: string, reference?: string, categorie?: string, dateTransaction?: string, receiptUrl?: string, receiptFileName?: string) => Promise<boolean>
  getTransactionsByCompte: (compteId: string) => TransactionBancaire[]
  getTotalSoldes: () => number
  initializeDefaultComptes: () => Promise<boolean>
  deleteTransaction: (transactionId: string) => Promise<boolean>
  updateTransaction: (transactionId: string, updates: Partial<TransactionBancaire>) => Promise<boolean>
  transfererEntreComptes: (compteSourceId: string, compteDestinationId: string, montant: number, description?: string, dateTransaction?: string) => Promise<{ success: boolean; creditTransactionId?: string }>
}

const CompteBancaireContext = createContext<CompteBancaireContextType | undefined>(undefined)

export const useComptesBancaires = () => {
  const context = useContext(CompteBancaireContext)
  if (!context) {
    throw new Error('useComptesBancaires must be used within a CompteBancaireProvider')
  }
  return context
}

export const CompteBancaireProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [comptes, setComptes] = useState<CompteBancaire[]>([])
  const [transactions, setTransactions] = useState<TransactionBancaire[]>([])
  const [loading, setLoading] = useState(true)

  // 🔄 RECHARGER LES COMPTES
  const refreshComptes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setComptes([])
        return
      }

      const { data, error } = await supabase
        .from('comptes_bancaires')
        .select('*')
        .eq('user_id', user.id)
        .eq('actif', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erreur lors du chargement des comptes:', error)
        setComptes([])
        return
      }

      const mappedComptes = (data || []).map(compte => ({
        id: compte.id,
        userId: compte.user_id,
        nom: compte.nom,
        numeroCompte: compte.numero_compte,
        banque: compte.banque,
        typeCompte: compte.type_compte as 'courant' | 'epargne' | 'entreprise' | 'operationnel',
        typePortefeuille: (compte.type_portefeuille || 'compte_bancaire') as 'compte_bancaire' | 'mobile_money' | 'especes' | 'autre',
        soldeInitial: parseFloat(compte.solde_initial || 0),
        soldeActuel: parseFloat(compte.solde_actuel || 0),
        excludeFromTotal: compte.exclude_from_total === true,
        devise: compte.devise || 'F CFA',
        actif: compte.actif !== false,
        createdAt: compte.created_at,
        updatedAt: compte.updated_at
      }))

      setComptes(mappedComptes)
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      setComptes([])
    }
  }

  // Fonction utilitaire pour retry avec gestion d'erreurs réseau
  const retryWithBackoff = async <T,>(
    fn: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> => {
    let lastError: any
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error: any) {
        lastError = error
        const isNetworkError = 
          error?.message?.includes('Failed to fetch') ||
          error?.message?.includes('NetworkError') ||
          error?.message?.includes('Network request failed') ||
          error?.code === 'ECONNREFUSED' ||
          error?.code === 'ETIMEDOUT'
        
        if (isNetworkError && i < maxRetries - 1) {
          const waitTime = delay * Math.pow(2, i) // Exponential backoff
          console.warn(`⚠️ Erreur réseau détectée, nouvelle tentative dans ${waitTime}ms... (${i + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
        throw error
      }
    }
    throw lastError
  }

  // 🔄 RECHARGER LES TRANSACTIONS
  const refreshTransactions = async (compteId?: string) => {
    try {
      // Vérifier la configuration Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Configuration Supabase manquante')
        notifyError('Configuration Supabase manquante. Vérifiez vos variables d\'environnement.')
        return
      }

      // Vérifier l'authentification avec retry
      const { data: { user }, error: authError } = await retryWithBackoff(
        () => supabase.auth.getUser(),
        2,
        500
      ).catch(async (error) => {
        // Si l'authentification échoue, essayer de récupérer la session
        console.warn('⚠️ Erreur getUser, tentative avec getSession...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session?.user) {
          throw error
        }
        return { data: { user: session.user }, error: null }
      })
      
      if (authError) {
        const isNetworkError = authError.message?.includes('Failed to fetch')
        console.error('❌ Erreur d\'authentification:', authError)
        
        if (isNetworkError) {
          notifyError('Erreur de connexion réseau. Vérifiez votre connexion internet.')
        } else {
          notifyError('Erreur d\'authentification. Veuillez vous reconnecter.')
        }
        setTransactions([])
        return
      }
      
      if (!user) {
        console.warn('⚠️ Aucun utilisateur authentifié')
        setTransactions([])
        return
      }

      console.log('🔄 Chargement des transactions pour l\'utilisateur:', user.id, compteId ? `(compte: ${compteId})` : '(tous les comptes)')

      // Construire la requête avec retry
      const { data, error } = await retryWithBackoff(async () => {
        let query = supabase
          .from('transactions_bancaires')
          .select('*')
          .eq('user_id', user.id)
          .order('date_transaction', { ascending: false })

        if (compteId) {
          query = query.eq('compte_id', compteId)
        }

        const result = await query
        return result
      }, 3, 1000)
      
      console.log('📊 Résultat de la requête:', { 
        dataCount: data?.length || 0, 
        hasError: !!error,
        error: error 
      })

      if (error) {
        // Extraire les informations d'erreur de manière robuste
        let errorMessage = 'Erreur inconnue'
        let errorCode = 'UNKNOWN'
        let errorDetails: any = null
        let errorHint: string | null = null
        
        // Essayer d'extraire le message de différentes façons
        if (error && typeof error === 'object') {
          // Vérifier si c'est une erreur "Failed to fetch" qui peut être vide
          const errorStr = String(error)
          if (errorStr === '[object Object]' || errorStr === '{}') {
            // L'erreur est vide, probablement une erreur réseau
            errorMessage = 'Failed to fetch'
            errorCode = 'NETWORK_ERROR'
          } else {
            errorMessage = (error as any)?.message || 
                          (error as any)?.error?.message || 
                          (error as any)?.name ||
                          errorStr || 
                          'Erreur inconnue'
            errorCode = (error as any)?.code || 
                       (error as any)?.error?.code || 
                       (error as any)?.status || 
                       'UNKNOWN'
            errorDetails = (error as any)?.details || 
                          (error as any)?.error?.details || 
                          null
            errorHint = (error as any)?.hint || 
                       (error as any)?.error?.hint || 
                       null
          }
        } else if (error) {
          errorMessage = String(error)
        }
        
        // Détecter les erreurs réseau spécifiques
        const isNetworkError = 
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('NetworkError') ||
          errorMessage.includes('Network request failed') ||
          errorMessage.includes('ECONNREFUSED') ||
          errorMessage.includes('ETIMEDOUT') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('aborted') ||
          errorMessage.includes('AbortError') ||
          errorCode === 'NETWORK_ERROR'
        
        // Log détaillé avec toutes les informations disponibles
        const errorInfo: any = {
          message: errorMessage,
          code: errorCode,
          isNetworkError,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name || 'Unknown'
        }
        
        if (errorDetails) errorInfo.details = errorDetails
        if (errorHint) errorInfo.hint = errorHint
        
        // Essayer de stringifier l'erreur complète pour le debug
        try {
          errorInfo.rawErrorString = JSON.stringify(error, Object.getOwnPropertyNames(error))
        } catch (e) {
          errorInfo.rawErrorString = 'Impossible de stringifier l\'erreur'
        }
        
        // Log seulement si on a des informations utiles ou si c'est une erreur réseau
        if (isNetworkError || errorMessage !== 'Erreur inconnue' || errorCode !== 'UNKNOWN' || errorDetails || errorHint) {
          console.error('❌ Erreur lors du chargement des transactions:', errorInfo)
        } else {
          console.error('❌ Erreur lors du chargement des transactions (erreur vide):', error)
        }
        
        // Message d'erreur adapté selon le type
        if (isNetworkError) {
          notifyError('Erreur de connexion réseau. Vérifiez votre connexion internet et réessayez.')
        } else {
          const displayMessage = errorMessage !== 'Erreur inconnue' 
            ? errorMessage 
            : errorCode !== 'UNKNOWN' 
              ? `Erreur ${errorCode}` 
              : 'Erreur inconnue lors du chargement'
          notifyError(`Erreur lors du chargement des transactions: ${displayMessage}`)
        }
        
        // Ne pas vider les transactions existantes pour éviter un écran vide
        return
      }

      const mappedTransactions = (data || []).map(transaction => ({
        id: transaction.id,
        userId: transaction.user_id,
        compteId: transaction.compte_id,
        typeTransaction: transaction.type_transaction as 'credit' | 'debit',
        montant: parseFloat(transaction.montant || 0),
        soldeAvant: parseFloat(transaction.solde_avant || 0),
        soldeApres: parseFloat(transaction.solde_apres || 0),
        libelle: transaction.libelle,
        description: transaction.description,
        reference: transaction.reference,
        categorie: transaction.categorie,
        dateTransaction: transaction.date_transaction,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
        receiptUrl: transaction.receipt_url || undefined,
        receiptFileName: transaction.receipt_file_name || undefined
      }))

      setTransactions(mappedTransactions)
    } catch (error) {
      // Gérer les erreurs inattendues (exceptions JavaScript)
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      
      // Détecter les erreurs réseau
      const isNetworkError = 
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('Network request failed') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('ETIMEDOUT') ||
        (error as any)?.code === 'ECONNREFUSED' ||
        (error as any)?.code === 'ETIMEDOUT'
      
      console.error('❌ Erreur inattendue lors du chargement des transactions:', {
        message: errorMessage,
        isNetworkError,
        stack: errorStack,
        error: error,
        errorType: typeof error,
        errorString: JSON.stringify(error, Object.getOwnPropertyNames(error))
      })
      
      // Message d'erreur adapté selon le type
      if (isNetworkError) {
        notifyError('Erreur de connexion réseau. Vérifiez votre connexion internet et réessayez.')
      } else {
        notifyError(`Erreur inattendue: ${errorMessage}`)
      }
      // Ne pas vider les transactions pour éviter un écran vide
      // setTransactions([]) - commenté pour préserver l'état existant
    }
  }

  // ➕ CRÉER UN COMPTE
  const createCompte = async (compte: Omit<CompteBancaire, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        notifyError('Erreur d\'authentification')
        return false
      }

      // Préparer les données à insérer (ne pas inclure undefined)
      const insertData: Record<string, any> = {
        user_id: user.id,
        nom: compte.nom,
        type_compte: compte.typeCompte,
        type_portefeuille: compte.typePortefeuille || 'compte_bancaire',
        solde_initial: parseFloat(compte.soldeInitial.toString()),
        solde_actuel: parseFloat(compte.soldeInitial.toString()), // Le solde actuel commence au solde initial
        exclude_from_total: compte.excludeFromTotal === true,
        devise: compte.devise || 'F CFA',
        actif: compte.actif !== false
      }

      // Ajouter les champs optionnels seulement s'ils existent
      if (compte.numeroCompte) {
        insertData.numero_compte = compte.numeroCompte
      }
      if (compte.banque) {
        insertData.banque = compte.banque
      }

      console.log('📝 Données à insérer:', insertData)

      const { data, error } = await supabase
        .from('comptes_bancaires')
        .insert(insertData)
        .select()

      if (error) {
        console.error('❌ Erreur lors de la création du compte:', error)
        notifyError(`Erreur lors de la création du compte: ${error.message || 'Erreur inconnue'}`)
        return false
      }

      console.log('✅ Compte créé avec succès:', data)
      notifyCreated('Compte bancaire')
      await refreshComptes()
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      notifyError('Erreur inattendue lors de la création')
      return false
    }
  }

  // ✏️ MODIFIER UN COMPTE
  const updateCompte = async (id: string, updates: Partial<CompteBancaire>): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        notifyError('Erreur d\'authentification')
        return false
      }

      const updateData: Record<string, any> = {}
      if (updates.nom !== undefined) updateData.nom = updates.nom
      if (updates.numeroCompte !== undefined) updateData.numero_compte = updates.numeroCompte
      if (updates.banque !== undefined) updateData.banque = updates.banque
      if (updates.typeCompte !== undefined) updateData.type_compte = updates.typeCompte
      if (updates.typePortefeuille !== undefined) updateData.type_portefeuille = updates.typePortefeuille
      if (updates.excludeFromTotal !== undefined) updateData.exclude_from_total = updates.excludeFromTotal
      if (updates.devise !== undefined) updateData.devise = updates.devise
      if (updates.actif !== undefined) updateData.actif = updates.actif

      // ✅ Optimistic UI: appliquer immédiatement certains champs (ex: exclude_from_total)
      // pour éviter la latence réseau au clic.
      const hadExcludeToggle = Object.prototype.hasOwnProperty.call(updateData, 'exclude_from_total')
      const prevCompteSnapshot = hadExcludeToggle ? comptes.find((c) => c.id === id) : undefined
      if (hadExcludeToggle) {
        const nextValue = updateData.exclude_from_total === true
        setComptes((prev) => prev.map((c) => (c.id === id ? { ...c, excludeFromTotal: nextValue } : c)))

      }

      const { error } = await supabase
        .from('comptes_bancaires')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Erreur lors de la modification du compte:', error)

        const code = (error as any)?.code
        const message = (error as any)?.message as string | undefined

        // Cas spécifique Supabase/PostgREST: colonne ajoutée mais schema cache pas rechargé
        if (
          code === 'PGRST204' &&
          Object.prototype.hasOwnProperty.call(updateData, 'exclude_from_total')
        ) {
          notifyError(
            "La colonne 'exclude_from_total' n'est pas encore disponible côté API (schema cache). " +
              "Dans Supabase SQL Editor, exécute: select pg_notify('pgrst','reload schema'); puis recharge la page."
          )
        } else {
          notifyError(`Erreur lors de la modification du compte${message ? `: ${message}` : ''}`)
        }

        // (log retiré pour performance)

        // rollback optimistic
        if (hadExcludeToggle && prevCompteSnapshot) {
          setComptes((prev) => prev.map((c) => (c.id === id ? prevCompteSnapshot : c)))
        }
        return false
      }

      // (vérification DB debug retirée pour performance)

      const isOnlyExcludeToggle =
        Object.keys(updateData).length === 1 && Object.prototype.hasOwnProperty.call(updateData, 'exclude_from_total')

      if (!isOnlyExcludeToggle) {
        notifyUpdated('Compte bancaire')
      }

      // 🔄 Pour un simple toggle, on rafraîchit en arrière-plan (l'UI est déjà à jour via optimistic)
      if (isOnlyExcludeToggle) {
        void refreshComptes().catch((e) => {
          console.error('❌ refreshComptes async after exclude toggle:', e)
        })
      } else {
        await refreshComptes()
      }
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      notifyError('Erreur inattendue lors de la modification')
      return false
    }
  }

  // ✅ Mise à jour en masse pour migrer depuis le localStorage (et éviter N requêtes)
  const bulkSetExcludeFromTotal = async (ids: string[], exclude: boolean): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        notifyError("Erreur d'authentification")
        return false
      }

      const cleanIds = Array.from(new Set(ids)).filter(Boolean)
      if (cleanIds.length === 0) return true

      const { error } = await supabase
        .from('comptes_bancaires')
        .update({ exclude_from_total: exclude })
        .in('id', cleanIds)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Erreur bulk exclude_from_total:', error)
        notifyError("Erreur lors de la mise à jour des exclusions")
        return false
      }

      await refreshComptes()
      return true
    } catch (e) {
      console.error('❌ Erreur bulk exclude_from_total (exception):', e)
      notifyError("Erreur inattendue lors de la mise à jour des exclusions")
      return false
    }
  }

  // 🗑️ SUPPRIMER UN COMPTE (soft delete) avec UNDO
  const deleteCompte = async (id: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        notifyError('Erreur d\'authentification')
        return false
      }

      // Sauvegarder les données du compte pour l'UNDO
      const compteToDelete = comptes.find(c => c.id === id)
      if (!compteToDelete) {
        notifyError('Compte non trouvé')
        return false
      }

      const { error } = await supabase
        .from('comptes_bancaires')
        .update({ actif: false })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Erreur lors de la suppression du compte:', error)
        notifyError('Erreur lors de la suppression du compte')
        return false
      }

      // Notification avec UNDO
      notifyDeleted('Compte bancaire', async () => {
        // Restaurer le compte
        const { error: restoreError } = await supabase
          .from('comptes_bancaires')
          .update({ actif: true })
          .eq('id', id)
          .eq('user_id', user.id)

        if (!restoreError) {
          await refreshComptes()
        }
      })

      await refreshComptes()
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      notifyError('Erreur inattendue lors de la suppression')
      return false
    }
  }

  // 💰 CRÉDITER UN COMPTE (Ajouter de l'argent)
  const crediterCompte = async (
    compteId: string,
    montant: number,
    libelle: string,
    description?: string,
    reference?: string,
    categorie?: string,
    dateTransaction?: string
  ): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        notifyError('Erreur d\'authentification')
        return false
      }

      if (montant <= 0) {
        notifyError('Le montant doit être supérieur à 0')
        return false
      }

      // Récupérer le solde actuel du compte
      const { data: compteData } = await supabase
        .from('comptes_bancaires')
        .select('solde_actuel')
        .eq('id', compteId)
        .eq('user_id', user.id)
        .single()

      if (!compteData) {
        notifyError('Compte non trouvé')
        return false
      }

      const soldeAvant = parseFloat(compteData.solde_actuel || 0)
      const soldeApres = soldeAvant + montant
      const dateOp = dateTransaction || new Date().toISOString()

      // Créer la transaction
      const { data: transactionData, error } = await supabase
        .from('transactions_bancaires')
        .insert({
          user_id: user.id,
          compte_id: compteId,
          type_transaction: 'credit',
          montant: montant,
          solde_avant: soldeAvant,
          solde_apres: soldeApres,
          libelle: libelle,
          description: description,
          reference: reference,
          categorie: categorie,
          date_transaction: dateOp
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur lors du crédit:', error)
        notifyError('Erreur lors du crédit')
        return null
      }

      notifySuccess(`${montant.toLocaleString()} F CFA crédités avec succès !`, '✅ Crédit effectué')
      return transactionData?.id || null
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      notifyError('Erreur inattendue')
      return null
    }
  }

  // 💸 DÉBITER UN COMPTE (Retirer de l'argent)
  const debiterCompte = async (
    compteId: string,
    montant: number,
    libelle: string,
    description?: string,
    reference?: string,
    categorie?: string,
    dateTransaction?: string,
    receiptUrl?: string,
    receiptFileName?: string
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        notifyError('Erreur d\'authentification')
        return false
      }

      if (montant <= 0) {
        notifyError('Le montant doit être supérieur à 0')
        return false
      }

      // Récupérer le solde actuel du compte
      const { data: compteData } = await supabase
        .from('comptes_bancaires')
        .select('solde_actuel')
        .eq('id', compteId)
        .eq('user_id', user.id)
        .single()

      if (!compteData) {
        notifyError('Compte non trouvé')
        return false
      }

      const soldeAvant = parseFloat(compteData.solde_actuel || 0)

      if (soldeAvant < montant) {
        notifyError(`Solde insuffisant. Solde disponible: ${soldeAvant.toLocaleString()} F CFA`)
        return false
      }

      const soldeApres = soldeAvant - montant
      const dateOp = dateTransaction || new Date().toISOString()

      // Préparer les données de la transaction
      const transactionData: any = {
        user_id: user.id,
        compte_id: compteId,
        type_transaction: 'debit',
        montant: montant,
        solde_avant: soldeAvant,
        solde_apres: soldeApres,
        libelle: libelle,
        description: description,
        reference: reference,
        categorie: categorie,
        date_transaction: dateOp
      }

      // Ajouter les champs receipt si fournis
      if (receiptUrl) transactionData.receipt_url = receiptUrl
      if (receiptFileName) transactionData.receipt_file_name = receiptFileName

      // Créer la transaction
      const { error } = await supabase
        .from('transactions_bancaires')
        .insert(transactionData)

      if (error) {
        console.error('❌ Erreur lors du débit:', error)
        notifyError('Erreur lors du débit')
        return false
      }

      notifySuccess(`${montant.toLocaleString()} F CFA débités avec succès !`, '✅ Débit effectué')
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      notifyError('Erreur inattendue')
      return false
    }
  }

  // 📊 RÉCUPÉRER LES TRANSACTIONS D'UN COMPTE
  const getTransactionsByCompte = (compteId: string): TransactionBancaire[] => {
    return transactions.filter(t => t.compteId === compteId)
  }

  // 💵 CALCULER LE TOTAL DES SOLDES
  const getTotalSoldes = (): number => {
    return comptes.reduce((total, compte) => total + compte.soldeActuel, 0)
  }

  // 🔄 TRANSFÉRER ENTRE COMPTES (Sans générer de reçu)
  const transfererEntreComptes = async (
    compteSourceId: string,
    compteDestinationId: string,
    montant: number,
    description?: string,
    dateTransaction?: string
  ): Promise<{ success: boolean; creditTransactionId?: string }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        notifyError('Erreur d\'authentification')
        return false
      }

      if (montant <= 0) {
        notifyError('Le montant doit être supérieur à 0')
        return { success: false }
      }

      if (compteSourceId === compteDestinationId) {
        notifyError('Vous ne pouvez pas transférer vers le même compte')
        return { success: false }
      }

      // Récupérer les comptes
      const compteSource = comptes.find(c => c.id === compteSourceId)
      const compteDestination = comptes.find(c => c.id === compteDestinationId)

      if (!compteSource || !compteDestination) {
        notifyError('Compte source ou destination introuvable')
        return { success: false }
      }

      const soldeSource = compteSource.soldeActuel
      if (soldeSource < montant) {
        notifyError(`Solde insuffisant. Solde disponible: ${soldeSource.toLocaleString()} F CFA`)
        return { success: false }
      }

      const dateOp = dateTransaction || new Date().toISOString()
      const libelleTransfert = `Transfert vers ${compteDestination.nom}`
      const libelleReception = `Transfert depuis ${compteSource.nom}`

      // 1. Débiter le compte source
      const soldeSourceAvant = soldeSource
      const soldeSourceApres = soldeSourceAvant - montant

      const { error: debitError } = await supabase
        .from('transactions_bancaires')
        .insert({
          user_id: user.id,
          compte_id: compteSourceId,
          type_transaction: 'debit',
          montant: montant,
          solde_avant: soldeSourceAvant,
          solde_apres: soldeSourceApres,
          libelle: libelleTransfert,
          description: description || `Transfert vers ${compteDestination.nom}`,
          categorie: 'Transfert',
          date_transaction: dateOp
        })

      if (debitError) {
        console.error('❌ Erreur lors du débit:', debitError)
        notifyError('Erreur lors du débit du compte source')
        return { success: false }
      }

      // 2. Créditer le compte destination
      const soldeDestAvant = compteDestination.soldeActuel
      const soldeDestApres = soldeDestAvant + montant

      const { data: creditData, error: creditError } = await supabase
        .from('transactions_bancaires')
        .insert({
          user_id: user.id,
          compte_id: compteDestinationId,
          type_transaction: 'credit',
          montant: montant,
          solde_avant: soldeDestAvant,
          solde_apres: soldeDestApres,
          libelle: libelleReception,
          description: description || `Transfert depuis ${compteSource.nom}`,
          categorie: 'Transfert',
          date_transaction: dateOp
        })
        .select()
        .single()

      if (creditError) {
        console.error('❌ Erreur lors du crédit:', creditError)
        notifyError('Erreur lors du crédit du compte destination')
        // Essayer de compenser le débit (rollback)
        return { success: false }
      }

      // 3. Rafraîchir les comptes
      await refreshComptes()

      notifySuccess(`Transfert de ${montant.toLocaleString()} F CFA effectué avec succès !`, '✅ Transfert réussi')
      return { success: true, creditTransactionId: creditData?.id }
    } catch (error) {
      console.error('❌ Erreur inattendue lors du transfert:', error)
      notifyError('Erreur inattendue lors du transfert')
      return { success: false }
    }
  }

  // 🔁 Recalculer le solde d'un compte + les soldes avant/après de CHAQUE transaction
  const recalculateCompteSolde = async (compteId: string, userId: string): Promise<boolean> => {
    const __agentStart = Date.now()

    // 🚀 Chemin rapide (SQL set-based) via RPC si disponible.
    // Important: on garde le fallback JS si la fonction n'est pas encore déployée.
    try {
      const { error: rpcError } = await supabase.rpc('recalculate_compte_solde', {
        p_compte_id: compteId
      })

      if (!rpcError) {
        return true
      }

    } catch (e) {
    }

    // 1. Charger le solde initial du compte
    const { data: compteRow, error: compteError } = await supabase
      .from('comptes_bancaires')
      .select('solde_initial')
      .eq('id', compteId)
      .eq('user_id', userId)
      .single()

    if (compteError || !compteRow) {
      console.error('❌ Erreur lors du chargement du compte pour recalcul des soldes:', compteError)
      notifyError('Erreur lors du recalcul des soldes du compte')
      return false
    }

    // 2. Charger toutes les transactions du compte dans l'ordre chronologique
    const { data: txRows, error: txError } = await supabase
      .from('transactions_bancaires')
      .select('id, type_transaction, montant')
      .eq('user_id', userId)
      .eq('compte_id', compteId)
      .order('date_transaction', { ascending: true })

    if (txError) {
      console.error('❌ Erreur lors du chargement des transactions pour recalcul:', txError)
      notifyError('Erreur lors du recalcul des transactions')
      return false
    }


    // 3. Recalculer les soldes avant/après pour chaque transaction + le solde final du compte
    let currentSolde = parseFloat(compteRow.solde_initial || 0)

    for (const tx of txRows || []) {
      const montant = parseFloat(tx.montant || 0)
      const soldeAvant = currentSolde
      const soldeApres =
        tx.type_transaction === 'credit'
          ? soldeAvant + montant
          : soldeAvant - montant

      currentSolde = soldeApres

      const { error: updateTxError } = await supabase
        .from('transactions_bancaires')
        .update({
          solde_avant: soldeAvant,
          solde_apres: soldeApres
        })
        .eq('id', tx.id)
        .eq('user_id', userId)

      if (updateTxError) {
        console.error('❌ Erreur lors de la mise à jour des soldes de transaction:', updateTxError)
        notifyError('Erreur lors du recalcul des soldes des transactions')
        return false
      }
    }

    // 4. Mettre à jour le solde actuel du compte avec le solde final recalculé
    const { error: updateCompteError } = await supabase
      .from('comptes_bancaires')
      .update({ solde_actuel: currentSolde })
      .eq('id', compteId)
      .eq('user_id', userId)

    if (updateCompteError) {
      console.error('❌ Erreur lors de la mise à jour du solde du compte:', updateCompteError)
      notifyError('Erreur lors de la mise à jour du solde du compte')
      return false
    }

    return true
  }

  // 🗑️ SUPPRIMER UNE TRANSACTION avec UNDO
  const deleteTransaction = async (transactionId: string): Promise<boolean> => {
    try {
      const __agentStart = Date.now()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        notifyError('Erreur d\'authentification')
        return false
      }

      // 1) Supprimer la transaction en récupérant la ligne supprimée
      // => 1 seule requête au lieu de (select + delete)
      const { data: deletedTx, error: deleteError } = await supabase
        .from('transactions_bancaires')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', user.id)
        .select('*')
        .single()

      if (deleteError || !deletedTx) {
        console.error('❌ Erreur lors de la suppression de la transaction:', deleteError)
        notifyError('Erreur lors de la suppression de la transaction')
        return false
      }

      const compteId = deletedTx.compte_id as string
      const transactionData = { ...deletedTx }

      // Optimistic UI: mettre à jour le solde local + retirer la transaction immédiatement
      // (le recalcul RPC + refresh remettront l'état exact ensuite)
      const montant = typeof deletedTx.montant === 'number' ? deletedTx.montant : parseFloat(deletedTx.montant || 0)
      const delta = deletedTx.type_transaction === 'credit' ? -montant : montant

      setComptes((prev) =>
        prev.map((c) => (c.id === compteId ? { ...c, soldeActuel: (c.soldeActuel || 0) + delta } : c))
      )
      setTransactions((prev) => prev.filter((t) => t.id !== transactionId))


      // 3. Recalculer le solde du compte
      const ok = await recalculateCompteSolde(compteId, user.id)
      if (!ok) {
        return false
      }

      // Notification avec UNDO
      notifyDeleted('Transaction', async () => {
        // Restaurer la transaction
        const { error: restoreError } = await supabase
          .from('transactions_bancaires')
          .insert(transactionData)

        if (!restoreError) {
          await recalculateCompteSolde(compteId, user.id)
          await Promise.all([refreshComptes(), refreshTransactions(compteId)])
        }
      })

      await Promise.all([refreshComptes(), refreshTransactions(compteId)])
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue lors de la suppression de la transaction:', error)
      notifyError('Erreur inattendue lors de la suppression de la transaction')
      return false
    }
  }

  // ✏️ MODIFIER UNE TRANSACTION (libellé / description / catégorie / date / montant)
  const updateTransaction = async (transactionId: string, updates: Partial<TransactionBancaire>): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        notifyError('Erreur d\'authentification')
        return false
      }

      // 1. Charger la transaction pour récupérer le compte associé
      const { data: existingTx, error: fetchError } = await supabase
        .from('transactions_bancaires')
        .select('id, compte_id')
        .eq('id', transactionId)
        .eq('user_id', user.id)
        .single()

      if (fetchError || !existingTx) {
        console.error('❌ Erreur lors du chargement de la transaction à modifier:', fetchError)
        notifyError('Transaction introuvable')
        return false
      }

      const compteId = existingTx.compte_id as string

      const payload: Record<string, any> = {}
      if (updates.libelle !== undefined) payload.libelle = updates.libelle
      if (updates.description !== undefined) payload.description = updates.description
      if (updates.categorie !== undefined) payload.categorie = updates.categorie
      if (updates.dateTransaction !== undefined) payload.date_transaction = updates.dateTransaction
      if (updates.montant !== undefined) payload.montant = updates.montant
      if (updates.receiptUrl !== undefined) payload.receipt_url = updates.receiptUrl
      if (updates.receiptFileName !== undefined) payload.receipt_file_name = updates.receiptFileName

      if (Object.keys(payload).length === 0) {
        return true
      }

      const { error } = await supabase
        .from('transactions_bancaires')
        .update(payload)
        .eq('id', transactionId)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Erreur lors de la modification de la transaction:', error)
        notifyError('Erreur lors de la modification de la transaction')
        return false
      }

      const needsRecalc = updates.montant !== undefined || updates.dateTransaction !== undefined

      // 🔄 Lancer le recalcul / rafraîchissement en arrière-plan pour que l'UI reste fluide
      if (needsRecalc) {
        void recalculateCompteSolde(compteId, user.id)
          .then((ok) => {
            if (!ok) return
            return Promise.all([refreshComptes(), refreshTransactions(compteId)])
          })
          .catch((err) => {
            console.error('❌ Erreur lors du recalcul asynchrone des soldes:', err)
          })
      } else {
        void refreshTransactions(compteId).catch((err) => {
          console.error('❌ Erreur lors du rafraîchissement asynchrone des transactions:', err)
        })
      }

      notifyUpdated('Transaction')
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue lors de la modification de la transaction:', error)
      notifyError('Erreur inattendue lors de la modification de la transaction')
      return false
    }
  }

  // 🏦 INITIALISER 3 COMPTES PAR DÉFAUT
  const initializeDefaultComptes = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        notifyError('Erreur d\'authentification')
        return false
      }

      // Vérifier si des comptes existent déjà
      const { data: existingComptes } = await supabase
        .from('comptes_bancaires')
        .select('id')
        .eq('user_id', user.id)
        .eq('actif', true)

      if (existingComptes && existingComptes.length > 0) {
        notifyInfo('Des comptes bancaires existent déjà')
        return false
      }

      // Créer les 3 comptes par défaut
      const comptesDefaut = [
        {
          user_id: user.id,
          nom: 'Compte Principal',
          numero_compte: '001-123456-78',
          banque: 'BSIC',
          type_compte: 'courant',
          solde_initial: 1000000,
          solde_actuel: 1000000,
          devise: 'F CFA',
          actif: true
        },
        {
          user_id: user.id,
          nom: 'Compte Épargne',
          numero_compte: '002-234567-89',
          banque: 'BSIC',
          type_compte: 'epargne',
          solde_initial: 500000,
          solde_actuel: 500000,
          devise: 'F CFA',
          actif: true
        },
        {
          user_id: user.id,
          nom: 'Compte Entreprise',
          numero_compte: '003-345678-90',
          banque: 'BSIC',
          type_compte: 'entreprise',
          solde_initial: 2000000,
          solde_actuel: 2000000,
          devise: 'F CFA',
          actif: true
        }
      ]

      const { error } = await supabase
        .from('comptes_bancaires')
        .insert(comptesDefaut)

      if (error) {
        console.error('❌ Erreur lors de l\'initialisation des comptes:', error)
        notifyError('Erreur lors de l\'initialisation des comptes')
        return false
      }

      notifySuccess('3 comptes bancaires créés avec succès !', '✅ Initialisation réussie')
      await refreshComptes()
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      notifyError('Erreur inattendue')
      return false
    }
  }

  // Charger les données au démarrage
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([refreshComptes(), refreshTransactions()])
      setLoading(false)
    }
    loadData()
  }, [])

  const value: CompteBancaireContextType = {
    comptes,
    transactions,
    loading,
    refreshComptes,
    refreshTransactions,
    createCompte,
    updateCompte,
    bulkSetExcludeFromTotal,
    deleteCompte,
    crediterCompte,
    debiterCompte,
    getTransactionsByCompte,
    getTotalSoldes,
    initializeDefaultComptes,
    deleteTransaction,
    updateTransaction,
    transfererEntreComptes
  }

  return (
    <CompteBancaireContext.Provider value={value}>
      {children}
    </CompteBancaireContext.Provider>
  )
}

