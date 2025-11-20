'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2Icon } from 'lucide-react'
import { useComptesBancaires } from '@/contexts/compte-bancaire-context'
import { toast } from 'sonner'

interface CompteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  compteToEdit?: any | null
}

export function CompteFormDialog({ open, onOpenChange, compteToEdit }: CompteFormDialogProps) {
  const { createCompte, updateCompte, refreshComptes } = useComptesBancaires()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nom: '',
    numeroCompte: '',
    banque: '',
    typeCompte: 'courant' as 'courant' | 'epargne' | 'entreprise' | 'operationnel',
    typePortefeuille: 'compte_bancaire' as 'compte_bancaire' | 'mobile_money' | 'especes' | 'autre',
    soldeInitial: '',
    devise: 'F CFA'
  })

  React.useEffect(() => {
    if (compteToEdit && open) {
      setFormData({
        nom: compteToEdit.nom || '',
        numeroCompte: compteToEdit.numeroCompte || '',
        banque: compteToEdit.banque || '',
        typeCompte: compteToEdit.typeCompte || 'courant',
        typePortefeuille: compteToEdit.typePortefeuille || 'compte_bancaire',
        soldeInitial: compteToEdit.soldeInitial?.toString() || '',
        devise: compteToEdit.devise || 'F CFA'
      })
    } else if (!compteToEdit && open) {
      setFormData({
        nom: '',
        numeroCompte: '',
        banque: '',
        typeCompte: 'courant',
        typePortefeuille: 'compte_bancaire',
        soldeInitial: '',
        devise: 'F CFA'
      })
    }
  }, [compteToEdit, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nom) {
      toast.error('Veuillez remplir le nom du compte')
      return
    }

    // En mode création, valider le solde initial
    let soldeInitial = 0
    if (!compteToEdit) {
      soldeInitial = formData.soldeInitial === '' || formData.soldeInitial === undefined 
        ? 0 
        : parseFloat(formData.soldeInitial)
      
      if (isNaN(soldeInitial) || soldeInitial < 0) {
        toast.error('Le solde initial doit être un nombre positif ou zéro')
        return
      }
    }

    setLoading(true)
    try {
      if (compteToEdit) {
        // MODIFICATION
        const success = await updateCompte(compteToEdit.id, {
          nom: formData.nom,
          numeroCompte: formData.numeroCompte || undefined,
          banque: formData.banque || undefined,
          typeCompte: formData.typeCompte,
          typePortefeuille: formData.typePortefeuille,
          devise: formData.devise
        })

        if (success) {
          toast.success('✅ Compte bancaire modifié avec succès !')
          await refreshComptes()
          onOpenChange(false)
        } else {
          toast.error('❌ Erreur lors de la modification du compte')
        }
      } else {
        // CRÉATION
        const success = await createCompte({
          nom: formData.nom,
          numeroCompte: formData.numeroCompte || undefined,
          banque: formData.banque || undefined,
          typeCompte: formData.typeCompte,
          typePortefeuille: formData.typePortefeuille,
          soldeInitial: soldeInitial,
          soldeActuel: soldeInitial,
          devise: formData.devise,
          actif: true
        })

        if (success) {
          toast.success('✅ Compte bancaire créé avec succès !')
          setFormData({
            nom: '',
            numeroCompte: '',
            banque: '',
            typeCompte: 'courant',
            typePortefeuille: 'compte_bancaire',
            soldeInitial: '',
            devise: 'F CFA'
          })
          onOpenChange(false)
        } else {
          toast.error('❌ Erreur lors de la création du compte')
        }
      }
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      toast.error('❌ Erreur inattendue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{compteToEdit ? '✏️ Modifier le Compte' : '🏦 Nouveau Compte Bancaire'}</DialogTitle>
          <DialogDescription>
            {compteToEdit ? 'Modifiez les informations du compte' : 'Créez un nouveau compte bancaire'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">
              Nom du compte <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nom"
              placeholder="Ex: Compte Principal"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numeroCompte">
              Numéro de compte
            </Label>
            <Input
              id="numeroCompte"
              placeholder="Ex: 001-123456-78"
              value={formData.numeroCompte}
              onChange={(e) => setFormData({ ...formData, numeroCompte: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="banque">
              Banque
            </Label>
            <Input
              id="banque"
              placeholder="Ex: BSIC, UBA, Ecobank"
              value={formData.banque}
              onChange={(e) => setFormData({ ...formData, banque: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="typePortefeuille">
              Type de portefeuille <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.typePortefeuille}
              onValueChange={(value: 'compte_bancaire' | 'mobile_money' | 'especes' | 'autre') => 
                setFormData({ ...formData, typePortefeuille: value })
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compte_bancaire">Compte Bancaire</SelectItem>
                <SelectItem value="mobile_money">Compte Mobile Money</SelectItem>
                <SelectItem value="especes">Espèces</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="typeCompte">
              Type de compte
            </Label>
            <Select
              value={formData.typeCompte}
              onValueChange={(value: 'courant' | 'epargne' | 'entreprise' | 'operationnel') => 
                setFormData({ ...formData, typeCompte: value })
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="courant">Compte Courant</SelectItem>
                <SelectItem value="epargne">Compte Épargne</SelectItem>
                <SelectItem value="entreprise">Compte Entreprise</SelectItem>
                <SelectItem value="operationnel">Compte Opérationnel (Dépenses Courantes)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!compteToEdit && (
            <div className="space-y-2">
              <Label htmlFor="soldeInitial">
                Solde initial (F CFA)
              </Label>
              <Input
                id="soldeInitial"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 1000000 (0 par défaut)"
                value={formData.soldeInitial}
                onChange={(e) => setFormData({ ...formData, soldeInitial: e.target.value })}
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Laissez vide ou entrez 0 pour un solde initial à zéro</p>
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
                  {compteToEdit ? 'Modification...' : 'Création...'}
                </>
              ) : (
                compteToEdit ? '✅ Modifier le compte' : '✅ Créer le compte'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

