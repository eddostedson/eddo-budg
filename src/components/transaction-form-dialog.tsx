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
import { CompteBancaire, SharedFund } from '@/lib/shared-data'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useTenants } from '@/hooks/useTenants'
import { SharedFundsService } from '@/lib/supabase/shared-funds-service'

interface TransactionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  compte: CompteBancaire | null
  type: 'credit' | 'debit'
}

export function TransactionFormDialog({ open, onOpenChange, compte, type }: TransactionFormDialogProps) {
  const { comptes, crediterCompte, debiterCompte, refreshComptes, refreshTransactions } = useComptesBancaires()
  const { createReceipt } = useReceipts()
  const { tenantOptions } = useTenants()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    montant: '',
    dateOperation: new Date().toISOString().split('T')[0],
    libelle: '',
    description: '',
    categorie: '',
    villa: '',
    periode: '',
    nom: '',
    compteSourceId: '',
    compteDestinationId: '',
    miroirKennedy: false
  })
  const [createSharedFund, setCreateSharedFund] = useState(false)
  const [sharedFundTargetCompteId, setSharedFundTargetCompteId] = useState('')
  const [availableSharedFunds, setAvailableSharedFunds] = useState<SharedFund[]>([])
  const [selectedSharedFundId, setSelectedSharedFundId] = useState('')

  // Vérifier si le compte est "Cité kennedy"
  const isCiteKennedy = compte?.nom?.toLowerCase().includes('cité kennedy') || compte?.nom?.toLowerCase().includes('cite kennedy')

  React.useEffect(() => {
    if (open) {
      setFormData({
        montant: '',
        dateOperation: new Date().toISOString().split('T')[0],
        libelle: isCiteKennedy ? 'Loyer' : '',
        description: '',
        categorie: '',
        villa: '',
        periode: '',
        nom: '',
        compteSourceId: '',
        compteDestinationId: '',
        miroirKennedy: false
      })
      setCreateSharedFund(false)
      setSharedFundTargetCompteId('')
      setSelectedSharedFundId('')
    } else {
      setAvailableSharedFunds([])
      setSelectedSharedFundId('')
    }
  }, [open, isCiteKennedy])

  // Charger les fonds partagés disponibles pour ce compte lors d'un débit
  React.useEffect(() => {
    const loadFunds = async () => {
      if (!open || type !== 'debit' || !compte) {
        setAvailableSharedFunds([])
        setSelectedSharedFundId('')
        return
      }
      try {
        const funds = await SharedFundsService.getFundsForCompte(compte.id)
        setAvailableSharedFunds(funds)
      } catch (error) {
        console.error('❌ Erreur lors du chargement des fonds partagés:', error)
        setAvailableSharedFunds([])
      }
    }
    loadFunds()
  }, [open, type, compte?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.montant || !formData.libelle) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (!formData.dateOperation) {
      toast.error('Veuillez sélectionner une date pour l\'opération')
      return
    }

    // Pour "Cité kennedy", vérifier que Nom, Villa et Période sont remplis
    // 👉 Seulement pour les CRÉDITS (les débits restent simples)
    if (isCiteKennedy && type === 'credit') {
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
      // Catégorie utilisée pour enregistrer la transaction.
      // Par défaut, on prend la valeur saisie dans le formulaire.
      let categorieFinale = formData.categorie

      // Pour Cité Kennedy au CRÉDIT uniquement, on construit une catégorie
      // plus détaillée: "Nom - Villa - Mois Année" (cohérent avec les reçus).
      if (isCiteKennedy && type === 'credit' && formData.nom && formData.villa && formData.periode) {
        const periodeFormatee = new Date(formData.periode).toLocaleDateString('fr-FR', {
          month: 'long',
          year: 'numeric'
        })
        const villaLabels: Record<string, string> = {
          'mini_villa_2_pieces_ean': 'mini Villa 2 Pièces EAN',
          'villa_3_pieces_esp': 'Villa 3 Pièces ESP',
          'villa_3_pieces_almyf': 'Villa 3 Pièces ALMYF',
          'villa_4_pieces_ekb': 'Villa 4 Pièces EKB',
          'villa_4_pieces_mad': 'Villa 4 Pièces MAD'
        }
        const villaLabel = villaLabels[formData.villa] || formData.villa
        categorieFinale = `${formData.nom} - ${villaLabel} - ${periodeFormatee}`
      }

      let transactionId: string | null = null
      
      if (type === 'credit') {
        transactionId = await crediterCompte(
          compte.id,
          montant,
          formData.libelle,
          formData.description || undefined,
          undefined,
          categorieFinale || undefined,
          new Date(formData.dateOperation).toISOString()
        )

        // Option : créer un fonds partagé lié à ce crédit
        if (transactionId && createSharedFund && sharedFundTargetCompteId) {
          try {
            const fund = await SharedFundsService.createFundFromCredit({
              transactionId,
              sourceCompteId: compte.id,
              primaryCompteId: sharedFundTargetCompteId,
              montant,
              libelle: formData.libelle,
              description: formData.description || undefined
            })
            if (!fund) {
              toast.warning('⚠️ Fonds partagé non créé (voir console).')
            } else {
              toast.success('✅ Fonds partagé créé pour un autre compte.')
          }
          } catch (error) {
            console.error('❌ Erreur lors de la création du fonds partagé:', error)
            toast.warning('⚠️ Erreur lors de la création du fonds partagé')
          }
        }
        
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

        // Crédit miroir virtuel sur Compte Cité Kennedy (optionnel, uniquement si compte Wave)
        if (transactionId && canMirrorKennedy && compteKennedy && formData.miroirKennedy) {
          const miroirOk = await crediterCompte(
            compteKennedy.id,
            montant,
            formData.libelle || 'Loyer Cité Kennedy',
            formData.description || undefined,
            undefined,
            'Loyer Cité Kennedy (miroir)',
            new Date(formData.dateOperation).toISOString()
          )

          if (!miroirOk) {
            toast.warning('⚠️ Crédit virtuel sur "Compte Cité Kennedy" non enregistré')
          }
        }
      } else {
        // 💸 Débit simple ou transfert vers un autre compte
        const debitSuccess = await debiterCompte(
          compte.id,
          montant,
          formData.libelle,
          formData.description || undefined,
          undefined,
          categorieFinale || undefined,
          new Date(formData.dateOperation).toISOString()
        )

        if (!debitSuccess) {
          transactionId = null
        } else {
          // Si un fonds partagé est sélectionné, enregistrer le mouvement
          if (selectedSharedFundId) {
            try {
              const ok = await SharedFundsService.registerMovement({
                sharedFundId: selectedSharedFundId,
                compteId: compte.id,
                type: 'debit',
                montant,
                transactionId: undefined,
                libelle: formData.libelle
              })
              if (!ok) {
                toast.warning('⚠️ Mouvement sur le fonds partagé non enregistré')
              }
            } catch (error) {
              console.error('❌ Erreur lors de l\'enregistrement du mouvement sur le fonds partagé:', error)
              toast.warning('⚠️ Erreur lors de l\'enregistrement du mouvement sur le fonds partagé')
            }
          }
          // Transfert optionnel vers un autre compte
          if (formData.compteDestinationId) {
            const compteDestination = comptes.find((c) => c.id === formData.compteDestinationId)
            if (!compteDestination) {
              toast.error('Compte de destination introuvable')
            } else {
              const creditId = await crediterCompte(
                compteDestination.id,
                montant,
                `Transfert depuis ${compte.nom}`,
                formData.description || undefined,
                undefined,
                'Transfert depuis autre compte',
                new Date(formData.dateOperation).toISOString()
              )

              if (!creditId) {
                toast.error('Erreur lors du crédit du compte de destination')
              }
            }
          }

          // Débit miroir virtuel sur Compte Cité Kennedy (optionnel, uniquement si compte Wave)
          if (canMirrorKennedy && compteKennedy && formData.miroirKennedy) {
            const miroirDebitOk = await debiterCompte(
              compteKennedy.id,
              montant,
              formData.libelle,
              formData.description || undefined,
              undefined,
              'Loyer Cité Kennedy (miroir)',
              new Date(formData.dateOperation).toISOString()
            )

            if (!miroirDebitOk) {
              toast.warning('⚠️ Débit virtuel sur "Compte Cité Kennedy" non enregistré')
            }
          }
        }
      }

      if (transactionId !== null || type === 'debit') {
        // 🔄 Rafraîchir en arrière-plan pour éviter de bloquer l'UI
        Promise.all([
          refreshComptes(),
          compte ? refreshTransactions(compte.id) : refreshTransactions()
        ]).catch((error) => {
          console.error('❌ Erreur lors du rafraîchissement après transaction:', error)
        })
        setFormData({
          montant: '',
          dateOperation: new Date().toISOString().split('T')[0],
          libelle: isCiteKennedy ? 'Loyer' : '',
          description: '',
          categorie: '',
          villa: '',
          periode: '',
          nom: '',
          compteSourceId: '',
          compteDestinationId: '',
          miroirKennedy: false
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

  const autresComptes = comptes.filter((c) => c.id !== compte.id)
  const isWaveAccount = compte.nom?.toLowerCase().includes('wave') || compte.nom?.toLowerCase().includes('mobile')
  const compteKennedy = comptes.find(
    (c) =>
      c.nom?.toLowerCase().includes('cité kennedy') || c.nom?.toLowerCase().includes('cite kennedy')
  )
  const canMirrorKennedy = !!compteKennedy && isWaveAccount

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
            <Label htmlFor="dateOperation">
              Date de l'opération <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dateOperation"
              type="date"
              value={formData.dateOperation}
              onChange={(e) => setFormData({ ...formData, dateOperation: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          {/* Option : créer un fonds partagé lors d'un CRÉDIT */}
          {type === 'credit' && autresComptes.length > 0 && (
            <div className="space-y-2 border rounded-lg p-3 bg-gray-50">
              <Label className="text-xs font-medium">
                Fonds partagé (optionnel)
              </Label>
              <div className="flex items-center gap-2">
                <input
                  id="createSharedFund"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={createSharedFund}
                  onChange={(e) => {
                    setCreateSharedFund(e.target.checked)
                    if (!e.target.checked) {
                      setSharedFundTargetCompteId('')
                    }
                  }}
                  disabled={loading}
                />
                <Label htmlFor="createSharedFund" className="text-xs text-gray-700">
                  Rendre ce crédit disponible virtuellement pour un autre compte
                </Label>
              </div>
              {createSharedFund && (
                <div className="space-y-1">
              <Select
                    value={sharedFundTargetCompteId || 'none'}
                onValueChange={(value) =>
                      setSharedFundTargetCompteId(value === 'none' ? '' : value)
                }
                disabled={loading}
              >
                <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le compte bénéficiaire" />
                </SelectTrigger>
                <SelectContent>
                      <SelectItem value="none">Sélectionner un compte</SelectItem>
                  {autresComptes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom} — {c.soldeActuel.toLocaleString()} F CFA
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
                  <p className="text-[11px] text-gray-500">
                    Le solde réel reste sur ce compte. Le compte choisi verra un solde virtuel lié à ce crédit.
                  </p>
                </div>
              )}
            </div>
          )}

          {type === 'debit' && autresComptes.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="compteDestinationId">
                Transférer vers un autre compte (optionnel)
              </Label>
              <Select
                value={formData.compteDestinationId || 'none'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    compteDestinationId: value === 'none' ? '' : value
                  })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un compte de destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun (retrait simple)</SelectItem>
                  {autresComptes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom} — {c.soldeActuel.toLocaleString()} F CFA
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="libelle">
              Libellé <span className="text-red-500">*</span>
            </Label>
            <Input
              id="libelle"
              placeholder={isCiteKennedy ? 'Loyer' : 'Ex: Virement reçu, Retrait ATM, Paiement facture'}
              value={formData.libelle}
              onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          {/* Lors d'un DÉBIT : possibilité d'imputer la dépense sur un fonds partagé existant */}
          {type === 'debit' && availableSharedFunds.length > 0 && (
            <div className="space-y-2 border rounded-lg p-3 bg-gray-50">
              <Label htmlFor="sharedFundId" className="text-xs font-medium">
                Utiliser un fonds partagé (optionnel)
              </Label>
              <Select
                value={selectedSharedFundId || 'none'}
                onValueChange={(value) =>
                  setSelectedSharedFundId(value === 'none' ? '' : value)
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucun fonds sélectionné" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun (débit normal)</SelectItem>
                  {availableSharedFunds.map((fund) => (
                    <SelectItem key={fund.id} value={fund.id}>
                      {fund.libelle} — reste {fund.montantRestant.toLocaleString()} F CFA
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-gray-500">
                La dépense sera tracée comme utilisation de ce fonds, sans modifier le crédit initial.
              </p>
            </div>
          )}

          {canMirrorKennedy && (
            <div className="flex items-center space-x-2">
              <input
                id="miroirKennedy"
                type="checkbox"
                className="h-4 w-4"
                checked={formData.miroirKennedy}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    miroirKennedy: e.target.checked
                  })
                }
                disabled={loading}
              />
              <Label htmlFor="miroirKennedy" className="text-xs text-gray-700">
                Associer cette opération au loyer "Compte Cité Kennedy" (miroir virtuel)
              </Label>
            </div>
          )}

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

          {/* Pour "Cité kennedy" : afficher Nom, Villa et Période AU CRÉDIT uniquement.
              Pour tous les autres cas (débit, autres comptes), afficher le champ Catégorie simple. */}
          {isCiteKennedy && type === 'credit' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="nom">
                  Nom <span className="text-red-500">*</span>
                </Label>
                {tenantOptions.length > 0 && (
                  <div className="space-y-1">
                    <Select
                      onValueChange={(value) => {
                        const selectedOption = tenantOptions.find((option) => option.id === value)
                        if (selectedOption) {
                          setFormData((prev) => ({ ...prev, nom: selectedOption.fullName }))
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

