// 🎨 PAGE DE TEST - TRI DES RECETTES PAR DISPONIBILITÉ
'use client'

import React, { useState } from 'react'
import { useRecettes } from '@/contexts/recette-context-direct'
import { useDepenses } from '@/contexts/depense-context'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCwIcon, TrendingUpIcon, TrendingDownIcon, AlertTriangleIcon } from 'lucide-react'
import RecettesByAvailability from '@/components/recettes-by-availability'
import { toast } from 'sonner'

const TestTriDisponibilitePage: React.FC = () => {
  const { recettes, loading, error, refreshRecettes } = useRecettes()
  const { depenses } = useDepenses()
  const [refreshKey, setRefreshKey] = useState(0)

  // Calculs des totaux
  const totalRecettes = recettes.reduce((sum, recette) => sum + recette.montant, 0)
  const totalDepenses = depenses.reduce((sum, depense) => sum + depense.montant, 0)
  const totalDisponible = recettes.reduce((sum, recette) => sum + recette.soldeDisponible, 0)

  // Statistiques par disponibilité
  const recettesHigh = recettes.filter(r => (r.soldeDisponible / r.montant) * 100 >= 50).length
  const recettesMedium = recettes.filter(r => {
    const pourcentage = (r.soldeDisponible / r.montant) * 100
    return pourcentage >= 15 && pourcentage < 50
  }).length
  const recettesLow = recettes.filter(r => (r.soldeDisponible / r.montant) * 100 < 15).length

  const handleRefresh = async () => {
    try {
      await refreshRecettes()
      setRefreshKey(prev => prev + 1)
      toast.success("Données rafraîchies avec succès !")
    } catch (error) {
      toast.error("Erreur lors du rafraîchissement")
    }
  }

  const handleViewRecette = (recette: any) => {
    console.log('Voir recette:', recette)
    toast.info(`Voir recette: ${recette.libelle}`)
  }

  const handleEditRecette = (recette: any) => {
    console.log('Modifier recette:', recette)
    toast.info(`Modifier recette: ${recette.libelle}`)
  }

  const handleDeleteRecette = (id: string) => {
    console.log('Supprimer recette:', id)
    toast.info(`Supprimer recette: ${id}`)
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
          <p className="text-gray-500 mt-2">Préparation du tri par disponibilité</p>
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
        key={refreshKey}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">📊 Test Tri par Disponibilité</h1>
              <p className="text-blue-100 text-lg">Recettes classées par pourcentage de budget disponible</p>
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
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Cartes de statistiques globales */}
        <motion.div
          key={refreshKey + 1}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">🟢 Disponibilité Élevée</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{recettesHigh}</div>
              <div className="flex items-center mt-2">
                <TrendingUpIcon className="h-4 w-4 mr-1" />
                <span className="text-sm opacity-80">50% - 100%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">🟠 Disponibilité Moyenne</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{recettesMedium}</div>
              <div className="flex items-center mt-2">
                <AlertTriangleIcon className="h-4 w-4 mr-1" />
                <span className="text-sm opacity-80">15% - 49%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">🔴 Disponibilité Faible</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{recettesLow}</div>
              <div className="flex items-center mt-2">
                <TrendingDownIcon className="h-4 w-4 mr-1" />
                <span className="text-sm opacity-80">0% - 14%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{recettes.length}</div>
              <div className="flex items-center mt-2">
                <span className="text-sm opacity-80">Recettes</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Résumé financier */}
        <motion.div
          key={refreshKey + 2}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">💰 Résumé Financier</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRecettes)}</div>
              <p className="text-sm text-gray-600">Total Recettes</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDepenses)}</div>
              <p className="text-sm text-gray-600">Total Dépenses</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalDisponible)}</div>
              <p className="text-sm text-gray-600">Solde Disponible</p>
            </div>
          </div>
        </motion.div>

        {/* Composant de tri par disponibilité */}
        <motion.div
          key={refreshKey + 3}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <RecettesByAvailability
            recettes={recettes}
            onView={handleViewRecette}
            onEdit={handleEditRecette}
            onDelete={handleDeleteRecette}
          />
        </motion.div>
      </div>
    </div>
  )
}

export default TestTriDisponibilitePage
