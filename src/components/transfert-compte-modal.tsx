'use client'

import React, { useState, useEffect } from 'react'
import { useComptesBancaires } from '@/contexts/compte-bancaire-context'
import { useReceipts } from '@/contexts/receipt-context'
import { CompteBancaire } from '@/lib/shared-data'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ArrowRightIcon } from 'lucide-react'

interface TransfertCompteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  compteSource: CompteBancaire | null
}

export function TransfertCompteModal({ open, onOpenChange, compteSource }: TransfertCompteModalProps) {
  const { comptes, transfererEntreComptes, refreshComptes } = useComptesBancaires()
  const { createReceipt } = useReceipts()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    montant: '',
    compteDestinationId: '',
    description: '',
    dateTransaction: new Date().toISOString().split('T')[0],
    genererRecu: false,
    nom: '',
    villa: '',
    periode: '',
    libelle: 'Loyer' // Libellé par défaut comme dans le crédit direct
  })

  useEffect(() => {
    if (open && compteSource) {
      setFormData({
        montant: '',
        compteDestinationId: '',
        description: '',
        dateTransaction: new Date().toISOString().split('T')[0],
        genererRecu: false,
        nom: '',
        villa: '',
        periode: ''
      })
    }
  }, [open, compteSource])

  const compteDestination = comptes.find(c => c.id === formData.compteDestinationId)
  const isCiteKennedy = compteDestination?.nom?.toLowerCase().includes('cité kennedy') || 
                        compteDestination?.nom?.toLowerCase().includes('cite kennedy')
  const canGenerateReceipt = isCiteKennedy && formData.genererRecu && 
                             formData.nom && formData.villa && formData.periode

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!compteSource) {
      toast.error('Compte source non sélectionné')
      return
    }

    if (!formData.compteDestinationId) {
      toast.error('Veuillez sélectionner un compte de destination')
      return
    }

    const montant = parseFloat(formData.montant)
    if (isNaN(montant) || montant <= 0) {
      toast.error('Le montant doit être supérieur à 0')
      return
    }

    if (montant > compteSource.soldeActuel) {
      toast.error(`Solde insuffisant. Solde disponible: ${compteSource.soldeActuel.toLocaleString()} F CFA`)
      return
    }

    setLoading(true)
    try {
      const result = await transfererEntreComptes(
        compteSource.id,
        formData.compteDestinationId,
        montant,
        formData.description || undefined,
        new Date(formData.dateTransaction).toISOString()
      )

      if (result.success) {
        await refreshComptes()

        // Si c'est un transfert vers Compte Cité Kennedy avec toutes les infos, générer le reçu
        if (canGenerateReceipt && compteDestination && result.creditTransactionId) {
          console.log('🧾 Génération automatique du reçu pour Cité kennedy...')
          const periodeFormatee = new Date(formData.periode).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
          const villaLabels: Record<string, string> = {
            'mini_villa_2_pieces_ean': 'mini Villa 2 Pièces EAN',
            'villa_3_pieces_esp': 'Villa 3 Pièces ESP',
            'villa_3_pieces_almyf': 'Villa 3 Pièces ALMYF',
            'villa_4_pieces_ekb': 'Villa 4 Pièces EKB',
            'villa_4_pieces_mad': 'Villa 4 Pièces MAD'
          }
          const villaLabel = villaLabels[formData.villa] || formData.villa
          
          try {
            const receiptId = await createReceipt({
              transactionId: result.creditTransactionId,
              compteId: compteDestination.id,
              nomLocataire: formData.nom,
              villa: villaLabel,
              periode: periodeFormatee,
              montant: montant,
              dateTransaction: new Date(formData.dateTransaction).toISOString(),
              libelle: 'Loyer', // Même libellé que lors d'un crédit direct
              description: formData.description || undefined
            })
            
            if (receiptId) {
              console.log('✅ Reçu généré avec succès ! ID:', receiptId)
              toast.success('🧾 Reçu généré automatiquement !')
            } else {
              console.warn('⚠️ Échec de la génération du reçu')
            }
          } catch (error) {
            console.error('❌ Erreur lors de la génération du reçu:', error)
            toast.error('Erreur lors de la génération du reçu')
          }
        }

        onOpenChange(false)
        setFormData({
          montant: '',
          compteDestinationId: '',
          description: '',
          dateTransaction: new Date().toISOString().split('T')[0],
          genererRecu: false,
          nom: '',
          villa: '',
          periode: ''
        })
      }
    } catch (error) {
      console.error('❌ Erreur lors du transfert:', error)
      toast.error('Erreur lors du transfert')
    } finally {
      setLoading(false)
    }
  }

  const comptesDestination = comptes.filter(c => c.id !== compteSource?.id)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightIcon className="w-5 h-5" />
            Transfert entre comptes
          </DialogTitle>
          <DialogDescription>
            Transférer de l'argent de <strong>{compteSource?.nom}</strong> vers un autre compte
            {compteSource && (
              <div className="mt-2 text-sm text-gray-600">
                Solde disponible: <strong className="text-green-600">{formatCurrency(compteSource.soldeActuel)}</strong>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="montant">Montant (F CFA) *</Label>
            <Input
              id="montant"
              type="number"
              step="0.01"
              min="0"
              value={formData.montant}
              onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
              placeholder="Ex: 85000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="compteDestination">Compte de destination *</Label>
            <Select
              value={formData.compteDestinationId}
              onValueChange={(value) => setFormData({ ...formData, compteDestinationId: value })}
              required
            >
              <SelectTrigger id="compteDestination">
                <SelectValue placeholder="Sélectionner un compte" />
              </SelectTrigger>
              <SelectContent>
                {comptesDestination.map((compte) => (
                  <SelectItem key={compte.id} value={compte.id}>
                    {compte.nom} - {formatCurrency(compte.soldeActuel)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateTransaction">Date de l'opération *</Label>
            <Input
              id="dateTransaction"
              type="date"
              value={formData.dateTransaction}
              onChange={(e) => setFormData({ ...formData, dateTransaction: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Transfert pour loyer"
              rows={3}
            />
          </div>

          {/* Option : Générer un reçu si transfert vers Compte Cité Kennedy */}
          {isCiteKennedy && (
            <div className="space-y-3 border rounded-lg p-4 bg-blue-50">
              <div className="flex items-center gap-2">
                <input
                  id="genererRecu"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={formData.genererRecu}
                  onChange={(e) => 
                    setFormData({ ...formData, genererRecu: e.target.checked })
                  }
                  disabled={loading}
                />
                <Label htmlFor="genererRecu" className="text-sm font-medium cursor-pointer">
                  🧾 Générer un reçu automatiquement
                </Label>
              </div>
              
              {formData.genererRecu && (
                <div className="space-y-3 mt-3 pl-6 border-l-2 border-blue-300">
                  <div className="space-y-2">
                    <Label htmlFor="nom">
                      Nom du locataire <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nom"
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      placeholder="Ex: Locataire, Propriétaire"
                      required={formData.genererRecu}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="villa">
                      Villa <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.villa}
                      onValueChange={(value) => setFormData({ ...formData, villa: value })}
                      required={formData.genererRecu}
                    >
                      <SelectTrigger id="villa">
                        <SelectValue placeholder="Sélectionner une villa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mini_villa_2_pieces_ean">mini Villa 2 Pièces EAN</SelectItem>
                        <SelectItem value="villa_3_pieces_esp">Villa 3 Pièces ESP</SelectItem>
                        <SelectItem value="villa_3_pieces_almyf">Villa 3 Pièces ALMYF</SelectItem>
                        <SelectItem value="villa_4_pieces_ekb">Villa 4 Pièces EKB</SelectItem>
                        <SelectItem value="villa_4_pieces_mad">Villa 4 Pièces MAD</SelectItem>
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
                      value={formData.periode}
                      onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                      required={formData.genererRecu}
                    />
                    <p className="text-xs text-gray-500">
                      La période sera formatée automatiquement (ex: "décembre 2025")
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Transfert en cours...' : 'Transférer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

