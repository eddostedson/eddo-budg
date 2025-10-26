// 🎨 PAGE DÉTAILS RECETTE - OPÉRATIONS ET HISTORIQUE
'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useRecettes } from '@/contexts/recette-context'
import { useDepenses } from '@/contexts/depense-context'
import { Recette, Depense } from '@/lib/shared-data'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeftIcon, PlusIcon, ReceiptIcon, CalendarIcon, DollarSignIcon, TrendingDownIcon, EditIcon, TrashIcon, AlertTriangleIcon, CheckCircleIcon, SaveIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'

const RecetteDetailsPage: React.FC = () => {
  const params = useParams()
  const router = useRouter()
  const { recettes, loading: recettesLoading, refreshRecettes } = useRecettes()
  const { depenses, loading: depensesLoading, addDepense, updateDepense, deleteDepense, refreshDepenses } = useDepenses()
  
  const [recette, setRecette] = useState<Recette | null>(null)
  const [depensesLiees, setDepensesLiees] = useState<Depense[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [depenseToDelete, setDepenseToDelete] = useState<Depense | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [depenseToEdit, setDepenseToEdit] = useState<Depense | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    libelle: '',
    montant: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    categorie: ''
  })
  const [editForm, setEditForm] = useState({
    libelle: '',
    montant: '',
    date: '',
    description: '',
    categorie: ''
  })

  useEffect(() => {
    if (!recettesLoading && !depensesLoading) {
      const recetteId = params.id as string
      const foundRecette = recettes.find(r => r.id === recetteId)
      
      if (foundRecette) {
        setRecette(foundRecette)
        const depensesLiees = depenses.filter(d => d.recetteId === recetteId)
        setDepensesLiees(depensesLiees)
      } else {
        toast.error("Recette non trouvée")
        router.push('/recettes')
      }
      setLoading(false)
    }
  }, [recettes, depenses, recettesLoading, depensesLoading, params.id, router])

  const handleBack = () => {
    router.push('/recettes')
  }

  const handleAddDepense = () => {
    setCreateForm({
      libelle: '',
      montant: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      categorie: ''
    })
    setShowCreateModal(true)
  }

  const handleEditDepense = (depense: Depense) => {
    setDepenseToEdit(depense)
    setEditForm({
      libelle: depense.libelle,
      montant: depense.montant.toString(),
      date: depense.date,
      description: depense.description || '',
      categorie: depense.categorie || ''
    })
    setShowEditModal(true)
  }

  const handleDeleteDepense = (depense: Depense) => {
    setDepenseToDelete(depense)
    setShowDeleteModal(true)
  }

  const confirmDeleteDepense = async () => {
    if (!depenseToDelete) return
    
    try {
      console.log('🔄 Suppression de dépense:', depenseToDelete.id)

      // Supprimer la dépense via le contexte
      await deleteDepense(depenseToDelete.id)
      
      toast.success("Dépense supprimée avec succès !")
      setShowDeleteModal(false)
      setDepenseToDelete(null)
      
      // Rafraîchir les données
      await Promise.all([refreshDepenses(), refreshRecettes()])
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la dépense:', error)
      toast.error("Erreur lors de la suppression de la dépense")
    }
  }

  const handleFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCreateFormChange = (field: string, value: string) => {
    setCreateForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveEdit = async () => {
    if (!depenseToEdit) return
    
    try {
      // Validation
      if (!editForm.libelle || !editForm.montant) {
        toast.error("Le libellé et le montant sont obligatoires")
        return
      }

      const montant = parseFloat(editForm.montant)
      if (isNaN(montant) || montant <= 0) {
        toast.error("Le montant doit être un nombre positif")
        return
      }

      console.log('🔄 Modification de dépense:', depenseToEdit.id, 'Nouveau montant:', montant)

      // Mettre à jour la dépense via le contexte
      await updateDepense(depenseToEdit.id, {
        libelle: editForm.libelle,
        montant: montant,
        date: editForm.date,
        description: editForm.description || '',
        categorie: editForm.categorie || '',
        updatedAt: new Date().toISOString()
      })
      
      toast.success("Dépense modifiée avec succès !")
      setShowEditModal(false)
      setDepenseToEdit(null)
      
      // Rafraîchir les données
      await Promise.all([refreshDepenses(), refreshRecettes()])
    } catch (error) {
      console.error('❌ Erreur lors de la modification de la dépense:', error)
      toast.error("Erreur lors de la modification de la dépense")
    }
  }

  const handleSaveCreate = async () => {
    if (!recette) {
      toast.error("Recette non trouvée")
      return
    }
    
    try {
      // Validation
      if (!createForm.libelle || !createForm.montant) {
        toast.error("Le libellé et le montant sont obligatoires")
        return
      }

      const montant = parseFloat(createForm.montant)
      if (isNaN(montant) || montant <= 0) {
        toast.error("Le montant doit être un nombre positif")
        return
      }

      console.log('🔄 Création de dépense pour recette:', recette.id, 'Montant:', montant)

      // Créer la dépense via le contexte
      await addDepense({
        libelle: createForm.libelle,
        montant: montant,
        date: createForm.date,
        description: createForm.description || '',
        recetteId: recette.id, // Utiliser l'ID de la recette courante
        categorie: createForm.categorie || '',
        userId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      toast.success("Dépense créée avec succès !")
      setShowCreateModal(false)
      setCreateForm({
        libelle: '',
        montant: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        categorie: ''
      })
      
      // Rafraîchir les données
      await Promise.all([refreshDepenses(), refreshRecettes()])
    } catch (error) {
      console.error('❌ Erreur lors de la création de la dépense:', error)
      toast.error("Erreur lors de la création de la dépense")
    }
  }

  const getPourcentageDisponible = () => {
    if (!recette) return 0
    return recette.montant > 0 ? Math.round((recette.soldeDisponible / recette.montant) * 100) : 0
  }

  const getStatusColor = () => {
    const pourcentage = getPourcentageDisponible()
    if (pourcentage >= 80) return 'bg-green-100 text-green-700 border-green-300'
    if (pourcentage >= 50) return 'bg-blue-100 text-blue-700 border-blue-300'
    if (pourcentage >= 20) return 'bg-orange-100 text-orange-700 border-orange-300'
    return 'bg-red-100 text-red-700 border-red-300'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Chargement des détails...</h2>
        </motion.div>
      </div>
    )
  }

  if (!recette) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
        </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Recette non trouvée</h2>
          <p className="text-gray-600 mb-6">Cette recette n'existe pas ou a été supprimée</p>
          <Button onClick={handleBack} className="bg-red-600 hover:bg-red-700">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Retour aux Recettes
          </Button>
        </motion.div>
      </div>
    )
  }

  const totalDepenses = depensesLiees.reduce((sum, depense) => sum + depense.montant, 0)
  const pourcentageDisponible = getPourcentageDisponible()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleBack}
                variant="secondary"
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Retour
              </Button>
            <div>
                <h1 className="text-3xl font-bold">💰 {recette.libelle}</h1>
                <p className="text-blue-100">Détails et opérations de la recette</p>
          </div>
            </div>
            <Button
              onClick={handleAddDepense}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nouvelle Dépense
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Informations de la recette */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">Montant Initial</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(recette.montant)}</div>
              <div className="flex items-center mt-2">
                <DollarSignIcon className="h-4 w-4 mr-1" />
                <span className="text-sm opacity-80">Budget total</span>
                </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">Total Dépensé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalDepenses)}</div>
              <div className="flex items-center mt-2">
                <TrendingDownIcon className="h-4 w-4 mr-1" />
                <span className="text-sm opacity-80">{depensesLiees.length} opérations</span>
                </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">Solde Disponible</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(recette.soldeDisponible)}</div>
              <div className="flex items-center mt-2">
                <span className="text-sm opacity-80">{pourcentageDisponible}% restant</span>
                </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Statut et informations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">Informations de la Recette</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600">Statut:</span>
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                    {recette.statut}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600">Date de création:</span>
                    <span className="font-medium">{new Date(recette.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
                    <div className="flex items-center justify-between">
                    <span className="text-gray-600">Dernière mise à jour:</span>
                    <span className="font-medium">{new Date(recette.updatedAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600">Disponibilité:</span>
                    <Badge 
                      variant="outline" 
                      className={`text-sm px-3 py-1 ${getStatusColor()}`}
                    >
                      {pourcentageDisponible}% disponible
                    </Badge>
                              </div>
                  {recette.description && (
                    <div>
                      <span className="text-gray-600">Description:</span>
                      <p className="mt-1 text-gray-800">{recette.description}</p>
                  </div>
                )}
              </div>
            </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tableau des opérations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Tableau des Opérations</h2>
            <Button
              onClick={handleAddDepense}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Ajouter une Dépense
            </Button>
          </div>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Libellé</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Montant</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Statut</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Montant initial de la recette */}
                    <tr className="bg-green-50 hover:bg-green-100 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white font-bold text-sm">+</span>
                          </div>
                          <span className="text-sm font-medium text-green-700">Recette</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{recette.libelle}</div>
                        <div className="text-sm text-gray-500">{recette.description || 'Aucune description'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(recette.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-lg font-bold text-green-600">
                          +{formatCurrency(recette.montant)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {recette.statut}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-10 w-10 p-0 bg-green-100 hover:bg-green-200 text-green-700 border-green-300 shadow-sm"
                            onClick={() => toast.info("Modification de recette en cours de développement")}
                            title="Modifier la recette"
                          >
                            <EditIcon className="h-5 w-5" />
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* Dépenses */}
                    {depensesLiees.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <ReceiptIcon className="h-8 w-8 text-gray-400" />
                                </div>
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucune dépense</h3>
                            <p className="text-gray-500 mb-4">Cette recette n'a pas encore de dépenses associées</p>
                            <Button
                              onClick={handleAddDepense}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <PlusIcon className="h-4 w-4 mr-2" />
                              Créer la Première Dépense
                            </Button>
                                </div>
                        </td>
                      </tr>
                    ) : (
                      depensesLiees.map((depense, index) => (
                        <motion.tr
                          key={depense.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                                <span className="text-white font-bold text-sm">-</span>
                              </div>
                              <span className="text-sm font-medium text-red-700">Dépense</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{depense.libelle}</div>
                            {depense.description && (
                              <div className="text-sm text-gray-500">{depense.description}</div>
                            )}
                            {depense.categorie && (
                              <div className="text-xs text-gray-400 mt-1">Catégorie: {depense.categorie}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(depense.date).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-lg font-bold text-red-600">
                              -{formatCurrency(depense.montant)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              {depense.receiptUrl && (
                                <Badge variant="secondary" className="bg-green-100 text-green-600">
                                  <ReceiptIcon className="h-3 w-3 mr-1" />
                                  Reçu
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-red-600 border-red-300">
                                Dépense
                              </Badge>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-3">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-10 w-10 p-0 bg-green-100 hover:bg-green-200 text-green-700 border-green-300 shadow-sm"
                                onClick={() => handleEditDepense(depense)}
                                title="Modifier la dépense"
                              >
                                <EditIcon className="h-5 w-5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-10 w-10 p-0 bg-red-100 hover:bg-red-200 text-red-700 border-red-300 shadow-sm"
                                onClick={() => handleDeleteDepense(depense)}
                                title="Supprimer la dépense"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Modale moderne de confirmation de suppression */}
        {showDeleteModal && depenseToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* En-tête avec icône d'alerte */}
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                <AlertTriangleIcon className="h-8 w-8 text-red-600" />
      </div>

              {/* Titre et message */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Confirmer la suppression
                </h3>
                <p className="text-gray-600">
                  Êtes-vous sûr de vouloir supprimer la dépense
                </p>
                <p className="text-lg font-semibold text-red-600 mt-2">
                  "{depenseToDelete.libelle}" ?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Cette action est irréversible.
                </p>
            </div>
            
              {/* Informations de la dépense */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Montant:</span>
                  <span className="font-bold text-red-600">
                    -{formatCurrency(depenseToDelete.montant)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-600">Date:</span>
                  <span className="text-sm text-gray-800">
                    {new Date(depenseToDelete.date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={confirmDeleteDepense}
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modale moderne de modification */}
        {showEditModal && depenseToEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* En-tête avec icône d'édition */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mr-4">
                    <EditIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Modifier la dépense
                    </h3>
                    <p className="text-sm text-gray-600">
                      Modifiez les informations de cette dépense
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setShowEditModal(false)}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* Formulaire de modification */}
              <div className="space-y-6">
                {/* Libellé */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Libellé *
                  </label>
                  <input
                    type="text"
                    value={editForm.libelle}
                    onChange={(e) => handleFormChange('libelle', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Nom de la dépense"
                  />
                </div>

                {/* Montant et Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Montant (FCFA) *
                    </label>
                    <input
                      type="number"
                      value={editForm.montant}
                      onChange={(e) => handleFormChange('montant', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => handleFormChange('date', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Catégorie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editForm.categorie}
                      onChange={(e) => handleFormChange('categorie', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="Tapez ou sélectionnez une catégorie"
                      list="categorie-suggestions-edit"
                    />
                    <datalist id="categorie-suggestions-edit">
                      <option value="Transport">Transport</option>
                      <option value="Nourriture">Nourriture</option>
                      <option value="Matériel">Matériel</option>
                      <option value="Communication">Communication</option>
                      <option value="Santé">Santé</option>
                      <option value="Éducation">Éducation</option>
                      <option value="Loisirs">Loisirs</option>
                      <option value="Vêtements">Vêtements</option>
                      <option value="Électricité">Électricité</option>
                      <option value="Eau">Eau</option>
                      <option value="Internet">Internet</option>
                      <option value="Assurance">Assurance</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Autre">Autre</option>
                    </datalist>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Vous pouvez taper une catégorie personnalisée ou choisir dans la liste
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                    placeholder="Description de la dépense (optionnel)"
                  />
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex space-x-3 mt-8 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowEditModal(false)}
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleSaveEdit}
                >
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal de création de dépense */}
        {showCreateModal && recette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* En-tête avec icône de création */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mr-4">
                    <PlusIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Créer une nouvelle dépense
                    </h3>
                    <p className="text-sm text-gray-600">
                      Pour la recette: <span className="font-semibold text-blue-600">{recette.libelle}</span>
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setShowCreateModal(false)}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* Formulaire de création */}
              <div className="space-y-6">
                {/* Libellé */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Libellé *
                  </label>
                  <input
                    type="text"
                    value={createForm.libelle}
                    onChange={(e) => handleCreateFormChange('libelle', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Nom de la dépense"
                  />
                </div>

                {/* Montant et Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Montant (FCFA) *
                    </label>
                    <input
                      type="number"
                      value={createForm.montant}
                      onChange={(e) => handleCreateFormChange('montant', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={createForm.date}
                      onChange={(e) => handleCreateFormChange('date', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Catégorie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={createForm.categorie}
                      onChange={(e) => handleCreateFormChange('categorie', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Tapez ou sélectionnez une catégorie"
                      list="categorie-suggestions"
                    />
                    <datalist id="categorie-suggestions">
                      <option value="Transport">Transport</option>
                      <option value="Nourriture">Nourriture</option>
                      <option value="Matériel">Matériel</option>
                      <option value="Communication">Communication</option>
                      <option value="Santé">Santé</option>
                      <option value="Éducation">Éducation</option>
                      <option value="Loisirs">Loisirs</option>
                      <option value="Vêtements">Vêtements</option>
                      <option value="Électricité">Électricité</option>
                      <option value="Eau">Eau</option>
                      <option value="Internet">Internet</option>
                      <option value="Assurance">Assurance</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Autre">Autre</option>
                    </datalist>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Vous pouvez taper une catégorie personnalisée ou choisir dans la liste
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => handleCreateFormChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    placeholder="Description de la dépense (optionnel)"
                  />
                </div>

                {/* Information sur la recette */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Recette associée</h4>
                  <div className="text-sm text-blue-700">
                    <p><strong>Nom:</strong> {recette.libelle}</p>
                    <p><strong>Solde disponible:</strong> {formatCurrency(recette.soldeDisponible)}</p>
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex space-x-3 mt-8 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowCreateModal(false)}
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleSaveCreate}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Créer la Dépense
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default RecetteDetailsPage