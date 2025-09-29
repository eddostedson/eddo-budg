'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Transaction, defaultTransactions } from '@/lib/shared-data'

interface TransactionContextType {
  transactions: Transaction[]
  setTransactions: (transactions: Transaction[] | ((prev: Transaction[]) => Transaction[])) => void
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void
  updateTransaction: (id: number, updates: Partial<Transaction>) => void
  deleteTransaction: (id: number) => void
  getTransactionsByBudget: (budgetId: string) => Transaction[]
  getTotalSpentByBudget: (budgetId: string) => number
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined)

export function TransactionProvider({ children }: { children: ReactNode }) {
  // ✅ Charger depuis LocalStorage au démarrage
  const [transactions, setTransactions] = useState<Transaction[]>(defaultTransactions)

  // Charger les transactions sauvegardées au démarrage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTransactions = localStorage.getItem('transactions')
      if (savedTransactions) {
        try {
          const parsedTransactions = JSON.parse(savedTransactions)
          setTransactions(parsedTransactions)
        } catch (error) {
          console.error('Erreur lors du chargement des transactions:', error)
        }
      }
    }
  }, [])

  // Sauvegarder dans LocalStorage à chaque changement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('transactions', JSON.stringify(transactions))
    }
  }, [transactions])

  const addTransaction = (transactionData: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: Date.now()
    }
    setTransactions(prev => [newTransaction, ...prev])
  }

  const updateTransaction = (id: number, updates: Partial<Transaction>) => {
    setTransactions(prev => 
      prev.map(transaction => 
        transaction.id === id ? { ...transaction, ...updates } : transaction
      )
    )
  }

  const deleteTransaction = (id: number) => {
    setTransactions(prev => prev.filter(transaction => transaction.id !== id))
  }

  const getTransactionsByBudget = (budgetId: string) => {
    return transactions.filter(transaction => transaction.budgetId === budgetId)
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
    getTotalSpentByBudget
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
