'use client'

import { Recette } from '@/lib/shared-data'

interface CertifiedSummaryProps {
  totalCertified: number
  totalRecettes: number
  totalCertifiedAmount: number
  certifiedRecettes: Recette[]
  className?: string
}

export function CertifiedSummary({ 
  totalCertified, 
  totalRecettes, 
  totalCertifiedAmount,
  certifiedRecettes,
  className = '' 
}: CertifiedSummaryProps) {
  const percentage = totalRecettes > 0 ? Math.round((totalCertifiedAmount / totalRecettes) * 100) : 0
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
  }

  return (
    <div className={`bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 border-2 border-yellow-200 rounded-2xl p-6 shadow-lg ${className}`}>
      {/* Header avec icône de certification */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fillRule="evenodd" 
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Recettes Certifiées</h3>
          <p className="text-sm text-gray-600">Montants vérifiés et conformes</p>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-yellow-300">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-700 mb-1">
              {formatCurrency(totalCertified)}
            </div>
            <div className="text-xs text-yellow-600 font-medium">Solde Certifié Disponible</div>
          </div>
        </div>
        
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-orange-300">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-700 mb-1">
              {certifiedRecettes.length}
            </div>
            <div className="text-xs text-orange-600 font-medium">Recettes Validées</div>
          </div>
        </div>
        
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-amber-300">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-700 mb-1">
              {percentage}%
            </div>
            <div className="text-xs text-amber-600 font-medium">Taux de Certification</div>
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progression de certification</span>
          <span className="text-sm text-gray-600">{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Liste des recettes certifiées */}
      {certifiedRecettes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <span>🏆</span>
            Recettes Certifiées ({certifiedRecettes.length})
          </h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {certifiedRecettes.map((recette) => (
              <div 
                key={recette.id}
                className="flex items-center justify-between bg-white/40 backdrop-blur-sm rounded-lg p-2 border border-yellow-200"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {recette.libelle}
                  </span>
                </div>
                <span className="text-sm font-bold text-yellow-700">
                  {formatCurrency(recette.soldeDisponible)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message si aucune certification */}
      {certifiedRecettes.length === 0 && (
        <div className="text-center py-4">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-sm text-gray-600">
            Aucune recette certifiée pour le moment
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Validez vos recettes pour les marquer comme conformes
          </p>
        </div>
      )}
    </div>
  )
}
