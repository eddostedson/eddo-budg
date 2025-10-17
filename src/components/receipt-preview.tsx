'use client'

import React, { useState, useEffect } from 'react'

interface ReceiptPreviewProps {
  receiptUrl: string
  fileName?: string
  className?: string
}

export function ReceiptPreview({ receiptUrl, fileName, className = '' }: ReceiptPreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFallback, setShowFallback] = useState(false)
  const isImage = receiptUrl.match(/\.(jpeg|jpg|png|webp)$/i)
  
  useEffect(() => {
    // Délai pour simuler le chargement
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])
  
  const handlePdfClick = () => {
    const newWindow = window.open(receiptUrl, '_blank', 'noopener,noreferrer')
    
    if (!newWindow) {
      setError('Impossible d\'ouvrir le PDF. Vérifiez que les pop-ups ne sont pas bloqués.')
    }
  }

  const handleIframeError = () => {
    setShowFallback(true)
    setError('Impossible de prévisualiser le PDF')
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-xl p-4 ${className}`}>
      <div className="text-sm font-medium text-gray-700 mb-2">Aperçu du reçu :</div>
      {isImage ? (
        // Aperçu pour les images
        <div className="max-w-xs">
          <img 
            src={receiptUrl} 
            alt="Aperçu du reçu" 
            className="max-w-full h-auto rounded border border-gray-200 shadow-sm"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden text-center text-gray-500 text-sm py-4">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>Impossible de charger l'aperçu</p>
          </div>
        </div>
      ) : (
        // Aperçu pour les PDFs avec vraie prévisualisation
        <div className="max-w-lg">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-sm text-gray-600">Chargement de l'aperçu...</span>
            </div>
          )}
          
          {!isLoading && !showFallback && (
            <div className="space-y-3">
              {/* Prévisualisation PDF avec iframe */}
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <iframe
                  src={`${receiptUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  width="100%"
                  height="400"
                  className="w-full"
                  onError={handleIframeError}
                  onLoad={() => setIsLoading(false)}
                  title={`Aperçu de ${fileName || 'document PDF'}`}
                />
              </div>
              
              {/* Contrôles et informations */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="truncate max-w-xs">{fileName}</span>
                <button
                  onClick={handlePdfClick}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Ouvrir complet
                </button>
              </div>
            </div>
          )}
          
          {/* Fallback si l'iframe ne fonctionne pas */}
          {(showFallback || error) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              
              <p className="text-sm text-gray-700 font-medium mb-2">Document PDF</p>
              <p className="text-xs text-gray-500 mb-4">{fileName}</p>
              
              {error && (
                <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                  {error}
                </div>
              )}
              
              <button
                onClick={handlePdfClick}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Ouvrir le PDF
              </button>
              
              <div className="mt-3 text-xs text-gray-500">
                Cliquez pour ouvrir le PDF dans un nouvel onglet
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

