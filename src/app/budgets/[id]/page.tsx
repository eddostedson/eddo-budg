'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useBudgets } from '@/contexts/budget-context'
import { useTransactions } from '@/contexts/transaction-context'
import { CFAAmount } from '@/components/ui/cfa-logo'
import { CategoryCombobox } from '@/components/ui/category-combobox'

export default function BudgetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { budgets, deleteBudget, updateBudget } = useBudgets()
  const { getTransactionsByBudget, addTransaction, deleteTransaction, getTotalSpentByBudget } = useTransactions()
  
  const [budget, setBudget] = useState<typeof budgets[0] | null>(null)
  const [budgetTransactions, setBudgetTransactions] = useState<ReturnType<typeof getTransactionsByBudget>>([])
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<number | null>(null)
  
  // Form data pour nouvelle transaction
  const [formData, setFormData] = useState({
    description: '',
    category: 'Alimentation',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (params.id) {
      const foundBudget = budgets.find(b => b.id === params.id)
      if (foundBudget) {
        setBudget(foundBudget)
        const relatedTransactions = getTransactionsByBudget(params.id as string)
        setBudgetTransactions(relatedTransactions)
      } else {
        // Budget non trouvé, rediriger vers la page principale
        router.push('/')
      }
    }
  }, [params.id, budgets, getTransactionsByBudget, router])

  // Fonction pour créer une nouvelle transaction
  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.description.trim() || !formData.amount) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    const amount = parseFloat(formData.amount)
    
    addTransaction({
      date: formData.date,
      description: formData.description,
      category: formData.category,
      amount: formData.type === 'expense' ? -amount : amount,
      type: formData.type,
      status: 'completed',
      budgetId: params.id as string
    })
    
    // Mettre à jour le budget
    if (formData.type === 'expense') {
      const newSpent = getTotalSpentByBudget(params.id as string) + amount
      const budget = budgets.find(b => b.id === params.id)
      
      if (budget) {
        updateBudget(params.id as string, {
          spent: newSpent,
          remaining: budget.amount - newSpent
        })
      }
    }
    
    // Reset form
    setFormData({
      description: '',
      category: 'Alimentation',
      amount: '',
      type: 'expense',
      date: new Date().toISOString().split('T')[0]
    })
    setShowTransactionForm(false)
    
    // Recharger les transactions
    const relatedTransactions = getTransactionsByBudget(params.id as string)
    setBudgetTransactions(relatedTransactions)
    
    alert('Transaction créée avec succès !')
  }

  // Fonction pour modifier une transaction
  const handleEditTransaction = (transactionId: number) => {
    const transaction = budgetTransactions.find(t => t.id === transactionId)
    if (transaction) {
      setFormData({
        description: transaction.description,
        category: transaction.category,
        amount: Math.abs(transaction.amount).toString(),
        type: transaction.type,
        date: transaction.date
      })
      setEditingTransaction(transactionId)
      setShowTransactionForm(true)
    }
  }

  // Fonction pour supprimer une transaction
  const handleDeleteTransaction = (transactionId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      deleteTransaction(transactionId)
      
      // Recharger les transactions et mettre à jour le budget
      const relatedTransactions = getTransactionsByBudget(params.id as string)
      setBudgetTransactions(relatedTransactions)
      
      const newSpent = getTotalSpentByBudget(params.id as string)
      const budget = budgets.find(b => b.id === params.id)
      
      if (budget) {
        updateBudget(params.id as string, {
          spent: newSpent,
          remaining: budget.amount - newSpent
        })
      }
      
      alert('Transaction supprimée avec succès !')
    }
  }

  if (!budget) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du budget...</p>
        </div>
      </div>
    )
  }

  const handleDeleteBudget = () => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le budget "${budget.name}" ? Cette action est irréversible.`)) {
      deleteBudget(budget.id)
      router.push('/')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Validation du solde
  const isAmountOverBudget = () => {
    if (!budget || !formData.amount) return false
    const amount = parseFloat(formData.amount)
    return formData.type === 'expense' && amount > budget.remaining
  }

  const isFormValid = () => {
    // Vérifier que tous les champs obligatoires sont remplis
    const hasRequiredFields = formData.description.trim() && 
                             formData.amount && 
                             parseFloat(formData.amount) > 0
    
    // Pour les dépenses, vérifier que le montant ne dépasse pas le solde
    const isAmountValid = formData.type === 'expense' 
      ? !isAmountOverBudget() 
      : true // Les revenus ne sont pas limités par le solde
    
    return hasRequiredFields && isAmountValid
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Retour
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{budget.name}</h1>
              <p className="text-gray-600">{budget.description}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => alert('Fonctionnalité de modification à venir')}
              variant="outline"
            >
              Modifier
            </Button>
            <Button
              onClick={handleDeleteBudget}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Supprimer
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations du budget */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Détails du Budget</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Montant total</label>
                    <p className="text-2xl font-bold text-gray-900">
                      <CFAAmount amount={budget.amount} />
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Période</label>
                    <p className="text-lg font-semibold text-gray-900">{budget.period}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Dépensé</label>
                    <p className="text-xl font-bold text-red-600">
                      <CFAAmount amount={budget.spent} />
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Restant</label>
                    <p className="text-xl font-bold text-green-600">
                      <CFAAmount amount={budget.remaining} />
                    </p>
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progression</span>
                    <span>{Math.round((budget.spent / budget.amount) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        budget.remaining > 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((budget.spent / budget.amount) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transactions liées */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Transactions ({budgetTransactions.length})</CardTitle>
                  <Button 
                    onClick={() => setShowTransactionForm(true)}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    + Ajouter une transaction
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {budgetTransactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Aucune transaction liée à ce budget</p>
                    <Button 
                      onClick={() => setShowTransactionForm(true)}
                      className="mt-4"
                    >
                      Créer une transaction
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {budgetTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            transaction.type === 'expense' ? 'bg-red-500' : 'bg-green-500'
                          }`}></div>
                          <div>
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-sm text-gray-500">
                              {formatDate(transaction.date)} • {transaction.category}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className={`font-semibold ${
                              transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                            }`}>
                              <CFAAmount amount={transaction.amount} />
                            </p>
                            <p className="text-xs text-gray-500">
                              {transaction.status === 'completed' ? 'Terminé' : 'En attente'}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditTransaction(transaction.id)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                              title="Modifier"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(transaction.id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                              title="Supprimer"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Statistiques */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {Math.round((budget.remaining / budget.amount) * 100)}%
                  </div>
                  <p className="text-sm text-gray-500">Budget restant</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Transactions</span>
                    <span className="font-semibold">{budgetTransactions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Dépenses moyennes</span>
                    <span className="font-semibold">
                      <CFAAmount amount={budgetTransactions.length > 0 ? budget.spent / budgetTransactions.length : 0} />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Créé le</span>
                    <span className="font-semibold">
                      {budget.createdAt.toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de création/modification de transaction */}
      {showTransactionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingTransaction ? 'Modifier la Transaction' : 'Nouvelle Transaction'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Budget : <span className="font-medium text-blue-600">{budget?.name}</span>
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowTransactionForm(false)
                  setEditingTransaction(null)
                  setFormData({
                    description: '',
                    category: 'Alimentation',
                    amount: '',
                    type: 'expense',
                    date: new Date().toISOString().split('T')[0]
                  })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateTransaction} className="space-y-4">
              {/* Information sur le budget */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-800 font-medium">Budget sélectionné :</span>
                  <span className="text-blue-600 font-semibold">{budget?.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-blue-700">Solde restant :</span>
                  <span className="text-blue-600 font-semibold">
                    <CFAAmount amount={budget?.remaining || 0} />
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Achat alimentaire"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="expense">Dépense</option>
                    <option value="income">Revenu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie
                  </label>
                  <CategoryCombobox
                    value={formData.category}
                    onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    placeholder="Sélectionner une catégorie..."
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant * (FCFA)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-gray-900 placeholder:text-gray-500 ${
                      isAmountOverBudget() 
                        ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    required
                  />
                  {isAmountOverBudget() && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      ⚠️ Le montant dépasse le solde restant de <CFAAmount amount={budget?.remaining || 0} />
                    </p>
                  )}
                  {formData.amount && parseFloat(formData.amount) > 0 && !isAmountOverBudget() && formData.type === 'expense' && (
                    <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                      ✅ Montant valide - Solde restant après transaction : <CFAAmount amount={(budget?.remaining || 0) - parseFloat(formData.amount)} />
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransactionForm(false)
                    setEditingTransaction(null)
                    setFormData({
                      description: '',
                      category: 'Alimentation',
                      amount: '',
                      type: 'expense',
                      date: new Date().toISOString().split('T')[0]
                    })
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid()}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    isFormValid()
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {editingTransaction ? 'Modifier' : 'Créer'} la transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
