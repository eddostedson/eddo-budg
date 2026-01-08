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
import { createClient } from '@/lib/supabase/browser'
import { useUltraModernToastContext } from '@/contexts/ultra-modern-toast-context'
import { ReceiptUpload } from '@/components/receipt-upload'
import { useVillaConfigs } from '@/hooks/useVillaConfigs'
import { LoyersService } from '@/lib/supabase/loyers-service'

interface TransactionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  compte: CompteBancaire | null
  type: 'credit' | 'debit'
}

export function TransactionFormDialog({ open, onOpenChange, compte, type }: TransactionFormDialogProps) {
  const { comptes, crediterCompte, debiterCompte, refreshComptes, refreshTransactions } = useComptesBancaires()
  const { createReceipt, updateReceipt } = useReceipts()
  const { tenantOptions } = useTenants()
  const { showSuccess } = useUltraModernToastContext()
  const { villas, loading: villasLoading, addVilla, getVillaById } = useVillaConfigs()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    montant: '',
    dateOperation: new Date().toISOString().split('T')[0],
    libelle: '',
    description: '',
    categorie: '',
    villaId: '',
    periode: '',
    nom: '',
    compteSourceId: '',
    compteDestinationId: '',
    miroirKennedy: false
  })
  const [showNewVillaForm, setShowNewVillaForm] = useState(false)
  const [newVillaForm, setNewVillaForm] = useState({ label: '', montant: '' })
  const [factureInfo, setFactureInfo] = useState<{
    id: string
    montantTotal: number
    montantRestant: number
  } | null>(null)
  const [factureLoading, setFactureLoading] = useState(false)
  const [factureError, setFactureError] = useState<string | null>(null)
  const [createSharedFund, setCreateSharedFund] = useState(false)
  const [sharedFundTargetCompteId, setSharedFundTargetCompteId] = useState('')
  const [availableSharedFunds, setAvailableSharedFunds] = useState<SharedFund[]>([])
  const [selectedSharedFundId, setSelectedSharedFundId] = useState('')
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>()
  const [receiptFileName, setReceiptFileName] = useState<string | undefined>()
  const supabase = React.useMemo(() => createClient(), [])
  const createTransferGroupId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  // Vérifier si le compte est "Cité kennedy"
  const isCiteKennedy = compte?.nom?.toLowerCase().includes('cité kennedy') || compte?.nom?.toLowerCase().includes('cite kennedy')
  const autresComptes = comptes.filter((c) => c.id !== (compte?.id ?? ''))
  const isWaveAccount =
    compte?.nom?.toLowerCase().includes('wave') || compte?.nom?.toLowerCase().includes('mobile')
  const compteKennedy = comptes.find(
    (c) =>
      c.nom?.toLowerCase().includes('cité kennedy') || c.nom?.toLowerCase().includes('cite kennedy')
  )
  const canMirrorKennedy = !!compteKennedy && isWaveAccount
  const shouldRenderRentFields =
    type === 'credit' && (isCiteKennedy || (formData.miroirKennedy && canMirrorKennedy))

  const selectedVilla = formData.villaId ? getVillaById(formData.villaId) : undefined
  const periodeDate =
    formData.periode && !Number.isNaN(new Date(formData.periode).getTime())
      ? new Date(formData.periode)
      : null
  const periodeFormatee = periodeDate
    ? periodeDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : ''
  const rentMetadata =
    formData.nom && selectedVilla && periodeDate
      ? {
          periodeFormatee,
          villaLabel: selectedVilla.label,
          categorieLabel: `${formData.nom} - ${selectedVilla.label} - ${periodeFormatee}`,
          villaId: selectedVilla.id,
          montantTotal: factureInfo?.montantTotal ?? selectedVilla.loyerMontant,
          montantRestant: factureInfo?.montantRestant ?? selectedVilla.loyerMontant,
          factureId: factureInfo?.id ?? null,
          mois: periodeDate.getMonth() + 1,
          annee: periodeDate.getFullYear()
        }
      : null

  const formatFca = (amount: number) => `${Math.round(amount).toLocaleString('fr-FR')} F CFA`

  // 🕐 Fonction pour combiner la date du formulaire avec l'heure actuelle
  const getFullDateTime = (dateString: string): string => {
    const selectedDate = new Date(dateString + 'T00:00:00')
    const now = new Date()
    // Combiner la date sélectionnée avec l'heure actuelle
    selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())
    return selectedDate.toISOString()
  }

  const fetchCompteSoldeActuel = async (compteId: string): Promise<{ nom: string; soldeActuel: number } | null> => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData?.user?.id
      if (!userId) return null

      const { data, error } = await supabase
        .from('comptes_bancaires')
        .select('nom, solde_actuel')
        .eq('id', compteId)
        .eq('user_id', userId)
        .single()

      if (error || !data) return null

      return {
        nom: String((data as any).nom || ''),
        soldeActuel: parseFloat((data as any).solde_actuel || 0)
      }
    } catch {
      return null
    }
  }

  React.useEffect(() => {
    if (open) {
      setFormData({
        montant: '',
        dateOperation: new Date().toISOString().split('T')[0],
        libelle: isCiteKennedy ? 'Loyer' : '',
        description: '',
        categorie: '',
        villaId: '',
        periode: '',
        nom: '',
        compteSourceId: '',
        compteDestinationId: '',
        miroirKennedy: false
      })
      setCreateSharedFund(false)
      setSharedFundTargetCompteId('')
      setSelectedSharedFundId('')
      setReceiptUrl(undefined)
      setReceiptFileName(undefined)
    } else {
      setAvailableSharedFunds([])
      setSelectedSharedFundId('')
      setFactureInfo(null)
      setFactureError(null)
      setShowNewVillaForm(false)
      setNewVillaForm({ label: '', montant: '' })
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
  }, [open, type, compte])

  React.useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/aec25d3d-f69f-4569-aa6b-763bde6b59a0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'H1',
        location: 'transaction-form-dialog.tsx:rentEffect',
        message: 'Rent effect triggered',
        data: {
          shouldRenderRentFields,
          nom: formData.nom,
          villaId: formData.villaId,
          periode: formData.periode,
          hasSelectedVilla: !!selectedVilla
        },
        timestamp: Date.now()
      })
    }).catch(() => {})
    // #endregion
    if (!shouldRenderRentFields) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/aec25d3d-f69f-4569-aa6b-763bde6b59a0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H1',
          location: 'transaction-form-dialog.tsx:rentEffect',
          message: 'Rent effect skipped - flag disabled',
          data: {},
          timestamp: Date.now()
        })
      }).catch(() => {})
      // #endregion
      setFactureInfo(null)
      return
    }
    if (!formData.nom || !formData.villaId || !periodeDate || !selectedVilla) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/aec25d3d-f69f-4569-aa6b-763bde6b59a0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H2',
          location: 'transaction-form-dialog.tsx:rentEffect',
          message: 'Rent effect missing data',
          data: {
            nom: formData.nom,
            villaId: formData.villaId,
            periode: formData.periode,
            hasPeriodeDate: !!periodeDate,
            hasSelectedVilla: !!selectedVilla
          },
          timestamp: Date.now()
        })
      }).catch(() => {})
      // #endregion
      setFactureInfo(null)
      return
    }
    setFactureLoading(true)
    setFactureError(null)
    LoyersService.ensureFacture({
      villaId: formData.villaId,
      locataireNom: formData.nom.trim(),
      periodeMois: periodeDate.getMonth() + 1,
      periodeAnnee: periodeDate.getFullYear(),
      montantTotal: selectedVilla.loyerMontant
    })
      .then((facture) => {
        if (facture) {
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/aec25d3d-f69f-4569-aa6b-763bde6b59a0', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: 'debug-session',
              runId: 'run1',
              hypothesisId: 'H3',
              location: 'transaction-form-dialog.tsx:rentEffect',
              message: 'Facture ensure result',
              data: {
                factureId: facture.id,
                montantRestant: facture.montantRestant
              },
              timestamp: Date.now()
            })
          }).catch(() => {})
          // #endregion
          setFactureInfo({
            id: facture.id,
            montantTotal: facture.montantTotal,
            montantRestant: facture.montantRestant
          })
        }
      })
      .catch((err) => {
        console.error('❌ ensureFacture error', err)
        setFactureError('Impossible de préparer la facture de ce loyer')
      })
      .finally(() => setFactureLoading(false))
  }, [
    shouldRenderRentFields,
    formData.nom,
    formData.villaId,
    formData.periode,
    selectedVilla?.id,
    selectedVilla?.loyerMontant
  ])

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

    // Pour "Cité kennedy" ou miroir, vérifier que Nom, Villa et Période sont remplis
    if (shouldRenderRentFields && !rentMetadata) {
      toast.error('Veuillez remplir le Nom, la Villa et la Période')
      return
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

    if (shouldRenderRentFields && factureInfo && montant > factureInfo.montantRestant + 0.0001) {
      toast.error(
        `Le montant dépasse le reste dû (${formatFca(factureInfo.montantRestant)})`
      )
      return
    }

    if (type === 'debit' && compte.soldeActuel < montant) {
      toast.error(`Solde insuffisant. Solde disponible: ${compte.soldeActuel.toLocaleString()} F CFA`)
      return
    }

    const isTransferToAnotherCompte = type === 'debit' && !!formData.compteDestinationId
    const transferGroupId = isTransferToAnotherCompte ? createTransferGroupId() : undefined
    const mirrorFundsForKennedy =
      type === 'debit' && isCiteKennedy && compte
        ? availableSharedFunds.filter(
            (fund) => fund.primaryCompteId === compte.id && fund.montantRestant > 0
          )
        : []
    const shouldAutoMirrorDebit = mirrorFundsForKennedy.length > 0

    setLoading(true)
    try {
      // Catégorie utilisée pour enregistrer la transaction.
      // Par défaut, on prend la valeur saisie dans le formulaire.
      let categorieFinale = formData.categorie

      if (isCiteKennedy && type === 'credit' && rentMetadata) {
        categorieFinale = rentMetadata.categorieLabel
      }

      const applyMirrorDebitOnSource = async () => {
        if (!shouldAutoMirrorDebit) return
        let remaining = montant
        const orderedFunds = [...mirrorFundsForKennedy].sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )

        for (const fund of orderedFunds) {
          if (remaining <= 0) break
          if (fund.montantRestant <= 0) continue

          const portion = Math.min(remaining, fund.montantRestant)
          const sourceCompte = comptes.find((c) => c.id === fund.sourceCompteId)
          const sourceLibelle =
            formData.libelle || `Débit miroir Cité Kennedy (${compte?.nom || 'Compte'})`

          const transferGroup = createTransferGroupId()
          const debitOk = await debiterCompte(
            fund.sourceCompteId,
            portion,
            sourceLibelle,
            formData.description || undefined,
            undefined,
            categorieFinale || undefined,
            getFullDateTime(formData.dateOperation),
            receiptUrl,
            receiptFileName,
            { transferGroupId: transferGroup }
          )

          if (!debitOk) {
            toast.error(
              `❌ Impossible de débiter le compte réel ${sourceCompte?.nom || fund.sourceCompteId}`
            )
            break
          }

          const registerOk = await SharedFundsService.registerMovement({
            sharedFundId: fund.id,
            compteId: compte.id,
            type: 'debit',
            montant: portion,
            transactionId: undefined,
            libelle: formData.libelle
          })

          if (!registerOk) {
            toast.warning('⚠️ Mouvement miroir non enregistré. Vérifiez le fonds partagé.')
            break
          }

          setAvailableSharedFunds((prev) =>
            prev.map((f) =>
              f.id === fund.id ? { ...f, montantRestant: f.montantRestant - portion } : f
            )
          )

          remaining -= portion
        }

        if (remaining > 0) {
          toast.warning('⚠️ Fonds virtuels insuffisants pour couvrir ce débit sur Cité Kennedy.')
        } else {
          toast.success('🔁 Débit synchronisé avec le compte d\'origine.')
        }
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
          getFullDateTime(formData.dateOperation)
        )

        // Option : créer un fonds partagé lié à ce crédit
        if (transactionId && createSharedFund && sharedFundTargetCompteId && !formData.miroirKennedy) {
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
        if (transactionId && isCiteKennedy) {
          console.log('🔍 Vérification génération automatique du reçu...', {
            transactionId: !!transactionId,
            isCiteKennedy,
            nom: !!formData.nom,
            villa: !!selectedVilla,
            periode: !!formData.periode,
            nomValue: formData.nom,
            villaValue: selectedVilla?.label,
            periodeValue: formData.periode
          })

        if (rentMetadata) {
            console.log('🧾 Génération automatique du reçu pour Cité kennedy...')
            
            try {
              console.log('📝 Données du reçu à créer:', {
                transactionId,
                compteId: compte.id,
              nomLocataire: formData.nom,
              villa: rentMetadata.villaLabel,
              periode: rentMetadata.periodeFormatee,
                montant,
                dateTransaction: new Date(formData.dateOperation).toISOString(),
                libelle: formData.libelle
              })

              const receiptId = await createReceipt({
                transactionId: transactionId,
                compteId: compte.id,
                nomLocataire: formData.nom,
              villa: rentMetadata.villaLabel,
              periode: rentMetadata.periodeFormatee,
                montant: montant,
                dateTransaction: getFullDateTime(formData.dateOperation),
                libelle: formData.libelle,
                description: formData.description
              })
              
              if (receiptId) {
                console.log('✅ Reçu généré avec succès ! ID:', receiptId)
                toast.success('🧾 Reçu généré automatiquement !')
                if (factureInfo?.id) {
                  const reglementResult = await LoyersService.registerReglement({
                    factureId: factureInfo.id,
                    montant,
                    receiptId,
                    transactionId: transactionId || undefined,
                    dateOperation: getFullDateTime(formData.dateOperation)
                  })
                  if (reglementResult) {
                    await updateReceipt(receiptId, {
                      loyerFactureId: factureInfo.id,
                      soldeRestant: reglementResult.updatedFacture.montantRestant
                    })
                    setFactureInfo({
                      id: reglementResult.updatedFacture.id,
                      montantTotal: reglementResult.updatedFacture.montantTotal,
                      montantRestant: reglementResult.updatedFacture.montantRestant
                    })
                    toast.info(
                      `Reste à payer : ${formatFca(reglementResult.updatedFacture.montantRestant)}`
                    )
                  } else {
                    toast.warning('⚠️ Acompte non synchronisé avec la facture de loyer.')
                  }
                }
              } else {
                console.warn('⚠️ Échec de la génération du reçu - receiptId est null')
                toast.warning('⚠️ Le reçu n\'a pas pu être généré automatiquement. Vous pouvez le créer manuellement.')
              }
            } catch (error) {
              console.error('❌ Erreur lors de la génération du reçu:', error)
              toast.error('Erreur lors de la génération automatique du reçu. Vous pouvez le créer manuellement.')
            }
          } else {
            // Log détaillé pour déboguer pourquoi le reçu n'est pas généré
            console.warn('⚠️ Reçu non généré automatiquement - Champs manquants:', {
              nom: !!formData.nom,
              villa: !!selectedVilla,
              periode: !!formData.periode,
              nomValue: formData.nom || 'VIDE',
              villaValue: selectedVilla?.label || 'VIDE',
              periodeValue: formData.periode || 'VIDE'
            })
            toast.warning('⚠️ Reçu non généré automatiquement. Veuillez remplir tous les champs (Nom, Villa, Période) pour la génération automatique.')
          }
        } else if (transactionId && !isCiteKennedy) {
          console.log('ℹ️ Reçu non généré - Ce n\'est pas un compte Cité Kennedy')
        } else if (!transactionId) {
          console.warn('⚠️ Reçu non généré - transactionId est null')
        }

        // Crédit miroir virtuel sur Compte Cité Kennedy (optionnel, uniquement si compte Wave)
        if (transactionId && canMirrorKennedy && compteKennedy && formData.miroirKennedy) {
          const mirrorGroupId = createTransferGroupId()
          
          // 🔄 Marquer aussi la transaction source comme transfert interne pour éviter le double comptage
          try {
            const { error: updateError } = await supabase
              .from('transactions_bancaires')
              .update({
                is_internal_transfer: true,
                transfer_group_id: mirrorGroupId
              })
              .eq('id', transactionId)
            
            if (updateError) {
              console.error('❌ Erreur lors du marquage de la transaction source:', updateError)
            }
          } catch (error) {
            console.error('❌ Erreur inattendue lors du marquage:', error)
          }
          
          const mirrorTransactionId = await crediterCompte(
            compteKennedy.id,
            montant,
            formData.libelle || 'Loyer Cité Kennedy',
            formData.description || undefined,
            undefined,
            rentMetadata?.categorieLabel || 'Loyer Cité Kennedy (miroir)',
            getFullDateTime(formData.dateOperation),
            { isInternalTransfer: true, transferGroupId: mirrorGroupId }
          )

          if (!mirrorTransactionId) {
            toast.warning('⚠️ Crédit virtuel sur "Compte Cité Kennedy" non enregistré')
          } else {
            // Créer automatiquement un fonds partagé pour lier le solde réel au virtuel
            try {
              const fund = await SharedFundsService.createFundFromCredit({
                transactionId,
                sourceCompteId: compte.id,
                primaryCompteId: compteKennedy.id,
                montant,
                libelle: formData.libelle || 'Loyer Cité Kennedy',
                description: formData.description || undefined
              })
              if (!fund) {
                toast.warning('⚠️ Fonds miroir non créé. Les dépenses Kennedy ne seront pas synchronisées.')
              }
            } catch (error) {
              console.error('❌ Erreur lors de la création automatique du fonds miroir:', error)
              toast.warning('⚠️ Fonds miroir non créé (voir console).')
            }

            if (rentMetadata) {
              try {
                const mirrorReceiptId = await createReceipt({
                  transactionId: mirrorTransactionId,
                  compteId: compteKennedy.id,
                  nomLocataire: formData.nom,
                  villa: rentMetadata.villaLabel,
                  periode: rentMetadata.periodeFormatee,
                  montant,
                  dateTransaction: getFullDateTime(formData.dateOperation),
                  libelle: formData.libelle || 'Loyer Cité Kennedy',
                  description: formData.description
                })
                if (mirrorReceiptId && factureInfo?.id) {
                  const reglementResult = await LoyersService.registerReglement({
                    factureId: factureInfo.id,
                    montant,
                    receiptId: mirrorReceiptId,
                    transactionId: mirrorTransactionId || undefined,
                    dateOperation: getFullDateTime(formData.dateOperation)
                  })
                  if (reglementResult) {
                    await updateReceipt(mirrorReceiptId, {
                      loyerFactureId: factureInfo.id,
                      soldeRestant: reglementResult.updatedFacture.montantRestant
                    })
                    setFactureInfo({
                      id: reglementResult.updatedFacture.id,
                      montantTotal: reglementResult.updatedFacture.montantTotal,
                      montantRestant: reglementResult.updatedFacture.montantRestant
                    })
                  }
                }
                toast.success('🧾 Reçu virtuel généré pour le miroir Cité Kennedy')
              } catch (error) {
                console.error('❌ Erreur génération reçu miroir:', error)
                toast.warning('⚠️ Reçu miroir non généré automatiquement.')
              }
            }
          }
        }
      } else {
        // 💸 Débit simple ou transfert vers un autre compte
        const debitOptions = isTransferToAnotherCompte
          ? { isInternalTransfer: true, transferGroupId }
          : shouldAutoMirrorDebit
            ? { isInternalTransfer: true }
            : undefined

        const debitSuccess = await debiterCompte(
          compte.id,
          montant,
          formData.libelle,
          formData.description || undefined,
          undefined,
          categorieFinale || undefined,
          getFullDateTime(formData.dateOperation),
          receiptUrl,
          receiptFileName,
          debitOptions
        )

        if (!debitSuccess) {
          transactionId = null
        } else {
          // Si un fonds partagé est sélectionné, enregistrer le mouvement
          if (selectedSharedFundId && !shouldAutoMirrorDebit) {
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
                getFullDateTime(formData.dateOperation),
                { isInternalTransfer: true, transferGroupId }
              )

              if (!creditId) {
                toast.error('Erreur lors du crédit du compte de destination')
              } else {
                const info = await fetchCompteSoldeActuel(compteDestination.id)
                const nomCible = info?.nom || compteDestination.nom
                const soldeCible = info?.soldeActuel ?? (compteDestination.soldeActuel + montant)

                showSuccess(
                  '✅ Compte crédité',
                  `${nomCible} • +${formatFca(montant)} • Solde: ${formatFca(soldeCible)}`,
                  'success'
                )
              }
            }
          }

          if (shouldAutoMirrorDebit) {
            await applyMirrorDebitOnSource()
          }

          // Débit miroir virtuel sur Compte Cité Kennedy (optionnel, uniquement si compte Wave)
          if (canMirrorKennedy && compteKennedy && formData.miroirKennedy && debitSuccess) {
            const mirrorGroupId = createTransferGroupId()
            
            // 🔄 Marquer aussi le débit source comme transfert interne pour éviter le double comptage
            // On doit récupérer l'ID de la transaction débit créée
            const { data: debitTx } = await supabase
              .from('transactions_bancaires')
              .select('id')
              .eq('compte_id', compte.id)
              .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
              .eq('libelle', formData.libelle)
              .eq('montant', montant)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()
            
            if (debitTx?.id) {
              try {
                await supabase
                  .from('transactions_bancaires')
                  .update({
                    is_internal_transfer: true,
                    transfer_group_id: mirrorGroupId
                  })
                  .eq('id', debitTx.id)
              } catch (updateError) {
                console.error('❌ Erreur lors du marquage du débit source:', updateError)
              }
            }
            
            const miroirDebitOk = await debiterCompte(
              compteKennedy.id,
              montant,
              formData.libelle,
              formData.description || undefined,
              undefined,
              kennedyCategorie || 'Loyer Cité Kennedy (miroir)',
              getFullDateTime(formData.dateOperation),
              undefined,
              undefined,
              { isInternalTransfer: true, transferGroupId: mirrorGroupId }
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
          villaId: '',
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

  const handleCreateVilla = async () => {
    if (!newVillaForm.label.trim() || !newVillaForm.montant.trim()) {
      toast.error('Nom et montant requis pour la nouvelle villa')
      return
    }
    const montant = parseFloat(newVillaForm.montant)
    if (Number.isNaN(montant) || montant <= 0) {
      toast.error('Montant de loyer invalide')
      return
    }
    const villa = await addVilla({
      label: newVillaForm.label.trim(),
      loyerMontant: montant
    })
    if (villa) {
      toast.success('Villa enregistrée')
      setFormData((prev) => ({ ...prev, villaId: villa.id }))
      setShowNewVillaForm(false)
      setNewVillaForm({ label: '', montant: '' })
    } else {
      toast.error('Impossible d’enregistrer la villa')
    }
  }

  if (!compte) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 overflow-y-auto">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
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

        {/* Contenu scrollable avec une vraie barre de défilement pour remonter facilement */}
        <div className="flex-1 min-h-0 px-6">
          <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4 pb-4">
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

          {/* 📎 Upload de reçu pour les débits */}
          {type === 'debit' && (
            <div className="space-y-2">
              <Label>
                Reçu (optionnel)
              </Label>
              <ReceiptUpload
                onReceiptUploaded={(url, fileName) => {
                  setReceiptUrl(url)
                  setReceiptFileName(fileName)
                }}
                onReceiptRemoved={() => {
                  setReceiptUrl(undefined)
                  setReceiptFileName(undefined)
                }}
                currentReceiptUrl={receiptUrl}
                currentFileName={receiptFileName}
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Vous pouvez joindre une photo ou un PDF du reçu de cette dépense
              </p>
            </div>
          )}

          {/* Afficher les champs spécifiques au loyer Kennedy lorsqu'on crédite ce compte
              ou lorsqu'on active le miroir virtuel */}
          {shouldRenderRentFields ? (
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
                  value={formData.villaId || 'none'}
                  onValueChange={(value) => {
                    if (value === '__new') {
                      setShowNewVillaForm(true)
                      return
                    }
                    setShowNewVillaForm(false)
                    setFormData((prev) => ({ ...prev, villaId: value === 'none' ? '' : value }))
                  }}
                  disabled={loading || villasLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une villa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sélectionner une villa</SelectItem>
                    {villas.map((villa) => (
                      <SelectItem key={villa.id} value={villa.id}>
                        {villa.label} — {villa.loyerMontant.toLocaleString('fr-FR')} F CFA
                      </SelectItem>
                    ))}
                    <SelectItem value="__new">+ Ajouter une villa</SelectItem>
                  </SelectContent>
                </Select>
                {selectedVilla && (
                  <p className="text-xs text-gray-500">
                    Loyer par défaut : {selectedVilla.loyerMontant.toLocaleString('fr-FR')} F CFA
                  </p>
                )}
                {showNewVillaForm && (
                  <div className="mt-3 space-y-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                    <Input
                      placeholder="Nom de la villa"
                      value={newVillaForm.label}
                      onChange={(e) =>
                        setNewVillaForm((prev) => ({ ...prev, label: e.target.value }))
                      }
                      disabled={loading}
                    />
                    <Input
                      type="number"
                      placeholder="Montant du loyer (F CFA)"
                      value={newVillaForm.montant}
                      onChange={(e) =>
                        setNewVillaForm((prev) => ({ ...prev, montant: e.target.value }))
                      }
                      disabled={loading}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCreateVilla}
                        disabled={loading}
                      >
                        Enregistrer
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowNewVillaForm(false)
                          setNewVillaForm({ label: '', montant: '' })
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
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

              {(factureLoading || factureInfo || factureError) && (
                <div className="space-y-2">
                  {factureLoading && (
                    <p className="text-xs text-gray-500 animate-pulse">Préparation du loyer...</p>
                  )}
                  {factureError && !factureLoading && (
                    <p className="text-xs text-red-600">{factureError}</p>
                  )}
                  {factureInfo && !factureLoading && (
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 text-sm">
                      <div className="font-semibold text-indigo-900">
                        Loyer {rentMetadata?.periodeFormatee}
                      </div>
                      <div className="flex items-center justify-between text-indigo-800">
                        <span>Total</span>
                        <span>{formatFca(factureInfo.montantTotal)}</span>
                      </div>
                      <div className="flex items-center justify-between text-indigo-800">
                        <span>Reste à payer</span>
                        <span>{formatFca(factureInfo.montantRestant)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
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

          </form>
        </div>
        
        <DialogFooter className="px-6 pb-6 pt-4 border-t bg-white flex-shrink-0">
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
            form="transaction-form"
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
      </DialogContent>
    </Dialog>
  )
}

