'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2Icon } from 'lucide-react'
import { useDepenses } from '@/contexts/depense-context-direct'
import { useComptesBancaires } from '@/contexts/compte-bancaire-context'
import { toast } from 'sonner'

interface DepenseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  compteId?: string // Optional: pour lier automatiquement à un compte bancaire
}

export function DepenseFormDialog({ open, onOpenChange, compteId }: DepenseFormDialogProps) {
  const { createDepense } = useDepenses()
  const { comptes, debiterCompte } = useComptesBancaires()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    libelle: '',
    montant: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    compteId: compteId || (comptes.length > 0 ? comptes[0].id : 'none'),
    categorie: '',
    villa: '',
    periode: '',
    nom: ''
  })

  // Vérifier si le compte sélectionné est "Cité kennedy" (mise à jour dynamique)
  const selectedCompte = comptes.find(c => c.id === formData.compteId)
  const isCiteKennedy = selectedCompte?.nom?.toLowerCase().includes('cité kennedy') || selectedCompte?.nom?.toLowerCase().includes('cite kennedy')

  // Réinitialiser nom, villa et periode si on change de compte et que ce n'est plus Cité kennedy
  React.useEffect(() => {
    if (!isCiteKennedy && (formData.nom || formData.villa || formData.periode)) {
      setFormData(prev => ({ ...prev, nom: '', villa: '', periode: '' }))
    }
  }, [isCiteKennedy, formData.compteId])

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

    // Vérifier si un compte bancaire est sélectionné et si le solde est suffisant
    if (!formData.compteId || formData.compteId === 'none') {
      toast.error('Veuillez sélectionner un portefeuille')
      return
    }

    const compteSelected = comptes.find(c => c.id === formData.compteId)
    if (!compteSelected) {
      toast.error('Portefeuille non trouvé')
      return
    }

    if (compteSelected.soldeActuel < montant) {
      toast.error(`Solde insuffisant. Solde disponible: ${compteSelected.soldeActuel.toLocaleString()} F CFA`)
      return
    }

    // Pour "Cité kennedy", vérifier que Nom, Villa et Période sont remplis
    const isCiteKennedyCheck = compteSelected?.nom?.toLowerCase().includes('cité kennedy') || compteSelected?.nom?.toLowerCase().includes('cite kennedy')
    if (isCiteKennedyCheck) {
      if (!formData.nom || !formData.villa || !formData.periode) {
        toast.error('Veuillez remplir le Nom, la Villa et la Période')
        return
      }
    }

    setLoading(true)
    try {
      // 1. Créer la dépense dans la table depenses (pour historique)
      const success = await createDepense({
        userId: '',
        libelle: formData.libelle,
        montant: montant,
        description: formData.description,
        date: formData.date,
        recetteId: undefined, // Plus de lien avec les recettes
        categorie: formData.categorie || undefined
      })

      if (success) {
        // 2. Débiter automatiquement le compte bancaire sélectionné
        // Pour Cité kennedy, inclure Nom, Villa et Période dans la catégorie
        let categorieFinale = formData.categorie
        if (isCiteKennedyCheck && formData.nom && formData.villa && formData.periode) {
          const periodeFormatee = new Date(formData.periode).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
          const villaLabel = formData.villa === '2_pieces' ? '2 pièces' : formData.villa === '3_pieces' ? '3 pièces' : '4 pièces'
          categorieFinale = `${formData.nom} - Villa ${villaLabel} - ${periodeFormatee}`
        }
        
        const debitSuccess = await debiterCompte(
          formData.compteId,
          montant,
          formData.libelle,
          formData.description || undefined,
          undefined,
          categorieFinale || undefined
        )

        if (!debitSuccess) {
          console.warn('⚠️ Dépense créée mais débit sur compte bancaire échoué')
          toast.warning('⚠️ Dépense créée mais débit sur compte bancaire échoué')
        }

        onOpenChange(false)
        
        setFormData({
          libelle: '',
          montant: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          compteId: comptes.length > 0 ? comptes[0].id : 'none',
          categorie: '',
          villa: '',
          periode: '',
          nom: ''
        })
        
        toast.success('✅ Dépense créée avec succès !')
      } else {
        toast.error('❌ Erreur lors de la création de la dépense')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('❌ Erreur inattendue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>💸 Nouvelle Dépense</DialogTitle>
          <DialogDescription>
            Créez une nouvelle dépense et débitez-la depuis un portefeuille
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1️⃣ PORTEFEUILLE EN PREMIER */}
          <div className="space-y-2">
            <Label htmlFor="compteId">
              Débiter depuis le portefeuille <span className="text-red-500">*</span>
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
                  comptes.map((compte) => {
                    const soldeAZero = compte.soldeActuel === 0
                    
                    return (
                      <SelectItem 
                        key={compte.id} 
                        value={compte.id}
                        disabled={soldeAZero}
                        className={soldeAZero ? 'opacity-50 cursor-not-allowed' : ''}
                      >
                        {compte.nom} - {compte.soldeActuel.toLocaleString()} F CFA disponible
                        {soldeAZero && ' (Solde à 0)'}
                      </SelectItem>
                    )
                  })
                )}
              </SelectContent>
            </Select>
            
            {comptes.length === 0 && (
              <p className="text-xs text-gray-500">Créez d'abord un portefeuille dans la section Comptes Bancaires</p>
            )}
            
            {/* Affichage du solde restant en temps réel */}
            {formData.compteId !== 'none' && (() => {
              const selectedCompte = comptes.find(c => c.id === formData.compteId)
              if (!selectedCompte) return null
              
              const montantSaisi = parseFloat(formData.montant) || 0
              const soldeRestant = selectedCompte.soldeActuel - montantSaisi
              const estNegatif = soldeRestant < 0
              const soldeAZero = selectedCompte.soldeActuel === 0
              
              return (
                <div className={`mt-2 p-3 rounded-lg border ${
                  soldeAZero 
                    ? 'bg-orange-50 border-orange-300' 
                    : estNegatif 
                    ? 'bg-red-50 border-red-300' 
                    : 'bg-blue-50 border-blue-300'
                }`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">Solde disponible :</span>
                    <span className="font-bold">{selectedCompte.soldeActuel.toLocaleString()} F CFA</span>
                  </div>
                  {soldeAZero && (
                    <p className="text-xs text-orange-600 mt-2 font-medium">⚠️ Le solde est à 0, impossible d'ajouter une dépense</p>
                  )}
                  {!soldeAZero && montantSaisi > 0 && (
                    <>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-gray-600">Montant saisi :</span>
                        <span className="text-gray-800">- {montantSaisi.toLocaleString()} F CFA</span>
                      </div>
                      <div className="border-t border-gray-300 my-2"></div>
                      <div className={`flex items-center justify-between text-sm font-bold ${estNegatif ? 'text-red-600' : 'text-green-600'}`}>
                        <span>Solde restant :</span>
                        <span className="text-lg">{soldeRestant.toLocaleString()} F CFA</span>
                      </div>
                      {estNegatif && (
                        <p className="text-xs text-red-600 mt-2">⚠️ Le montant dépasse le solde disponible !</p>
                      )}
                    </>
                  )}
                </div>
              )
            })()}
          </div>

          {/* 2️⃣ LIBELLÉ */}
          <div className="space-y-2">
            <Label htmlFor="libelle">
              Libellé <span className="text-red-500">*</span>
            </Label>
            <Input
              id="libelle"
              placeholder="Ex: Namory Soutrali"
              value={formData.libelle}
              onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          {/* 3️⃣ MONTANT */}
          <div className="space-y-2">
            <Label htmlFor="montant">
              Montant (F CFA) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="montant"
              type="number"
              step="0.01"
              placeholder="Ex: 30000"
              value={formData.montant}
              onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          {/* 4️⃣ DATE */}
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
                    <SelectItem value="2_pieces">2 pièces</SelectItem>
                    <SelectItem value="3_pieces">3 pièces</SelectItem>
                    <SelectItem value="4_pieces">4 pièces</SelectItem>
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
                placeholder="Ex: Salaire, Réparation, etc."
                value={formData.categorie}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                disabled={loading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">
              Description
            </Label>
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
            <Button 
              type="submit" 
              disabled={loading || (formData.recetteId !== 'none' && (() => {
                const selectedRecette = recettes.find(r => r.id === formData.recetteId)
                if (!selectedRecette) return false
                const depensesLiees = depenses.filter(d => d.recetteId === selectedRecette.id)
                const totalDepenses = depensesLiees.reduce((sum, depense) => sum + depense.montant, 0)
                const soldeDisponibleCalcule = selectedRecette.montant - totalDepenses
                return soldeDisponibleCalcule === 0
              })())}
              title={formData.recetteId !== 'none' && (() => {
                const selectedRecette = recettes.find(r => r.id === formData.recetteId)
                if (!selectedRecette) return ''
                const depensesLiees = depenses.filter(d => d.recetteId === selectedRecette.id)
                const totalDepenses = depensesLiees.reduce((sum, depense) => sum + depense.montant, 0)
                const soldeDisponibleCalcule = selectedRecette.montant - totalDepenses
                return soldeDisponibleCalcule === 0 ? 'Impossible d\'ajouter une dépense : solde à 0' : ''
              })()}
            >
              {loading ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                '✅ Créer la dépense'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

