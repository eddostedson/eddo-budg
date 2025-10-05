'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useToast } from '@/contexts/toast-context'
import type { Budget } from '@/lib/shared-data'

// Interfaces locales pour ce module
interface Expense {
  id: string
  budget_id: string
  category: string
  amount: number
  date?: string
  description: string
  created_at: string
  updated_at: string
}

interface Income {
  id: string
  budget_id: string
  category: string
  amount: number
  description: string
  created_at: string
  updated_at: string
}

interface TransactionCategory {
  id: string
  budget_id: string
  name: string
  type: 'income' | 'expense'
  created_at: string
  updated_at: string
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [categories, setCategories] = useState<TransactionCategory[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedBudget, setSelectedBudget] = useState<string>('')
  const [selectedIncome, setSelectedIncome] = useState<string>('')
  const { showSuccess, showInfo, showWarning } = useToast()
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    category_id: '',
    income_id: '',
    budget_id: ''
  })
  const [editFormData, setEditFormData] = useState({
    name: '',
    amount: '',
    date: '',
    description: '',
    category_id: '',
    income_id: '',
    budget_id: ''
  })
  const [formError, setFormError] = useState<string>('')
  const [editFormError, setEditFormError] = useState<string>('')

  // Mock data pour le développement
  useEffect(() => {
    setTimeout(() => {
      const mockBudgets: Budget[] = [
        {
          id: '1',
          name: 'Personnel',
          description: 'Budget personnel mensuel',
          amount: 500000,
          spent: 0,
          remaining: 500000,
          period: 'Mensuel',
          color: 'bg-blue-500',
          source: 'Salaire',
          type: 'principal',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          createdAt: new Date('2024-01-15T10:00:00Z')
        },
        {
          id: '2',
          name: 'Expertise',
          description: 'Budget pour activité d\'expertise',
          amount: 200000,
          spent: 0,
          remaining: 200000,
          period: 'Mensuel',
          color: 'bg-green-500',
          source: 'Freelance',
          type: 'secondaire',
          created_at: '2024-01-10T14:30:00Z',
          updated_at: '2024-01-10T14:30:00Z',
          createdAt: new Date('2024-01-10T14:30:00Z')
        }
      ]

      const mockCategories: TransactionCategory[] = [
        {
          id: '2',
          budget_id: '1',
          name: 'Alimentation',
          type: 'expense',
          created_at: '2024-01-15T11:00:00Z',
          updated_at: '2024-01-15T11:00:00Z'
        },
        {
          id: '4',
          budget_id: '1',
          name: 'Transport',
          type: 'expense',
          created_at: '2024-01-16T09:00:00Z',
          updated_at: '2024-01-16T09:00:00Z'
        },
        {
          id: '6',
          budget_id: '2',
          name: 'Matériel',
          type: 'expense',
          created_at: '2024-01-10T16:00:00Z',
          updated_at: '2024-01-10T16:00:00Z'
        }
      ]

      const mockIncomes: Income[] = [
        {
          id: '1',
          budget_id: '1',
          category: 'Salaire',
          amount: 3500,
          description: 'Salaire mensuel',
          created_at: '2024-01-31T10:00:00Z',
          updated_at: '2024-01-31T10:00:00Z'
        },
        {
          id: '2',
          budget_id: '2',
          category: 'Prestations',
          amount: 2500,
          description: 'Développement site web',
          created_at: '2024-01-15T14:00:00Z',
          updated_at: '2024-01-15T14:00:00Z'
        }
      ]

      const mockExpenses: Expense[] = [
        {
          id: '1',
          budget_id: '1',
          category: 'Alimentation',
          amount: 150,
          description: 'Courses hebdomadaires',
          created_at: '2024-02-01T10:00:00Z',
          updated_at: '2024-02-01T10:00:00Z'
        },
        {
          id: '2',
          budget_id: '1',
          category: 'Transport',
          amount: 80,
          description: 'Plein d\'essence',
          created_at: '2024-02-02T15:00:00Z',
          updated_at: '2024-02-02T15:00:00Z'
        }
      ]

      setBudgets(mockBudgets)
      setCategories(mockCategories)
      setIncomes(mockIncomes)
      setExpenses(mockExpenses)
      setSelectedBudget(mockBudgets[0]?.id || '')
      setFormData(prev => ({ ...prev, budget_id: mockBudgets[0]?.id || '' }))
      setLoading(false)
    }, 500)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    
    const amount = parseFloat(formData.amount)
    const income = incomes.find(i => i.id === formData.income_id)
    
    if (!income) {
      setFormError('Veuillez sélectionner une recette valide')
      return
    }

    const remaining = getIncomeRemaining(income.id)
    
    if (amount > remaining) {
      setFormError(`Montant trop élevé. Reste disponible: ${formatCurrency(remaining)}`)
      showWarning('Budget dépassé !', `Le montant dépasse le budget disponible de ${formatCurrency(remaining)}`)
      return
    }
    
    const newExpense: Expense = {
      id: Date.now().toString(),
      budget_id: formData.budget_id,
      category: formData.name || 'Autre',
      amount: amount,
      description: formData.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setExpenses([...expenses, newExpense])
    setFormData({
      name: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      category_id: '',
      income_id: '',
      budget_id: selectedBudget
    })
    setShowForm(false)
    showSuccess('Dépense créée !', `La dépense "${newExpense.category}" de ${formatCurrency(newExpense.amount)} a été créée.`)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setFormError('')
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    })
    setEditFormError('')
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setEditFormData({
      name: expense.category,
      amount: expense.amount.toString(),
      date: expense.date || new Date().toISOString().split('T')[0],
      description: expense.description || '',
      category_id: '',
      income_id: '',
      budget_id: expense.budget_id
    })
    setShowEditDialog(true)
  }

  const handleViewDetails = (expense: Expense) => {
    setSelectedExpense(expense)
    setShowDetailDialog(true)
    showInfo('Détails de la dépense', `Affichage des détails de "${expense.category}"`)
  }

  const handleUpdateExpense = (e: React.FormEvent) => {
    e.preventDefault()
    setEditFormError('')
    
    if (!editingExpense) return

    const amount = parseFloat(editFormData.amount)
    const income = incomes.find(i => i.id === editFormData.income_id)
    
    if (!income) {
      setEditFormError('Veuillez sélectionner une recette valide')
      return
    }

    // Calculer le remaining en excluant la dépense actuelle
    const otherExpenses = expenses.filter(exp => exp.id !== editingExpense.id && exp.income_id === income.id)
    const totalOtherExpenses = otherExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    const remaining = income.amount - totalOtherExpenses
    
    if (amount > remaining) {
      setEditFormError(`Montant trop élevé. Reste disponible: ${formatCurrency(remaining)}`)
      showWarning('Budget dépassé !', `Le montant dépasse le budget disponible de ${formatCurrency(remaining)}`)
      return
    }

    const updatedExpense: Expense = {
      ...editingExpense,
      name: editFormData.name,
      amount: amount,
      date: editFormData.date,
      description: editFormData.description,
      category_id: editFormData.category_id,
      income_id: editFormData.income_id,
      budget_id: editFormData.budget_id,
      updated_at: new Date().toISOString()
    }

    setExpenses(expenses.map(expense => 
      expense.id === editingExpense.id ? updatedExpense : expense
    ))
    setShowEditDialog(false)
    setEditingExpense(null)
    showSuccess('Dépense modifiée !', `La dépense "${updatedExpense.name}" a été mise à jour.`)
  }

  const getIncomeRemaining = (incomeId: string) => {
    const income = incomes.find(i => i.id === incomeId)
    if (!income) return 0
    
    const totalExpenses = expenses
      .filter(expense => expense.income_id === incomeId)
      .reduce((sum, expense) => sum + expense.amount, 0)
    
    return income.amount - totalExpenses
  }

  const filteredExpenses = expenses.filter(expense => {
    if (selectedBudget && expense.budget_id !== selectedBudget) return false
    if (selectedIncome && expense.income_id !== selectedIncome) return false
    return true
  })

  const getBudgetName = (budgetId: string) => {
    return budgets.find(b => b.id === budgetId)?.name || 'Budget inconnu'
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Catégorie inconnue'
  }

  const getIncomeName = (incomeId: string) => {
    return incomes.find(i => i.id === incomeId)?.name || 'Recette inconnue'
  }

  const getExpenseCategories = () => {
    return categories.filter(cat => 
      cat.type === 'expense' && 
      (selectedBudget ? cat.budget_id === selectedBudget : true)
    )
  }

  const getAvailableIncomes = () => {
    return incomes.filter(income => 
      selectedBudget ? income.budget_id === selectedBudget : true
    )
  }

  const getTotalExpenses = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent">
            💸 Dépenses
          </h1>
          <p className="text-gray-300 mt-2">Suivez vos dépenses et contrôlez votre budget</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg shadow-red-400/20"
        >
          {showForm ? '❌ Annuler' : '✨ Nouvelle Dépense'}
        </Button>
      </div>

      {/* Filtres et résumé */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-white">Filtrer par budget</CardTitle>
              </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedBudget === '' ? 'default' : 'outline'}
                onClick={() => setSelectedBudget('')}
                size="sm"
                className="cursor-pointer"
              >
                Tous
              </Button>
              {budgets.map(budget => (
                <Button
                  key={budget.id}
                  variant={selectedBudget === budget.id ? 'default' : 'outline'}
                  onClick={() => setSelectedBudget(budget.id)}
                  size="sm"
                  className="cursor-pointer"
                >
                  {budget.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-white">Filtrer par recette</CardTitle>
              </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedIncome === '' ? 'default' : 'outline'}
                onClick={() => setSelectedIncome('')}
                size="sm"
                className="cursor-pointer"
              >
                Toutes
              </Button>
              {getAvailableIncomes().map(income => (
                <Button
                  key={income.id}
                  variant={selectedIncome === income.id ? 'default' : 'outline'}
                  onClick={() => setSelectedIncome(income.id)}
                  size="sm"
                  className="text-xs cursor-pointer"
                >
                  {income.name.substring(0, 15)}...
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <span className="text-red-400">💸</span>
              Total des Dépenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">
              {formatCurrency(getTotalExpenses())}
            </div>
            <p className="text-sm text-gray-300 mt-1">
              {filteredExpenses.length} dépense(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Résumé des recettes avec remaining */}
      {selectedBudget && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-white">État des recettes - {getBudgetName(selectedBudget)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getAvailableIncomes().map(income => {
                const remaining = getIncomeRemaining(income.id)
                const usedPercentage = ((income.amount - remaining) / income.amount) * 100
                
                return (
                  <div key={income.id} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{income.name}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total:</span>
                        <span className="font-medium">{formatCurrency(income.amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Utilisé:</span>
                        <span className="text-red-600">{formatCurrency(income.amount - remaining)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>Reste:</span>
                        <span className={remaining > 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(remaining)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${usedPercentage >= 100 ? 'bg-red-500' : usedPercentage >= 80 ? 'bg-orange-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(usedPercentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Ajouter une nouvelle dépense</CardTitle>
            <CardDescription>
              Enregistrez une nouvelle dépense liée à une recette
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{formError}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="budget_id">Budget *</Label>
                  <select
                    id="budget_id"
                    name="budget_id"
                    value={formData.budget_id}
                    onChange={handleInputChange}
                    className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    <option value="">Sélectionner un budget</option>
                    {budgets.map(budget => (
                      <option key={budget.id} value={budget.id}>
                        {budget.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="income_id">Recette source *</Label>
                  <select
                    id="income_id"
                    name="income_id"
                    value={formData.income_id}
                    onChange={handleInputChange}
                    className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    <option value="">Sélectionner une recette</option>
                    {getAvailableIncomes().map(income => (
                      <option key={income.id} value={income.id}>
                        {income.name} - Reste: {formatCurrency(getIncomeRemaining(income.id))}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="category_id">Catégorie *</Label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  {getExpenseCategories().map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Nom de la dépense *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="ex: Courses, Essence, Matériel..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Montant (€) *</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                  />
                  {formData.income_id && formData.amount && (
                    <p className="text-xs text-gray-300 mt-1">
                      Reste après cette dépense: {formatCurrency(getIncomeRemaining(formData.income_id) - parseFloat(formData.amount || '0'))}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Description optionnelle..."
                  className="w-full min-h-[80px] px-3 py-2 text-sm border border-input bg-background rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Ajouter la dépense</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des dépenses */}
      <div className="space-y-4">
        {filteredExpenses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">💸</div>
              <h3 className="text-lg font-medium text-white mb-2">
                Aucune dépense trouvée
              </h3>
              <p className="text-gray-300 mb-4">
                Commencez par ajouter votre première dépense
              </p>
              <Button onClick={() => setShowForm(true)}>
                Ajouter ma première dépense
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredExpenses.map((expense) => (
            <Card key={expense.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">💸</span>
                      <div>
                        <h3 className="font-semibold text-lg">{expense.category}</h3>
                        <p className="text-sm text-gray-300">
                          {getCategoryName(expense.category_id)} • {getBudgetName(expense.budget_id)}
                        </p>
                        <p className="text-sm text-blue-600">
                          Depuis: {getIncomeName(expense.income_id)}
                        </p>
                      </div>
                    </div>
                    {expense.description && (
                      <p className="text-gray-300 text-sm mb-2">{expense.description}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {formatDate(expense.date)} • Créé le {formatDate(expense.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600 mb-2">
                      -{formatCurrency(expense.amount)}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => handleViewDetails(expense)}
                      >
                        👁️ Voir détails
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => handleEditExpense(expense)}
                      >
                        ✏️ Modifier
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="cursor-pointer hover:bg-red-100 text-red-600 hover:text-red-700"
                        onClick={() => {
                          if (confirm(`Êtes-vous sûr de vouloir supprimer la dépense "${expense.category}" ?`)) {
                            setExpenses(expenses.filter(e => e.id !== expense.id))
                            showSuccess('Dépense supprimée !', `La dépense "${expense.category}" a été supprimée.`)
                          }
                        }}
                      >
                        🗑️ Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modale de modification */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la dépense</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la dépense
            </DialogDescription>
          </DialogHeader>
          {editFormError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{editFormError}</p>
            </div>
          )}
          <form onSubmit={handleUpdateExpense} className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="edit-budget_id">Budget *</Label>
                <select
                  id="edit-budget_id"
                  name="budget_id"
                  value={editFormData.budget_id}
                  onChange={handleEditInputChange}
                  className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">Sélectionner un budget</option>
                  {budgets.map(budget => (
                    <option key={budget.id} value={budget.id}>
                      {budget.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="edit-income_id">Recette source *</Label>
                <select
                  id="edit-income_id"
                  name="income_id"
                  value={editFormData.income_id}
                  onChange={handleEditInputChange}
                  className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">Sélectionner une recette</option>
                  {incomes.map(income => (
                    <option key={income.id} value={income.id}>
                      {income.name} - Reste: {formatCurrency(getIncomeRemaining(income.id))}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-category_id">Catégorie *</Label>
              <select
                id="edit-category_id"
                name="category_id"
                value={editFormData.category_id}
                onChange={handleEditInputChange}
                className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.filter(cat => cat.type === 'expense').map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="edit-name">Nom de la dépense *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  type="text"
                  value={editFormData.name}
                  onChange={handleEditInputChange}
                  placeholder="ex: Courses, Essence, Matériel..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-amount">Montant (€) *</Label>
                <Input
                  id="edit-amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editFormData.amount}
                  onChange={handleEditInputChange}
                  placeholder="0.00"
                  required
                />
                {editFormData.income_id && editFormData.amount && editingExpense && (
                  <p className="text-xs text-gray-600 mt-1">
                    Reste après cette modification: {formatCurrency(
                      (() => {
                        const income = incomes.find(i => i.id === editFormData.income_id)
                        if (!income) return 0
                        const otherExpenses = expenses.filter(exp => exp.id !== editingExpense.id && exp.income_id === income.id)
                        const totalOtherExpenses = otherExpenses.reduce((sum, exp) => sum + exp.amount, 0)
                        return income.amount - totalOtherExpenses - parseFloat(editFormData.amount || '0')
                      })()
                    )}
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="edit-date">Date *</Label>
              <Input
                id="edit-date"
                name="date"
                type="date"
                value={editFormData.date}
                onChange={handleEditInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <textarea
                id="edit-description"
                name="description"
                value={editFormData.description}
                onChange={handleEditInputChange}
                placeholder="Description optionnelle..."
                className="w-full min-h-[80px] px-3 py-2 text-sm border border-input bg-background rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit">Sauvegarder</Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
              >
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modale de détails */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de la dépense</DialogTitle>
            <DialogDescription>
              Informations complètes de la dépense
            </DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4 mt-4">
              <div>
                <Label className="font-semibold">Nom:</Label>
                <p className="text-gray-300">{selectedExpense.name}</p>
              </div>
              <div>
                <Label className="font-semibold">Montant:</Label>
                <p className="text-2xl font-bold text-red-600">-{formatCurrency(selectedExpense.amount)}</p>
              </div>
              <div>
                <Label className="font-semibold">Date:</Label>
                <p className="text-gray-300">{formatDate(selectedExpense.date)}</p>
              </div>
              <div>
                <Label className="font-semibold">Budget:</Label>
                <p className="text-gray-300">{getBudgetName(selectedExpense.budget_id)}</p>
              </div>
              <div>
                <Label className="font-semibold">Catégorie:</Label>
                <p className="text-gray-300">{getCategoryName(selectedExpense.category_id)}</p>
              </div>
              <div>
                <Label className="font-semibold">Recette source:</Label>
                <p className="text-gray-300">{getIncomeName(selectedExpense.income_id)}</p>
              </div>
              {selectedExpense.description && (
                <div>
                  <Label className="font-semibold">Description:</Label>
                  <p className="text-gray-300">{selectedExpense.description}</p>
                </div>
              )}
              <div>
                <Label className="font-semibold">Créé le:</Label>
                <p className="text-gray-300">{formatDate(selectedExpense.created_at)}</p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => {
                    setShowDetailDialog(false)
                    handleEditExpense(selectedExpense)
                  }}
                >
                  ✏️ Modifier
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDetailDialog(false)}
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
