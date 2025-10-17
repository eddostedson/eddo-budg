'use client'

import React, { useState } from 'react'

interface SimpleReceiptPreviewProps {
  receiptUrl: string
  fileName?: string
}

export function SimpleReceiptPreview({ receiptUrl, fileName }: SimpleReceiptPreviewProps) {
  const [showPreview, setShowPreview] = useState(false)
  
  return (
    <div className="relative">
      <div 
        className="border border-gray-300 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
        onMouseEnter={() => {
          console.log('🖱️ Mouse enter - showing preview')
          setShowPreview(true)
        }}
        onMouseLeave={() => {
          console.log('🖱️ Mouse leave - hiding preview')
          setShowPreview(false)
        }}
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {fileName || 'Reçu uploadé'}
            </p>
            <p className="text-xs text-gray-500">Fichier joint • Survolez pour voir l'aperçu</p>
          </div>
        </div>
      </div>
      
      {/* Aperçu au survol */}
      {showPreview && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Aperçu du reçu :</div>
            {receiptUrl.match(/\.(jpeg|jpg|png|webp)$/i) ? (
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
              // Aperçu pour les PDFs
              <div className="max-w-xs">
                <div className="bg-gray-100 border border-gray-200 rounded p-4 text-center">
                  <svg className="w-16 h-16 mx-auto mb-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-600 font-medium">Document PDF</p>
                  <p className="text-xs text-gray-500 mt-1">{fileName}</p>
                  <a 
                    href={receiptUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                  >
                    Ouvrir le PDF
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}







