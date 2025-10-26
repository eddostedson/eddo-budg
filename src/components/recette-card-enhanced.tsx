// 🎨 CARTE RECETTE AMÉLIORÉE - DESIGN REMARQUABLE
'use client'

import React from 'react'
import { Recette } from '@/lib/shared-data'
import { formatCurrency, formatCurrencyHarmonized } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EditIcon, Trash2Icon, EyeIcon, AlertTriangleIcon } from 'lucide-react'

interface RecetteCardEnhancedProps {
  recette: Recette
  onEdit?: (recette: Recette) => void
  onDelete?: (id: string) => void
  onView?: (recette: Recette) => void
  isSelected?: boolean
  onToggleSelection?: (recetteId: string) => void
  showSelection?: boolean
}

const RecetteCardEnhanced: React.FC<RecetteCardEnhancedProps> = ({
  recette,
  onEdit,
  onDelete,
  onView,
  isSelected = false,
  onToggleSelection,
  showSelection = false
}) => {
  const totalDepenses = recette.montant - recette.soldeDisponible
  const pourcentageUtilise = (totalDepenses / recette.montant) * 100

  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={`relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer h-80 ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}
      onClick={() => onView && onView(recette)}
    >
      {/* Barre de statut colorée avec icône */}
      <div className={`absolute left-0 top-0 bottom-0 w-2 ${
        recette.soldeDisponible === recette.montant ? 'bg-gradient-to-b from-green-500 to-green-600' :
        recette.soldeDisponible > recette.montant * 0.5 ? 'bg-gradient-to-b from-yellow-500 to-yellow-600' :
        recette.soldeDisponible > recette.montant * 0.2 ? 'bg-gradient-to-b from-orange-500 to-orange-600' : 'bg-gradient-to-b from-red-500 to-red-600'
      }`}>
        {recette.soldeDisponible < recette.montant * 0.2 && (
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
            <AlertTriangleIcon className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Checkbox de sélection */}
      {showSelection && (
        <div 
          className="absolute top-4 right-4 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelection && onToggleSelection(recette.id);
          }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            readOnly
            className="w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
          />
        </div>
      )}

      <div className="p-6 h-full flex flex-col">
        {/* En-tête avec statut */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0 pr-2">
            <h3 
              className="text-xl font-bold text-gray-900 truncate cursor-help hover:text-blue-600 transition-colors mb-2" 
              title={recette.libelle}
            >
              {recette.libelle}
            </h3>
            <div className="flex items-center space-x-2">
              <Badge 
                variant="secondary" 
                className={`text-xs px-3 py-1 ${
                  recette.statut === 'reçue' ? 'bg-green-100 text-green-800' :
                  recette.statut === 'en attente' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {recette.statut}
              </Badge>
              <span className="text-xs text-gray-500">
                {new Date(recette.dateReception).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        </div>

        {/* Section principale avec informations complètes */}
        <div className="flex-1 space-y-4">
          {/* Montant initial */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-1">Montant Initial</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrencyHarmonized(recette.montant)}
            </div>
          </div>

          {/* Solde disponible avec pourcentage */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="relative">
              <div className="text-sm opacity-90 mb-2">Solde Disponible</div>
              <div className="text-3xl font-bold mb-2">
                {formatCurrencyHarmonized(recette.soldeDisponible)}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-90">
                  {Math.round((recette.soldeDisponible / recette.montant) * 100)}% disponible
                </div>
                <div className="bg-white bg-opacity-20 rounded-full px-3 py-1 text-xs font-medium">
                  Disponible
                </div>
              </div>
            </div>
          </div>

          {/* Dépenses et restant */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 rounded-xl p-3 border border-red-100">
              <div className="text-xs text-red-600 mb-1">Dépensé</div>
              <div className="text-lg font-bold text-red-700">
                {formatCurrencyHarmonized(totalDepenses)}
              </div>
            </div>
            <div className="bg-green-50 rounded-xl p-3 border border-green-100">
              <div className="text-xs text-green-600 mb-1">Restant</div>
              <div className="text-lg font-bold text-green-700">
                {formatCurrencyHarmonized(recette.soldeDisponible)}
              </div>
            </div>
          </div>

          {/* Description si disponible */}
          {recette.description && (
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <div className="text-xs text-blue-600 mb-1">Description</div>
              <div className="text-sm text-blue-800 line-clamp-2">
                {recette.description}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
          {onView && (
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onView(recette); }} className="h-8">
              <EyeIcon className="h-4 w-4 mr-1" />
              Voir
            </Button>
          )}
          {onEdit && (
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onEdit(recette); }} className="h-8">
              <EditIcon className="h-4 w-4 mr-1" />
              Modifier
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onDelete(recette.id); }} className="h-8 text-red-600 border-red-200 hover:bg-red-50">
              <Trash2Icon className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default RecetteCardEnhanced
