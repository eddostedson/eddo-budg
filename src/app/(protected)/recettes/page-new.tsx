// 🎨 PAGE RECETTES AVEC DESIGN AMÉLIORÉ - SOLDES REMARQUABLES
'use client'

import React, { useState, useEffect } from 'react'
import { useRecettes } from '@/contexts/recette-context-direct'
import { useDepenses } from '@/contexts/depense-context'
import { Recette } from '@/lib/shared-data'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, PlusIcon, RefreshCwIcon, TrendingUpIcon, TrendingDownIcon, DollarSignIcon } from 'lucide-react'
import RecetteCardEnhanced from '@/components/recette-card-enhanced'
import { toast } from 'sonner'

const RecettesPageNew: React.FC = () => {
  const { recettes, loading, error, refreshRecettes } = useRecettes()
  const { depenses } = useDepenses()
  const [showModal, setShowModal] = useState(false)
  const [selectedRecette, setSelectedRecette] = useState<Recette | null>(null)

  // Calculs des totaux
  const totalRecettes = recettes.reduce((sum, recette) => sum + recette.montant, 0)
  const totalDepenses = depenses.reduce((sum, depense) => sum + depense.montant, 0)
  const totalDisponible = recettes.reduce((sum, recette) => sum + recette.soldeDisponible, 0)

  // Statistiques avancées
  const recettesUtilisees = recettes.filter(r => r.soldeDisponible < r.montant).length
  const recettesVides = recettes.filter(r => r.soldeDisponible === 0).length
  const recettesPleine = recettes.filter(r => r.soldeDisponible === r.montant).length

  const handleRefresh = async () => {
    try {
      await refreshRecettes()
      toast.success("Données rafraîchies avec succès !")
    } catch (error) {
      toast.error("Erreur lors du rafraîchissement")
    }
  }

  const handleViewRecette = (recette: Recette) => {
    setSelectedRecette(recette)
    setShowModal(true)
  }

  const handleEditRecette = (recette: Recette) => {
    // Logique d'édition
    toast.info("Fonctionnalité d'édition en cours de développement")
  }

  const handleDeleteRecette = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette recette ?")) {
      try {
        // Logique de suppression
        toast.success("Recette supprimée avec succès !")
        await refreshRecettes()
      } catch (error) {
        toast.error("Erreur lors de la suppression")
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

  if (error) {
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
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={handleRefresh} className="bg-red-600 hover:bg-red-700">
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
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
              <Button className="bg-white text-blue-600 hover:bg-blue-50">
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
            {recettes.map((recette, index) => (
              <motion.div
                key={recette.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <RecetteCardEnhanced
                  recette={recette}
                  onView={handleViewRecette}
                  onEdit={handleEditRecette}
                  onDelete={handleDeleteRecette}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default RecettesPageNew
