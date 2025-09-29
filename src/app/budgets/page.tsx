'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import { AuthGuard } from '@/components/auth-guard'
import { useToast } from '@/contexts/toast-context'
import type { Budget } from '@/types'

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const { showSuccess, showError, showInfo } = useToast()
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: ''
  })

  // Mock data pour le développement
  useEffect(() => {
    // Simuler un appel API
    setTimeout(() => {
      setBudgets([
        {
          id: '1',
          name: 'Personnel',
          description: 'Budget personnel mensuel',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          name: 'Expertise',
          description: 'Budget pour activité d\'expertise',
          created_at: '2024-01-10T14:30:00Z',
          updated_at: '2024-01-10T14:30:00Z'
        }
      ])
      setLoading(false)
    }, 500)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newBudget: Budget = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setBudgets([...budgets, newBudget])
    setFormData({ name: '', description: '' })
    setShowForm(false)
    showSuccess('Budget créé !', `Le budget "${newBudget.name}" a été créé avec succès.`)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    })
  }

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget)
    setEditFormData({
      name: budget.name,
      description: budget.description || ''
    })
    setShowEditDialog(true)
  }

  const handleViewDetails = (budget: Budget) => {
    setSelectedBudget(budget)
    setShowDetailDialog(true)
    showInfo('Détails du budget', `Affichage des détails de "${budget.name}"`)
  }

  const handleUpdateBudget = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBudget) return

    const updatedBudget: Budget = {
      ...editingBudget,
      name: editFormData.name,
      description: editFormData.description,
      updated_at: new Date().toISOString()
    }

    setBudgets(budgets.map(budget => 
      budget.id === editingBudget.id ? updatedBudget : budget
    ))
    setShowEditDialog(false)
    setEditingBudget(null)
    showSuccess('Budget modifié !', `Le budget "${updatedBudget.name}" a été mis à jour.`)
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
    <AuthGuard>
      <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            💰 Budgets
          </h1>
          <p className="text-gray-300 mt-2">Gérez vos différents budgets</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg shadow-yellow-400/20"
        >
          {showForm ? '❌ Annuler' : '✨ Nouveau Budget'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Créer un nouveau budget</CardTitle>
            <CardDescription>
              Ajoutez un nouveau budget pour organiser vos finances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom du budget *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="ex: Personnel, Expertise..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  type="text"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Description optionnelle du budget"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Créer le budget</Button>
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {budgets.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">💰</div>
            <h3 className="text-lg font-medium text-white mb-2">
              Aucun budget trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              Commencez par créer votre premier budget
            </p>
            <Button onClick={() => setShowForm(true)}>
              Créer mon premier budget
            </Button>
          </div>
        ) : (
          budgets.map((budget) => (
            <Card key={budget.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  {budget.name}
                </CardTitle>
                {budget.description && (
                  <CardDescription>{budget.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Créé le {formatDate(budget.created_at)}</p>
                  <div className="flex justify-between items-center pt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => handleViewDetails(budget)}
                    >
                      👁️ Voir détails
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => handleEditBudget(budget)}
                      >
                        ✏️ Modifier
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="cursor-pointer hover:bg-red-100 text-red-600 hover:text-red-700"
                        onClick={() => {
                          if (confirm(`Êtes-vous sûr de vouloir supprimer le budget "${budget.name}" ?`)) {
                            setBudgets(budgets.filter(b => b.id !== budget.id))
                            showSuccess('Budget supprimé !', `Le budget "${budget.name}" a été supprimé.`)
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
            <DialogTitle>Modifier le budget</DialogTitle>
            <DialogDescription>
              Modifiez les informations du budget
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateBudget} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="edit-name">Nom du budget *</Label>
              <Input
                id="edit-name"
                name="name"
                type="text"
                value={editFormData.name}
                onChange={handleEditInputChange}
                placeholder="ex: Personnel, Expertise..."
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                name="description"
                type="text"
                value={editFormData.description}
                onChange={handleEditInputChange}
                placeholder="Description optionnelle du budget"
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
            <DialogTitle>Détails du budget</DialogTitle>
            <DialogDescription>
              Informations complètes du budget
            </DialogDescription>
          </DialogHeader>
          {selectedBudget && (
            <div className="space-y-4 mt-4">
              <div>
                <Label className="font-semibold">Nom:</Label>
                <p className="text-gray-300">{selectedBudget.name}</p>
              </div>
              {selectedBudget.description && (
                <div>
                  <Label className="font-semibold">Description:</Label>
                  <p className="text-gray-300">{selectedBudget.description}</p>
                </div>
              )}
              <div>
                <Label className="font-semibold">Créé le:</Label>
                <p className="text-gray-300">{formatDate(selectedBudget.created_at)}</p>
              </div>
              <div>
                <Label className="font-semibold">Dernière modification:</Label>
                <p className="text-gray-300">{formatDate(selectedBudget.updated_at)}</p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => {
                    setShowDetailDialog(false)
                    handleEditBudget(selectedBudget)
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
    </AuthGuard>
  )
}
