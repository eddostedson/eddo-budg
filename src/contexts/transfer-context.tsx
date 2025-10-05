'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { BudgetTransfer } from '@/lib/shared-data'

interface TransferContextType {
  transfers: BudgetTransfer[]
  addTransfer: (transfer: Omit<BudgetTransfer, 'id' | 'createdAt'>) => void
  updateTransferStatus: (id: string, status: 'pending' | 'completed' | 'refunded') => void
  getTransfersByBudget: (budgetId: string) => BudgetTransfer[]
  getPendingTransfers: (budgetId: string) => { borrowed: BudgetTransfer[], lent: BudgetTransfer[] }
  getDebtSummary: (budgetId: string) => { totalBorrowed: number, totalLent: number, netDebt: number }
}

const TransferContext = createContext<TransferContextType | undefined>(undefined)

export function TransferProvider({ children }: { children: ReactNode }) {
  const [transfers, setTransfers] = useState<BudgetTransfer[]>([])

  // Charger les transferts depuis localStorage au démarrage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTransfers = localStorage.getItem('budgetTransfers')
      if (savedTransfers) {
        try {
          const parsedTransfers = JSON.parse(savedTransfers)
          const transfersWithDates = parsedTransfers.map((transfer: BudgetTransfer & { createdAt: string }) => ({
            ...transfer,
            createdAt: new Date(transfer.createdAt)
          }))
          setTransfers(transfersWithDates)
        } catch (error) {
          console.error('Erreur lors du chargement des transferts:', error)
          setTransfers([])
        }
      } else {
        setTransfers([])
      }
    }
  }, [])

  // Sauvegarder dans localStorage à chaque changement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('budgetTransfers', JSON.stringify(transfers))
    }
  }, [transfers])

  const addTransfer = (transferData: Omit<BudgetTransfer, 'id' | 'createdAt'>) => {
    const newTransfer: BudgetTransfer = {
      ...transferData,
      id: Date.now().toString(),
      createdAt: new Date()
    }
    setTransfers(prev => [newTransfer, ...prev])
  }

  const updateTransferStatus = (id: string, status: 'pending' | 'completed' | 'refunded') => {
    setTransfers(prev =>
      prev.map(transfer =>
        transfer.id === id ? { ...transfer, status } : transfer
      )
    )
  }

  const getTransfersByBudget = (budgetId: string) => {
    return transfers.filter(
      transfer => transfer.fromBudgetId === budgetId || transfer.toBudgetId === budgetId
    )
  }

  const getPendingTransfers = (budgetId: string) => {
    const borrowed = transfers.filter(
      transfer => transfer.toBudgetId === budgetId && transfer.status === 'pending'
    )
    const lent = transfers.filter(
      transfer => transfer.fromBudgetId === budgetId && transfer.status === 'pending'
    )
    return { borrowed, lent }
  }

  const getDebtSummary = (budgetId: string) => {
    const totalBorrowed = transfers
      .filter(transfer => transfer.toBudgetId === budgetId && transfer.status === 'pending')
      .reduce((sum, transfer) => sum + transfer.amount, 0)

    const totalLent = transfers
      .filter(transfer => transfer.fromBudgetId === budgetId && transfer.status === 'pending')
      .reduce((sum, transfer) => sum + transfer.amount, 0)

    const netDebt = totalBorrowed - totalLent

    return { totalBorrowed, totalLent, netDebt }
  }

  const value: TransferContextType = {
    transfers,
    addTransfer,
    updateTransferStatus,
    getTransfersByBudget,
    getPendingTransfers,
    getDebtSummary
  }

  return <TransferContext.Provider value={value}>{children}</TransferContext.Provider>
}

export function useTransfers() {
  const context = useContext(TransferContext)
  if (context === undefined) {
    throw new Error('useTransfers must be used within a TransferProvider')
  }
  return context
}



