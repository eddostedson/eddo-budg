'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useReceipts } from '@/contexts/receipt-context'
import { useComptesBancaires } from '@/contexts/compte-bancaire-context'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/browser'

const supabase = createClient()

interface ReceiptSodeciDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReceiptSodeciDialog({ open, onOpenChange }: ReceiptSodeciDialogProps) {
  const { createReceipt } = useReceipts()
  const { comptes } = useComptesBancaires()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    libelle: '',
    montant: '',
    dateDebut: '',
    dateFin: '',
    compteId: comptes.length > 0 ? comptes[0].id : 'none'
  })
  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.libelle || !formData.montant || !formData.dateDebut || !formData.dateFin) {
      toast.error('Veuillez renseigner le libellé, le montant et la période complète.')
      return
    }

    const montant = parseFloat(formData.montant.replace(',', '.'))
    if (Number.isNaN(montant) || montant <= 0) {
      toast.error('Le montant doit être un nombre positif.')
      return
    }

    if (!formData.compteId || formData.compteId === 'none') {
      toast.error('Veuillez sélectionner un compte pour rattacher le reçu.')
      return
    }

    const start = new Date(formData.dateDebut)
    const end = new Date(formData.dateFin)
    if (start > end) {
      toast.error('La date de début doit être antérieure à la date de fin.')
      return
    }

    const periodeTexte = `Du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}`

    setLoading(true)
    try {
      let receiptUrl: string | undefined
      let receiptFileName: string | undefined

      if (file) {
        const ext = file.name.split('.').pop()
        const path = `sodeci-cie/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('receipts-files')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('❌ Erreur upload fichier reçu SODECI & CIE:', uploadError)
          toast.error('Erreur lors de l’upload du fichier du reçu.')
          setLoading(false)
          return
        }

        const { data } = supabase.storage.from('receipts-files').getPublicUrl(path)
        receiptUrl = data.publicUrl
        receiptFileName = file.name
      }

      const receiptId = await createReceipt({
        transactionId: undefined,
        compteId: formData.compteId,
        nomLocataire: 'SODECI & CIE',
        villa: 'Factures SODECI & CIE',
        periode: periodeTexte,
        montant,
        dateTransaction: end.toISOString(),
        libelle: formData.libelle,
        description: undefined,
        receiptUrl,
        receiptFileName
      })

      if (receiptId) {
        onOpenChange(false)
        setFile(null)
      }
    } catch (error) {
      console.error('❌ Erreur inattendue création reçu SODECI & CIE:', error)
      toast.error('Erreur inattendue lors de la création du reçu SODECI & CIE.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Reçu SODECI & CIE</DialogTitle>
          <DialogDescription>
            Crée un reçu spécifique pour les factures d&apos;eau et d&apos;électricité, avec période et
            fichier importé depuis ton PC.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="libelle">Libellé du reçu</Label>
            <Input
              id="libelle"
              placeholder="Ex: Facture SODECI Octobre 2025"
              value={formData.libelle}
              onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="montant">Montant</Label>
            <Input
              id="montant"
              type="number"
              placeholder="Ex: 85000"
              value={formData.montant}
              onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
              disabled={loading}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateDebut">Période – Début</Label>
              <Input
                id="dateDebut"
                type="date"
                value={formData.dateDebut}
                onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFin">Période – Fin</Label>
              <Input
                id="dateFin"
                type="date"
                value={formData.dateFin}
                onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fichier">Fichier du reçu (image ou PDF)</Label>
            <Input
              id="fichier"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const selected = e.target.files?.[0] || null
                setFile(selected)
              }}
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              Ce fichier sera stocké dans Supabase Storage (bucket <code>receipts-files</code>) et
              pourra être imprimé plus tard.
            </p>
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
              {loading ? 'Enregistrement...' : 'Enregistrer le reçu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}




