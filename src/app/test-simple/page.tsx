'use client'

import { SimpleReceiptPreview } from '@/components/simple-receipt-preview'

export default function TestSimplePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">Test Aperçu Simple</h1>
      
      <div className="space-y-8">
        {/* Test avec image */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Test avec Image</h2>
          <SimpleReceiptPreview 
            receiptUrl="https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Test+Image"
            fileName="test-image.jpg"
          />
        </div>
        
        {/* Test avec PDF */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Test avec PDF</h2>
          <SimpleReceiptPreview 
            receiptUrl="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
            fileName="test-document.pdf"
          />
        </div>
      </div>
    </div>
  )
}















