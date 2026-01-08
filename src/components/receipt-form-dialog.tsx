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
import { useTenants } from '@/hooks/useTenants'

interface ReceiptFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receiptToEdit?: Receipt | null
}

export function ReceiptFormDialog({ open, onOpenChange, receiptToEdit }: ReceiptFormDialogProps) {
  const { receipts, createReceipt, updateReceipt, refreshReceipts } = useReceipts()
  const { comptes, transactions, refreshTransactions } = useComptesBancaires()
  const { tenantOptions, addTenantIfNotExists } = useTenants()
  const [loading, setLoading] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>('')
  
  // Trouver le compte Cité Kennedy
  const compteKennedy = comptes.find(
    c => c.nom?.toLowerCase().includes('cité kennedy') || c.nom?.toLowerCase().includes('cite kennedy')
  )
  
  const [formData, setFormData] = useState({
    nomLocataire: '',
    villa: '',
    periode: '',
    montant: '',
    dateTransaction: new Date().toISOString().split('T')[0],
    compteId: compteKennedy?.id || (comptes.length > 0 ? comptes[0].id : 'none'),
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
      setSelectedTransactionId('')
    } else if (!receiptToEdit && open && !selectedTransactionId) {
      // Réinitialiser avec Compte Cité Kennedy par défaut SEULEMENT si aucun crédit n'est sélectionné
      setFormData({
        nomLocataire: '',
        villa: '',
        periode: '',
        montant: '',
        dateTransaction: new Date().toISOString().split('T')[0],
        compteId: compteKennedy?.id || (comptes.length > 0 ? comptes[0].id : 'none'),
        libelle: '',
        description: ''
      })
      // Charger les transactions du compte Kennedy si disponible
      if (compteKennedy) {
        refreshTransactions(compteKennedy.id)
      }
    }
  }, [receiptToEdit, open, selectedTransactionId, compteKennedy, comptes, refreshTransactions])
  
  // Charger les transactions et reçus quand le compte Kennedy est disponible (séparément pour éviter les réinitialisations)
  useEffect(() => {
    if (open && !receiptToEdit && compteKennedy) {
      console.log('🔄 Rechargement des transactions et reçus pour le formulaire')
      refreshTransactions(compteKennedy.id)
      refreshReceipts()
    }
  }, [compteKennedy, open, receiptToEdit, refreshTransactions, refreshReceipts])

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
        // Ajoute automatiquement le locataire dans la base locale s'il n'existe pas encore
        addTenantIfNotExists(formData.nomLocataire)

        const receiptId = await createReceipt({
          transactionId: selectedTransactionId && selectedTransactionId !== 'none' ? selectedTransactionId : undefined,
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
          // Recharger les reçus et transactions pour mettre à jour la liste
          console.log('✅ Reçu créé, rechargement des données...')
          await refreshReceipts()
          if (compteKennedy) {
            await refreshTransactions(compteKennedy.id)
          }
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

  // Réinitialiser quand le modal se ferme
  useEffect(() => {
    if (!open) {
      setSelectedTransactionId('')
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle>
            {receiptToEdit ? '✏️ Modifier le Reçu' : '📄 Nouveau Reçu'}
          </DialogTitle>
          <DialogDescription>
            {receiptToEdit ? 'Modifiez les informations du reçu' : 'Créez un nouveau reçu de paiement'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <form onSubmit={handleSubmit} className="space-y-4" id="receipt-form">
          {/* Sélection d'une transaction de crédit existante */}
          {!receiptToEdit && compteKennedy && (
            <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Label htmlFor="transactionSelect">
                📋 Référencer un crédit existant (optionnel)
              </Label>
              <Select
                value={selectedTransactionId || 'none'}
                onValueChange={(value) => {
                  console.log('🔍 Sélection de transaction:', value)
                  setSelectedTransactionId(value)
                  
                  if (value && value !== 'none') {
                    const transaction = transactions.find(t => t.id === value)
                    console.log('📋 Transaction trouvée:', transaction)
                    
                    if (transaction && transaction.typeTransaction === 'credit') {
                      // Extraire les informations de la catégorie (format: "Nom - Villa - Période")
                      let nom = ''
                      let villa = ''
                      let periode = ''
                      
                      if (transaction.categorie) {
                        const categorieParts = transaction.categorie.split(' - ')
                        console.log('📝 Parties de la catégorie:', categorieParts)
                        
                        if (categorieParts.length >= 3) {
                          nom = categorieParts[0].trim()
                          villa = categorieParts[1].trim()
                          periode = categorieParts[2].trim()
                        } else if (categorieParts.length === 2) {
                          // Format alternatif possible
                          nom = categorieParts[0].trim()
                          villa = categorieParts[1].trim()
                          periode = new Date(transaction.dateTransaction).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                        }
                      }
                      
                      // Si pas de catégorie ou format non standard, utiliser les valeurs par défaut
                      if (!nom && !villa && !periode) {
                        // Essayer d'extraire du libellé ou description
                        nom = transaction.libelle || ''
                        periode = new Date(transaction.dateTransaction).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                      }
                      
                      // Convertir la période en date pour l'input de période
                      let periodeDateInput = new Date().toISOString().split('T')[0]
                      if (periode) {
                        try {
                          const [mois, annee] = periode.split(' ')
                          const moisMap: Record<string, string> = {
                            'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
                            'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
                            'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
                          }
                          if (mois && moisMap[mois.toLowerCase()] && annee) {
                            periodeDateInput = `${annee}-${moisMap[mois.toLowerCase()]}-01`
                          }
                        } catch (e) {
                          console.warn('⚠️ Impossible de parser la période:', periode)
                        }
                      }
                      
                      const newFormData = {
                        nomLocataire: nom || '',
                        villa: villa || '',
                        periode: periode || new Date(transaction.dateTransaction).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
                        montant: transaction.montant.toString(),
                        dateTransaction: new Date(transaction.dateTransaction).toISOString().split('T')[0],
                        compteId: transaction.compteId,
                        libelle: transaction.libelle || 'Loyer',
                        description: transaction.description || ''
                      }
                      
                      console.log('✅ Données à remplir:', newFormData)
                      setFormData(newFormData)
                      toast.success('✅ Informations du crédit chargées automatiquement !')
                    } else {
                      console.warn('⚠️ Transaction non trouvée ou pas un crédit')
                      toast.warning('⚠️ Transaction non valide')
                    }
                  } else {
                    // Réinitialiser si "Aucun" est sélectionné
                    setFormData({
                      nomLocataire: '',
                      villa: '',
                      periode: '',
                      montant: '',
                      dateTransaction: new Date().toISOString().split('T')[0],
                      compteId: compteKennedy?.id || '',
                      libelle: '',
                      description: ''
                    })
                  }
                }}
                disabled={loading}
              >
                <SelectTrigger id="transactionSelect">
                  <SelectValue placeholder="Sélectionner un crédit existant" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const availableCredits = transactions
                      .filter(t => 
                        t.compteId === compteKennedy?.id && 
                        t.typeTransaction === 'credit' &&
                        !receipts.some(r => r.transactionId === t.id) // Exclure les transactions déjà liées à un reçu
                      )
                      .sort((a, b) => new Date(b.dateTransaction).getTime() - new Date(a.dateTransaction).getTime())
                    
                    console.log('📋 Crédits disponibles pour reçu:', {
                      totalTransactions: transactions.filter(t => t.compteId === compteKennedy?.id && t.typeTransaction === 'credit').length,
                      totalReceipts: receipts.length,
                      availableCredits: availableCredits.length,
                      receiptsWithTransactionId: receipts.filter(r => r.transactionId).length
                    })
                    
                    return (
                      <>
                        <SelectItem value="none">Aucun (créer manuellement)</SelectItem>
                        {availableCredits.map((transaction) => (
                          <SelectItem key={transaction.id} value={transaction.id}>
                            {transaction.libelle || 'Crédit'} - {transaction.montant.toLocaleString()} FCFA - {new Date(transaction.dateTransaction).toLocaleDateString('fr-FR')}
                            {transaction.categorie && ` (${transaction.categorie})`}
                          </SelectItem>
                        ))}
                        {availableCredits.length === 0 && (
                          <SelectItem value="no-credits" disabled>Aucun crédit disponible</SelectItem>
                        )}
                      </>
                    )
                  })()}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Sélectionnez un crédit pour remplir automatiquement les informations du reçu.
              </p>
            </div>
          )}

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
                          periode: lastReceipt.periode,
                          montant: lastReceipt.montant.toString(),
                          libelle: lastReceipt.libelle || '',
                          description: lastReceipt.description || ''
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
              onValueChange={(value) => {
                setFormData({ ...formData, compteId: value })
                // Recharger les transactions du compte sélectionné
                if (value && value !== 'none') {
                  refreshTransactions(value)
                }
              }}
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
                      {compte.nom?.toLowerCase().includes('cité kennedy') || compte.nom?.toLowerCase().includes('cite kennedy') ? ' (Recommandé)' : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {compteKennedy && formData.compteId !== compteKennedy.id && (
              <p className="text-xs text-amber-600">
                💡 Pour générer un reçu de loyer, sélectionnez "Compte Cité Kennedy"
              </p>
            )}
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
          </form>
        </div>

        <DialogFooter className="px-6 pb-6 pt-4 flex-shrink-0 border-t border-gray-100 bg-white">
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
            form="receipt-form"
            onClick={(e) => {
              e.preventDefault()
              const form = document.getElementById('receipt-form') as HTMLFormElement
              if (form) {
                form.requestSubmit()
              }
            }}
          >
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
      </DialogContent>
    </Dialog>
  )
}

