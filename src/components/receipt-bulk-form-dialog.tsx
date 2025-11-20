'use client'

import React, { useEffect, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2Icon } from 'lucide-react'
import { useReceipts } from '@/contexts/receipt-context'
import { useComptesBancaires } from '@/contexts/compte-bancaire-context'
import { toast } from 'sonner'
import { useTenants } from '@/hooks/useTenants'

interface ReceiptBulkFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface MonthDefinition {
  year: number
  monthIndex: number // 0-11
}

export function ReceiptBulkFormDialog({ open, onOpenChange }: ReceiptBulkFormDialogProps) {
  const { receipts, createReceipt } = useReceipts()
  const { comptes } = useComptesBancaires()
  const { tenantOptions, addTenantIfNotExists } = useTenants()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nomLocataire: '',
    villa: '',
    montant: '',
    startMonth: '',
    endMonth: '',
    libelle: 'Loyer mensuel',
    description: ''
  })

  const parseMonth = (value: string): MonthDefinition | null => {
    if (!value) return null
    const [yearStr, monthStr] = value.split('-')
    const year = Number(yearStr)
    const month = Number(monthStr)
    if (!year || !month || month < 1 || month > 12) {
      return null
    }
    return { year, monthIndex: month - 1 }
  }

  const buildMonthRange = (start: MonthDefinition, end: MonthDefinition): MonthDefinition[] => {
    const months: MonthDefinition[] = []
    let currentYear = start.year
    let currentMonth = start.monthIndex

    while (currentYear < end.year || (currentYear === end.year && currentMonth <= end.monthIndex)) {
      months.push({ year: currentYear, monthIndex: currentMonth })
      currentMonth += 1
      if (currentMonth > 11) {
        currentMonth = 0
        currentYear += 1
      }
    }

    return months
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nomLocataire || !formData.villa || !formData.montant || !formData.startMonth || !formData.endMonth) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    const montant = parseFloat(formData.montant)
    if (isNaN(montant) || montant <= 0) {
      toast.error('Le montant doit être un nombre positif')
      return
    }

    const start = parseMonth(formData.startMonth)
    const end = parseMonth(formData.endMonth)

    if (!start || !end) {
      toast.error('Format de mois invalide')
      return
    }

    if (end.year < start.year || (end.year === start.year && end.monthIndex < start.monthIndex)) {
      toast.error('Le mois de fin doit être postérieur ou égal au mois de début')
      return
    }

    const months = buildMonthRange(start, end)

    // Trouver automatiquement le compte "Cité Kennedy"
    const compteKennedy = comptes.find((compte) => {
      const nom = (compte.nom || '').toLowerCase()
      return nom.includes('cité kennedy') || nom.includes('cite kennedy')
    })

    if (!compteKennedy) {
      toast.error('Aucun compte "Cité Kennedy" trouvé. Créez d\'abord ce compte pour générer les reçus.')
      return
    }

    // Sécurité : éviter de créer trop de reçus en une seule fois
    if (months.length > 24) {
      toast.error('La période est trop longue. Limite: 24 mois maximum.')
      return
    }

    setLoading(true)
    try {
      for (const { year, monthIndex } of months) {
        // Dernier jour du mois pour la date de transaction
        const dateTransaction = new Date(Date.UTC(year, monthIndex + 1, 0))
        const periodeFormatee = dateTransaction.toLocaleDateString('fr-FR', {
          month: 'long',
          year: 'numeric'
        })

        // Ajoute automatiquement le locataire dans la base locale s'il n'existe pas encore
        addTenantIfNotExists(formData.nomLocataire)

        await createReceipt({
          transactionId: undefined,
          compteId: compteKennedy.id,
          nomLocataire: formData.nomLocataire,
          villa: formData.villa,
          periode: periodeFormatee,
          montant,
          dateTransaction: dateTransaction.toISOString(),
          libelle: formData.libelle || undefined,
          description: formData.description || undefined
        })
      }

      toast.success(`✅ ${months.length} reçu(s) généré(s) avec succès`)
      onOpenChange(false)
    } catch (error) {
      console.error('❌ Erreur inattendue lors de la génération multiple des reçus:', error)
      toast.error('Erreur inattendue lors de la génération des reçus')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>🧾 Générer plusieurs reçus</DialogTitle>
          <DialogDescription>
            Créez en une seule fois plusieurs reçus de loyer pour un même locataire sur une période (ex: janvier 2025 à juin 2025).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nomLocataire">
              Nom du Locataire <span className="text-red-500">*</span>
            </Label>

            {tenantOptions.length > 0 && (
              <div className="space-y-1">
                <Select
                  onValueChange={(value) => {
                    const selectedOption = tenantOptions.find((option) => option.id === value)
                    if (selectedOption) {
                      const tenantName = selectedOption.fullName

                      // Rechercher le dernier reçu pour ce locataire
                      const lastReceipt = receipts
                        .filter((r) => r.nomLocataire === tenantName)
                        .sort(
                          (a, b) =>
                            new Date(b.dateTransaction).getTime() - new Date(a.dateTransaction).getTime()
                        )[0]

                      if (lastReceipt) {
                        setFormData((prev) => ({
                          ...prev,
                          nomLocataire: tenantName,
                          villa: lastReceipt.villa,
                          montant: lastReceipt.montant.toString(),
                          libelle: lastReceipt.libelle || prev.libelle,
                          description: lastReceipt.description || prev.description
                        }))
                      } else {
                        setFormData((prev) => ({ ...prev, nomLocataire: tenantName }))
                      }
                    }
                  }}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un locataire existant (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Vous pouvez choisir un locataire existant ou saisir un nouveau nom ci-dessous.
                </p>
              </div>
            )}

            <Input
              id="nomLocataire"
              placeholder="Ex: YAO Evelyne"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startMonth">
                Mois de début <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startMonth"
                type="month"
                value={formData.startMonth}
                onChange={(e) => setFormData({ ...formData, startMonth: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endMonth">
                Mois de fin <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endMonth"
                type="month"
                value={formData.endMonth}
                onChange={(e) => setFormData({ ...formData, endMonth: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="montant">
              Montant par mois (F CFA) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="montant"
              type="number"
              step="0.01"
              placeholder="Ex: 120000"
              value={formData.montant}
              onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              Les reçus seront automatiquement rattachés au compte <span className="font-semibold">Cité Kennedy</span>.
            </p>
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
              placeholder="Informations supplémentaires (optionnel)..."
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
                  Génération...
                </>
              ) : (
                '✅ Générer les reçus'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


