'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { CompteBancaire, TransactionBancaire } from '@/lib/shared-data'
import { createClient } from '@/lib/supabase/browser'
import { toast } from 'sonner'

const supabase = createClient()

interface CompteBancaireContextType {
  comptes: CompteBancaire[]
  transactions: TransactionBancaire[]
  loading: boolean
  refreshComptes: () => Promise<void>
  refreshTransactions: (compteId?: string) => Promise<void>
  createCompte: (compte: Omit<CompteBancaire, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>
  updateCompte: (id: string, updates: Partial<CompteBancaire>) => Promise<boolean>
  deleteCompte: (id: string) => Promise<boolean>
  crediterCompte: (compteId: string, montant: number, libelle: string, description?: string, reference?: string, categorie?: string, dateTransaction?: string) => Promise<string | null>
  debiterCompte: (compteId: string, montant: number, libelle: string, description?: string, reference?: string, categorie?: string, dateTransaction?: string) => Promise<boolean>
  getTransactionsByCompte: (compteId: string) => TransactionBancaire[]
  getTotalSoldes: () => number
  initializeDefaultComptes: () => Promise<boolean>
  deleteTransaction: (transactionId: string) => Promise<boolean>
  updateTransaction: (transactionId: string, updates: Partial<TransactionBancaire>) => Promise<boolean>
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

  // 🔄 RECHARGER LES TRANSACTIONS
  const refreshTransactions = async (compteId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setTransactions([])
        return
      }

      let query = supabase
        .from('transactions_bancaires')
        .select('*')
        .eq('user_id', user.id)
        .order('date_transaction', { ascending: false })

      if (compteId) {
        query = query.eq('compte_id', compteId)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Erreur lors du chargement des transactions:', {
          message: (error as any).message,
          code: (error as any).code,
          details: (error as any).details,
          hint: (error as any).hint
        })
        // On conserve l'ancien état plutôt que de tout vider pour éviter un écran vide
        toast.error(
          `Erreur lors du chargement des transactions: ${(error as any).message || 'voir la console pour le détail'}`
        )
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
        updatedAt: transaction.updated_at
      }))

      setTransactions(mappedTransactions)
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      setTransactions([])
    }
  }

  // ➕ CRÉER UN COMPTE
  const createCompte = async (compte: Omit<CompteBancaire, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Erreur d\'authentification')
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
        console.error('❌ Code erreur:', error.code)
        console.error('❌ Message:', error.message)
        console.error('❌ Détails:', error.details)
        console.error('❌ Hint:', error.hint)
        toast.error(`Erreur lors de la création du compte: ${error.message || 'Erreur inconnue'}`)
        return false
      }

      console.log('✅ Compte créé avec succès:', data)
      toast.success('✅ Compte bancaire créé avec succès !')
      await refreshComptes()
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      toast.error('Erreur inattendue')
      return false
    }
  }

  // ✏️ MODIFIER UN COMPTE
  const updateCompte = async (id: string, updates: Partial<CompteBancaire>): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Erreur d\'authentification')
        return false
      }

      const updateData: Record<string, any> = {}
      if (updates.nom !== undefined) updateData.nom = updates.nom
      if (updates.numeroCompte !== undefined) updateData.numero_compte = updates.numeroCompte
      if (updates.banque !== undefined) updateData.banque = updates.banque
      if (updates.typeCompte !== undefined) updateData.type_compte = updates.typeCompte
      if (updates.typePortefeuille !== undefined) updateData.type_portefeuille = updates.typePortefeuille
      if (updates.devise !== undefined) updateData.devise = updates.devise
      if (updates.actif !== undefined) updateData.actif = updates.actif

      const { error } = await supabase
        .from('comptes_bancaires')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Erreur lors de la modification du compte:', error)
        toast.error('Erreur lors de la modification du compte')
        return false
      }

      toast.success('✅ Compte bancaire modifié avec succès !')
      await refreshComptes()
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      toast.error('Erreur inattendue')
      return false
    }
  }

  // 🗑️ SUPPRIMER UN COMPTE (soft delete)
  const deleteCompte = async (id: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Erreur d\'authentification')
        return false
      }

      const { error } = await supabase
        .from('comptes_bancaires')
        .update({ actif: false })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Erreur lors de la suppression du compte:', error)
        toast.error('Erreur lors de la suppression du compte')
        return false
      }

      toast.success('✅ Compte bancaire supprimé avec succès !')
      await refreshComptes()
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      toast.error('Erreur inattendue')
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
        toast.error('Erreur d\'authentification')
        return false
      }

      if (montant <= 0) {
        toast.error('Le montant doit être supérieur à 0')
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
        toast.error('Compte non trouvé')
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
        toast.error('Erreur lors du crédit')
        return null
      }

      toast.success(`✅ ${montant.toLocaleString()} F CFA crédités avec succès !`)
      return transactionData?.id || null
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      toast.error('Erreur inattendue')
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
    dateTransaction?: string
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Erreur d\'authentification')
        return false
      }

      if (montant <= 0) {
        toast.error('Le montant doit être supérieur à 0')
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
        toast.error('Compte non trouvé')
        return false
      }

      const soldeAvant = parseFloat(compteData.solde_actuel || 0)

      if (soldeAvant < montant) {
        toast.error(`Solde insuffisant. Solde disponible: ${soldeAvant.toLocaleString()} F CFA`)
        return false
      }

      const soldeApres = soldeAvant - montant
      const dateOp = dateTransaction || new Date().toISOString()

      // Créer la transaction
      const { error } = await supabase
        .from('transactions_bancaires')
        .insert({
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
        })

      if (error) {
        console.error('❌ Erreur lors du débit:', error)
        toast.error('Erreur lors du débit')
        return false
      }

      toast.success(`✅ ${montant.toLocaleString()} F CFA débités avec succès !`)
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      toast.error('Erreur inattendue')
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

  // 🔁 Recalculer le solde actuel d'un compte à partir de son solde initial + toutes ses transactions
  const recalculateCompteSolde = async (compteId: string, userId: string): Promise<boolean> => {
    // 1. Charger le solde initial du compte
    const { data: compteRow, error: compteError } = await supabase
      .from('comptes_bancaires')
      .select('solde_initial')
      .eq('id', compteId)
      .eq('user_id', userId)
      .single()

    if (compteError || !compteRow) {
      console.error('❌ Erreur lors du chargement du compte pour recalcul des soldes:', compteError)
      toast.error('Erreur lors du recalcul des soldes du compte')
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
      toast.error('Erreur lors du recalcul des transactions')
      return false
    }

    // 3. Recalculer le solde actuel du compte
    let currentSolde = parseFloat(compteRow.solde_initial || 0)
    for (const tx of txRows || []) {
      const montant = parseFloat(tx.montant || 0)
      currentSolde =
        tx.type_transaction === 'credit'
          ? currentSolde + montant
          : currentSolde - montant
    }

    // 4. Mettre à jour le solde actuel du compte avec le solde final recalculé
    const { error: updateCompteError } = await supabase
      .from('comptes_bancaires')
      .update({ solde_actuel: currentSolde })
      .eq('id', compteId)
      .eq('user_id', userId)

    if (updateCompteError) {
      console.error('❌ Erreur lors de la mise à jour du solde du compte:', updateCompteError)
      toast.error('Erreur lors de la mise à jour du solde du compte')
      return false
    }

    return true
  }

  // 🗑️ SUPPRIMER UNE TRANSACTION
  const deleteTransaction = async (transactionId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Erreur d\'authentification')
        return false
      }

      // 1. Charger la transaction
      const { data: transaction, error: fetchError } = await supabase
        .from('transactions_bancaires')
        .select('*')
        .eq('id', transactionId)
        .eq('user_id', user.id)
        .single()

      if (fetchError || !transaction) {
        console.error('❌ Erreur lors du chargement de la transaction à supprimer:', fetchError)
        toast.error('Transaction introuvable')
        return false
      }

      const compteId = transaction.compte_id as string

      // 2. Supprimer la transaction
      const { error: deleteError } = await supabase
        .from('transactions_bancaires')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('❌ Erreur lors de la suppression de la transaction:', deleteError)
        toast.error('Erreur lors de la suppression de la transaction')
        return false
      }

      // 3. Recalculer le solde du compte
      const ok = await recalculateCompteSolde(compteId, user.id)
      if (!ok) {
        return false
      }

      toast.success('✅ Transaction supprimée avec succès')
      await Promise.all([refreshComptes(), refreshTransactions(compteId)])
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue lors de la suppression de la transaction:', error)
      toast.error('Erreur inattendue lors de la suppression de la transaction')
      return false
    }
  }

  // ✏️ MODIFIER UNE TRANSACTION (libellé / description / catégorie / date / montant)
  const updateTransaction = async (transactionId: string, updates: Partial<TransactionBancaire>): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Erreur d\'authentification')
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
        toast.error('Transaction introuvable')
        return false
      }

      const compteId = existingTx.compte_id as string

      const payload: Record<string, any> = {}
      if (updates.libelle !== undefined) payload.libelle = updates.libelle
      if (updates.description !== undefined) payload.description = updates.description
      if (updates.categorie !== undefined) payload.categorie = updates.categorie
      if (updates.dateTransaction !== undefined) payload.date_transaction = updates.dateTransaction
      if (updates.montant !== undefined) payload.montant = updates.montant

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
        toast.error('Erreur lors de la modification de la transaction')
        return false
      }

      const needsRecalc = updates.montant !== undefined || updates.dateTransaction !== undefined

      if (needsRecalc) {
        const ok = await recalculateCompteSolde(compteId, user.id)
        if (!ok) {
          return false
        }
        await Promise.all([refreshComptes(), refreshTransactions(compteId)])
      } else {
        await refreshTransactions(compteId)
      }

      toast.success('✅ Transaction modifiée avec succès')
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue lors de la modification de la transaction:', error)
      toast.error('Erreur inattendue lors de la modification de la transaction')
      return false
    }
  }

  // 🏦 INITIALISER 3 COMPTES PAR DÉFAUT
  const initializeDefaultComptes = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Erreur d\'authentification')
        return false
      }

      // Vérifier si des comptes existent déjà
      const { data: existingComptes } = await supabase
        .from('comptes_bancaires')
        .select('id')
        .eq('user_id', user.id)
        .eq('actif', true)

      if (existingComptes && existingComptes.length > 0) {
        toast.info('Des comptes bancaires existent déjà')
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
        toast.error('Erreur lors de l\'initialisation des comptes')
        return false
      }

      toast.success('✅ 3 comptes bancaires créés avec succès !')
      await refreshComptes()
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      toast.error('Erreur inattendue')
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
    deleteCompte,
    crediterCompte,
    debiterCompte,
    getTransactionsByCompte,
    getTotalSoldes,
    initializeDefaultComptes,
    deleteTransaction,
    updateTransaction
  }

  return (
    <CompteBancaireContext.Provider value={value}>
      {children}
    </CompteBancaireContext.Provider>
  )
}

