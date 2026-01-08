'use client'

import React, { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { QRCodeSVG } from 'qrcode.react'
import { Receipt } from '@/lib/shared-data'
import { Button } from '@/components/ui/button'
import { PrinterIcon, DownloadIcon } from 'lucide-react'
import Image from 'next/image'

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
        size: A4;
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
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

  const buildSignature = () => {
    if (receipt.signature) return receipt.signature

    const base = `${receipt.id}|${receipt.nomLocataire}|${receipt.villa}|${receipt.periode}|${receipt.montant}|${receipt.dateTransaction}`
    let hash = 0
    for (let i = 0; i < base.length; i++) {
      hash = (hash * 31 + base.charCodeAt(i)) >>> 0
    }
    return `EDDO-${hash.toString(16).toUpperCase().padStart(8, '0')}`
  }

  const formatVilla = (villa: string) => {
    if (!villa) return ''
    let value = villa
    value = value.replace(/^mini\s+Villa\s+/i, 'mini ')
    value = value.replace(/^Villa\s+/i, '')
    return value.trim()
  }

  const formatLibelle = (libelle: string | null | undefined) => {
    if (!libelle) return '-'
    // Supprimer tout ce qui suit ":" dans le libellé
    // Ex: "Loyer Kennedy: 3 Pieces Grandes" → "Loyer Kennedy"
    return libelle.split(':')[0].trim()
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
          <div ref={componentRef} className="bg-white p-6 print:block">
            <div className="border-2 border-gray-800 p-4">
              {/* En-tête */}
              <div className="relative mb-4">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-1">REÇU DE PAIEMENT</h1>
                  <div className="border-t-2 border-gray-800 pt-2 inline-block px-4">
                    <p className="text-base font-semibold">EDDO Stéphane</p>
                    <p className="text-xs">Tél: 0709363699</p>
                  </div>
                </div>

                {/* QR miniature en haut à droite */}
                <div className="absolute top-0 right-0 flex flex-col items-center text-[10px] gap-1">
                  <div className="bg-white p-1 border border-gray-300">
                    <QRCodeSVG
                      value={
                        receipt.qrCodeData ||
                        JSON.stringify({
                          nom: receipt.nomLocataire,
                          villa: receipt.villa,
                          periode: receipt.periode,
                          montant: receipt.montant,
                          date: receipt.dateTransaction,
                          bailleur: 'EDDO Stéphane',
                          telephone: '0709363699',
                          signature: buildSignature()
                        })
                      }
                      size={64}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <span className="font-mono">{buildSignature()}</span>
                </div>
              </div>

              {/* Informations du reçu */}
              <div className="space-y-3 mb-4 text-sm">
                <div>
                  <p className="font-semibold text-gray-600">
                    Date:&nbsp;
                    <span className="font-normal text-gray-900">
                      {formatDate(receipt.dateTransaction)}
                    </span>
                    ,&nbsp;Référence:&nbsp;
                    <span className="font-mono text-gray-900">
                      {receipt.id.substring(0, 8).toUpperCase()}
                    </span>
                  </p>
                </div>

                <div className="border-t border-gray-300 pt-3">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold text-gray-600">Le/la locataire:&nbsp;</span>
                    <span className="font-bold">{receipt.nomLocataire}</span>
                  </p>
                </div>

                <div className="border-t border-gray-300 pt-3">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold text-gray-600">Type:&nbsp;</span>
                    <span>{formatVilla(receipt.villa)}</span>
                  </p>
                </div>

                <div className="border-t border-gray-300 pt-3">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold text-gray-600">Période:&nbsp;</span>
                    <span>{receipt.periode}</span>
                  </p>
                </div>

                <div className="border-t border-gray-300 pt-3">
                  <p className="text-sm text-gray-900 flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      <span className="font-semibold text-gray-600">Libellé:&nbsp;</span>
                      <span>{formatLibelle(receipt.libelle)}</span>
                    </span>
                    <span>
                      <span className="font-semibold text-gray-600">Montant reçu:&nbsp;</span>
                      <span>{formatCurrency(receipt.montant)}</span>
                    </span>
                  </p>
                </div>
              </div>

              {/* Zone de signatures classiques */}
              <div className="mt-6 flex justify-end">
                <div className="text-center">
                  <p className="text-xs font-semibold text-gray-700 mb-2">
                    Signature du bailleur
                  </p>
                  <div className="mb-2 flex justify-center">
                    <Image
                      src="/signature-bailleur.png"
                      alt="Signature du bailleur"
                      className="h-16 w-auto object-contain"
                      width={200}
                      height={64}
                      priority
                    />
                  </div>
                  <div className="border-t border-gray-500 pt-1">
                    <p className="text-xs italic text-gray-800">
                      EDDO Stéphane
                    </p>
                  </div>
                </div>
              </div>

              {/* Pied de page */}
              <div className="border-t-2 border-gray-800 pt-3 mt-4 text-center">
                <p className="text-[10px] text-gray-600">
                  Ce reçu certifie que le paiement a été effectué et reçu en bonne et due forme.
                </p>
                <p className="text-[10px] text-gray-500 mt-1">
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
