'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'

interface ReceiptSidebarProps {
  isOpen: boolean
  onClose: () => void
  receiptUrl?: string
  fileName?: string
  className?: string
  autoClose?: boolean
}

export function ReceiptSidebar({ isOpen, onClose, receiptUrl, fileName, className = '', autoClose = false }: ReceiptSidebarProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFallback, setShowFallback] = useState(false)
  const isImage = receiptUrl?.match(/\.(jpeg|jpg|png|webp)$/i)
  
  useEffect(() => {
    if (isOpen && receiptUrl) {
      setIsLoading(true)
      setError(null)
      setShowFallback(false)
      
      // Délai pour simuler le chargement
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, receiptUrl])

  // Auto-fermeture après un délai si activé
  useEffect(() => {
    if (isOpen && autoClose) {
      const autoCloseTimer = setTimeout(() => {
        onClose()
      }, 5000) // Ferme automatiquement après 5 secondes
      
      return () => clearTimeout(autoCloseTimer)
    }
  }, [isOpen, autoClose, onClose])
  
  const handlePdfClick = () => {
    if (receiptUrl) {
      const newWindow = window.open(receiptUrl, '_blank', 'noopener,noreferrer')
      
      if (!newWindow) {
        setError('Impossible d\'ouvrir le PDF. Vérifiez que les pop-ups ne sont pas bloqués.')
      }
    }
  }

  const handleIframeError = () => {
    setShowFallback(true)
    setError('Impossible de prévisualiser le PDF')
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay pour fermer en cliquant à côté */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Panneau latéral */}
      <div className={`fixed top-0 right-0 h-full w-full lg:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${className} ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">📄</span>
            <h3 className="font-semibold">Aperçu du reçu</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-4">
          {!receiptUrl ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">Aucun reçu sélectionné</p>
              </div>
            </div>
          ) : isImage ? (
            // Aperçu pour les images
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-2">
                <strong>Fichier :</strong> {fileName}
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <Image
                  src={receiptUrl}
                  alt="Aperçu du reçu"
                  className="w-full h-auto max-h-96 object-contain"
                  width={800}
                  height={600}
                  unoptimized
                  onError={() => setShowFallback(true)}
                />
                {showFallback && (
                  <div className="text-center text-gray-500 text-sm py-8">
                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>Impossible de charger l'aperçu</p>
                  </div>
                )}
              </div>
              <button
                onClick={handlePdfClick}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Ouvrir l'image
              </button>
            </div>
          ) : (
            // Aperçu pour les PDFs
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-2">
                <strong>Fichier :</strong> {fileName}
              </div>
              
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
                  
                  <button
                    onClick={handlePdfClick}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Ouvrir le PDF complet
                  </button>
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
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
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
      </div>
    </>
  )
}
