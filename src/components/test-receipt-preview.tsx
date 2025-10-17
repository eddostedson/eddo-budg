'use client'

import React, { useState } from 'react'
import { ReceiptPreview } from './receipt-preview'

export function TestReceiptPreview() {
  const [showPreview, setShowPreview] = useState(false)
  
  // URL de test pour une image
  const testImageUrl = 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Test+Image'
  const testPdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  
  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold">Test Aperçu Reçu</h2>
      
      {/* Test avec image */}
      <div className="relative">
        <div 
          className="border border-gray-300 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
          onMouseEnter={() => setShowPreview(true)}
          onMouseLeave={() => setShowPreview(false)}
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Test Image</p>
              <p className="text-xs text-gray-500">Survolez pour voir l'aperçu</p>
            </div>
          </div>
        </div>
        
        {/* Aperçu au survol */}
        {showPreview && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50">
            <ReceiptPreview 
              receiptUrl={testImageUrl} 
              fileName="test-image.jpg"
            />
          </div>
        )}
      </div>
      
      {/* Test avec PDF */}
      <div className="relative">
        <div 
          className="border border-gray-300 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
          onMouseEnter={() => setShowPreview(true)}
          onMouseLeave={() => setShowPreview(false)}
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Test PDF</p>
              <p className="text-xs text-gray-500">Survolez pour voir l'aperçu</p>
            </div>
          </div>
        </div>
        
        {/* Aperçu au survol */}
        {showPreview && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50">
            <ReceiptPreview 
              receiptUrl={testPdfUrl} 
              fileName="test-document.pdf"
            />
          </div>
        )}
      </div>
    </div>
  )
}







