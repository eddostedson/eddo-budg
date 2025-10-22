'use client'

import { Recette, isRecetteEpuisee, isRecetteUtilisable } from '@/lib/shared-data'
import { formatCurrency } from '@/lib/utils'

interface RecetteStatusBadgeProps {
  recette: Recette
  showDetails?: boolean
}

export function RecetteStatusBadge({ recette, showDetails = false }: RecetteStatusBadgeProps) {
  const isEpuisee = isRecetteEpuisee(recette)
  const isUtilisable = isRecetteUtilisable(recette)
  
  if (isEpuisee) {
    return (
      <div className="flex items-center gap-2">
        <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium border border-red-200">
          ⚠️ Solde épuisé
        </div>
        {showDetails && (
          <div className="text-xs text-gray-500">
            {formatCurrency(recette.soldeDisponible)} / {formatCurrency(recette.montant)}
          </div>
        )}
      </div>
    )
  }
  
  if (!isUtilisable) {
    return (
      <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium border border-orange-200">
        🔒 Clôturée
      </div>
    )
  }
  
  return (
    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium border border-green-200">
      ✅ Disponible
    </div>
  )
}







