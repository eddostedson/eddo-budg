'use client'

import React, { useState } from 'react'

interface SimplePdfPreviewProps {
  receiptUrl: string
  fileName?: string
  className?: string
}

export function SimplePdfPreview({ receiptUrl, fileName, className = '' }: SimplePdfPreviewProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handlePreviewClick = () => {
    setIsLoading(true)
    setError(null)
    
    // Ouvrir le PDF dans un nouvel onglet
    const newWindow = window.open(receiptUrl, '_blank', 'noopener,noreferrer')
    
    if (!newWindow) {
      setError('Impossible d\'ouvrir le PDF. Vérifiez que les pop-ups ne sont pas bloqués.')
    }
    
    setIsLoading(false)
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-xl p-4 ${className}`}>
      <div className="text-sm font-medium text-gray-700 mb-2">Aperçu du reçu :</div>
      
      <div className="max-w-sm">
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
            onClick={handlePreviewClick}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Ouverture...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Ouvrir le PDF
              </>
            )}
          </button>
          
          <div className="mt-3 text-xs text-gray-500">
            Cliquez pour ouvrir le PDF dans un nouvel onglet
          </div>
        </div>
      </div>
    </div>
  )
}






