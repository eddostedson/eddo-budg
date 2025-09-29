'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useBudgets } from '@/contexts/budget-context'
import { useTransactions } from '@/contexts/transaction-context'
import { useCategories } from '@/contexts/category-context'

interface DataManagementProps {
  className?: string
}

export function DataManagement({ className = '' }: DataManagementProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [deleteType, setDeleteType] = useState<'all' | 'budgets' | 'transactions' | 'categories'>('all')
  
  const { setBudgets } = useBudgets()
  const { setTransactions } = useTransactions()
  const { setCategories } = useCategories()

  const handleDeleteData = () => {
    switch (deleteType) {
      case 'all':
        // Supprimer toutes les données
        setBudgets([])
        setTransactions([])
        setCategories([])
        localStorage.removeItem('budgets')
        localStorage.removeItem('transactions')
        localStorage.removeItem('categories')
        alert('Toutes les données ont été supprimées !')
        break
      case 'budgets':
        // Supprimer seulement les budgets
        setBudgets([])
        localStorage.removeItem('budgets')
        alert('Tous les budgets ont été supprimés !')
        break
      case 'transactions':
        // Supprimer seulement les transactions
        setTransactions([])
        localStorage.removeItem('transactions')
        alert('Toutes les transactions ont été supprimées !')
        break
      case 'categories':
        // Supprimer seulement les catégories
        setCategories([])
        localStorage.removeItem('categories')
        alert('Toutes les catégories ont été supprimées !')
        break
    }
    setShowConfirmModal(false)
  }

  return (
    <div className={className}>
      <Button
        onClick={() => setShowConfirmModal(true)}
        variant="outline"
        className="border-red-300 text-red-700 hover:bg-red-50"
      >
        🗑️ Gérer les Données
      </Button>

      {/* Modal de confirmation */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Supprimer les Données</h2>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                Que voulez-vous supprimer ?
              </p>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deleteType"
                    value="all"
                    checked={deleteType === 'all'}
                    onChange={(e) => setDeleteType(e.target.value as 'all' | 'budgets' | 'transactions' | 'categories')}
                    className="text-red-500"
                  />
                  <span>Tout supprimer (Budgets + Transactions + Catégories)</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deleteType"
                    value="budgets"
                    checked={deleteType === 'budgets'}
                    onChange={(e) => setDeleteType(e.target.value as 'all' | 'budgets' | 'transactions' | 'categories')}
                    className="text-red-500"
                  />
                  <span>Supprimer seulement les Budgets</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deleteType"
                    value="transactions"
                    checked={deleteType === 'transactions'}
                    onChange={(e) => setDeleteType(e.target.value as 'all' | 'budgets' | 'transactions' | 'categories')}
                    className="text-red-500"
                  />
                  <span>Supprimer seulement les Transactions</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deleteType"
                    value="categories"
                    checked={deleteType === 'categories'}
                    onChange={(e) => setDeleteType(e.target.value as 'all' | 'budgets' | 'transactions' | 'categories')}
                    className="text-red-500"
                  />
                  <span>Supprimer seulement les Catégories</span>
                </label>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">
                  ⚠️ <strong>Attention :</strong> Cette action est irréversible !
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteData}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
