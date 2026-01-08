'use client'

import React, { useState } from 'react'
import Image from 'next/image'

interface SimpleReceiptPreviewProps {
  receiptUrl: string
  fileName?: string
}

export function SimpleReceiptPreview({ receiptUrl, fileName }: SimpleReceiptPreviewProps) {
  const [showPreview, setShowPreview] = useState(false)
  const isPdf = receiptUrl.toLowerCase().endsWith('.pdf') || receiptUrl.toLowerCase().includes('application/pdf')
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Ouvrir le PDF dans un nouvel onglet
    window.open(receiptUrl, '_blank', 'noopener,noreferrer')
  }
  
  return (
    <div className="relative">
      <div 
        className="border border-gray-300 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
        onMouseEnter={() => {
          setShowPreview(true)
        }}
        onMouseLeave={() => {
          setShowPreview(false)
        }}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick(e as any)
          }
        }}
        aria-label={`Ouvrir ${fileName || 'le reçu'}`}
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
            <p className="text-xs text-gray-500">Fichier joint • Survolez pour voir l'aperçu • Cliquez pour ouvrir</p>
          </div>
        </div>
      </div>
      
      {/* Aperçu au survol */}
      {showPreview && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 z-50"
          onMouseEnter={() => setShowPreview(true)}
          onMouseLeave={() => setShowPreview(false)}
        >
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-w-md">
            <div className="text-sm font-medium text-gray-700 mb-3">Aperçu du reçu :</div>
            {!isPdf && receiptUrl.match(/\.(jpeg|jpg|png|webp)$/i) ? (
              // Aperçu pour les images
              <div className="max-w-full">
                <Image
                  src={receiptUrl}
                  alt="Aperçu du reçu"
                  className="max-w-full h-auto rounded border border-gray-200 shadow-sm"
                  width={600}
                  height={400}
                  unoptimized
                />
              </div>
            ) : (
              // Aperçu pour les PDFs avec iframe
              <div className="w-full">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-center mb-3">
                    <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700 font-medium text-center mb-1">Document PDF</p>
                  <p className="text-xs text-gray-500 text-center mb-3 break-all">{fileName}</p>
                </div>
                {/* Aperçu PDF avec iframe */}
                <div className="border border-gray-300 rounded-lg overflow-hidden bg-white" style={{ height: '400px' }}>
                  <iframe
                    src={receiptUrl}
                    className="w-full h-full"
                    title={`Aperçu de ${fileName || 'le PDF'}`}
                  />
                </div>
                <button
                  onClick={handleClick}
                  className="w-full mt-3 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Ouvrir le PDF dans un nouvel onglet
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}





















