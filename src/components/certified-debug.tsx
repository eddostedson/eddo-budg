'use client'

import { Recette } from '@/lib/shared-data'

interface CertifiedDebugProps {
  certifiedRecettes: Recette[]
  totalCertified: number
  className?: string
}

export function CertifiedDebug({ 
  certifiedRecettes, 
  totalCertified,
  className = '' 
}: CertifiedDebugProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
  }

  const totalCalculated = certifiedRecettes.reduce((sum, recette) => sum + recette.soldeDisponible, 0)

  return (
    <div className={`bg-red-50 border-2 border-red-200 rounded-xl p-4 ${className}`}>
      <h3 className="text-lg font-bold text-red-800 mb-3 flex items-center gap-2">
        <span>🐛</span>
        Debug - Solde Certifié
      </h3>
      
      <div className="space-y-3">
        <div className="bg-white rounded-lg p-3 border border-red-300">
          <div className="text-sm font-medium text-gray-700 mb-2">Calculs :</div>
          <div className="text-xs space-y-1">
            <div>Total calculé manuellement: <span className="font-bold text-blue-600">{formatCurrency(totalCalculated)}</span></div>
            <div>Total retourné par getTotalCertified(): <span className="font-bold text-green-600">{formatCurrency(totalCertified)}</span></div>
            <div>Différence: <span className="font-bold text-red-600">{formatCurrency(Math.abs(totalCalculated - totalCertified))}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-red-300">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Recettes certifiées ({certifiedRecettes.length}) :
          </div>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {certifiedRecettes.map((recette, index) => (
              <div key={recette.id} className="bg-gray-50 rounded p-2 text-xs">
                <div className="font-medium text-gray-800">{index + 1}. {recette.libelle}</div>
                <div className="text-gray-600">
                  Montant: {formatCurrency(recette.montant)} | 
                  Solde: {formatCurrency(recette.soldeDisponible)} | 
                  Certifié: {recette.validationBancaire ? '✅' : '❌'}
                </div>
                {recette.dateValidationBancaire && (
                  <div className="text-gray-500">
                    Validé le: {new Date(recette.dateValidationBancaire).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {certifiedRecettes.length === 0 && (
          <div className="text-center py-4 text-gray-600">
            <div className="text-2xl mb-2">❌</div>
            <p className="text-sm">Aucune recette certifiée trouvée</p>
          </div>
        )}
      </div>
    </div>
  )
}
