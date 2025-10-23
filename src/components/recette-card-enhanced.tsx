// 🎨 CARTE RECETTE AMÉLIORÉE - DESIGN REMARQUABLE
'use client'

import React from 'react'
import { Recette } from '@/lib/shared-data'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EditIcon, Trash2Icon, EyeIcon } from 'lucide-react'
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
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.3 }}
      className="relative bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 h-32"
    >
      {/* Layout horizontal - En-tête à gauche, contenu à droite */}
      <div className="flex h-full">
        {/* Section gauche - En-tête avec dégradé */}
        <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 w-1/3 text-white flex flex-col justify-between p-4">
          {/* Effet de brillance */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 transform -skew-x-12" />
          
          <div className="relative z-10 flex flex-col justify-between h-full">
            {/* En-tête */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center"
                >
                  <span className="text-sm">💰</span>
                </motion.div>
                <Badge 
                  variant="secondary" 
                  className="bg-white text-blue-600 font-semibold px-2 py-1 text-xs"
                >
                  {recette.statut}
                </Badge>
              </div>
              
              <h3 className="text-sm font-bold leading-tight">{recette.libelle}</h3>
              <p className="text-blue-100 text-xs mt-1">Initial: {formatCurrency(recette.montant)}</p>
            </div>
            
            {/* Barre de progression */}
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>Utilisation</span>
                <span>{pourcentageUtilise.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-white bg-opacity-20 rounded-full h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pourcentageUtilise}%` }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Section droite - Contenu principal */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          {/* Solde Disponible compact */}
          <div className="mb-3">
            <SoldeDisponibleEnhanced
              montant={recette.soldeDisponible}
              montantInitial={recette.montant}
              className="h-16"
            />
          </div>
          
          {/* Informations compactes */}
          <div className="flex justify-between items-center text-xs text-gray-600 mb-3">
            <div className="flex space-x-4">
              <span className="text-red-600 font-semibold">
                Dépensé: {formatCurrency(totalDepenses)}
              </span>
              <span className="text-green-600 font-semibold">
                Restant: {formatCurrency(recette.soldeDisponible)}
              </span>
            </div>
            <div className="text-gray-500">
              {new Date(recette.createdAt).toLocaleDateString('fr-FR')}
            </div>
          </div>
          
          {/* Actions compactes */}
          <div className="flex space-x-1">
            {onView && (
              <Button
                onClick={() => onView(recette)}
                variant="outline"
                size="sm"
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 text-xs px-2 py-1 h-6"
              >
                <EyeIcon className="h-3 w-3 mr-1" />
                Voir
              </Button>
            )}
            
            {onEdit && (
              <Button
                onClick={() => onEdit(recette)}
                variant="outline"
                size="sm"
                className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200 text-xs px-2 py-1 h-6"
              >
                <EditIcon className="h-3 w-3 mr-1" />
                Modifier
              </Button>
            )}
            
            {onDelete && (
              <Button
                onClick={() => onDelete(recette.id)}
                variant="outline"
                size="sm"
                className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 text-xs px-2 py-1 h-6"
              >
                <Trash2Icon className="h-3 w-3 mr-1" />
                Supprimer
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
