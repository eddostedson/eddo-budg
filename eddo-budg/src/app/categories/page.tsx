'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/contexts/toast-context'
import type { Budget } from '@/types'

// Interface locale pour les catégories de ce module
interface TransactionCategory {
  id: string
  budget_id: string
  name: string
  type: 'income' | 'expense'
  created_at: string
  updated_at: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<TransactionCategory[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedBudget, setSelectedBudget] = useState<string>('')
  const { showSuccess } = useToast()
  const [editingCategory, setEditingCategory] = useState<TransactionCategory | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'income' as 'income' | 'expense',
    budget_id: ''
  })
  const [editFormData, setEditFormData] = useState({
    name: '',
    type: 'income' as 'income' | 'expense',
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
          id: '1',
          budget_id: '1',
          name: 'Salaire',
          type: 'income',
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          budget_id: '1',
          name: 'Alimentation',
          type: 'expense',
          created_at: '2024-01-15T11:00:00Z',
          updated_at: '2024-01-15T11:00:00Z'
        },
        {
          id: '3',
          budget_id: '2',
          name: 'Prestations',
          type: 'income',
          created_at: '2024-01-10T15:00:00Z',
          updated_at: '2024-01-10T15:00:00Z'
        },
        {
          id: '4',
          budget_id: '1',
          name: 'Transport',
          type: 'expense',
          created_at: '2024-01-16T09:00:00Z',
          updated_at: '2024-01-16T09:00:00Z'
        }
      ]

      setBudgets(mockBudgets)
      setCategories(mockCategories)
      setSelectedBudget(mockBudgets[0]?.id || '')
      setFormData(prev => ({ ...prev, budget_id: mockBudgets[0]?.id || '' }))
      setLoading(false)
    }, 500)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newCategory: TransactionCategory = {
      id: Date.now().toString(),
      name: formData.name,
      type: formData.type,
      budget_id: formData.budget_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setCategories([...categories, newCategory])
    setFormData({ name: '', type: 'income', budget_id: selectedBudget })
    setShowForm(false)
    showSuccess('Catégorie créée !', `La catégorie "${newCategory.name}" (${newCategory.type === 'income' ? 'Recette' : 'Dépense'}) a été créée.`)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    })
  }

  const handleEditCategory = (category: TransactionCategory) => {
    setEditingCategory(category)
    setEditFormData({
      name: category.name,
      type: category.type,
      budget_id: category.budget_id
    })
    setShowEditDialog(true)
  }

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return

    const updatedCategory: TransactionCategory = {
      ...editingCategory,
      name: editFormData.name,
      type: editFormData.type,
      budget_id: editFormData.budget_id,
      updated_at: new Date().toISOString()
    }

    setCategories(categories.map(cat => 
      cat.id === editingCategory.id ? updatedCategory : cat
    ))
    setShowEditDialog(false)
    setEditingCategory(null)
    showSuccess('Catégorie modifiée !', `La catégorie "${updatedCategory.name}" a été mise à jour.`)
  }

  const filteredCategories = categories.filter(cat => 
    selectedBudget ? cat.budget_id === selectedBudget : true
  )

  const incomeCategories = filteredCategories.filter(cat => cat.type === 'income')
  const expenseCategories = filteredCategories.filter(cat => cat.type === 'expense')

  const getBudgetName = (budgetId: string) => {
    return budgets.find(b => b.id === budgetId)?.name || 'Budget inconnu'
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            📂 Catégories
          </h1>
          <p className="text-gray-300 mt-2">Organisez vos recettes et dépenses par catégories</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-400/20"
        >
          {showForm ? '❌ Annuler' : '✨ Nouvelle Catégorie'}
        </Button>
      </div>

          {/* Sélecteur de budget */}
          <Card className="mb-6">
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

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Créer une nouvelle catégorie</CardTitle>
            <CardDescription>
              Ajoutez une catégorie de recette ou de dépense
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="name">Nom de la catégorie *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="ex: Salaire, Alimentation, Transport..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Type *</Label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="income">Recette</option>
                  <option value="expense">Dépense</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Créer la catégorie</Button>
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Catégories de recettes */}
        <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <span className="text-green-400">💵</span>
                  Catégories de Recettes
                </CardTitle>
            <CardDescription>
              {incomeCategories.length} catégorie(s) de recette
            </CardDescription>
          </CardHeader>
          <CardContent>
            {incomeCategories.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">💵</div>
                <p className="text-gray-300">Aucune catégorie de recette</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incomeCategories.map(category => (
                  <div key={category.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <h4 className="font-medium text-white">{category.name}</h4>
                      <p className="text-sm text-gray-300">
                        {getBudgetName(category.budget_id)} • {formatDate(category.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="cursor-pointer hover:bg-green-100"
                        onClick={() => handleEditCategory(category)}
                      >
                        ✏️ Modifier
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="cursor-pointer hover:bg-red-100 text-red-600 hover:text-red-700"
                        onClick={() => {
                          if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`)) {
                            setCategories(categories.filter(c => c.id !== category.id))
                            showSuccess('Catégorie supprimée !', `La catégorie "${category.name}" a été supprimée.`)
                          }
                        }}
                      >
                        🗑️ Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Catégories de dépenses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <span className="text-red-400">💸</span>
                  Catégories de Dépenses
                </CardTitle>
            <CardDescription>
              {expenseCategories.length} catégorie(s) de dépense
            </CardDescription>
          </CardHeader>
          <CardContent>
            {expenseCategories.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">💸</div>
                <p className="text-gray-300">Aucune catégorie de dépense</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expenseCategories.map(category => (
                  <div key={category.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <h4 className="font-medium text-white">{category.name}</h4>
                      <p className="text-sm text-gray-300">
                        {getBudgetName(category.budget_id)} • {formatDate(category.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="cursor-pointer hover:bg-red-100"
                        onClick={() => handleEditCategory(category)}
                      >
                        ✏️ Modifier
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="cursor-pointer hover:bg-red-200 text-red-600 hover:text-red-700"
                        onClick={() => {
                          if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`)) {
                            setCategories(categories.filter(c => c.id !== category.id))
                            showSuccess('Catégorie supprimée !', `La catégorie "${category.name}" a été supprimée.`)
                          }
                        }}
                      >
                        🗑️ Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modale de modification */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la catégorie
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCategory} className="space-y-4 mt-4">
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
              <Label htmlFor="edit-name">Nom de la catégorie *</Label>
              <Input
                id="edit-name"
                name="name"
                type="text"
                value={editFormData.name}
                onChange={handleEditInputChange}
                placeholder="ex: Salaire, Alimentation, Transport..."
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-type">Type *</Label>
              <select
                id="edit-type"
                name="type"
                value={editFormData.type}
                onChange={handleEditInputChange}
                className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="income">Recette</option>
                <option value="expense">Dépense</option>
              </select>
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
    </div>
  )
}
