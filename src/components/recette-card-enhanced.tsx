// 🎨 CARTE RECETTE AMÉLIORÉE - DESIGN REMARQUABLE
'use client'

import React from 'react'
import { Recette } from '@/lib/shared-data'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EditIcon, Trash2Icon, EyeIcon, DollarSignIcon, AlertTriangleIcon, XCircleIcon } from 'lucide-react'
import SoldeDisponibleEnhanced from './solde-disponible-enhanced'

interface RecetteCardEnhancedProps {
  recette: Recette
  onEdit?: (recette: Recette) => void
  onDelete?: (id: string) => void
  onView?: (recette: Recette) => void
}

const RecetteCardEnhanced: React.FC<RecetteCardEnhancedProps> = ({
  recette,
  onEdit,
  onDelete,
  onView
}) => {
  const totalDepenses = recette.montant - recette.soldeDisponible
  const pourcentageUtilise = (totalDepenses / recette.montant) * 100

  // Fonction pour déterminer la couleur de la bande latérale
  const getAvailabilityColorClass = (recette: Recette) => {
    const pourcentageDisponible = (recette.soldeDisponible / recette.montant) * 100
    if (recette.soldeDisponible === 0) {
      return 'from-red-700 to-red-800' // Rouge - Épuisé
    } else if (pourcentageDisponible >= 50) {
      return 'from-green-700 to-green-800' // Vert - Élevé
    } else if (pourcentageDisponible >= 15) {
      return 'from-orange-600 to-orange-700' // Orange - Moyen
    } else {
      return 'from-red-600 to-red-700' // Rouge - Faible
    }
  }

  // Fonction pour l'icône de statut
  const getStatusIcon = (recette: Recette) => {
    const pourcentageDisponible = (recette.soldeDisponible / recette.montant) * 100
    if (recette.soldeDisponible === 0) return <XCircleIcon className="h-4 w-4 text-red-100" />
    if (pourcentageDisponible < 15) return <AlertTriangleIcon className="h-4 w-4 text-red-100" />
    if (pourcentageDisponible < 50) return <AlertTriangleIcon className="h-4 w-4 text-orange-100" />
    return <DollarSignIcon className="h-4 w-4 text-green-100" />
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.3 }}
      className="relative bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex"
    >
      {/* Bande latérale gauche colorée */}
      <div className={`w-3 bg-gradient-to-b ${getAvailabilityColorClass(recette)} rounded-l-xl flex items-center justify-center`}>
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="text-white"
        >
          {getStatusIcon(recette)}
        </motion.div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div>
              <h3 className="text-lg font-bold text-gray-800">{recette.libelle}</h3>
              <p className="text-sm text-gray-500">Initial: {formatCurrency(recette.montant)}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs px-2 py-1">
            {recette.statut}
          </Badge>
        </div>

        {/* Solde Disponible compact */}
        <div className="mb-3">
          <SoldeDisponibleEnhanced
            montant={recette.soldeDisponible}
            montantInitial={recette.montant}
            className="!p-2"
          />
        </div>

        {/* Informations et actions */}
        <div className="flex justify-between items-end">
          {/* Statistiques */}
          <div className="flex-1 grid grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-gray-600 mb-1">Dépensé</div>
              <div className="font-bold text-red-600">
                {formatCurrency(totalDepenses)}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-gray-600 mb-1">Restant</div>
              <div className="font-bold text-green-600">
                {formatCurrency(recette.soldeDisponible)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-1 ml-4">
            {onView && (
              <Button size="icon" variant="ghost" onClick={() => onView(recette)} className="h-8 w-8">
                <EyeIcon className="h-4 w-4" />
              </Button>
            )}
            {onEdit && (
              <Button size="icon" variant="ghost" onClick={() => onEdit(recette)} className="h-8 w-8">
                <EditIcon className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button size="icon" variant="ghost" onClick={() => onDelete(recette.id)} className="h-8 w-8 text-red-500 hover:text-red-700">
                <Trash2Icon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Effet de bordure animée */}
      <motion.div
        animate={{ 
          background: [
            'linear-gradient(45deg, #3b82f6, #8b5cf6, #06b6d4)',
            'linear-gradient(45deg, #8b5cf6, #06b6d4, #3b82f6)',
            'linear-gradient(45deg, #06b6d4, #3b82f6, #8b5cf6)'
          ]
        }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-0 rounded-xl p-[1px] -z-10"
      >
        <div className="w-full h-full bg-white rounded-xl" />
      </motion.div>
    </motion.div>
  )
}

export default RecetteCardEnhanced
