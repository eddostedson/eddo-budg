// 🎨 PAGE RECETTES AVEC DESIGN AMÉLIORÉ - SOLDES REMARQUABLES
'use client'

import React, { useState, useEffect } from 'react'
import { useRecettes } from '@/contexts/recette-context-direct'
import { useDepenses } from '@/contexts/depense-context-direct'
import { Recette } from '@/lib/shared-data'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, PlusIcon, RefreshCwIcon, TrendingUpIcon, TrendingDownIcon, DollarSignIcon, EyeIcon, EditIcon, TrashIcon, Trash2Icon, DatabaseIcon } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RecetteFormDialog } from '@/components/recette-form-dialog'
import { AnimatedListItem } from '@/components/animated-list-item'

export default function RecettesPage() {
  const router = useRouter()
  const { recettes, loading, refreshRecettes, deleteRecette } = useRecettes()
  const { depenses } = useDepenses()
  const [showModal, setShowModal] = useState(false)
  const [selectedRecette, setSelectedRecette] = useState<Recette | null>(null)
  const [deletedRecettes, setDeletedRecettes] = useState<Set<string>>(new Set())

  // Calculs des totaux
  const totalRecettes = recettes.reduce((sum, recette) => sum + recette.montant, 0)
  const totalDepenses = depenses.reduce((sum, depense) => sum + depense.montant, 0)
  
  // Calculer le solde disponible en temps réel pour chaque recette
  const totalDisponible = recettes.reduce((sum, recette) => {
    const depensesLiees = depenses.filter(d => d.recetteId === recette.id)
    const totalDepensesRecette = depensesLiees.reduce((total, depense) => total + depense.montant, 0)
    const soldeDisponibleCalcule = recette.montant - totalDepensesRecette
    return sum + soldeDisponibleCalcule
  }, 0)

  // Statistiques avancées - calculées en temps réel
  const recettesUtilisees = recettes.filter(r => {
    const depensesLiees = depenses.filter(d => d.recetteId === r.id)
    const totalDepensesRecette = depensesLiees.reduce((total, depense) => total + depense.montant, 0)
    const soldeDisponibleCalcule = r.montant - totalDepensesRecette
    return soldeDisponibleCalcule < r.montant && soldeDisponibleCalcule > 0
  }).length
  
  const recettesVides = recettes.filter(r => {
    const depensesLiees = depenses.filter(d => d.recetteId === r.id)
    const totalDepensesRecette = depensesLiees.reduce((total, depense) => total + depense.montant, 0)
    const soldeDisponibleCalcule = r.montant - totalDepensesRecette
    return soldeDisponibleCalcule === 0
  }).length
  
  const recettesPleine = recettes.filter(r => {
    const depensesLiees = depenses.filter(d => d.recetteId === r.id)
    const totalDepensesRecette = depensesLiees.reduce((total, depense) => total + depense.montant, 0)
    const soldeDisponibleCalcule = r.montant - totalDepensesRecette
    return soldeDisponibleCalcule === r.montant
  }).length

  const handleRefresh = async () => {
    try {
      await refreshRecettes()
      toast.success("Données rafraîchies avec succès !")
    } catch (error) {
      toast.error("Erreur lors du rafraîchissement")
    }
  }

  const handleViewRecette = (recette: Recette) => {
    // Rediriger vers la page de détails
    window.location.href = `/recettes/${recette.id}`
  }

  const handleEditRecette = (recette: Recette) => {
    setSelectedRecette(recette)
    setShowModal(true)
  }

  const handleDeleteRecette = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette recette ? Toutes les dépenses liées seront également supprimées.")) {
      // Marquer comme supprimé pour l'animation
      setDeletedRecettes(prev => new Set(prev).add(id))
      
      try {
        const success = await deleteRecette(id)
        if (!success) {
          // Annuler la suppression visuelle en cas d'erreur
          setDeletedRecettes(prev => {
            const newSet = new Set(prev)
            newSet.delete(id)
            return newSet
          })
          toast.error("❌ Erreur lors de la suppression")
        }
      } catch (error) {
        // Annuler la suppression visuelle en cas d'erreur
        setDeletedRecettes(prev => {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Chargement des recettes...</h2>
          <p className="text-gray-500 mt-2">Préparation des données financières</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* En-tête avec animations */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">💰 Gestion des Recettes</h1>
              <p className="text-blue-100 text-lg">Suivi financier avec design remarquable</p>
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
                onClick={() => router.push('/recettes/corbeille')}
                variant="secondary"
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white"
              >
                <Trash2Icon className="h-4 w-4 mr-2" />
                Corbeille
              </Button>
              <Button
                onClick={() => router.push('/recettes/restaurer-backup')}
                variant="secondary"
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white"
              >
                <DatabaseIcon className="h-4 w-4 mr-2" />
                Restaurer Backup
              </Button>
              <Button 
                onClick={() => setShowModal(true)}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouvelle Recette
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
              <div className="text-3xl font-bold">{recettes.length}</div>
              <div className="flex items-center mt-2">
                <span className="text-sm opacity-80">Recettes actives</span>
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
              <CardTitle className="text-lg font-semibold text-green-600">✅ Recettes Pleines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{recettesPleine}</div>
              <p className="text-sm text-gray-600 mt-2">Aucune dépense effectuée</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-orange-600">⚠️ Recettes Utilisées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{recettesUtilisees}</div>
              <p className="text-sm text-gray-600 mt-2">Partiellement dépensées</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-red-600">❌ Recettes Vides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{recettesVides}</div>
              <p className="text-sm text-gray-600 mt-2">Entièrement dépensées</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Liste des recettes avec design amélioré */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Mes Recettes</h2>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {recettes.length} recettes
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recettes.map((recette, index) => {
              // Calculer le solde disponible en temps réel
              const depensesLiees = depenses.filter(d => d.recetteId === recette.id)
              const totalDepensesRecette = depensesLiees.reduce((total, depense) => total + depense.montant, 0)
              const soldeDisponibleCalcule = recette.montant - totalDepensesRecette
              const pourcentageDisponible = recette.montant > 0 ? Math.round((soldeDisponibleCalcule / recette.montant) * 100) : 0
              const isDeleted = deletedRecettes.has(recette.id)
              
              return (
                <AnimatedListItem
                  key={recette.id}
                  id={recette.id}
                  isDeleted={isDeleted}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                  <Card className={`shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden ${
                    soldeDisponibleCalcule === 0 
                      ? 'bg-orange-50 border-orange-200' 
                      : 'bg-white'
                  }`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">💰</span>
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold text-gray-800">{recette.libelle}</CardTitle>
                            <p className="text-sm text-gray-500">{recette.description || 'Aucune description'}</p>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-2 py-1 ${
                            soldeDisponibleCalcule === recette.montant 
                              ? 'bg-green-100 text-green-700 border-green-300'
                              : soldeDisponibleCalcule === 0
                              ? 'bg-red-100 text-red-700 border-red-300'
                              : 'bg-orange-100 text-orange-700 border-orange-300'
                          }`}
                        >
                          {soldeDisponibleCalcule === recette.montant ? 'Pleine' : 
                           soldeDisponibleCalcule === 0 ? 'Vide' : 'Utilisée'}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {/* Montant initial */}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Montant initial:</span>
                          <span className="font-bold text-gray-800">{formatCurrency(recette.montant)}</span>
                        </div>
                        
                        {/* Solde disponible */}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Solde disponible:</span>
                          <span className="font-bold text-green-600">{formatCurrency(soldeDisponibleCalcule)}</span>
                        </div>
                        
                        {/* Barre de progression */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              soldeDisponibleCalcule === recette.montant 
                                ? 'bg-green-500' 
                                : soldeDisponibleCalcule === 0
                                ? 'bg-red-500'
                                : 'bg-orange-500'
                            }`}
                            style={{ 
                              width: `${pourcentageDisponible}%` 
                            }}
                          />
                        </div>
                        
                        {/* Pourcentage */}
                        <div className="text-center">
                          <span className="text-sm font-medium text-gray-600">
                            {pourcentageDisponible}% disponible
                          </span>
                        </div>
                      
                        {/* Date */}
                        <div className="text-center text-xs text-gray-500">
                          Créée le {new Date(recette.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      
                      {/* Boutons d'action */}
                      <div className="flex space-x-2 mt-6">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                          onClick={() => handleViewRecette(recette)}
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                          onClick={() => handleEditRecette(recette)}
                        >
                          <EditIcon className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                          onClick={() => handleDeleteRecette(recette.id)}
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Dialog de création/modification de recette */}
      <RecetteFormDialog 
        open={showModal} 
        onOpenChange={(open) => {
          setShowModal(open)
          if (!open) {
            setSelectedRecette(null) // Réinitialiser la recette sélectionnée quand le modal se ferme
          }
        }}
        recetteToEdit={selectedRecette}
      />
    </div>
  )
}
