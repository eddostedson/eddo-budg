'use client'

import React, { useState } from 'react'
import { useReceipts } from '@/contexts/receipt-context'
import { Receipt } from '@/lib/shared-data'
import { ReceiptPreview } from '@/components/receipt-preview'
import { ReceiptFormDialog } from '@/components/receipt-form-dialog'
import { ReceiptBulkFormDialog } from '@/components/receipt-bulk-form-dialog'
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
  const [showBulkForm, setShowBulkForm] = useState(false)

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
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <Loader2Icon className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg px-4 py-6 md:px-8 md:py-8">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-2">
              <ReceiptIcon className="h-4 w-4 text-indigo-500" />
              Reçus
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold text-slate-900">Gestion des Reçus</h1>
            <p className="mt-1 text-sm text-slate-500">
              Consulte, modifie et supprime les reçus générés automatiquement pour tes locations.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkForm(true)
              }}
              className="rounded-xl border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Générer plusieurs reçus
            </Button>
            <Button
              onClick={() => {
                setReceiptToEdit(null)
                setShowForm(true)
              }}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm shadow-sm"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nouveau Reçu
            </Button>
          </div>
        </div>

        {/* Statistiques simplifiées */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-md px-5 py-4">
            <div className="text-xs font-medium uppercase tracking-wide opacity-90">
              Total Reçus
            </div>
            <div className="mt-2 text-2xl md:text-3xl font-semibold">{receipts.length}</div>
            <p className="mt-1 text-[11px] opacity-80">
              Nombre total de reçus générés pour toutes les locations.
            </p>
          </Card>
        </div>

        {/* Liste des reçus */}
        {receipts.length === 0 ? (
          <Card className="p-12 text-center rounded-xl border border-slate-200 bg-slate-50">
            <ReceiptIcon className="h-16 w-16 mx-auto text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Aucun reçu</h3>
            <p className="text-slate-500 mb-4">
              Les reçus générés automatiquement lors des crédits sur Cité Kennedy apparaîtront ici.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBulkForm(true)
                }}
                className="rounded-xl border-slate-300 bg-white hover:bg-slate-100 text-slate-800"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Générer plusieurs reçus
              </Button>
              <Button
                onClick={() => {
                  setReceiptToEdit(null)
                  setShowForm(true)
                }}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Créer un reçu
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {receipts.map((receipt, index) => (
              <motion.div
                key={receipt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
              >
                <Card className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-indigo-100 to-sky-50 hover:shadow-md transition-all">
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          {receipt.nomLocataire}
                        </h3>
                        <p className="text-xs text-slate-500">{receipt.villa}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-emerald-600">
                          {formatCurrency(receipt.montant)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formatDate(receipt.dateTransaction)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                          Période
                        </span>
                        <span className="font-medium text-slate-800">{receipt.periode}</span>
                      </div>
                      {receipt.libelle && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                            Libellé
                          </span>
                          <span className="font-medium text-slate-800 truncate max-w-[180px] text-right">
                            {receipt.libelle}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 px-5 pb-4 pt-3 border-t border-slate-200 bg-white/60 rounded-b-xl">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(receipt)}
                      className="flex-1 rounded-lg border-slate-300 text-slate-800 hover:bg-slate-50"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(receipt)}
                      className="flex-1 rounded-lg border-slate-300 text-slate-800 hover:bg-slate-50"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(receipt)}
                      className="rounded-lg border-red-200 text-red-600 hover:bg-red-50"
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

        {showBulkForm && (
          <ReceiptBulkFormDialog
            open={showBulkForm}
            onOpenChange={(open) => {
              setShowBulkForm(open)
            }}
          />
        )}
      </div>
    </div>
  )
}





