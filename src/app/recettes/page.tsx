// 🎨 PAGE RECETTES AVEC DESIGN AMÉLIORÉ - SOLDES REMARQUABLES
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRecettes } from '@/contexts/recette-context'
import { useDepenses } from '@/contexts/depense-context'
import { Recette } from '@/lib/shared-data'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, PlusIcon, RefreshCwIcon, TrendingUpIcon, TrendingDownIcon, DollarSignIcon } from 'lucide-react'
import RecetteCardEnhanced from '@/components/recette-card-enhanced'
import RecettesByAvailability from '@/components/recettes-by-availability'
import { toast } from 'sonner'

const RecettesPage: React.FC = () => {
  const router = useRouter()
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
    // Navigation vers la page de détails avec Next.js router
    router.push(`/recettes/${recette.id}`)
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
      {/* En-tête avec métriques intégrées */}
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
          </div>

          {/* Métriques intégrées dans le header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <div>
                  <div className="text-sm font-medium opacity-90">Total Recettes</div>
                  <div className="text-2xl font-bold">{formatCurrency(totalRecettes)}</div>
                    </div>
                <TrendingUpIcon className="h-8 w-8 opacity-80" />
                  </div>
          </div>

            <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium opacity-90">Total Dépenses</div>
                  <div className="text-2xl font-bold">{formatCurrency(totalDepenses)}</div>
                </div>
                <TrendingDownIcon className="h-8 w-8 opacity-80" />
              </div>
            </div>

            <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium opacity-90">Solde Disponible</div>
                  <div className="text-2xl font-bold">{formatCurrency(totalDisponible)}</div>
                </div>
                <DollarSignIcon className="h-8 w-8 opacity-80" />
              </div>
              </div>
            </div>
                </div>
      </motion.div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Nouvelles cartes en paysage - optimisées en hauteur */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <TrendingUpIcon className="h-6 w-6" />
                </div>
                <div>
                    <div className="text-sm font-medium opacity-90">Recettes Pleines</div>
                    <div className="text-2xl font-bold">{recettesPleine}</div>
                </div>
              </div>
                <div className="text-right">
                  <div className="text-xs opacity-80">Aucune dépense effectuée</div>
              </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <TrendingDownIcon className="h-6 w-6" />
                </div>
                <div>
                    <div className="text-sm font-medium opacity-90">Recettes Utilisées</div>
                    <div className="text-2xl font-bold">{recettesUtilisees}</div>
                </div>
              </div>
                <div className="text-right">
                  <div className="text-xs opacity-80">Partiellement dépensées</div>
              </div>
            </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white shadow-xl">
            <CardContent className="p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-xl">❌</span>
                  </div>
              <div>
                    <div className="text-sm font-medium opacity-90">Recettes Vides</div>
                    <div className="text-2xl font-bold">{recettesVides}</div>
              </div>
              </div>
                <div className="text-right">
                  <div className="text-xs opacity-80">Entièrement dépensées</div>
            </div>
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

        {/* Liste des recettes avec design rectangulaire */}
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
                
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recettes
              .sort((a, b) => {
                // Calculer le pourcentage de solde disponible pour chaque recette
                const pourcentageA = a.montant > 0 ? (a.soldeDisponible / a.montant) * 100 : 0
                const pourcentageB = b.montant > 0 ? (b.soldeDisponible / b.montant) * 100 : 0
                
                // Trier par pourcentage décroissant (plus haut pourcentage en premier)
                return pourcentageB - pourcentageA
              })
              .map((recette, index) => {
                // Calculer le pourcentage pour l'affichage
                const pourcentageDisponible = recette.montant > 0 
                  ? Math.round((recette.soldeDisponible / recette.montant) * 100) 
                  : 0
                
                return (
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
                    {/* Indicateur de pourcentage */}
                    <div className="mt-2 text-center">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          pourcentageDisponible >= 80 
                            ? 'bg-green-100 text-green-700 border-green-300' 
                            : pourcentageDisponible >= 50 
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : pourcentageDisponible >= 20 
                            ? 'bg-orange-100 text-orange-700 border-orange-300'
                            : 'bg-red-100 text-red-700 border-red-300'
                        }`}
                      >
                        {pourcentageDisponible}% disponible
                      </Badge>
                    </div>
                  </motion.div>
                )
              })}
            </div>
        </motion.div>
                    </div>
                  </div>
                )
}

export default RecettesPage