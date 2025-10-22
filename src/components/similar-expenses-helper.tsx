'use client'

import { useState } from 'react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SimilarExpense {
  libelle: string
  date?: string
  montant?: number
}

interface SimilarExpensesHelperProps {
  similarExpenses: SimilarExpense[]
  onClose?: () => void
  className?: string
}

export function SimilarExpensesHelper({ 
  similarExpenses, 
  onClose,
  className = '' 
}: SimilarExpensesHelperProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (similarExpenses.length === 0) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
  }

  return (
    <Alert variant="info" className={`mb-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <AlertTitle className="flex items-center gap-2">
            <span>💡</span>
            Dépenses similaires trouvées
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="text-sm text-gray-600 mb-3">
              Voici des dépenses similaires pour vous aider à vous retrouver :
            </p>
            
            {!isExpanded && similarExpenses.length > 3 ? (
              <div>
                <div className="space-y-1">
                  {similarExpenses.slice(0, 3).map((expense, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">
                        {expense.date || 'Sans date'}
                      </Badge>
                      <span className="text-gray-700">{expense.libelle}</span>
                      {expense.montant && (
                        <span className="text-gray-500 text-xs">
                          {formatCurrency(expense.montant)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(true)}
                  className="mt-2 text-blue-600 hover:text-blue-700"
                >
                  Voir toutes ({similarExpenses.length})
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {similarExpenses.map((expense, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-xs">
                      {expense.date || 'Sans date'}
                    </Badge>
                    <span className="text-gray-700">{expense.libelle}</span>
                    {expense.montant && (
                      <span className="text-gray-500 text-xs">
                        {formatCurrency(expense.montant)}
                      </span>
                    )}
                  </div>
                ))}
                {isExpanded && similarExpenses.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                    className="mt-2 text-blue-600 hover:text-blue-700"
                  >
                    Voir moins
                  </Button>
                )}
              </div>
            )}
            
            <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 font-medium">
                ✅ Vous pouvez continuer - aucune restriction sur les doublons
              </p>
            </div>
          </AlertDescription>
        </div>
        
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </Button>
        )}
      </div>
    </Alert>
  )
}







