'use client'

import React, { useState } from 'react'
import { ReceiptPreview } from '@/components/receipt-preview'

export default function TestPdfPreviewPage() {
  const [showPdfPreview, setShowPdfPreview] = useState(false)
  const [showImagePreview, setShowImagePreview] = useState(false)
  
  // URLs de test
  const testPdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  const testImageUrl = 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Test+Image'
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Prévisualisation PDF</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test PDF */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Test PDF avec iframe</h2>
            <div className="relative">
              <div 
                className="border border-gray-300 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                onMouseEnter={() => setShowPdfPreview(true)}
                onMouseLeave={() => setShowPdfPreview(false)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Document PDF de test</p>
                    <p className="text-xs text-gray-500">Survolez pour voir l'aperçu avec iframe</p>
                  </div>
                </div>
              </div>
              
              {/* Aperçu au survol */}
              {showPdfPreview && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50">
                  <ReceiptPreview 
                    receiptUrl={testPdfUrl} 
                    fileName="dummy.pdf"
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Test Image */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Image</h2>
            <div className="relative">
              <div 
                className="border border-gray-300 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                onMouseEnter={() => setShowImagePreview(true)}
                onMouseLeave={() => setShowImagePreview(false)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Image de test</p>
                    <p className="text-xs text-gray-500">Survolez pour voir l'aperçu</p>
                  </div>
                </div>
              </div>
              
              {/* Aperçu au survol */}
              {showImagePreview && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50">
                  <ReceiptPreview 
                    receiptUrl={testImageUrl} 
                    fileName="test-image.jpg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Test direct de prévisualisation */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Direct - Prévisualisation PDF</h2>
          <div className="max-w-2xl">
            <ReceiptPreview 
              receiptUrl={testPdfUrl} 
              fileName="dummy.pdf"
            />
          </div>
        </div>
        
        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Instructions de test</h3>
          <ul className="text-blue-800 space-y-1">
            <li>• <strong>Test avec iframe :</strong> Survolez le premier élément pour voir l'aperçu PDF avec iframe</li>
            <li>• <strong>Test image :</strong> Survolez le deuxième élément pour voir l'aperçu d'image</li>
            <li>• <strong>Test direct :</strong> La section du bas montre directement l'aperçu PDF</li>
            <li>• <strong>Pour les PDFs :</strong> Vous devriez voir une vraie prévisualisation du contenu dans un iframe</li>
            <li>• <strong>Fallback :</strong> Si l'iframe ne fonctionne pas, un bouton d'ouverture s'affiche</li>
            <li>• <strong>Bouton "Ouvrir complet" :</strong> Pour ouvrir le PDF dans un nouvel onglet</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
