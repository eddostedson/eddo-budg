// 🎨 COMPOSANT TRI DES RECETTES PAR DISPONIBILITÉ
'use client'

import React, { useState, useMemo } from 'react'
import { Recette } from '@/lib/shared-data'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUpDownIcon, TrendingUpIcon, TrendingDownIcon, AlertTriangleIcon } from 'lucide-react'
import RecetteCardEnhanced from './recette-card-enhanced'

interface RecettesByAvailabilityProps {
  recettes: Recette[]
  onView?: (recette: Recette) => void
  onEdit?: (recette: Recette) => void
  onDelete?: (id: string) => void
}

const RecettesByAvailability: React.FC<RecettesByAvailabilityProps> = ({
  recettes,
  onView,
  onEdit,
  onDelete
}) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Calculer le pourcentage de disponibilité pour chaque recette
  const recettesWithAvailability = useMemo(() => {
    return recettes.map(recette => {
      const pourcentageDisponible = (recette.soldeDisponible / recette.montant) * 100
      
      // Déterminer la catégorie de disponibilité
      let category: 'high' | 'medium' | 'low'
      let colorClass: string
      let icon: string
      let label: string

      if (pourcentageDisponible >= 50) {
        category = 'high'
        colorClass = 'text-green-600 bg-green-50 border-green-200'
        icon = '🟢'
        label = 'Élevé'
      } else if (pourcentageDisponible >= 15) {
        category = 'medium'
        colorClass = 'text-orange-600 bg-orange-50 border-orange-200'
        icon = '🟠'
        label = 'Moyen'
      } else {
        category = 'low'
        colorClass = 'text-red-600 bg-red-50 border-red-200'
        icon = '🔴'
        label = 'Faible'
      }

      return {
        ...recette,
        pourcentageDisponible,
        category,
        colorClass,
        icon,
        label
      }
    })
  }, [recettes])

  // Trier par pourcentage de disponibilité
  const sortedRecettes = useMemo(() => {
    return [...recettesWithAvailability].sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.pourcentageDisponible - a.pourcentageDisponible
      } else {
        return a.pourcentageDisponible - b.pourcentageDisponible
      }
    })
  }, [recettesWithAvailability, sortOrder])

  // Grouper par catégorie
  const groupedRecettes = useMemo(() => {
    const groups = {
      high: sortedRecettes.filter(r => r.category === 'high'),
      medium: sortedRecettes.filter(r => r.category === 'medium'),
      low: sortedRecettes.filter(r => r.category === 'low')
    }
    return groups
  }, [sortedRecettes])

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')
  }

  return (
    <div className="space-y-8">
      {/* En-tête avec statistiques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">📊 Recettes par Disponibilité</h2>
          <Button
            onClick={toggleSortOrder}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ArrowUpDownIcon className="h-4 w-4" />
            <span>{sortOrder === 'desc' ? 'Décroissant' : 'Croissant'}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-green-600 flex items-center">
                <span className="text-2xl mr-2">🟢</span>
                Disponibilité Élevée
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{groupedRecettes.high.length}</div>
              <p className="text-sm text-green-600">50% - 100% du budget</p>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-orange-600 flex items-center">
                <span className="text-2xl mr-2">🟠</span>
                Disponibilité Moyenne
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{groupedRecettes.medium.length}</div>
              <p className="text-sm text-orange-600">15% - 49% du budget</p>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-red-600 flex items-center">
                <span className="text-2xl mr-2">🔴</span>
                Disponibilité Faible
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{groupedRecettes.low.length}</div>
              <p className="text-sm text-red-600">0% - 14% du budget</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Section VERTE - Disponibilité Élevée */}
      {groupedRecettes.high.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🟢</span>
              <h3 className="text-xl font-bold text-green-600">Disponibilité Élevée</h3>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {groupedRecettes.high.length} recettes
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {groupedRecettes.high.map((recette, index) => (
              <motion.div
                key={recette.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <RecetteCardEnhanced
                  recette={recette}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Section ORANGE - Disponibilité Moyenne */}
      {groupedRecettes.medium.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🟠</span>
              <h3 className="text-xl font-bold text-orange-600">Disponibilité Moyenne</h3>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                {groupedRecettes.medium.length} recettes
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {groupedRecettes.medium.map((recette, index) => (
              <motion.div
                key={recette.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <RecetteCardEnhanced
                  recette={recette}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Section ROUGE - Disponibilité Faible */}
      {groupedRecettes.low.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🔴</span>
              <h3 className="text-xl font-bold text-red-600">Disponibilité Faible</h3>
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                {groupedRecettes.low.length} recettes
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {groupedRecettes.low.map((recette, index) => (
              <motion.div
                key={recette.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <RecetteCardEnhanced
                  recette={recette}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Message si aucune recette */}
      {recettes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune recette disponible</h3>
          <p className="text-gray-500">Commencez par ajouter vos premières recettes</p>
        </motion.div>
      )}
    </div>
  )
}

export default RecettesByAvailability
