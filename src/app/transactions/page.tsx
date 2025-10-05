'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthGuard } from '@/components/auth-guard'
import { useTransactions } from '@/contexts/transaction-context'
import { CategoryCombobox } from '@/components/ui/category-combobox'

import { Transaction } from '@/lib/shared-data'

export default function TransactionsPage() {
  const { transactions, addTransaction, deleteTransaction, updateTransaction, refreshTransactions } = useTransactions()
  const [formData, setFormData] = useState({
    date: '',
    description: '',
    category: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    status: 'completed' as 'completed' | 'pending' | 'cancelled'
  })
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  
  // Exécuter une fois au chargement
  useEffect(() => {
    refreshTransactions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreateOrUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.description.trim() || !formData.amount) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (editingTransaction) {
      // Mettre à jour la transaction existante
      await updateTransaction(editingTransaction.id, {
        date: formData.date,
        description: formData.description,
        category: formData.category,
        amount: parseFloat(formData.amount),
        type: formData.type,
        status: formData.status
      })
    } else {
      // Créer une nouvelle transaction
      await addTransaction({
        date: formData.date,
        description: formData.description,
        category: formData.category,
        amount: parseFloat(formData.amount),
        type: formData.type,
        status: formData.status
      })
    }

    // Réinitialiser le formulaire et l'état d'édition
    setEditingTransaction(null)
  }

  const handleDeleteTransaction = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      await deleteTransaction(id)
      alert('Transaction supprimée avec succès !')
    }
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      date: transaction.date.split('T')[0], // Formater la date pour l'input
      description: transaction.description,
      category: transaction.category,
      amount: transaction.amount.toString(),
      type: transaction.type,
      status: transaction.status,
    })
  }
  
  const cancelEdit = () => {
    setEditingTransaction(null)
    setFormData({
      date: '',
      description: '',
      category: '',
      amount: '',
      type: 'expense',
      status: 'completed'
    })
  }

  // Filtrage et tri
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filteredAndSortedTransactions = transactions
    .filter(t => filterType === 'all' || t.type === filterType)
    .sort((a, b) => {
      let comparison = 0
      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
      } else {
        comparison = a.amount - b.amount
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Toutes les Transactions</h1>

        {/* Formulaire de création/modification */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">{editingTransaction ? 'Modifier la transaction' : 'Ajouter une transaction'}</h2>
          <form onSubmit={handleCreateOrUpdateTransaction} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input type="date" name="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
            <Input name="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Description" required />
            <CategoryCombobox 
              value={formData.category}
              onChange={value => setFormData({...formData, category: value})}
            />
            <Input type="number" name="amount" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="Montant" required />
            <select name="type" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as 'income' | 'expense'})} className="p-2 border rounded">
              <option value="expense">Dépense</option>
              <option value="income">Revenu</option>
            </select>
            <select name="status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as 'completed' | 'pending' | 'cancelled'})} className="p-2 border rounded">
              <option value="completed">Exécutée</option>
              <option value="pending">Planifiée</option>
              <option value="cancelled">Annulée</option>
            </select>
            <div className="md:col-span-3 flex justify-end gap-2">
              {editingTransaction && (
                <Button type="button" onClick={cancelEdit} variant="outline">Annuler</Button>
              )}
              <Button type="submit">{editingTransaction ? 'Mettre à jour' : 'Ajouter'}</Button>
            </div>
          </form>
        </div>

        {/* Filtres et tri */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Button onClick={() => setFilterType('all')} variant={filterType === 'all' ? 'default' : 'outline'}>Toutes</Button>
            <Button onClick={() => setFilterType('income')} variant={filterType === 'income' ? 'default' : 'outline'}>Revenus</Button>
            <Button onClick={() => setFilterType('expense')} variant={filterType === 'expense' ? 'default' : 'outline'}>Dépenses</Button>
          </div>
          <div className="flex gap-2">
            <select value={sortBy} onChange={e => setSortBy(e.target.value as 'date' | 'amount')} className="p-2 border rounded">
              <option value="date">Trier par Date</option>
              <option value="amount">Trier par Montant</option>
            </select>
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')} className="p-2 border rounded">
              <option value="desc">Décroissant</option>
              <option value="asc">Croissant</option>
            </select>
          </div>
        </div>
        
        {/* Liste des transactions */}
        <div className="bg-white rounded-lg shadow-md">
          <ul className="divide-y divide-gray-200">
            {filteredAndSortedTransactions.map(transaction => (
              <li key={transaction.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{transaction.description}</p>
                  <p className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'} {transaction.amount} FCFA
                  </p>
                  <p className="text-xs text-gray-400">{transaction.status}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleEditTransaction(transaction)} size="sm" variant="outline">Modifier</Button>
                  <Button onClick={() => handleDeleteTransaction(transaction.id)} size="sm" variant="destructive">Supprimer</Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AuthGuard>
  )
}