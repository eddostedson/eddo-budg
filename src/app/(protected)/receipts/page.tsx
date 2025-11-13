'use client'

import React, { useState } from 'react'
import { useReceipts } from '@/contexts/receipt-context'
import { Receipt } from '@/lib/shared-data'
import { ReceiptPreview } from '@/components/receipt-preview'
import { ReceiptFormDialog } from '@/components/receipt-form-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ReceiptIcon, PlusIcon, EyeIcon, PencilIcon, TrashIcon, Loader2Icon } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function ReceiptsPage() {
  const { receipts, loading, deleteReceipt } = useReceipts()
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [receiptToEdit, setReceiptToEdit] = useState<Receipt | null>(null)

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

  const handleView = (receipt: Receipt) => {
    setSelectedReceipt(receipt)
    setShowPreview(true)
  }

  const handleEdit = (receipt: Receipt) => {
    setReceiptToEdit(receipt)
    setShowForm(true)
  }

  const handleDelete = async (receipt: Receipt) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le reçu de ${receipt.nomLocataire} ?`)) {
      await deleteReceipt(receipt.id)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2Icon className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <ReceiptIcon className="h-8 w-8 text-blue-600" />
            Gestion des Reçus
          </h1>
          <p className="text-gray-600">Consultez, modifiez et supprimez vos reçus générés</p>
        </div>
        <Button onClick={() => {
          setReceiptToEdit(null)
          setShowForm(true)
        }}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Nouveau Reçu
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="text-sm opacity-90 mb-1">Total Reçus</div>
          <div className="text-3xl font-bold">{receipts.length}</div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="text-sm opacity-90 mb-1">Montant Total</div>
          <div className="text-3xl font-bold">
            {formatCurrency(receipts.reduce((sum, r) => sum + r.montant, 0))}
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="text-sm opacity-90 mb-1">Ce Mois</div>
          <div className="text-3xl font-bold">
            {receipts.filter(r => {
              const receiptDate = new Date(r.dateTransaction)
              const now = new Date()
              return receiptDate.getMonth() === now.getMonth() && receiptDate.getFullYear() === now.getFullYear()
            }).length}
          </div>
        </Card>
      </div>

      {/* Liste des reçus */}
      {receipts.length === 0 ? (
        <Card className="p-12 text-center">
          <ReceiptIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun reçu</h3>
          <p className="text-gray-500 mb-4">Les reçus générés automatiquement lors des crédits sur Cité kennedy apparaîtront ici.</p>
          <Button onClick={() => {
            setReceiptToEdit(null)
            setShowForm(true)
          }}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Créer un reçu
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {receipts.map((receipt, index) => (
            <motion.div
              key={receipt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{receipt.nomLocataire}</h3>
                    <p className="text-sm text-gray-600">{receipt.villa}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">{formatCurrency(receipt.montant)}</p>
                    <p className="text-xs text-gray-500">{formatDate(receipt.dateTransaction)}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600 w-20">Période:</span>
                    <span className="font-medium">{receipt.periode}</span>
                  </div>
                  {receipt.libelle && (
                    <div className="flex items-center text-sm">
                      <span className="text-gray-600 w-20">Libellé:</span>
                      <span className="font-medium truncate">{receipt.libelle}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(receipt)}
                    className="flex-1"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Voir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(receipt)}
                    className="flex-1"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(receipt)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modales */}
      {showPreview && selectedReceipt && (
        <ReceiptPreview
          receipt={selectedReceipt}
          onClose={() => {
            setShowPreview(false)
            setSelectedReceipt(null)
          }}
        />
      )}

      {showForm && (
        <ReceiptFormDialog
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open)
            if (!open) {
              setReceiptToEdit(null)
            }
          }}
          receiptToEdit={receiptToEdit}
        />
      )}
    </div>
  )
}



