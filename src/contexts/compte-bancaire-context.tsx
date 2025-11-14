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
  crediterCompte: (compteId: string, montant: number, libelle: string, description?: string, reference?: string, categorie?: string) => Promise<string | null>
  debiterCompte: (compteId: string, montant: number, libelle: string, description?: string, reference?: string, categorie?: string) => Promise<boolean>
  updateTransaction: (transactionId: string, updates: Partial<TransactionBancaire>) => Promise<boolean>
  deleteTransaction: (transactionId: string) => Promise<boolean>
  getTransactionsByCompte: (compteId: string) => TransactionBancaire[]
  getTotalSoldes: () => number
  initializeDefaultComptes: () => Promise<boolean>
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
        typeCompte: compte.type_compte as 'courant' | 'epargne' | 'entreprise',
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
      // Vérifier l'authentification
      const { data: authData, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        // Ne logger que les erreurs non-réseau pour éviter le spam dans la console
        if (authError.message && !authError.message.includes('Failed to fetch') && !authError.message.includes('NetworkError')) {
          console.error('❌ Erreur d\'authentification:', {
            message: authError.message,
            status: authError.status,
            error: authError
          })
        }
        setTransactions([])
        return
      }

      if (!authData?.user) {
        // Ne logger que si ce n'est pas juste une absence de session
        console.warn('⚠️ Aucun utilisateur connecté')
        setTransactions([])
        return
      }

      // Construire la requête
      let query = supabase
        .from('transactions_bancaires')
        .select('*')
        .eq('user_id', authData.user.id)
        .order('date_transaction', { ascending: false })

      if (compteId) {
        query = query.eq('compte_id', compteId)
      }

      const { data, error } = await query

      if (error) {
        // Ne logger que les erreurs non-réseau
        if (error.message && !error.message.includes('Failed to fetch') && !error.message.includes('NetworkError')) {
          console.error('❌ Erreur lors du chargement des transactions:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            error: error
          })
        }
        setTransactions([])
        return
      }

      // Mapper les transactions
      try {
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
      } catch (mappingError) {
        console.error('❌ Erreur lors du mapping des transactions:', {
          error: mappingError,
          data: data
        })
        setTransactions([])
      }
    } catch (error) {
      // Gérer les erreurs réseau de manière silencieuse
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Ne logger que les erreurs non-réseau
      if (!errorMessage.includes('Failed to fetch') && !errorMessage.includes('NetworkError') && !errorMessage.includes('fetch')) {
        console.error('❌ Erreur inattendue lors du chargement des transactions:', {
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
          } : error
        })
      }
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
    categorie?: string
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
      const soldeApres = soldeAvant + montant

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
          categorie: categorie
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur lors du crédit:', error)
        toast.error('Erreur lors du crédit')
        return null
      }

      toast.success(`✅ ${montant.toLocaleString()} F CFA crédités avec succès !`)
      await Promise.all([refreshComptes(), refreshTransactions()])
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
    categorie?: string
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
          categorie: categorie
        })

      if (error) {
        console.error('❌ Erreur lors du débit:', error)
        toast.error('Erreur lors du débit')
        return false
      }

      toast.success(`✅ ${montant.toLocaleString()} F CFA débités avec succès !`)
      await Promise.all([refreshComptes(), refreshTransactions()])
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      toast.error('Erreur inattendue')
      return false
    }
  }

  // 🔄 MODIFIER UNE TRANSACTION
  const updateTransaction = async (transactionId: string, updates: Partial<TransactionBancaire>): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Erreur d\'authentification')
        return false
      }

      // Récupérer la transaction actuelle
      const { data: currentTransaction } = await supabase
        .from('transactions_bancaires')
        .select('*')
        .eq('id', transactionId)
        .eq('user_id', user.id)
        .single()

      if (!currentTransaction) {
        toast.error('Transaction non trouvée')
        return false
      }

      const compteId = currentTransaction.compte_id
      const ancienMontant = parseFloat(currentTransaction.montant || 0)
      const nouveauMontant = updates.montant !== undefined ? updates.montant : ancienMontant
      const typeTransaction = currentTransaction.type_transaction

      const updateData: Record<string, any> = {}
      if (updates.montant !== undefined) updateData.montant = nouveauMontant
      if (updates.libelle !== undefined) updateData.libelle = updates.libelle
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.reference !== undefined) updateData.reference = updates.reference
      if (updates.categorie !== undefined) updateData.categorie = updates.categorie
      if (updates.dateTransaction !== undefined) updateData.date_transaction = updates.dateTransaction

      // Recalculer les soldes si le montant change
      if (updates.montant !== undefined && nouveauMontant !== ancienMontant) {
        // Récupérer toutes les transactions du compte triées par date
        const { data: allTransactions } = await supabase
          .from('transactions_bancaires')
          .select('*')
          .eq('compte_id', compteId)
          .eq('user_id', user.id)
          .order('date_transaction', { ascending: true })
          .order('created_at', { ascending: true })

        if (allTransactions) {
          // Trouver le solde initial du compte
          const { data: compteData } = await supabase
            .from('comptes_bancaires')
            .select('solde_initial')
            .eq('id', compteId)
            .eq('user_id', user.id)
            .single()

          let soldeCourant = compteData ? parseFloat(compteData.solde_initial || 0) : 0

          // Recalculer tous les soldes depuis le début
          for (const trans of allTransactions) {
            const montant = parseFloat(trans.montant || 0)
            const type = trans.type_transaction
            const isCurrentTransaction = trans.id === transactionId

            if (isCurrentTransaction) {
              // Utiliser le nouveau montant pour cette transaction
              const soldeAvant = soldeCourant
              soldeCourant = type === 'credit' 
                ? soldeCourant + nouveauMontant 
                : soldeCourant - nouveauMontant
              const soldeApres = soldeCourant

              updateData.solde_avant = soldeAvant
              updateData.solde_apres = soldeApres
            } else {
              // Recalculer les soldes pour les autres transactions
              const soldeAvant = soldeCourant
              soldeCourant = type === 'credit' 
                ? soldeCourant + montant 
                : soldeCourant - montant
              const soldeApres = soldeCourant

              // Mettre à jour les soldes de cette transaction
              await supabase
                .from('transactions_bancaires')
                .update({
                  solde_avant: soldeAvant,
                  solde_apres: soldeApres
                })
                .eq('id', trans.id)
                .eq('user_id', user.id)
            }
          }

          // Mettre à jour le solde actuel du compte
          await supabase
            .from('comptes_bancaires')
            .update({ solde_actuel: soldeCourant })
            .eq('id', compteId)
            .eq('user_id', user.id)
        }
      } else if (updates.montant === undefined) {
        // Si le montant ne change pas, juste mettre à jour les autres champs
        // Pas besoin de recalculer les soldes
      }

      // Mettre à jour la transaction
      const { error } = await supabase
        .from('transactions_bancaires')
        .update(updateData)
        .eq('id', transactionId)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Erreur lors de la modification de la transaction:', error)
        toast.error('Erreur lors de la modification de la transaction')
        return false
      }

      toast.success('✅ Transaction modifiée avec succès !')
      await Promise.all([refreshComptes(), refreshTransactions()])
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      toast.error('Erreur inattendue')
      return false
    }
  }

  // 🗑️ SUPPRIMER UNE TRANSACTION
  const deleteTransaction = async (transactionId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Erreur d\'authentification')
        return false
      }

      // Récupérer la transaction pour recalculer le solde
      const { data: transaction } = await supabase
        .from('transactions_bancaires')
        .select('*')
        .eq('id', transactionId)
        .eq('user_id', user.id)
        .single()

      if (!transaction) {
        toast.error('Transaction non trouvée')
        return false
      }

      const compteId = transaction.compte_id
      
      // Supprimer le reçu associé si c'est un crédit (recette)
      if (transaction.type_transaction === 'credit') {
        const { data: receipts } = await supabase
          .from('receipts')
          .select('id')
          .eq('transaction_id', transactionId)
          .eq('user_id', user.id)
        
        if (receipts && receipts.length > 0) {
          for (const receipt of receipts) {
            await supabase
              .from('receipts')
              .delete()
              .eq('id', receipt.id)
              .eq('user_id', user.id)
          }
          console.log('✅ Reçu(s) associé(s) supprimé(s) automatiquement')
        }
      }

      // Supprimer la transaction
      const { error } = await supabase
        .from('transactions_bancaires')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Erreur lors de la suppression de la transaction:', error)
        toast.error('Erreur lors de la suppression de la transaction')
        return false
      }

      // Recalculer tous les soldes depuis le début
      const { data: allTransactions } = await supabase
        .from('transactions_bancaires')
        .select('*')
        .eq('compte_id', compteId)
        .eq('user_id', user.id)
        .order('date_transaction', { ascending: true })
        .order('created_at', { ascending: true })

      if (allTransactions) {
        // Trouver le solde initial du compte
        const { data: compteData } = await supabase
          .from('comptes_bancaires')
          .select('solde_initial')
          .eq('id', compteId)
          .eq('user_id', user.id)
          .single()

        let soldeCourant = compteData ? parseFloat(compteData.solde_initial || 0) : 0

        // Recalculer tous les soldes
        for (const trans of allTransactions) {
          const montant = parseFloat(trans.montant || 0)
          const type = trans.type_transaction
          const soldeAvant = soldeCourant
          
          soldeCourant = type === 'credit' 
            ? soldeCourant + montant 
            : soldeCourant - montant
          
          const soldeApres = soldeCourant

          // Mettre à jour les soldes de cette transaction
          await supabase
            .from('transactions_bancaires')
            .update({
              solde_avant: soldeAvant,
              solde_apres: soldeApres
            })
            .eq('id', trans.id)
            .eq('user_id', user.id)
        }

        // Mettre à jour le solde actuel du compte
        await supabase
          .from('comptes_bancaires')
          .update({ solde_actuel: soldeCourant })
          .eq('id', compteId)
          .eq('user_id', user.id)
      }

      toast.success('✅ Transaction supprimée avec succès !')
      await Promise.all([refreshComptes(), refreshTransactions()])
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
    updateTransaction,
    deleteTransaction,
    getTransactionsByCompte,
    getTotalSoldes,
    initializeDefaultComptes
  }

  return (
    <CompteBancaireContext.Provider value={value}>
      {children}
    </CompteBancaireContext.Provider>
  )
}

