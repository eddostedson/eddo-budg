'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Transaction } from '@/lib/shared-data'
import { TransactionService } from '@/lib/supabase/database'

interface TransactionContextType {
  transactions: Transaction[]
  setTransactions: (transactions: Transaction[] | ((prev: Transaction[]) => Transaction[])) => void
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>
  updateTransaction: (id: number, updates: Partial<Transaction>) => void
  deleteTransaction: (id: number) => Promise<void>
  getTransactionsByBudget: (budgetId: string) => Transaction[]
  getTotalSpentByBudget: (budgetId: string) => number
  refreshTransactions: () => Promise<void>
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined)

export function TransactionProvider({ children }: { children: ReactNode }) {
  // ✅ État vide par défaut - pas de données fictives
  const [transactions, setTransactions] = useState<Transaction[]>([])

  // ✅ Fonction pour recharger les transactions depuis Supabase
  const refreshTransactions = async () => {
    try {
      console.log('🔄 Rechargement des transactions depuis Supabase...')
      const supabaseTransactions = await TransactionService.getTransactions()
      
      // ✅ TOUJOURS mettre à jour avec les données de Supabase (même si vide)
      console.log('✅ Transactions rechargées depuis Supabase:', supabaseTransactions.length)
      setTransactions(supabaseTransactions)
      
      // ✅ Mettre à jour localStorage avec les nouvelles données
      if (typeof window !== 'undefined') {
        if (supabaseTransactions.length > 0) {
          localStorage.setItem('transactions', JSON.stringify(supabaseTransactions))
        } else {
          // Vider localStorage si plus de transactions
          localStorage.removeItem('transactions')
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du rechargement des transactions:', error)
      // En cas d'erreur, essayer le fallback localStorage
      if (typeof window !== 'undefined') {
        const savedTransactions = localStorage.getItem('transactions')
        if (savedTransactions) {
          const parsedTransactions = JSON.parse(savedTransactions)
          console.log('⚠️ Fallback localStorage:', parsedTransactions.length)
          setTransactions(parsedTransactions)
        } else {
          setTransactions([])
        }
      }
    }
  }

  // Charger les transactions sauvegardées au démarrage
  useEffect(() => {
    refreshTransactions()
  }, [])

  // Sauvegarder dans LocalStorage à chaque changement
  // ⚠️ DÉSACTIVÉ : La sauvegarde est maintenant gérée directement dans refreshTransactions()
  // pour éviter les conflits avec les rechargements depuis Supabase
  // useEffect(() => {
  //   if (typeof window !== 'undefined' && transactions.length > 0) {
  //     console.log('💾 Sauvegarde de', transactions.length, 'transactions dans localStorage')
  //     localStorage.setItem('transactions', JSON.stringify(transactions))
  //   }
  // }, [transactions])

  const addTransaction = async (transactionData: Omit<Transaction, 'id'>) => {
    console.log('➕ Ajout d\'une nouvelle transaction:', transactionData.description)
    try {
      // Essayer de sauvegarder dans Supabase
      const newTransaction = await TransactionService.createTransaction(transactionData)
      if (newTransaction) {
        console.log('✅ Transaction créée dans Supabase:', newTransaction.id)
        // ✅ Recharger toutes les transactions pour avoir les données fraîches
        await refreshTransactions()
      } else {
        // Fallback vers localStorage
        console.log('⚠️ Fallback localStorage pour la création')
        const fallbackTransaction: Transaction = {
          ...transactionData,
          id: Date.now()
        }
        setTransactions(prev => [fallbackTransaction, ...prev])
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création de la transaction:', error)
      // Fallback vers localStorage
      const fallbackTransaction: Transaction = {
        ...transactionData,
        id: Date.now()
      }
      setTransactions(prev => [fallbackTransaction, ...prev])
    }
  }

  const updateTransaction = async (id: number, updates: Partial<Transaction>) => {
    console.log('🔄 Mise à jour de la transaction:', id)
    try {
      // Essayer de mettre à jour dans Supabase
      const success = await TransactionService.updateTransaction(id, updates)
      if (success) {
        console.log('✅ Transaction mise à jour dans Supabase:', id)
        // ✅ Recharger toutes les transactions pour avoir les données fraîches
        await refreshTransactions()
      } else {
        // Fallback vers mise à jour locale
        console.log('⚠️ Fallback localStorage pour la mise à jour')
        setTransactions(prev => 
          prev.map(transaction => 
            transaction.id === id ? { ...transaction, ...updates } : transaction
          )
        )
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la transaction:', error)
      // Fallback vers mise à jour locale
      setTransactions(prev => 
        prev.map(transaction => 
          transaction.id === id ? { ...transaction, ...updates } : transaction
        )
      )
    }
  }

  const deleteTransaction = async (id: number) => {
    console.log('🗑️ Suppression de la transaction:', id)
    try {
      // Essayer de supprimer dans Supabase
      const success = await TransactionService.deleteTransaction(id)
      if (success) {
        console.log('✅ Transaction supprimée dans Supabase:', id)
        // ✅ Recharger toutes les transactions pour avoir les données fraîches
        await refreshTransactions()
      } else {
        // Fallback vers suppression locale
        console.log('⚠️ Fallback localStorage pour la suppression')
        setTransactions(prev => prev.filter(transaction => transaction.id !== id))
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la transaction:', error)
      // Fallback vers suppression locale
      setTransactions(prev => prev.filter(transaction => transaction.id !== id))
    }
  }

  const getTransactionsByBudget = (budgetId: string) => {
    console.log('🔍 Filtrage transactions par budget_id:', budgetId)
    console.log('📊 Transactions disponibles:', transactions.length)
    console.log('📋 Budget IDs des transactions:', transactions.map(t => ({ id: t.id, budgetId: t.budgetId })))
    
    const filtered = transactions.filter(transaction => {
      const match = transaction.budgetId === budgetId
      if (!match && transaction.budgetId) {
        console.log(`❌ Transaction ${transaction.id} ne correspond pas:`, {
          attendu: budgetId,
          reçu: transaction.budgetId,
          correspondent: transaction.budgetId === budgetId
        })
      }
      return match
    })
    
    console.log('✅ Transactions filtrées:', filtered.length)
    return filtered
  }

  const getTotalSpentByBudget = (budgetId: string) => {
    return transactions
      .filter(transaction => transaction.budgetId === budgetId && transaction.type === 'expense')
      .reduce((total, transaction) => total + Math.abs(transaction.amount), 0)
  }

  const value: TransactionContextType = {
    transactions,
    setTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByBudget,
    getTotalSpentByBudget,
    refreshTransactions // ✅ Exposer la fonction de rafraîchissement
  }

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  )
}

export function useTransactions() {
  const context = useContext(TransactionContext)
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider')
  }
  return context
}
