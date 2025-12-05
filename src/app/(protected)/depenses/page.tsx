// 🎨 PAGE DÉPENSES AVEC DESIGN AMÉLIORÉ - SOLDES REMARQUABLES
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useDepenses } from '@/contexts/depense-context-direct'
import { useRecettes } from '@/contexts/recette-context-direct'
import { Depense } from '@/lib/shared-data'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, PlusIcon, RefreshCwIcon, TrendingUpIcon, TrendingDownIcon, DollarSignIcon, ReceiptIcon, EyeIcon, EditIcon, TrashIcon } from 'lucide-react'
import { toast } from 'sonner'
import { DepenseFormDialog } from '@/components/depense-form-dialog'
import { AnimatedListItem } from '@/components/animated-list-item'

export default function DepensesPage() {
  const { depenses, loading, refreshDepenses, deleteDepense } = useDepenses()
  const { recettes } = useRecettes()
  const [showModal, setShowModal] = useState(false)
  const [selectedDepense, setSelectedDepense] = useState<Depense | null>(null)
  const [deletedDepenses, setDeletedDepenses] = useState<Set<number>>(new Set())

  // Calculs des totaux avec useMemo pour forcer le recalcul
  const totalDepenses = useMemo(() => 
    depenses.reduce((sum, depense) => sum + depense.montant, 0), 
    [depenses]
  )
  const totalRecettes = useMemo(() => 
    recettes.reduce((sum, recette) => sum + recette.montant, 0), 
    [recettes]
  )
  // Calculer le solde disponible en temps réel pour chaque recette
  const totalDisponible = useMemo(() => {
    return recettes.reduce((sum, recette) => {
      const depensesLiees = depenses.filter(d => d.recetteId === recette.id)
      const totalDepensesRecette = depensesLiees.reduce((total, depense) => total + depense.montant, 0)
      const soldeDisponibleCalcule = recette.montant - totalDepensesRecette
      return sum + soldeDisponibleCalcule
    }, 0)
  }, [recettes, depenses])

  // Debug temporaire
  useEffect(() => {
    console.log('🔄 [DEPENSES PAGE] depenses changed:', depenses.length, 'total:', totalDepenses)
    if (depenses.length > 0) {
      console.log('📊 [DEPENSES PAGE] Première dépense:', {
        id: depenses[0].id,
        libelle: depenses[0].libelle,
        montant: depenses[0].montant,
        date: depenses[0].date,
        description: depenses[0].description,
        categorie: depenses[0].categorie
      })
    }
  }, [depenses, totalDepenses])

  // Statistiques avancées
  const depensesAvecRecu = depenses.filter(d => d.receiptUrl).length
  const depensesSansRecu = depenses.filter(d => !d.receiptUrl).length
  const depensesRecent = depenses.filter(d => {
    const depenseDate = new Date(d.date)
    const now = new Date()
    const diffDays = (now.getTime() - depenseDate.getTime()) / (1000 * 3600 * 24)
    return diffDays <= 7
  }).length

  const handleRefresh = async () => {
    try {
      await refreshDepenses()
      toast.success("Dépenses rafraîchies avec succès !")
    } catch (error) {
      toast.error("Erreur lors du rafraîchissement")
    }
  }

  const handleViewDepense = (depense: Depense) => {
    // Rediriger vers la page de détails
    window.location.href = `/depenses/${depense.id}`
  }

  const handleEditDepense = (depense: Depense) => {
    // Logique d'édition
    toast.info("Fonctionnalité d'édition en cours de développement")
  }

  const handleDeleteDepense = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette dépense ?")) {
      // Marquer comme supprimé pour l'animation
      setDeletedDepenses(prev => new Set(prev).add(id))
      
      try {
        const success = await deleteDepense(id)
        if (!success) {
          // Annuler la suppression visuelle en cas d'erreur
          setDeletedDepenses(prev => {
            const newSet = new Set(prev)
            newSet.delete(id)
            return newSet
          })
          toast.error("❌ Erreur lors de la suppression")
        }
      } catch (error) {
        // Annuler la suppression visuelle en cas d'erreur
        setDeletedDepenses(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
        toast.error("❌ Erreur lors de la suppression")
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Chargement des dépenses...</h2>
          <p className="text-gray-500 mt-2">Préparation des données financières</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* En-tête avec animations */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 via-orange-600 to-pink-600 text-white p-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">💸 Gestion des Dépenses</h1>
              <p className="text-red-100 text-lg">Suivi financier avec design remarquable</p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={handleRefresh}
                variant="secondary"
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white"
              >
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button 
                onClick={() => setShowModal(true)}
                className="bg-white text-red-600 hover:bg-red-50"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouvelle Dépense
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Cartes de statistiques globales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">Total Dépenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalDepenses)}</div>
              <div className="flex items-center mt-2">
                <TrendingDownIcon className="h-4 w-4 mr-1" />
                <span className="text-sm opacity-80">Dépenses totales</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">Total Recettes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalRecettes)}</div>
              <div className="flex items-center mt-2">
                <TrendingUpIcon className="h-4 w-4 mr-1" />
                <span className="text-sm opacity-80">Revenus totaux</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">Solde Disponible</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalDisponible)}</div>
              <div className="flex items-center mt-2">
                <DollarSignIcon className="h-4 w-4 mr-1" />
                <span className="text-sm opacity-80">Disponible</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">Statut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{depenses.length}</div>
              <div className="flex items-center mt-2">
                <span className="text-sm opacity-80">Dépenses enregistrées</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Statistiques détaillées */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-green-600">📄 Avec Reçu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{depensesAvecRecu}</div>
              <p className="text-sm text-gray-600 mt-2">Dépenses documentées</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-orange-600">📝 Sans Reçu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{depensesSansRecu}</div>
              <p className="text-sm text-gray-600 mt-2">À documenter</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-blue-600">🕒 Récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{depensesRecent}</div>
              <p className="text-sm text-gray-600 mt-2">Dernière semaine</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Liste des dépenses avec design amélioré */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Mes Dépenses</h2>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {depenses.length} dépenses
            </Badge>
          </div>

          {depenses.length === 0 ? (
            <Card className="bg-white shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ReceiptIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucune dépense</h3>
                <p className="text-gray-500 mb-4">Vous n'avez pas encore de dépenses enregistrées</p>
                <Button
                  onClick={() => setShowModal(true)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Créer la Première Dépense
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {depenses.map((depense, index) => {
                // Vérifier et formater les données
                const libelle = depense.libelle || 'Dépense sans libellé'
                const isDeleted = deletedDepenses.has(depense.id)
                const montant = depense.montant || 0
                const date = depense.date || depense.createdAt || new Date().toISOString()
                const description = depense.description || ''
                const categorie = depense.categorie || ''
                
                return (
                  <AnimatedListItem
                    key={depense.id}
                    id={depense.id}
                    isDeleted={isDeleted}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-lg">💸</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg font-bold text-gray-800 truncate">{libelle}</CardTitle>
                              <p className="text-sm text-gray-500 truncate">{description || 'Aucune description'}</p>
                            </div>
                          </div>
                          {depense.receiptUrl && (
                            <Badge variant="secondary" className="bg-green-100 text-green-600 flex-shrink-0 ml-2">
                              <ReceiptIcon className="h-3 w-3 mr-1" />
                              Reçu
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {/* Montant avec design remarquable */}
                          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-4 text-white">
                            <div className="text-sm font-medium opacity-90 mb-1">Montant</div>
                            <div className="text-2xl font-black">{formatCurrency(montant)}</div>
                          </div>

                          {/* Informations détaillées */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Date:</span>
                              <span className="font-medium">{new Date(date).toLocaleDateString('fr-FR')}</span>
                            </div>
                            
                            {categorie && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Catégorie:</span>
                                <span className="font-medium">{categorie}</span>
                              </div>
                            )}

                            {description && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Description:</span>
                                <p className="mt-1 line-clamp-2">{description}</p>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex space-x-2 pt-4">
                            <Button
                              onClick={() => handleViewDepense(depense)}
                              variant="outline"
                              size="sm"
                              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              Voir
                            </Button>
                            <Button
                              onClick={() => handleEditDepense(depense)}
                              variant="outline"
                              size="sm"
                              className="flex-1 bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                            >
                              <EditIcon className="h-4 w-4 mr-1" />
                              Modifier
                            </Button>
                            <Button
                              onClick={() => handleDeleteDepense(depense.id)}
                              variant="outline"
                              size="sm"
                              className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                            >
                              <TrashIcon className="h-4 w-4 mr-1" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    </motion.div>
                  </AnimatedListItem>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Dialog de création de dépense */}
      <DepenseFormDialog 
        open={showModal} 
        onOpenChange={setShowModal} 
      />
    </div>
  )
}
