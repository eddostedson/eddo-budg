'use client'

import React, { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { QRCodeSVG } from 'qrcode.react'
import { Receipt } from '@/lib/shared-data'
import { Button } from '@/components/ui/button'
import { PrinterIcon, DownloadIcon } from 'lucide-react'

interface ReceiptPreviewProps {
  receipt: Receipt
  onClose?: () => void
}

export function ReceiptPreview({ receipt, onClose }: ReceiptPreviewProps) {
  const componentRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Reçu_${receipt.nomLocataire}_${receipt.periode}`,
    pageStyle: `
      @page {
        size: A4 landscape;
        margin: 0;
      }
      @media print {
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .receipt-print-container {
          width: 50% !important;
          max-width: 50% !important;
          margin: auto !important;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .receipt-print-container > div {
          page-break-inside: avoid;
          break-inside: avoid;
          padding-left: 3rem !important;
        }
        .receipt-print-container * {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .receipt-print-container .space-y-4 > * {
          page-break-after: avoid;
          break-after: avoid;
        }
        @page {
          size: A4 landscape;
          margin: 0;
        }
      }
    `
  })

  // Parser les données du QR code
  let qrData = {}
  try {
    qrData = receipt.qrCodeData ? JSON.parse(receipt.qrCodeData) : {}
  } catch (e) {
    console.error('Erreur parsing QR code data:', e)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Aperçu du Reçu</h2>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  if (componentRef.current) {
                    handlePrint()
                  } else {
                    console.error('Ref not available')
                  }
                }} 
                variant="outline" 
                size="sm"
              >
                <PrinterIcon className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
              {onClose && (
                <Button onClick={onClose} variant="outline" size="sm">
                  Fermer
                </Button>
              )}
            </div>
          </div>

          {/* Contenu du reçu à imprimer */}
          <div ref={componentRef} className="bg-white p-8 print:block receipt-print-container">
            <div className="border-2 border-gray-800 pt-6 pr-6 pb-6 pl-12 print:receipt-print-container" style={{ paddingLeft: '3rem' }}>
              {/* En-tête */}
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold mb-2">REÇU DE PAIEMENT</h1>
              </div>

              {/* Informations du reçu */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Date:</p>
                    <p className="text-base">{formatDate(receipt.dateTransaction)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Référence:</p>
                    <p className="text-base font-mono">{receipt.id.substring(0, 8).toUpperCase()}</p>
                  </div>
                </div>

                <div className="border-t border-gray-300 pt-4">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Bailleur :</p>
                  <p className="text-lg font-semibold">EDDO Stéphane</p>
                  <p className="text-sm text-gray-600">Tél: 0709363699</p>
                </div>

                <div className="border-t border-gray-300 pt-4">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Locataire(rice):</p>
                  <p className="text-lg font-bold">{receipt.nomLocataire}</p>
                </div>

                <div className="border-t border-gray-300 pt-4">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Villa:</p>
                  <p className="text-lg">{receipt.villa}</p>
                </div>

                <div className="border-t border-gray-300 pt-4">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Période:</p>
                  <p className="text-lg">{receipt.periode}</p>
                </div>

                {receipt.libelle && (
                  <div className="border-t border-gray-300 pt-4">
                    <p className="text-sm font-semibold text-gray-600 mb-2">Libellé:</p>
                    <p className="text-base">{receipt.libelle}</p>
                  </div>
                )}

                <div className="pt-4 mt-6">
                  <div className="flex justify-between items-center">
                    <p className="text-xl font-bold">Montant reçu:</p>
                    <p className="text-2xl font-bold">{formatCurrency(receipt.montant)}</p>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="border-t border-gray-300 pt-6 mt-6">
                <div className="flex items-center justify-center">
                  <div className="bg-white p-4 border-2 border-gray-300">
                    <QRCodeSVG
                      value={receipt.qrCodeData || JSON.stringify({
                        nom: receipt.nomLocataire,
                        villa: receipt.villa,
                        periode: receipt.periode,
                        montant: receipt.montant,
                        date: receipt.dateTransaction,
                        bailleur: 'EDDO Stéphane',
                        telephone: '0709363699'
                      })}
                      size={150}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                </div>
                <p className="text-xs text-center text-gray-500 mt-2">
                  Scannez ce code pour vérifier l'authenticité du reçu
                </p>
              </div>

              {/* Pied de page */}
              <div className="border-t-2 border-gray-800 pt-4 mt-6 text-center">
                <p className="text-xs text-gray-600">
                  Ce reçu certifie que le paiement a été effectué et reçu en bonne et due forme.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Généré le {formatDate(receipt.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
