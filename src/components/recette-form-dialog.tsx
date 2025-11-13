'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2Icon } from 'lucide-react'
import { useRecettes } from '@/contexts/recette-context-direct'
import { useComptesBancaires } from '@/contexts/compte-bancaire-context'
import { Recette } from '@/lib/shared-data'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface RecetteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recetteToEdit?: Recette | null // Recette à modifier (optionnel)
}

export function RecetteFormDialog({ open, onOpenChange, recetteToEdit }: RecetteFormDialogProps) {
  const { createRecette, updateRecette, refreshRecettes } = useRecettes()
  const { comptes, crediterCompte } = useComptesBancaires()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    libelle: '',
    montant: '',
    date: new Date().toISOString().split('T')[0],
    statut: 'Reçue',
    compteId: 'none' // Compte bancaire où créditer la recette
  })

  // Charger les données de la recette à modifier quand le modal s'ouvre
  React.useEffect(() => {
    if (recetteToEdit && open) {
      // Dans la base, description sert de libellé principal
      // On charge le libellé depuis description ou libelle
      const libelle = recetteToEdit.libelle || recetteToEdit.description || ''
      
      setFormData({
        libelle: libelle,
        montant: recetteToEdit.montant?.toString() || '',
        date: recetteToEdit.date ? new Date(recetteToEdit.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        statut: recetteToEdit.statut || 'Reçue'
      })
    } else if (!recetteToEdit && open) {
      // Réinitialiser le formulaire pour une nouvelle recette
      setFormData({
        libelle: '',
        montant: '',
        date: new Date().toISOString().split('T')[0],
        statut: 'Reçue',
        compteId: comptes.length > 0 ? comptes[0].id : 'none'
      })
    }
  }, [recetteToEdit, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.libelle || !formData.montant) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    const montant = parseFloat(formData.montant)
    if (isNaN(montant) || montant <= 0) {
      toast.error('Le montant doit être un nombre positif')
      return
    }

    setLoading(true)
    try {
      if (recetteToEdit) {
        // MODIFICATION
        console.log('🔄 [RecetteFormDialog] Début de la modification:', {
          id: recetteToEdit.id,
          libelle: formData.libelle,
          montant: montant
        })
        
        // Utiliser libelle comme description (car dans la base c'est le champ description qui sert de libellé)
        const success = await updateRecette(recetteToEdit.id, {
          libelle: formData.libelle, // Sera mappé vers description dans updateRecette
          montant: montant,
          date: formData.date
          // statut retiré car la colonne n'existe pas dans la base
        })

        console.log('📊 [RecetteFormDialog] Résultat de la modification:', success)

        if (success) {
          toast.success('✅ Recette modifiée avec succès !')
          console.log('🔄 [RecetteFormDialog] Rafraîchissement des recettes...')
          await refreshRecettes() // Rafraîchir pour afficher les modifications
          console.log('✅ [RecetteFormDialog] Recettes rafraîchies')
          onOpenChange(false)
        } else {
          console.error('❌ [RecetteFormDialog] Échec de la modification')
          toast.error('❌ Erreur lors de la modification de la recette')
        }
      } else {
        // CRÉATION
        // 1. Créer la recette dans la table recettes (pour historique)
        const success = await createRecette({
          userId: '', // Will be set by context
          libelle: formData.libelle,
          montant: montant,
          soldeDisponible: montant,
          description: formData.libelle, // Utiliser libelle comme description
          date: formData.date,
          statut: formData.statut as any
        })

        if (success) {
          // 2. Si un compte bancaire est sélectionné, créer automatiquement un crédit
          if (formData.compteId && formData.compteId !== 'none') {
            const compte = comptes.find(c => c.id === formData.compteId)
            if (compte) {
              const transactionId = await crediterCompte(
                formData.compteId,
                montant,
                `Recette: ${formData.libelle}`,
                `Recette enregistrée le ${new Date(formData.date).toLocaleDateString('fr-FR')}`,
                undefined,
                'Recette'
              )
              if (!transactionId) {
                console.warn('⚠️ Recette créée mais crédit sur compte bancaire échoué')
              }
            }
          }
          
          toast.success('✅ Recette créée avec succès !')
          // Reset form
          setFormData({
            libelle: '',
            montant: '',
            date: new Date().toISOString().split('T')[0],
            statut: 'Reçue',
            compteId: comptes.length > 0 ? comptes[0].id : 'none'
          })
          onOpenChange(false)
        } else {
          toast.error('❌ Erreur lors de la création de la recette')
        }
      }
    } catch (error) {
      console.error('❌ [RecetteFormDialog] Erreur inattendue:', error)
      toast.error('❌ Erreur inattendue lors de la modification')
    } finally {
      console.log('🔄 [RecetteFormDialog] Fin du traitement, désactivation du loading')
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{recetteToEdit ? '✏️ Modifier la Recette' : '💰 Nouvelle Recette'}</DialogTitle>
          <DialogDescription>
            {recetteToEdit ? 'Modifiez les informations de la recette' : 'Créez une nouvelle recette pour suivre vos revenus'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="libelle">
              Libellé <span className="text-red-500">*</span>
            </Label>
            <Input
              id="libelle"
              placeholder="Ex: Loyer Kennedy Novembre"
              value={formData.libelle}
              onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="montant">
              Montant (F CFA) <span className="text-red-500">*</span>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">
              Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          {!recetteToEdit && (
            <div className="space-y-2">
              <Label htmlFor="compteId">
                Créditer sur le portefeuille <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.compteId}
                onValueChange={(value) => setFormData({ ...formData, compteId: value })}
                disabled={loading || comptes.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un portefeuille" />
                </SelectTrigger>
                <SelectContent>
                  {comptes.length === 0 ? (
                    <SelectItem value="none" disabled>Aucun portefeuille disponible</SelectItem>
                  ) : (
                    comptes.map((compte) => (
                      <SelectItem key={compte.id} value={compte.id}>
                        {compte.nom} - {compte.soldeActuel.toLocaleString()} F CFA
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {comptes.length === 0 && (
                <p className="text-xs text-gray-500">Créez d'abord un portefeuille dans la section Comptes Bancaires</p>
              )}
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  {recetteToEdit ? 'Modification...' : 'Création...'}
                </>
              ) : (
                recetteToEdit ? '✅ Modifier la recette' : '✅ Créer la recette'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

