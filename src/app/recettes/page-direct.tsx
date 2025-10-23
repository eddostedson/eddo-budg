// 🚀 ARCHITECTURE DIRECTE - PAGE RECETTES SIMPLIFIÉE
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Recette } from '@/lib/shared-data'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { PlusCircleIcon, EditIcon, Trash2Icon, UploadIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DirectService } from '@/lib/supabase/direct-service'

interface FormData {
  libelle: string
  montant: string
  date: string
  description: string
  statut: string
}

const RecettesPageDirect: React.FC = () => {
  const router = useRouter()
  const [recettes, setRecettes] = useState<Recette[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRecette, setEditingRecette] = useState<Recette | null>(null)
  const [formData, setFormData] = useState<FormData>({
    libelle: '',
    montant: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    statut: 'Reçue'
  })

  // 🔄 CHARGER LES RECETTES (ARCHITECTURE DIRECTE)
  const loadRecettes = async () => {
    try {
      setLoading(true)
      const data = await DirectService.getRecettes()
      setRecettes(data)
    } catch (error) {
      console.error('❌ Erreur lors du chargement des recettes:', error)
      toast.error('Erreur lors du chargement des recettes')
    } finally {
      setLoading(false)
    }
  }

  // 🔄 CHARGER AU DÉMARRAGE
  useEffect(() => {
    loadRecettes()
  }, [])

  // ➕ CRÉER UNE RECETTE (DIRECT)
  const handleCreateRecette = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.libelle || !formData.montant) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    const montant = parseFloat(formData.montant)
    if (isNaN(montant) || montant <= 0) {
      toast.error('Le montant doit être un nombre positif')
      return
    }

    try {
      const success = await DirectService.createRecette({
        libelle: formData.libelle,
        montant: montant,
        soldeDisponible: montant, // Solde initial = montant
        description: formData.description,
        date: formData.date,
        statut: formData.statut
      })

      if (success) {
        toast.success('Recette créée avec succès !')
        setShowModal(false)
        resetForm()
        await loadRecettes() // Recharger depuis la base
      } else {
        toast.error('Erreur lors de la création de la recette')
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création:', error)
      toast.error('Erreur lors de la création de la recette')
    }
  }

  // ✏️ MODIFIER UNE RECETTE (DIRECT)
  const handleUpdateRecette = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingRecette) return

    const montant = parseFloat(formData.montant)
    if (isNaN(montant) || montant <= 0) {
      toast.error('Le montant doit être un nombre positif')
      return
    }

    try {
      const success = await DirectService.updateRecette(editingRecette.id, {
        libelle: formData.libelle,
        montant: montant,
        soldeDisponible: montant, // Recalculer le solde
        description: formData.description,
        date: formData.date,
        statut: formData.statut
      })

      if (success) {
        toast.success('Recette modifiée avec succès !')
        setShowModal(false)
        setEditingRecette(null)
        resetForm()
        await loadRecettes() // Recharger depuis la base
      } else {
        toast.error('Erreur lors de la modification de la recette')
      }
    } catch (error) {
      console.error('❌ Erreur lors de la modification:', error)
      toast.error('Erreur lors de la modification de la recette')
    }
  }

  // 🗑️ SUPPRIMER UNE RECETTE (DIRECT)
  const handleDeleteRecette = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette recette ?')) return

    try {
      const success = await DirectService.deleteRecette(id)
      if (success) {
        toast.success('Recette supprimée avec succès !')
        await loadRecettes() // Recharger depuis la base
      } else {
        toast.error('Erreur lors de la suppression de la recette')
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error)
      toast.error('Erreur lors de la suppression de la recette')
    }
  }

  // 🔄 RÉINITIALISER LE FORMULAIRE
  const resetForm = () => {
    setFormData({
      libelle: '',
      montant: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      statut: 'Reçue'
    })
  }

  // ✏️ OUVRIR LE MODAL DE MODIFICATION
  const handleEditClick = (recette: Recette) => {
    setEditingRecette(recette)
    setFormData({
      libelle: recette.libelle,
      montant: recette.montant.toString(),
      date: recette.date,
      description: recette.description,
      statut: recette.statut
    })
    setShowModal(true)
  }

  // 📊 CALCULER LE TOTAL DISPONIBLE
  const totalDisponible = recettes.reduce((total, recette) => total + recette.soldeDisponible, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des recettes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-8 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-extrabold mb-2">Recettes</h1>
            <p className="text-green-100">Gérez toutes vos entrées d'argent</p>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setEditingRecette(null)
              setShowModal(true)
            }}
            className="bg-white text-green-600 hover:bg-green-100 transition-colors duration-300 shadow-md flex items-center space-x-2 px-6 py-3 rounded-lg"
          >
            <PlusCircleIcon className="h-5 w-5" />
            <span>Nouvelle Recette</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-l-4 border-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Recettes</CardTitle>
              <span className="text-2xl">💰</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{formatCurrency(recettes.reduce((total, r) => total + r.montant, 0))}</div>
              <p className="text-xs text-gray-500 mt-1">Total de toutes les recettes</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg border-l-4 border-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Solde Disponible</CardTitle>
              <span className="text-2xl">💎</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{formatCurrency(totalDisponible)}</div>
              <p className="text-xs text-gray-500 mt-1">Montant disponible</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg border-l-4 border-gray-400">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Nombre de Recettes</CardTitle>
              <span className="text-2xl">📊</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-700">{recettes.length}</div>
              <p className="text-xs text-gray-500 mt-1">Total des enregistrements</p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des Recettes */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Liste des Recettes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recettes.map(recette => (
            <Card key={recette.id} className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                <CardTitle className="text-lg font-bold">{recette.libelle}</CardTitle>
                <Badge variant="secondary" className="bg-white text-green-600 w-fit">
                  {recette.statut}
                </Badge>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Montant initial:</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(recette.montant)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Solde disponible:</span>
                    <span className="font-bold text-green-600 text-lg">{formatCurrency(recette.soldeDisponible)}</span>
                  </div>
                  {recette.description && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Description:</span>
                      <p className="mt-1">{recette.description}</p>
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Créé le: {new Date(recette.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(recette)}
                    className="flex-1"
                  >
                    <EditIcon className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteRecette(recette.id)}
                    className="flex-1"
                  >
                    <Trash2Icon className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {recettes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune recette enregistrée</h3>
            <p className="text-gray-500 mb-6">Commencez par créer votre première recette</p>
            <Button
              onClick={() => {
                resetForm()
                setEditingRecette(null)
                setShowModal(true)
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              Créer une recette
            </Button>
          </div>
        )}
      </div>

      {/* Modal Création/Modification */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[500px] p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">
              {editingRecette ? 'Modifier la Recette' : 'Nouvelle Recette'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {editingRecette ? 'Modifiez les informations de la recette.' : 'Enregistrez une nouvelle entrée d\'argent.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editingRecette ? handleUpdateRecette : handleCreateRecette} className="space-y-4">
            <div>
              <label htmlFor="libelle" className="block text-sm font-medium text-gray-700 mb-1">
                Libellé <span className="text-red-500">*</span>
              </label>
              <Input
                id="libelle"
                value={formData.libelle}
                onChange={(e) => setFormData({...formData, libelle: e.target.value})}
                placeholder="Ex: Salaire, Vente, Subvention"
                required
              />
            </div>

            <div>
              <label htmlFor="montant" className="block text-sm font-medium text-gray-700 mb-1">
                Montant <span className="text-red-500">*</span>
              </label>
              <Input
                id="montant"
                type="number"
                step="0.01"
                value={formData.montant}
                onChange={(e) => setFormData({...formData, montant: e.target.value})}
                placeholder="Ex: 100000"
                required
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>

            <div>
              <label htmlFor="statut" className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                id="statut"
                value={formData.statut}
                onChange={(e) => setFormData({...formData, statut: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="Reçue">Reçue</option>
                <option value="En attente">En attente</option>
                <option value="Annulée">Annulée</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Détails supplémentaires sur la recette"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {editingRecette ? 'Modifier' : 'Créer'} Recette
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RecettesPageDirect
