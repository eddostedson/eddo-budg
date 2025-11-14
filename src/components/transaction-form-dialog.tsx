'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2Icon, TrendingUpIcon, TrendingDownIcon, EditIcon } from 'lucide-react'
import { useComptesBancaires } from '@/contexts/compte-bancaire-context'
import { useReceipts } from '@/contexts/receipt-context'
import { CompteBancaire } from '@/lib/shared-data'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/browser'

const supabase = createClient()

interface TransactionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  compte: CompteBancaire | null
  type: 'credit' | 'debit'
  transactionToEdit?: TransactionBancaire | null
}

export function TransactionFormDialog({ open, onOpenChange, compte, type, transactionToEdit }: TransactionFormDialogProps) {
  const { crediterCompte, debiterCompte, updateTransaction, refreshComptes, refreshTransactions, transactions } = useComptesBancaires()
  const { createReceipt, updateReceipt, receipts, refreshReceipts } = useReceipts()
  const [loading, setLoading] = useState(false)
  const [isNomDropdownOpen, setIsNomDropdownOpen] = useState(false)
  const isEditMode = !!transactionToEdit
  const [formData, setFormData] = useState({
    montant: '',
    libelle: '',
    typePaiement: '',
    mobileMoneyType: '',
    description: '', // Gardé pour les débits non-Cité Kennedy
    categorie: '',
    villa: '',
    periode: '',
    nom: ''
  })

  // Vérifier si le compte est "Cité kennedy"
  const isCiteKennedy = compte?.nom?.toLowerCase().includes('cité kennedy') || compte?.nom?.toLowerCase().includes('cite kennedy')

  // Récupérer les noms de locataires uniques depuis les reçus
  const nomsLocataires = React.useMemo(() => {
    const noms = receipts.map(r => r.nomLocataire).filter(Boolean)
    return Array.from(new Set(noms)).sort()
  }, [receipts])

  // Fonction pour récupérer les dernières informations d'un locataire
  const getLastTenantInfo = React.useCallback((nomLocataire: string) => {
    if (!nomLocataire || !isCiteKennedy || isEditMode) return null

    // Trouver le dernier reçu de ce locataire
    const tenantReceipts = receipts
      .filter(r => r.nomLocataire.toLowerCase() === nomLocataire.toLowerCase())
      .sort((a, b) => new Date(b.dateTransaction).getTime() - new Date(a.dateTransaction).getTime())

    if (tenantReceipts.length === 0) return null

    const lastReceipt = tenantReceipts[0]

    // Récupérer la transaction associée pour obtenir le type de paiement
    let typePaiement = ''
    let mobileMoneyType = ''
    
    if (lastReceipt.transactionId) {
      const transaction = transactions.find(t => t.id === lastReceipt.transactionId)
      if (transaction?.categorie) {
        // Format: "Nom - Villa - Période - TypePaiement"
        const parts = transaction.categorie.split(' - ')
        if (parts.length >= 4) {
          const typePaiementLabel = parts[3]
          const mobileMoneyTypes = ['Orange Money', 'Wave', 'MTN Mobile Money', 'Moov Money']
          
          if (mobileMoneyTypes.includes(typePaiementLabel)) {
            typePaiement = 'mobile_money'
            mobileMoneyType = typePaiementLabel
          } else {
            const typeMap: Record<string, string> = {
              'Espèce': 'espece',
              'Virement': 'virement',
              'Chèque': 'cheque'
            }
            typePaiement = typeMap[typePaiementLabel] || ''
          }
        }
      }
    }

    // Convertir la villa du label vers la valeur
    const villaLabels: Record<string, string> = {
      'mini Villa 2 Pièces EAN': 'mini_villa_2_pieces_ean',
      'Villa 3 Pièces ESP': 'villa_3_pieces_esp',
      'Villa 3 Pièces ALMYF': 'villa_3_pieces_almyf',
      'Villa 4 Pièces EKB': 'villa_4_pieces_ekb',
      'Villa 4 Pièces MAD': 'villa_4_pieces_mad'
    }
    const villa = villaLabels[lastReceipt.villa] || lastReceipt.villa

    // Convertir la période du format "novembre 2025" vers une date
    let periode = ''
    if (lastReceipt.periode) {
      const moisMap: Record<string, string> = {
        'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
        'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
        'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
      }
      const parts = lastReceipt.periode.split(' ')
      if (parts.length === 2) {
        const mois = moisMap[parts[0].toLowerCase()]
        const annee = parts[1]
        if (mois && annee) {
          periode = `${annee}-${mois}-01`
        }
      }
    }

    return {
      villa,
      periode,
      montant: lastReceipt.montant.toString(),
      typePaiement,
      mobileMoneyType
    }
  }, [receipts, transactions, isCiteKennedy, isEditMode])

  // Charger automatiquement les dernières informations quand le nom change
  React.useEffect(() => {
    if (formData.nom && isCiteKennedy && type === 'credit' && !isEditMode) {
      // Vérifier si le nom correspond exactement à un locataire existant
      const nomExiste = nomsLocataires.some(n => n.toLowerCase() === formData.nom.toLowerCase())
      
      if (nomExiste) {
        const lastInfo = getLastTenantInfo(formData.nom)
        if (lastInfo) {
          setFormData(prev => ({
            ...prev,
            villa: lastInfo.villa || prev.villa,
            periode: lastInfo.periode || prev.periode,
            montant: lastInfo.montant || prev.montant,
            typePaiement: lastInfo.typePaiement || prev.typePaiement,
            mobileMoneyType: lastInfo.mobileMoneyType || prev.mobileMoneyType
          }))
        }
      }
    }
  }, [formData.nom, isCiteKennedy, type, isEditMode, getLastTenantInfo, nomsLocataires])

  // Réinitialiser ou pré-remplir le formulaire quand le dialog s'ouvre
  React.useEffect(() => {
    if (open) {
      // Rafraîchir les reçus pour avoir les derniers noms de locataires
      if (isCiteKennedy && type === 'credit') {
        refreshReceipts()
      }
      setIsNomDropdownOpen(false)
      
      if (transactionToEdit) {
        // Mode édition : pré-remplir avec les données de la transaction
        const isCiteKennedyEdit = compte?.nom?.toLowerCase().includes('cité kennedy') || compte?.nom?.toLowerCase().includes('cite kennedy')
        
        // Extraire les informations de la catégorie pour Cité Kennedy
        let nom = ''
        let villa = ''
        let periode = ''
        let typePaiement = ''
        let mobileMoneyType = ''
        
        if (isCiteKennedyEdit && transactionToEdit.categorie) {
          // Format: "Nom - Villa - Période - Type"
          const parts = transactionToEdit.categorie.split(' - ')
          if (parts.length >= 4) {
            nom = parts[0]
            villa = parts[1]
            periode = parts[2]
            typePaiement = parts[3]
            
            // Vérifier si c'est un type Mobile Money
            const mobileMoneyTypes = ['Orange Money', 'Wave', 'MTN Mobile Money', 'Moov Money']
            if (mobileMoneyTypes.includes(typePaiement)) {
              mobileMoneyType = typePaiement
              typePaiement = 'mobile_money'
            } else {
              // Mapper les types
              const typeMap: Record<string, string> = {
                'Espèce': 'espece',
                'Virement': 'virement',
                'Chèque': 'cheque'
              }
              typePaiement = typeMap[typePaiement] || typePaiement.toLowerCase()
            }
            
            // Convertir la période en format date
            if (periode) {
              const moisMap: Record<string, string> = {
                'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
                'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
                'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
              }
              const [moisStr, annee] = periode.split(' ')
              const mois = moisMap[moisStr.toLowerCase()] || '01'
              periode = `${annee}-${mois}-01`
            }
            
            // Mapper la villa
            const villaMap: Record<string, string> = {
              'mini Villa 2 Pièces EAN': 'mini_villa_2_pieces_ean',
              'Villa 3 Pièces ESP': 'villa_3_pieces_esp',
              'Villa 3 Pièces ALMYF': 'villa_3_pieces_almyf',
              'Villa 4 Pièces EKB': 'villa_4_pieces_ekb',
              'Villa 4 Pièces MAD': 'villa_4_pieces_mad'
            }
            villa = villaMap[villa] || villa
          } else if (parts.length >= 1) {
            // Si pas de format complet, utiliser le nom de la catégorie
            nom = parts[0]
          }
        }
        
        setFormData({
          montant: transactionToEdit.montant.toString(),
          libelle: isCiteKennedyEdit && type === 'credit' ? 'Paiement Loyer' : (transactionToEdit.libelle || ''),
          typePaiement: typePaiement || transactionToEdit.reference || '',
          mobileMoneyType: mobileMoneyType,
          description: transactionToEdit.description || '',
          categorie: transactionToEdit.categorie || '',
          villa: villa,
          periode: periode,
          nom: nom
        })
      } else {
        // Mode création : formulaire vide
        setFormData({
          montant: '',
          libelle: isCiteKennedy && type === 'credit' ? 'Paiement Loyer' : '',
          typePaiement: '',
          mobileMoneyType: '',
          description: '',
          categorie: '',
          villa: '',
          periode: '',
          nom: ''
        })
      }
    }
    // Ne réinitialiser que quand open change, pas quand les autres valeurs changent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transactionToEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.montant) {
      toast.error('Veuillez remplir le montant')
      return
    }

    // Pour les crédits, le libellé est obligatoire (sauf pour Cité Kennedy où il est auto-rempli)
    if (type === 'credit' && !isCiteKennedy && !formData.libelle) {
      toast.error('Veuillez remplir le libellé')
      return
    }

    // Pour "Cité kennedy" en mode création CRÉDIT uniquement, vérifier que Nom, Villa, Période et Type sont remplis
    // En mode édition, ces champs peuvent être vides si la transaction n'avait pas ces informations
    if (isCiteKennedy && type === 'credit' && !isEditMode) {
      if (!formData.nom || !formData.villa || !formData.periode || !formData.typePaiement) {
        toast.error('Veuillez remplir le Nom, la Villa, la Période et le Type de paiement')
        return
      }
      // Si Mobile Money est sélectionné, vérifier le type de Mobile Money
      if (formData.typePaiement === 'mobile_money' && !formData.mobileMoneyType) {
        toast.error('Veuillez sélectionner le type de Mobile Money')
        return
      }
    } else if (isCiteKennedy && type === 'credit' && isEditMode && formData.typePaiement) {
      // En mode édition crédit, si un type est sélectionné, vérifier Mobile Money si nécessaire
      if (formData.typePaiement === 'mobile_money' && !formData.mobileMoneyType) {
        toast.error('Veuillez sélectionner le type de Mobile Money')
        return
      }
    }

    // Pour les débits, le libellé est obligatoire
    if (type === 'debit' && !formData.libelle) {
      toast.error('Veuillez remplir le libellé')
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

    if (type === 'debit' && compte.soldeActuel < montant) {
      toast.error(`Solde insuffisant. Solde disponible: ${compte.soldeActuel.toLocaleString()} F CFA`)
      return
    }

    setLoading(true)
    try {
      let success = false
      
      // Pour Cité kennedy, inclure Nom, Villa, Période et Type de paiement dans la catégorie
      let categorieFinale = formData.categorie
      let villaLabel = ''
      
      // Pour les crédits : format complet avec Nom, Villa, Période, Type
      if (isCiteKennedy && type === 'credit' && formData.nom && formData.villa && formData.periode && formData.typePaiement) {
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
        
        // Construire la référence avec le type de paiement
        let typePaiementLabel = formData.typePaiement
        if (formData.typePaiement === 'mobile_money' && formData.mobileMoneyType) {
          typePaiementLabel = formData.mobileMoneyType
        }
        categorieFinale = `${formData.nom} - ${villaLabel} - ${periodeFormatee} - ${typePaiementLabel}`
      }
      // Pour les débits en modification : inclure la période si elle est renseignée
      else if (isCiteKennedy && type === 'debit' && isEditMode && formData.periode) {
        const periodeFormatee = new Date(formData.periode).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        // Si on a déjà une catégorie avec le format complet, on la préserve partiellement
        if (formData.categorie && formData.categorie.includes(' - ')) {
          const parts = formData.categorie.split(' - ')
          // Remplacer la période dans la catégorie existante
          if (parts.length >= 3) {
            parts[2] = periodeFormatee
            categorieFinale = parts.join(' - ')
          } else {
            categorieFinale = `${formData.categorie} - ${periodeFormatee}`
          }
        } else {
          // Sinon, créer une catégorie simple avec la période
          categorieFinale = formData.categorie ? `${formData.categorie} - ${periodeFormatee}` : periodeFormatee
        }
      }

      let transactionId: string | null = null
      
      // Construire la référence pour Cité Kennedy avec le type de paiement
      let referenceFinale: string | undefined = undefined
      
      // Mode édition
      if (isEditMode && transactionToEdit) {
        // Pour Cité Kennedy, forcer le libellé à "Paiement Loyer"
        const libelleFinal = isCiteKennedy && type === 'credit' ? 'Paiement Loyer' : formData.libelle
        
        if (isCiteKennedy && formData.typePaiement) {
          if (formData.typePaiement === 'mobile_money' && formData.mobileMoneyType) {
            referenceFinale = formData.mobileMoneyType
          } else {
            const typeLabels: Record<string, string> = {
              'espece': 'Espèce',
              'virement': 'Virement',
              'cheque': 'Chèque',
              'mobile_money': formData.mobileMoneyType || 'Mobile Money'
            }
            referenceFinale = typeLabels[formData.typePaiement] || formData.typePaiement
          }
        }
        
        const updates: Partial<TransactionBancaire> = {
          montant: montant,
          libelle: libelleFinal,
          description: formData.description || undefined,
          reference: referenceFinale,
          categorie: categorieFinale || undefined
        }
        
        const success = await updateTransaction(transactionToEdit.id, updates)
        setLoading(false)
        if (success) {
          // Mettre à jour le reçu associé si c'est un crédit Cité Kennedy
          if (isCiteKennedy && type === 'credit') {
            // Rechercher directement le reçu dans la base de données par transaction_id
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              const { data: receiptData } = await supabase
                .from('receipts')
                .select('id')
                .eq('transaction_id', transactionToEdit.id)
                .eq('user_id', user.id)
                .single()
              
              if (receiptData) {
                // Préparer les données de mise à jour
                const updateData: any = {
                  montant: montant,
                  libelle: libelleFinal
                }
                
                // Mettre à jour le nom si fourni
                if (formData.nom) {
                  updateData.nomLocataire = formData.nom
                }
                
                // Mettre à jour la villa si fournie
                if (formData.villa) {
                  const villaLabels: Record<string, string> = {
                    'mini_villa_2_pieces_ean': 'mini Villa 2 Pièces EAN',
                    'villa_3_pieces_esp': 'Villa 3 Pièces ESP',
                    'villa_3_pieces_almyf': 'Villa 3 Pièces ALMYF',
                    'villa_4_pieces_ekb': 'Villa 4 Pièces EKB',
                    'villa_4_pieces_mad': 'Villa 4 Pièces MAD'
                  }
                  updateData.villa = villaLabels[formData.villa] || formData.villa
                }
                
                // Mettre à jour la période si fournie
                if (formData.periode) {
                  const periodeFormatee = new Date(formData.periode).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                  updateData.periode = periodeFormatee
                }
                
                await updateReceipt(receiptData.id, updateData)
                console.log('✅ Reçu mis à jour automatiquement', updateData)
              } else {
                // Si pas de reçu existant mais toutes les infos sont là, créer le reçu
                if (formData.nom && formData.villa && formData.periode) {
                  const periodeFormatee = new Date(formData.periode).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                  const villaLabels: Record<string, string> = {
                    'mini_villa_2_pieces_ean': 'mini Villa 2 Pièces EAN',
                    'villa_3_pieces_esp': 'Villa 3 Pièces ESP',
                    'villa_3_pieces_almyf': 'Villa 3 Pièces ALMYF',
                    'villa_4_pieces_ekb': 'Villa 4 Pièces EKB',
                    'villa_4_pieces_mad': 'Villa 4 Pièces MAD'
                  }
                  const villaLabel = villaLabels[formData.villa] || formData.villa
                  
                  await createReceipt({
                    transactionId: transactionToEdit.id,
                    compteId: compte.id,
                    nomLocataire: formData.nom,
                    villa: villaLabel,
                    periode: periodeFormatee,
                    montant: montant,
                    dateTransaction: transactionToEdit.dateTransaction,
                    libelle: libelleFinal,
                    description: undefined
                  })
                  console.log('✅ Reçu créé automatiquement lors de la modification')
                }
              }
            }
          }
          
          await Promise.all([refreshComptes(), refreshTransactions(), refreshReceipts()])
          setFormData({
            montant: '',
            libelle: isCiteKennedy && type === 'credit' ? 'Paiement Loyer' : '',
            typePaiement: '',
            mobileMoneyType: '',
            description: '',
            categorie: '',
            villa: '',
            periode: '',
            nom: ''
          })
          onOpenChange(false)
        }
        return
      }
      
      // Mode création
      if (type === 'credit') {
        // Pour Cité Kennedy, forcer le libellé à "Paiement Loyer"
        const libelleFinal = isCiteKennedy ? 'Paiement Loyer' : formData.libelle
        
        // Construire la référence pour Cité Kennedy avec le type de paiement
        if (isCiteKennedy && formData.typePaiement) {
          if (formData.typePaiement === 'mobile_money' && formData.mobileMoneyType) {
            referenceFinale = formData.mobileMoneyType
          } else {
            const typeLabels: Record<string, string> = {
              'espece': 'Espèce',
              'virement': 'Virement',
              'cheque': 'Chèque',
              'mobile_money': formData.mobileMoneyType || 'Mobile Money'
            }
            referenceFinale = typeLabels[formData.typePaiement] || formData.typePaiement
          }
        }
        
        transactionId = await crediterCompte(
          compte.id,
          montant,
          libelleFinal,
          undefined, // Description supprimée
          referenceFinale, // Référence remplacée par le type de paiement
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
              libelle: libelleFinal, // Toujours "Paiement Loyer" pour Cité Kennedy
              description: undefined // Description supprimée
            })
            
            if (receiptId) {
              console.log('✅ Reçu généré avec succès ! ID:', receiptId)
              toast.success('🧾 Reçu généré automatiquement !')
              await refreshReceipts()
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
        
        if (transactionId !== null) {
          await Promise.all([refreshComptes(), refreshTransactions(), refreshReceipts()])
          setFormData({
            montant: '',
            libelle: isCiteKennedy && type === 'credit' ? 'Paiement Loyer' : '',
            typePaiement: '',
            mobileMoneyType: '',
            description: '',
            categorie: '',
            villa: '',
            periode: '',
            nom: ''
          })
          onOpenChange(false)
        }
      } else {
        // Pour les débits, on garde la même logique mais sans description/référence si Cité Kennedy
        let referenceFinale: string | undefined = undefined
        if (isCiteKennedy && formData.typePaiement) {
          if (formData.typePaiement === 'mobile_money' && formData.mobileMoneyType) {
            referenceFinale = formData.mobileMoneyType
          } else {
            const typeLabels: Record<string, string> = {
              'espece': 'Espèce',
              'virement': 'Virement',
              'cheque': 'Chèque',
              'mobile_money': formData.mobileMoneyType || 'Mobile Money'
            }
            referenceFinale = typeLabels[formData.typePaiement] || formData.typePaiement
          }
        }
        
        const debitSuccess = await debiterCompte(
          compte.id,
          montant,
          formData.libelle,
          undefined, // Description supprimée
          referenceFinale,
          categorieFinale || undefined
        )
        if (debitSuccess) {
          transactionId = 'debit-success' // Marqueur pour indiquer que le débit a réussi
        } else {
          transactionId = null
        }
      }

      if (transactionId !== null) {
        await Promise.all([refreshComptes(), refreshTransactions(), refreshReceipts()])
        setFormData({
          montant: '',
          libelle: isCiteKennedy && type === 'credit' ? 'Paiement Loyer' : '',
          typePaiement: '',
          mobileMoneyType: '',
          description: '',
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
            {isEditMode ? (
              <>
                <EditIcon className="h-5 w-5 text-blue-600" />
                ✏️ Modifier la Transaction
              </>
            ) : type === 'credit' ? (
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
          {/* Pour "Cité kennedy" : afficher Nom en premier (uniquement pour les crédits) */}
          {isCiteKennedy && type === 'credit' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="nom">
                  Nom <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="nom"
                    type="text"
                    placeholder="Sélectionner ou saisir un nom de locataire"
                    value={formData.nom}
                    onChange={(e) => {
                      setFormData({ ...formData, nom: e.target.value })
                      setIsNomDropdownOpen(true)
                    }}
                    onFocus={() => setIsNomDropdownOpen(true)}
                    onBlur={() => {
                      // Délai pour permettre le clic sur une option
                      setTimeout(() => setIsNomDropdownOpen(false), 200)
                    }}
                    disabled={loading}
                    list="noms-locataires-list"
                    autoComplete="off"
                  />
                  {isNomDropdownOpen && nomsLocataires.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {nomsLocataires
                        .filter(nom => nom.toLowerCase().includes(formData.nom.toLowerCase()))
                        .map((nom) => (
                          <div
                            key={nom}
                            onClick={() => {
                              setFormData({ ...formData, nom })
                              setIsNomDropdownOpen(false)
                            }}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-900"
                          >
                            {nom}
                          </div>
                        ))}
                      {formData.nom && !nomsLocataires.some(n => n.toLowerCase() === formData.nom.toLowerCase()) && (
                        <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
                          Appuyez sur Entrée pour utiliser "{formData.nom}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {nomsLocataires.length === 0 && (
                  <p className="text-xs text-gray-500">Aucun locataire enregistré. Vous pouvez saisir un nouveau nom.</p>
                )}
              </div>
            </>
          ) : null}

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

          {/* Champ Libellé pour les débits ou les crédits non-Cité Kennedy */}
          {(type === 'debit' || (type === 'credit' && !isCiteKennedy)) && (
            <div className="space-y-2">
              <Label htmlFor="libelle">
                Libellé <span className="text-red-500">*</span>
              </Label>
              <Input
                id="libelle"
                placeholder="Ex: Retrait ATM, Paiement facture, Frais bancaires"
                value={formData.libelle}
                onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          )}

          {/* Pour "Cité kennedy" : afficher Type de paiement au lieu de Description/Référence */}
          {isCiteKennedy && (type === 'credit' || isEditMode) ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="typePaiement">
                  Type {!isEditMode && <span className="text-red-500">*</span>}
                </Label>
                <Select
                  value={formData.typePaiement}
                  onValueChange={(value) => {
                    setFormData({ 
                      ...formData, 
                      typePaiement: value,
                      mobileMoneyType: value !== 'mobile_money' ? '' : formData.mobileMoneyType
                    })
                  }}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type de paiement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="espece">Espèce</SelectItem>
                    <SelectItem value="virement">Virement</SelectItem>
                    <SelectItem value="cheque">Chèque</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.typePaiement === 'mobile_money' && (
                <div className="space-y-2">
                  <Label htmlFor="mobileMoneyType">
                    Type Mobile Money <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.mobileMoneyType}
                    onValueChange={(value) => setFormData({ ...formData, mobileMoneyType: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type de Mobile Money" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Orange Money">Orange Money</SelectItem>
                      <SelectItem value="Wave">Wave</SelectItem>
                      <SelectItem value="MTN Mobile Money">MTN Mobile Money</SelectItem>
                      <SelectItem value="Moov Money">Moov Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Pour les autres comptes ou les débits, garder les champs normaux */}
            </>
          )}

          {/* Pour "Cité kennedy" : afficher Villa (uniquement pour les crédits) */}
          {isCiteKennedy && type === 'credit' ? (
            <>
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
            </>
          ) : null}

          {/* Champ Période pour Cité Kennedy (crédits et débits en modification) */}
          {isCiteKennedy && (type === 'credit' || isEditMode) ? (
            <div className="space-y-2">
              <Label htmlFor="periode">
                Période {type === 'credit' && !isEditMode && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="periode"
                type="date"
                value={formData.periode}
                onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                required={type === 'credit' && !isEditMode}
                disabled={loading}
              />
              {formData.periode && (
                <p className="text-xs text-gray-500">
                  Affichage: {new Date(formData.periode).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
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
              className={isEditMode ? 'bg-blue-600 hover:bg-blue-700' : type === 'credit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {loading ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                isEditMode ? '✅ Modifier' : type === 'credit' ? '✅ Créditer' : '✅ Débiter'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

