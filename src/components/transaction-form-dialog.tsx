'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2Icon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react'
import { useComptesBancaires } from '@/contexts/compte-bancaire-context'
import { useReceipts } from '@/contexts/receipt-context'
import { CompteBancaire } from '@/lib/shared-data'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface TransactionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  compte: CompteBancaire | null
  type: 'credit' | 'debit'
}

export function TransactionFormDialog({ open, onOpenChange, compte, type }: TransactionFormDialogProps) {
  const { crediterCompte, debiterCompte, refreshComptes, refreshTransactions } = useComptesBancaires()
  const { createReceipt } = useReceipts()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    montant: '',
    libelle: '',
    description: '',
    reference: '',
    categorie: '',
    villa: '',
    periode: '',
    nom: ''
  })

  React.useEffect(() => {
    if (open) {
      setFormData({
        montant: '',
        libelle: '',
        description: '',
        reference: '',
        categorie: '',
        villa: '',
        periode: '',
        nom: ''
      })
    }
  }, [open])

  // Vérifier si le compte est "Cité kennedy"
  const isCiteKennedy = compte?.nom?.toLowerCase().includes('cité kennedy') || compte?.nom?.toLowerCase().includes('cite kennedy')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.montant || !formData.libelle) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    // Pour "Cité kennedy", vérifier que Nom, Villa et Période sont remplis
    if (isCiteKennedy) {
      if (!formData.nom || !formData.villa || !formData.periode) {
        toast.error('Veuillez remplir le Nom, la Villa et la Période')
        return
      }
    }

    if (!compte) {
      toast.error('Aucun compte sélectionné')
      return
    }

    const montant = parseFloat(formData.montant)
    if (isNaN(montant) || montant <= 0) {
      toast.error('Le montant doit être un nombre positif')
      return
    }

    if (type === 'debit' && compte.soldeActuel < montant) {
      toast.error(`Solde insuffisant. Solde disponible: ${compte.soldeActuel.toLocaleString()} F CFA`)
      return
    }

    setLoading(true)
    try {
      let success = false
      
      // Pour Cité kennedy, inclure Nom, Villa et Période dans la catégorie
      let categorieFinale = formData.categorie
      let villaLabel = ''
      if (isCiteKennedy && formData.nom && formData.villa && formData.periode) {
        const periodeFormatee = new Date(formData.periode).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        // Mapping des valeurs de villa vers leurs labels
        const villaLabels: Record<string, string> = {
          'mini_villa_2_pieces_ean': 'mini Villa 2 Pièces EAN',
          'villa_3_pieces_esp': 'Villa 3 Pièces ESP',
          'villa_3_pieces_almyf': 'Villa 3 Pièces ALMYF',
          'villa_4_pieces_ekb': 'Villa 4 Pièces EKB',
          'villa_4_pieces_mad': 'Villa 4 Pièces MAD'
        }
        villaLabel = villaLabels[formData.villa] || formData.villa
        categorieFinale = `${formData.nom} - ${villaLabel} - ${periodeFormatee}`
      }

      let transactionId: string | null = null
      
      if (type === 'credit') {
        transactionId = await crediterCompte(
          compte.id,
          montant,
          formData.libelle,
          formData.description || undefined,
          formData.reference || undefined,
          categorieFinale || undefined
        )
        
        // Si c'est un crédit sur Cité kennedy avec toutes les infos, générer automatiquement le reçu
        if (transactionId && isCiteKennedy && formData.nom && formData.villa && formData.periode) {
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
              transactionId: transactionId,
              compteId: compte.id,
              nomLocataire: formData.nom,
              villa: villaLabel,
              periode: periodeFormatee,
              montant: montant,
              dateTransaction: new Date().toISOString(),
              libelle: formData.libelle,
              description: formData.description
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
        } else {
          // Log pour déboguer pourquoi le reçu n'est pas généré
          if (transactionId && isCiteKennedy) {
            console.log('⚠️ Reçu non généré - Champs manquants:', {
              nom: !!formData.nom,
              villa: !!formData.villa,
              periode: !!formData.periode
            })
          }
        }
      } else {
        const debitSuccess = await debiterCompte(
          compte.id,
          montant,
          formData.libelle,
          formData.description || undefined,
          formData.reference || undefined,
          categorieFinale || undefined
        )
        if (!debitSuccess) {
          transactionId = null
        }
      }

      if (transactionId !== null || type === 'debit') {
        await Promise.all([refreshComptes(), refreshTransactions()])
        setFormData({
          montant: '',
          libelle: '',
          description: '',
          reference: '',
          categorie: '',
          villa: '',
          periode: '',
          nom: ''
        })
        onOpenChange(false)
      }
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      toast.error('❌ Erreur inattendue')
    } finally {
      setLoading(false)
    }
  }

  if (!compte) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'credit' ? (
              <>
                <TrendingUpIcon className="h-5 w-5 text-green-600" />
                💰 Créditer le Compte
              </>
            ) : (
              <>
                <TrendingDownIcon className="h-5 w-5 text-red-600" />
                💸 Débiter le Compte
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {type === 'credit' 
              ? `Ajouter de l'argent au compte "${compte.nom}"` 
              : `Retirer de l'argent du compte "${compte.nom}"`}
            <br />
            <span className="font-medium">Solde actuel: {compte.soldeActuel.toLocaleString()} F CFA</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="libelle">
              Libellé <span className="text-red-500">*</span>
            </Label>
            <Input
              id="libelle"
              placeholder="Ex: Virement reçu, Retrait ATM, Paiement facture"
              value={formData.libelle}
              onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Détails supplémentaires..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">
              Référence
            </Label>
            <Input
              id="reference"
              placeholder="Ex: REF-2025-001, Chèque N°123"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Pour "Cité kennedy" : afficher Nom, Villa et Période au lieu de Catégorie */}
          {isCiteKennedy ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="nom">
                  Nom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nom"
                  placeholder="Ex: Locataire, Propriétaire"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
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
                  required
                  disabled={loading}
                />
                {formData.periode && (
                  <p className="text-xs text-gray-500">
                    Affichage: {new Date(formData.periode).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="categorie">
                Catégorie
              </Label>
              <Input
                id="categorie"
                placeholder="Ex: Salaire, Frais, Transfert"
                value={formData.categorie}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                disabled={loading}
              />
            </div>
          )}

          {type === 'debit' && formData.montant && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <strong>Solde après transaction:</strong>{' '}
                {(compte.soldeActuel - parseFloat(formData.montant || '0')).toLocaleString()} F CFA
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className={type === 'credit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {loading ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                type === 'credit' ? '✅ Créditer' : '✅ Débiter'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

