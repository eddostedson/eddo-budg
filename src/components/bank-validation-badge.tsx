'use client'

import { useState } from 'react'
import { Recette } from '@/lib/shared-data'

interface BankValidationBadgeProps {
  recette: Recette
  onToggleValidation: (recetteId: string, isValidated: boolean) => Promise<void>
  className?: string
}

export function BankValidationBadge({ 
  recette, 
  onToggleValidation, 
  className = '' 
}: BankValidationBadgeProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation() // Empêcher la navigation vers la page de détail
    
    if (isLoading) return
    
    setIsLoading(true)
    try {
      await onToggleValidation(recette.id, !recette.validationBancaire)
    } catch (error) {
      console.error('Erreur lors de la validation bancaire:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const isValidationActive = recette.validationBancaire === true

  return (
    <div className={`relative ${className}`}>
      {/* Sceau de validation proéminent */}
      {isValidationActive && (
        <div className="absolute -top-3 -right-3 z-20 transform rotate-12">
          <div className="relative">
            {/* Sceau doré avec effet 3D */}
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full shadow-2xl border-4 border-yellow-300 flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
              {/* Bordure décorative */}
              <div className="absolute inset-1 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-full border-2 border-yellow-600"></div>
              
              {/* Icône de validation */}
              <div className="relative z-10">
                <svg className="w-6 h-6 text-yellow-800 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                  <path 
                    fillRule="evenodd" 
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
              
              {/* Effet de brillance */}
              <div className="absolute top-1 left-1 w-3 h-3 bg-white/60 rounded-full blur-sm"></div>
            </div>
            
            {/* Ruban rouge */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-4 bg-red-500 rounded-sm shadow-lg">
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-4 border-transparent border-t-red-500"></div>
            </div>
          </div>
        </div>
      )}

      {/* Bouton de toggle plus discret */}
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`
          group relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
          transition-all duration-200 hover:scale-105 active:scale-95
          ${isValidationActive 
            ? 'bg-yellow-50 text-yellow-700 border border-yellow-300 hover:bg-yellow-100' 
            : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={isValidationActive 
          ? 'Validé - Conforme au solde bancaire' 
          : 'Cliquer pour valider la conformité bancaire'
        }
      >
        {isLoading ? (
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {isValidationActive ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path 
                  fillRule="evenodd" 
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                  clipRule="evenodd" 
                />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            )}
            <span className="hidden sm:inline">
              {isValidationActive ? 'Validé' : 'Valider'}
            </span>
          </>
        )}
      </button>

      {/* Tooltip avec date de validation */}
      {isValidationActive && recette.dateValidationBancaire && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
          Validé le {new Date(recette.dateValidationBancaire).toLocaleDateString('fr-FR')}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  )
}

// Composant badge simple (sans bouton de toggle) pour l'affichage
export function BankValidationBadgeDisplay({ 
  recette, 
  className = '' 
}: { 
  recette: Recette
  className?: string 
}) {
  const isValidationActive = recette.validationBancaire === true

  if (!isValidationActive) return null

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <div className="bg-green-500 text-white rounded-full p-1 shadow-sm">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path 
            fillRule="evenodd" 
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>
      <span className="text-xs text-green-600 font-medium">Conforme</span>
    </div>
  )
}
