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
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="relative bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300"
    >
      {/* En-tête avec dégradé */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 text-white">
        {/* Effet de brillance */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 transform -skew-x-12" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center"
              >
                <span className="text-2xl">💰</span>
              </motion.div>
              <div>
                <h3 className="text-xl font-bold">{recette.libelle}</h3>
                <p className="text-blue-100 text-sm">Montant initial: {formatCurrency(recette.montant)}</p>
              </div>
            </div>
            
            <Badge 
              variant="secondary" 
              className="bg-white text-blue-600 font-semibold px-3 py-1"
            >
              {recette.statut}
            </Badge>
          </div>
          
          {/* Barre de progression globale */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Utilisation</span>
              <span>{pourcentageUtilise.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
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
      
      {/* Contenu principal */}
      <div className="p-6">
        {/* Solde Disponible - COMPOSANT AMÉLIORÉ */}
        <div className="mb-6">
          <SoldeDisponibleEnhanced
            montant={recette.soldeDisponible}
            montantInitial={recette.montant}
          />
        </div>
        
        {/* Informations détaillées */}
        <div className="space-y-4">
          {/* Statistiques */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">Dépensé</div>
              <div className="text-lg font-bold text-red-600">
                {formatCurrency(totalDepenses)}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">Restant</div>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(recette.soldeDisponible)}
              </div>
            </div>
          </div>
          
          {/* Description */}
          {recette.description && (
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-sm text-blue-600 font-medium mb-2">Description</div>
              <p className="text-gray-700">{recette.description}</p>
            </div>
          )}
          
          {/* Dates */}
          <div className="flex justify-between text-sm text-gray-500">
            <span>Créé le: {new Date(recette.createdAt).toLocaleDateString('fr-FR')}</span>
            <span>Mis à jour: {new Date(recette.updatedAt).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex space-x-2 mt-6">
          {onView && (
            <Button
              onClick={() => onView(recette)}
              variant="outline"
              size="sm"
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              Voir
            </Button>
          )}
          
          {onEdit && (
            <Button
              onClick={() => onEdit(recette)}
              variant="outline"
              size="sm"
              className="flex-1 bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
            >
              <EditIcon className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          )}
          
          {onDelete && (
            <Button
              onClick={() => onDelete(recette.id)}
              variant="outline"
              size="sm"
              className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
            >
              <Trash2Icon className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          )}
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
        className="absolute inset-0 rounded-3xl p-[2px] -z-10"
      >
        <div className="w-full h-full bg-white rounded-3xl" />
      </motion.div>
    </motion.div>
  )
}

export default RecetteCardEnhanced
