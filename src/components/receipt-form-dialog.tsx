'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2Icon } from 'lucide-react'
import { useReceipts } from '@/contexts/receipt-context'
import { useComptesBancaires } from '@/contexts/compte-bancaire-context'
import { Receipt } from '@/lib/shared-data'
import { toast } from 'sonner'

interface ReceiptFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receiptToEdit?: Receipt | null
}

export function ReceiptFormDialog({ open, onOpenChange, receiptToEdit }: ReceiptFormDialogProps) {
  const { createReceipt, updateReceipt } = useReceipts()
  const { comptes } = useComptesBancaires()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nomLocataire: '',
    villa: '',
    periode: '',
    montant: '',
    dateTransaction: new Date().toISOString().split('T')[0],
    compteId: comptes.length > 0 ? comptes[0].id : 'none',
    libelle: '',
    description: ''
  })

  useEffect(() => {
    if (receiptToEdit && open) {
      setFormData({
        nomLocataire: receiptToEdit.nomLocataire,
        villa: receiptToEdit.villa,
        periode: receiptToEdit.periode,
        montant: receiptToEdit.montant.toString(),
        dateTransaction: new Date(receiptToEdit.dateTransaction).toISOString().split('T')[0],
        compteId: receiptToEdit.compteId,
        libelle: receiptToEdit.libelle || '',
        description: receiptToEdit.description || ''
      })
    } else if (!receiptToEdit && open) {
      setFormData({
        nomLocataire: '',
        villa: '',
        periode: '',
        montant: '',
        dateTransaction: new Date().toISOString().split('T')[0],
        compteId: comptes.length > 0 ? comptes[0].id : 'none',
        libelle: '',
        description: ''
      })
    }
  }, [receiptToEdit, open, comptes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nomLocataire || !formData.villa || !formData.periode || !formData.montant) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    const montant = parseFloat(formData.montant)
    if (isNaN(montant) || montant <= 0) {
      toast.error('Le montant doit être un nombre positif')
      return
    }

    if (!formData.compteId || formData.compteId === 'none') {
      toast.error('Veuillez sélectionner un compte')
      return
    }

    setLoading(true)
    try {
      if (receiptToEdit) {
        // MODIFICATION
        const success = await updateReceipt(receiptToEdit.id, {
          nomLocataire: formData.nomLocataire,
          villa: formData.villa,
          periode: formData.periode,
          montant: montant,
          dateTransaction: new Date(formData.dateTransaction).toISOString(),
          libelle: formData.libelle || undefined,
          description: formData.description || undefined
        })

        if (success) {
          onOpenChange(false)
        }
      } else {
        // CRÉATION
        const receiptId = await createReceipt({
          transactionId: undefined,
          compteId: formData.compteId,
          nomLocataire: formData.nomLocataire,
          villa: formData.villa,
          periode: formData.periode,
          montant: montant,
          dateTransaction: new Date(formData.dateTransaction).toISOString(),
          libelle: formData.libelle || undefined,
          description: formData.description || undefined
        })

        if (receiptId) {
          onOpenChange(false)
        }
      }
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      toast.error('❌ Erreur inattendue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {receiptToEdit ? '✏️ Modifier le Reçu' : '📄 Nouveau Reçu'}
          </DialogTitle>
          <DialogDescription>
            {receiptToEdit ? 'Modifiez les informations du reçu' : 'Créez un nouveau reçu de paiement'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nomLocataire">
              Nom du Locataire <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nomLocataire"
              placeholder="Ex: Jean Dupont"
              value={formData.nomLocataire}
              onChange={(e) => setFormData({ ...formData, nomLocataire: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="villa">
              Villa <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.villa}
              onValueChange={(value) => setFormData({ ...formData, villa: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une villa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mini Villa 2 Pièces EAN">mini Villa 2 Pièces EAN</SelectItem>
                <SelectItem value="Villa 3 Pièces ESP">Villa 3 Pièces ESP</SelectItem>
                <SelectItem value="Villa 3 Pièces ALMYF">Villa 3 Pièces ALMYF</SelectItem>
                <SelectItem value="Villa 4 Pièces EKB">Villa 4 Pièces EKB</SelectItem>
                <SelectItem value="Villa 4 Pièces MAD">Villa 4 Pièces MAD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="periode">
              Période <span className="text-red-500">*</span>
            </Label>
            <Input
              id="periode"
              type="date"
              value={(() => {
                // Si periode est déjà formatée (ex: "mai 2025"), on ne peut pas la convertir en date
                // On utilise une date par défaut pour l'input
                if (formData.periode && !formData.periode.match(/^\d{4}-\d{2}-\d{2}$/)) {
                  return new Date().toISOString().split('T')[0]
                }
                return formData.periode || new Date().toISOString().split('T')[0]
              })()}
              onChange={(e) => {
                const date = e.target.value
                if (date) {
                  const periodeFormatee = new Date(date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                  setFormData({ ...formData, periode: periodeFormatee })
                }
              }}
              required
              disabled={loading}
            />
            {formData.periode && (
              <p className="text-xs text-gray-500">
                Affichage: {formData.periode}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="montant">
              Montant (F CFA) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="montant"
              type="number"
              step="0.01"
              placeholder="Ex: 100000"
              value={formData.montant}
              onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateTransaction">
              Date de Transaction <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dateTransaction"
              type="date"
              value={formData.dateTransaction}
              onChange={(e) => setFormData({ ...formData, dateTransaction: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="compteId">
              Compte <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.compteId}
              onValueChange={(value) => setFormData({ ...formData, compteId: value })}
              disabled={loading || comptes.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un compte" />
              </SelectTrigger>
              <SelectContent>
                {comptes.length === 0 ? (
                  <SelectItem value="none" disabled>Aucun compte disponible</SelectItem>
                ) : (
                  comptes.map((compte) => (
                    <SelectItem key={compte.id} value={compte.id}>
                      {compte.nom}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="libelle">Libellé</Label>
            <Input
              id="libelle"
              placeholder="Ex: Loyer mensuel"
              value={formData.libelle}
              onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Informations supplémentaires..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  {receiptToEdit ? 'Modification...' : 'Création...'}
                </>
              ) : (
                receiptToEdit ? '✅ Modifier le reçu' : '✅ Créer le reçu'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

