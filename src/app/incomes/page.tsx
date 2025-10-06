'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useToast } from '@/contexts/toast-context'
import type { Transaction, Category, Budget } from '@/types'

export default function IncomesPage() {
  const [incomes, setIncomes] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedBudget, setSelectedBudget] = useState<string>('')
  const { showSuccess, showInfo } = useToast()
  const [editingIncome, setEditingIncome] = useState<Transaction | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedIncome, setSelectedIncome] = useState<Transaction | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    category_id: '',
    budget_id: ''
  })
  const [editFormData, setEditFormData] = useState({
    name: '',
    amount: '',
    date: '',
    description: '',
    category_id: '',
    budget_id: ''
  })

  // Mock data pour le développement
  useEffect(() => {
    setTimeout(() => {
      const mockBudgets: Budget[] = [
        {
          id: '1',
          name: 'Personnel',
          description: 'Budget personnel mensuel',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        } as unknown as Budget,
        {
          id: '2',
          name: 'Expertise',
          description: 'Budget pour activité d\'expertise',
          created_at: '2024-01-10T14:30:00Z',
          updated_at: '2024-01-10T14:30:00Z'
        } as unknown as Budget
      ]

      const mockCategories: Category[] = [
        {
          id: '1',
          // @ts-expect-error champs supplémentaires pour le mock
          budget_id: '1',
          name: 'Salaire',
          // @ts-expect-error champ supplémentaire pour le mock
          type: 'income',
          created_at: '2024-01-15T10:30:00Z',
          // @ts-expect-error champ supplémentaire pour le mock
          updated_at: '2024-01-15T10:30:00Z'
        } as unknown as Category,
        {
          id: '3',
          // @ts-expect-error
          budget_id: '2',
          name: 'Prestations',
          // @ts-expect-error
          type: 'income',
          created_at: '2024-01-10T15:00:00Z',
          // @ts-expect-error
          updated_at: '2024-01-10T15:00:00Z'
        } as unknown as Category,
        {
          id: '5',
          // @ts-expect-error
          budget_id: '1',
          name: 'Primes',
          // @ts-expect-error
          type: 'income',
          created_at: '2024-01-16T09:00:00Z',
          // @ts-expect-error
          updated_at: '2024-01-16T09:00:00Z'
        } as unknown as Category
      ]

      const mockIncomes: Transaction[] = [
        {
          id: 1,
          // @ts-expect-error champ supplémentaire pour le mock
          budget_id: '1',
          // @ts-expect-error champ supplémentaire pour le mock
          category_id: '1',
          // @ts-expect-error champ supplémentaire pour le mock
          name: 'Salaire Janvier',
          amount: 3500,
          date: '2024-01-31',
          // @ts-expect-error champ supplémentaire pour le mock
          description: 'Salaire mensuel',
          created_at: '2024-01-31T10:00:00Z',
          updated_at: '2024-01-31T10:00:00Z',
          type: 'income',
          status: 'completed'
        } as unknown as Transaction,
        {
          id: 2,
          // @ts-expect-error
          budget_id: '2',
          // @ts-expect-error
          category_id: '3',
          // @ts-expect-error
          name: 'Prestation Client A',
          amount: 2500,
          date: '2024-01-15',
          // @ts-expect-error
          description: 'Développement site web',
          created_at: '2024-01-15T14:00:00Z',
          updated_at: '2024-01-15T14:00:00Z',
          type: 'income',
          status: 'completed'
        } as unknown as Transaction,
        {
          id: 3,
          // @ts-expect-error
          budget_id: '1',
          // @ts-expect-error
          category_id: '5',
          // @ts-expect-error
          name: 'Prime performance',
          amount: 500,
          date: '2024-01-31',
          // @ts-expect-error
          description: 'Prime trimestrielle',
          created_at: '2024-01-31T16:00:00Z',
          updated_at: '2024-01-31T16:00:00Z',
          type: 'income',
          status: 'completed'
        } as unknown as Transaction
      ]

      setBudgets(mockBudgets)
      setCategories(mockCategories)
      setIncomes(mockIncomes)
      setSelectedBudget(mockBudgets[0]?.id || '')
      setFormData(prev => ({ ...prev, budget_id: mockBudgets[0]?.id || '' }))
      setLoading(false)
    }, 500)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newIncome: Transaction = {
      id: Date.now(),
      // @ts-expect-error champs UI spécifiques au mock
      name: formData.name,
      amount: parseFloat(formData.amount),
      date: formData.date,
      // @ts-expect-error
      description: formData.description,
      // @ts-expect-error
      category_id: formData.category_id,
      // @ts-expect-error
      budget_id: formData.budget_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      type: 'income',
      status: 'completed'
    } as unknown as Transaction

    setIncomes([...incomes, newIncome])
    setFormData({
      name: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      category_id: '',
      budget_id: selectedBudget
    })
    setShowForm(false)
    showSuccess('Recette créée !', `La recette "${(newIncome as any).name}" de ${formatCurrency(newIncome.amount)} a été créée.`)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    })
  }

  const handleEditIncome = (income: Transaction) => {
    setEditingIncome(income)
    setEditFormData({
      // @ts-expect-error champ du mock
      name: (income as any).name,
      amount: income.amount.toString(),
      date: income.date,
      // @ts-expect-error
      description: (income as any).description || '',
      // @ts-expect-error
      category_id: (income as any).category_id,
      // @ts-expect-error
      budget_id: (income as any).budget_id
    })
    setShowEditDialog(true)
  }

  const handleViewDetails = (income: Transaction) => {
    setSelectedIncome(income)
    setShowDetailDialog(true)
    // @ts-expect-error champ du mock
    showInfo('Détails de la recette', `Affichage des détails de "${(income as any).name}"`)
  }

  const handleUpdateIncome = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingIncome) return

    const updatedIncome: Transaction = {
      ...editingIncome,
      // @ts-expect-error
      name: editFormData.name,
      amount: parseFloat(editFormData.amount),
      date: editFormData.date,
      // @ts-expect-error
      description: editFormData.description,
      // @ts-expect-error
      category_id: editFormData.category_id,
      // @ts-expect-error
      budget_id: editFormData.budget_id,
      updated_at: new Date().toISOString()
    } as unknown as Transaction

    setIncomes(incomes.map(income => 
      // @ts-expect-error
      (income as any).id === (editingIncome as any).id ? updatedIncome : income
    ))
    setShowEditDialog(false)
    setEditingIncome(null)
    // @ts-expect-error
    showSuccess('Recette modifiée !', `La recette "${(updatedIncome as any).name}" a été mise à jour.`)
  }

  const filteredIncomes = incomes.filter(income => 
    // @ts-expect-error
    selectedBudget ? (income as any).budget_id === selectedBudget : true
  )

  const getBudgetName = (budgetId: string) => {
    // @ts-expect-error
    return (budgets.find(b => (b as any).id === budgetId) as any)?.name || 'Budget inconnu'
  }

  const getCategoryName = (categoryId: string) => {
    // @ts-expect-error
    return (categories.find(c => (c as any).id === categoryId) as any)?.name || 'Catégorie inconnue'
  }

  const getIncomeCategories = () => {
    // @ts-expect-error
    return categories.filter(cat => (cat as any).type === 'income' && (selectedBudget ? (cat as any).budget_id === selectedBudget : true))
  }

  const getTotalIncome = () => {
    return filteredIncomes.reduce((sum, income) => sum + income.amount, 0)
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            💵 Recettes
          </h1>
          <p className="text-gray-300 mt-2">Gérez vos sources de revenus</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg shadow-green-400/20"
        >
          {showForm ? '❌ Annuler' : '✨ Nouvelle Recette'}
        </Button>
      </div>

      {/* Sélecteur de budget et résumé */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
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
                Tous les budgets
              </Button>
              {budgets.map(budget => (
                // @ts-expect-error
                <Button
                  key={(budget as any).id}
                  variant={selectedBudget === (budget as any).id ? 'default' : 'outline'}
                  onClick={() => setSelectedBudget((budget as any).id)}
                  size="sm"
                  className="cursor-pointer"
                >
                  {(budget as any).name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <span className="text-green-400">💵</span>
              Total des Recettes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">
              {formatCurrency(getTotalIncome())}
            </div>
            <p className="text-sm text-gray-300 mt-1">
              {filteredIncomes.length} recette(s)
              {selectedBudget && ` • ${getBudgetName(selectedBudget)}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Ajouter une nouvelle recette</CardTitle>
            <CardDescription>
              Enregistrez une nouvelle source de revenus
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                      // @ts-expect-error
                      <option key={(budget as any).id} value={(budget as any).id}>
                        {(budget as any).name}
                      </option>
                    ))}
                  </select>
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
                    {getIncomeCategories().map(category => (
                      // @ts-expect-error
                      <option key={(category as any).id} value={(category as any).id}>
                        {(category as any).name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Nom de la recette *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="ex: Salaire janvier, Prestation client..."
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
                <Button type="submit">Ajouter la recette</Button>
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

      {/* Liste des recettes */}
      <div className="space-y-4">
        {filteredIncomes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">💵</div>
              <h3 className="text-lg font-medium text-white mb-2">
                Aucune recette trouvée
              </h3>
              <p className="text-gray-300 mb-4">
                Commencez par ajouter votre première recette
              </p>
              <Button onClick={() => setShowForm(true)}>
                Ajouter ma première recette
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredIncomes.map((income) => (
            // @ts-expect-error
            <Card key={(income as any).id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">💵</span>
                      <div>
                        {/* @ts-expect-error */}
                        <h3 className="font-semibold text-lg">{(income as any).name}</h3>
                        <p className="text-sm text-gray-300">
                          {/* @ts-expect-error */}
                          {getCategoryName((income as any).category_id)} • {getBudgetName((income as any).budget_id)}
                        </p>
                      </div>
                    </div>
                    {
                      // @ts-expect-error
                      (income as any).description && (
                        // @ts-expect-error
                        <p className="text-gray-300 text-sm mb-2">{(income as any).description}</p>
                      )
                    }
                    <p className="text-xs text-gray-500">
                      {formatDate(income.date)} • {/* @ts-expect-error */}Créé le {formatDate((income as any).created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {formatCurrency(income.amount)}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => handleViewDetails(income)}
                      >
                        👁️ Voir détails
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => handleEditIncome(income)}
                      >
                        ✏️ Modifier
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="cursor-pointer hover:bg-red-100 text-red-600 hover:text-red-700"
                        onClick={() => {
                          // @ts-expect-error
                          if (confirm(`Êtes-vous sûr de vouloir supprimer la recette "${(income as any).name}" ?`)) {
                            // @ts-expect-error
                            setIncomes(incomes.filter(i => (i as any).id !== (income as any).id))
                            // @ts-expect-error
                            showSuccess('Recette supprimée !', `La recette "${(income as any).name}" a été supprimée.`)
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
            <DialogTitle>Modifier la recette</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la recette
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateIncome} className="space-y-4 mt-4">
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
                    // @ts-expect-error
                    <option key={(budget as any).id} value={(budget as any).id}>
                      {(budget as any).name}
                    </option>
                  ))}
                </select>
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
                  {categories.filter(cat => 
                    // @ts-expect-error
                    (cat as any).type === 'income'
                  ).map(category => (
                    // @ts-expect-error
                    <option key={(category as any).id} value={(category as any).id}>
                      {(category as any).name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="edit-name">Nom de la recette *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  type="text"
                  value={editFormData.name}
                  onChange={handleEditInputChange}
                  placeholder="ex: Salaire janvier, Prestation client..."
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
            <DialogTitle>Détails de la recette</DialogTitle>
            <DialogDescription>
              Informations complètes de la recette
            </DialogDescription>
          </DialogHeader>
          {selectedIncome && (
            <div className="space-y-4 mt-4">
              <div>
                <Label className="font-semibold">Nom:</Label>
                {/* @ts-expect-error */}
                <p className="text-gray-300">{(selectedIncome as any).name}</p>
              </div>
              <div>
                <Label className="font-semibold">Montant:</Label>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedIncome.amount)}</p>
              </div>
              <div>
                <Label className="font-semibold">Date:</Label>
                <p className="text-gray-300">{formatDate(selectedIncome.date)}</p>
              </div>
              <div>
                <Label className="font-semibold">Budget:</Label>
                {/* @ts-expect-error */}
                <p className="text-gray-300">{getBudgetName((selectedIncome as any).budget_id)}</p>
              </div>
              <div>
                <Label className="font-semibold">Catégorie:</Label>
                {/* @ts-expect-error */}
                <p className="text-gray-300">{getCategoryName((selectedIncome as any).category_id)}</p>
              </div>
              {
                // @ts-expect-error
                (selectedIncome as any).description && (
                  // @ts-expect-error
                  <div>
                    <Label className="font-semibold">Description:</Label>
                    {/* @ts-expect-error */}
                    <p className="text-gray-300">{(selectedIncome as any).description}</p>
                  </div>
                )
              }
              <div>
                <Label className="font-semibold">Créé le:</Label>
                {/* @ts-expect-error */}
                <p className="text-gray-300">{formatDate((selectedIncome as any).created_at)}</p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => {
                    setShowDetailDialog(false)
                    handleEditIncome(selectedIncome)
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
