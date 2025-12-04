'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { BudgetSalaireMois, BudgetSalaireRubrique, BudgetSalaireMouvement } from '@/lib/shared-data'
import { BudgetSalaireService } from '@/lib/supabase/budget-salaire-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre'
]

export default function BudgetSalairePage() {
  const router = useRouter()
  const supabase = createClient()

  const today = new Date()
  const [annee, setAnnee] = useState(today.getFullYear())
  const [mois, setMois] = useState(today.getMonth() + 1)

  const [loadingAuth, setLoadingAuth] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [budgetMois, setBudgetMois] = useState<BudgetSalaireMois | null>(null)
  const [rubriques, setRubriques] = useState<BudgetSalaireRubrique[]>([])

  const [revenuInput, setRevenuInput] = useState('')
  const [newRubrique, setNewRubrique] = useState({
    nom: '',
    montantBudgete: '',
    typeDepense: 'progressive' as 'progressive' | 'unique'
  })

  const [editingRubrique, setEditingRubrique] = useState<BudgetSalaireRubrique | null>(null)
  const [editRubriqueForm, setEditRubriqueForm] = useState({
    nom: '',
    montantBudgete: '',
    typeDepense: 'progressive' as 'progressive' | 'unique'
  })

  const [selectedRubrique, setSelectedRubrique] = useState<BudgetSalaireRubrique | null>(null)
  const [mouvementForm, setMouvementForm] = useState({
    montant: '',
    dateOperation: new Date().toISOString().split('T')[0],
    description: ''
  })
  const [rubriqueMouvements, setRubriqueMouvements] = useState<BudgetSalaireMouvement[]>([])
  const [rubriqueMouvementsRubrique, setRubriqueMouvementsRubrique] = useState<BudgetSalaireRubrique | null>(null)
  const [loadingMouvementsRubrique, setLoadingMouvementsRubrique] = useState(false)
  const [mouvementEnEdition, setMouvementEnEdition] = useState<BudgetSalaireMouvement | null>(null)
  const [editMouvementForm, setEditMouvementForm] = useState({
    montant: '',
    dateOperation: '',
    description: ''
  })

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }
      setLoadingAuth(false)
    }
    checkAuth()
  }, [router, supabase])

  const loadData = async (forceRevenuCreation?: number) => {
    setLoadingData(true)
    try {
      const budget = await BudgetSalaireService.getOrCreateBudgetMois(
        annee,
        mois,
        forceRevenuCreation
      )

      if (!budget) {
        setBudgetMois(null)
        setRubriques([])
        return
      }

      const rubs = await BudgetSalaireService.getRubriques(budget.id)
      const mouvementsBudget = await BudgetSalaireService.getMouvementsPourBudget(budget.id)

      // Recalculer les montants dépensés à partir des mouvements pour une cohérence totale
      const depenseParRubrique: Record<string, number> = {}
      let totalDepenseCalcule = 0

      mouvementsBudget.forEach((mvt) => {
        depenseParRubrique[mvt.rubriqueId] =
          (depenseParRubrique[mvt.rubriqueId] || 0) + mvt.montant
        totalDepenseCalcule += mvt.montant
      })

      const rubriquesCorrigees = rubs.map((r) => ({
        ...r,
        montantDepense: depenseParRubrique[r.id] ?? r.montantDepense
      }))

      const budgetCorrige: BudgetSalaireMois = {
        ...budget,
        montantDepenseTotal: totalDepenseCalcule
      }

      setBudgetMois(budgetCorrige)
      setRubriques(rubriquesCorrigees)
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [annee, mois])

  const handleCreateBudgetMois = async (e: React.FormEvent) => {
    e.preventDefault()
    const revenu = parseFloat(revenuInput.replace(',', '.'))
    if (Number.isNaN(revenu) || revenu <= 0) {
      alert('Veuillez saisir un revenu valide pour le mois.')
      return
    }
    await loadData(revenu)
    setRevenuInput('')
  }

  const totalBudgete = rubriques.reduce((sum, r) => sum + r.montantBudgete, 0)
  const totalDepense = budgetMois?.montantDepenseTotal ?? 0
  const disponiblePourBudget = (budgetMois?.revenuMensuel ?? 0) - totalBudgete
  const resteApresDepensesReelles = (budgetMois?.revenuMensuel ?? 0) - totalDepense
  const margeSurBudget = totalBudgete - totalDepense

  // Mois précédent (pour afficher "Revenu du mois de {mois précédent} {année}")
  const previousMonthIndex = mois === 1 ? 11 : mois - 2
  const previousMonthYear = mois === 1 ? annee - 1 : annee
  const previousMonthLabel = MONTHS[previousMonthIndex]

  const handleCreateRubrique = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!budgetMois) return

    const montant = parseFloat(newRubrique.montantBudgete.replace(',', '.'))
    if (!newRubrique.nom.trim() || Number.isNaN(montant) || montant <= 0) {
      alert('Veuillez renseigner un nom et un montant valide pour la rubrique.')
      return
    }

    if (budgetMois && montant > disponiblePourBudget) {
      alert(
        `Le montant budgété dépasse le revenu disponible pour ce mois. Montant maximum possible: ${disponiblePourBudget.toLocaleString(
          'fr-FR'
        )} F CFA.`
      )
      return
    }

    const rubrique = await BudgetSalaireService.createRubrique({
      budgetMoisId: budgetMois.id,
      nom: newRubrique.nom.trim(),
      montantBudgete: montant,
      typeDepense: newRubrique.typeDepense
    })

    if (rubrique) {
      setRubriques((prev) => [...prev, rubrique])
      setNewRubrique({ nom: '', montantBudgete: '', typeDepense: 'progressive' })
    }
  }

  const openEditRubriqueModal = (rubrique: BudgetSalaireRubrique) => {
    setEditingRubrique(rubrique)
    setEditRubriqueForm({
      nom: rubrique.nom,
      montantBudgete: String(rubrique.montantBudgete),
      typeDepense: rubrique.typeDepense
    })
  }

  const handleUpdateRubrique = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRubrique) return

    const montant = parseFloat(editRubriqueForm.montantBudgete.replace(',', '.'))
    if (!editRubriqueForm.nom.trim() || Number.isNaN(montant) || montant <= 0) {
      alert('Veuillez renseigner un nom et un montant valide pour la rubrique.')
      return
    }

    const ancienMontant = editingRubrique.montantBudgete
    const nouveauTotal = totalBudgete - ancienMontant + montant
    const maxBudget = budgetMois?.revenuMensuel ?? 0
    if (nouveauTotal > maxBudget) {
      alert(
        `Le nouveau montant budgété dépasse le revenu du mois. Montant maximum possible pour cette rubrique: ${(
          maxBudget - (totalBudgete - ancienMontant)
        ).toLocaleString('fr-FR')} F CFA.`
      )
      return
    }

    const ok = await BudgetSalaireService.updateRubrique(editingRubrique.id, {
      nom: editRubriqueForm.nom.trim(),
      montantBudgete: montant,
      typeDepense: editRubriqueForm.typeDepense
    })

    if (ok) {
      await loadData()
      setEditingRubrique(null)
    }
  }

  const handleDeleteRubrique = async (rubrique: BudgetSalaireRubrique) => {
    if (rubrique.montantDepense > 0) {
      alert("Impossible de supprimer une rubrique qui a déjà des dépenses. Supprime d'abord les mouvements.")
      return
    }

    if (!confirm(`Supprimer définitivement la rubrique "${rubrique.nom}" ?`)) {
      return
    }

    const ok = await BudgetSalaireService.deleteRubrique(rubrique.id)
    if (ok) {
      await loadData()
    }
  }

  const handleVoirMouvementsRubrique = async (rubrique: BudgetSalaireRubrique) => {
    setRubriqueMouvementsRubrique(rubrique)
    setLoadingMouvementsRubrique(true)
    try {
      const mouvements = await BudgetSalaireService.getMouvementsPourRubrique(rubrique.id)
      setRubriqueMouvements(mouvements)
      setMouvementEnEdition(null)
    } finally {
      setLoadingMouvementsRubrique(false)
    }
  }

  const openEditMouvement = (mvt: BudgetSalaireMouvement) => {
    setMouvementEnEdition(mvt)
    setEditMouvementForm({
      montant: String(mvt.montant),
      dateOperation: mvt.dateOperation
        ? new Date(mvt.dateOperation).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      description: mvt.description || ''
    })
  }

  const handleUpdateMouvementRubrique = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mouvementEnEdition || !rubriqueMouvementsRubrique || !budgetMois) return

    const montant = parseFloat(editMouvementForm.montant.replace(',', '.'))
    if (Number.isNaN(montant) || montant <= 0) {
      alert('Veuillez saisir un montant valide pour le mouvement.')
      return
    }

    const ok = await BudgetSalaireService.updateMouvement({
      mouvement: mouvementEnEdition,
      rubrique: rubriqueMouvementsRubrique,
      budgetMois,
      montant,
      dateOperation: new Date(editMouvementForm.dateOperation).toISOString(),
      description: editMouvementForm.description || undefined
    })

    if (ok) {
      await loadData()
      const mouvements = await BudgetSalaireService.getMouvementsPourRubrique(
        rubriqueMouvementsRubrique.id
      )
      setRubriqueMouvements(mouvements)
      setMouvementEnEdition(null)
    }
  }

  const handleDeleteMouvementRubrique = async (mvt: BudgetSalaireMouvement) => {
    if (!rubriqueMouvementsRubrique || !budgetMois) return

    if (
      !confirm(
        `Supprimer définitivement le mouvement de ${mvt.montant.toLocaleString('fr-FR')} F CFA ?`
      )
    ) {
      return
    }

    const ok = await BudgetSalaireService.deleteMouvement({
      mouvement: mvt,
      rubrique: rubriqueMouvementsRubrique,
      budgetMois
    })

    if (ok) {
      await loadData()
      const mouvements = await BudgetSalaireService.getMouvementsPourRubrique(
        rubriqueMouvementsRubrique.id
      )
      setRubriqueMouvements(mouvements)
      if (mouvementEnEdition?.id === mvt.id) {
        setMouvementEnEdition(null)
      }
    }
  }

  const handleAddMouvement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!budgetMois || !selectedRubrique) return

    const montant = parseFloat(mouvementForm.montant.replace(',', '.'))
    if (Number.isNaN(montant) || montant <= 0) {
      alert('Veuillez saisir un montant valide.')
      return
    }

    const ok = await BudgetSalaireService.addMouvement({
      rubrique: selectedRubrique,
      budgetMois,
      montant,
      dateOperation: new Date(mouvementForm.dateOperation).toISOString(),
      description: mouvementForm.description || undefined
    })

    if (ok) {
      await loadData()
      setSelectedRubrique(null)
      setMouvementForm({
        montant: '',
        dateOperation: new Date().toISOString().split('T')[0],
        description: ''
      })
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount)

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Vérification de l&apos;authentification...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg px-4 py-6 md:px-8 md:py-8">
        {/* Bloc sticky : titre, sélecteur mois/année et résumé */}
        <div className="sticky top-4 z-20 bg-white/95 backdrop-blur-md pb-5 mb-8 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Budget mensuel</p>
              <h1 className="mt-1 text-2xl md:text-3xl font-bold text-slate-900">Budget Salaire</h1>
              <p className="mt-1 text-sm text-slate-500 max-w-xl">
                Suivi premium de ton salaire et des dépenses par rubriques, indépendant des comptes bancaires.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={String(mois)} onValueChange={(value) => setMois(parseInt(value, 10))}>
                <SelectTrigger className="w-[150px] rounded-xl border-slate-300 bg-slate-50/80 shadow-inner text-sm">
                  <SelectValue placeholder="Mois" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((label, index) => (
                    <SelectItem key={index + 1} value={String(index + 1)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={annee}
                onChange={(e) => setAnnee(parseInt(e.target.value, 10) || today.getFullYear())}
                className="w-[110px] rounded-xl border-slate-300 bg-slate-50/80 shadow-inner text-sm"
              />
              <Button
                type="button"
                onClick={() => router.push('/comptes-bancaires')}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold shadow-sm"
              >
                Aller aux comptes bancaires
              </Button>
            </div>
          </div>

          {/* Création du budget mensuel si inexistant */}
          {!budgetMois && (
            <Card className="border-dashed border-slate-300 bg-slate-50/80 rounded-xl shadow-none">
              <CardContent className="pt-4">
                <form
                  onSubmit={handleCreateBudgetMois}
                  className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      Créer le budget pour {MONTHS[mois - 1]} {annee}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Indique ton revenu net du mois pour commencer à répartir ton budget par rubriques.
                    </p>
                    <div className="mt-3 max-w-xs">
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Revenu du mois (salaire net)
                      </label>
                      <Input
                        type="number"
                        placeholder="Ex: 500000"
                        value={revenuInput}
                        onChange={(e) => setRevenuInput(e.target.value)}
                        required
                        className="rounded-xl border-slate-300 bg-white shadow-inner text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="mt-2 md:mt-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                  >
                    Créer le budget du mois
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Résumé du mois courant */}
          {budgetMois && (
            <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-slate-100 px-5 py-4 shadow-md">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Revenu du mois de {previousMonthLabel} {previousMonthYear}
                </p>
                <p className="mt-2 text-2xl md:text-3xl font-semibold text-slate-900">
                  {formatCurrency(budgetMois.revenuMensuel)}
                </p>
              </div>
              <div className="rounded-xl bg-rose-100/80 px-5 py-4 shadow-md">
                <p className="text-xs font-medium uppercase tracking-wide text-rose-800">
                  Total dépensé ce mois
                </p>
                <p className="mt-2 text-2xl md:text-3xl font-semibold text-rose-900">
                  {formatCurrency(totalDepense)}
                </p>
                <p className="mt-1 text-[11px] text-rose-900/80">
                  Reste après dépenses réelles:&nbsp;
                  <span
                    className={`font-semibold ${
                      resteApresDepensesReelles >= 0 ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {formatCurrency(resteApresDepensesReelles)}
                  </span>
                </p>
              </div>
              <div className="rounded-xl bg-blue-100/80 px-5 py-4 shadow-md">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-800">
                  Marge sur le budget (plafonds - dépenses)
                </p>
                <p
                  className={`mt-2 text-2xl md:text-3xl font-semibold ${
                    margeSurBudget >= 0 ? 'text-blue-900' : 'text-red-700'
                  }`}
                >
                  {formatCurrency(margeSurBudget)}
                </p>
                <p className="mt-1 text-[11px] text-blue-900/80">
                  Différence entre le total budgété et le total dépensé ce mois. Si ce montant devient
                  négatif, les plafonds sont dépassés.
                </p>
              </div>
            </div>
          )}
        </div>

        {budgetMois && (
          <>
            {/* Rubriques */}
            <Card className="border-none shadow-none">
              <CardHeader className="px-0 pt-0 pb-4">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Rubriques de dépenses pour ce mois
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 md:px-6">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-white text-slate-700">
                        <tr>
                          <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide">
                            Rubrique
                          </th>
                          <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide">
                            Budgeté
                          </th>
                          <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide">
                            Dépensé
                          </th>
                          <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide">
                            Reste
                          </th>
                          <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wide">
                            Type
                          </th>
                          <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wide">
                            Statut
                          </th>
                          <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {rubriques.map((rubrique, index) => {
                          const resteRubrique = rubrique.montantBudgete - rubrique.montantDepense
                          const depenseRatio =
                            rubrique.montantBudgete > 0
                              ? Math.min(100, (rubrique.montantDepense / rubrique.montantBudgete) * 100)
                              : 0
                          const resteRatio =
                            rubrique.montantBudgete > 0 && resteRubrique > 0
                              ? Math.min(100, (resteRubrique / rubrique.montantBudgete) * 100)
                              : 0
                          const rowBg =
                            index % 2 === 0 ? 'bg-white hover:bg-indigo-50/50' : 'bg-slate-50 hover:bg-indigo-50/50'

                          const depenseClass =
                            rubrique.montantDepense === 0
                              ? 'text-slate-400'
                              : 'text-rose-600'

                          const resteClass =
                            resteRubrique <= 0
                              ? 'text-red-600'
                              : resteRubrique < rubrique.montantBudgete * 0.25
                                ? 'text-amber-600'
                                : 'text-emerald-600'

                          return (
                            <tr key={rubrique.id} className={`${rowBg} transition-colors`}>
                              <td className="px-5 py-4 align-top">
                                <div className="inline-flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-indigo-400" />
                                  <span className="font-semibold text-slate-900">{rubrique.nom}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-right align-top font-semibold text-slate-900">
                                {formatCurrency(rubrique.montantBudgete)}
                              </td>
                              <td className={`px-5 py-4 text-right align-top font-semibold ${depenseClass}`}>
                                <div className="flex flex-col items-end gap-1">
                                  <span>{formatCurrency(rubrique.montantDepense)}</span>
                                  {rubrique.montantBudgete > 0 && (
                                    <div className="mt-1 h-1.5 w-24 rounded-full bg-slate-200">
                                      <div
                                        className={`h-1.5 rounded-full ${
                                          rubrique.montantDepense > rubrique.montantBudgete
                                            ? 'bg-red-700'
                                            : 'bg-rose-500'
                                        }`}
                                        style={{ width: `${depenseRatio}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className={`px-5 py-4 text-right align-top font-semibold ${resteClass}`}>
                                <div className="flex flex-col items-end gap-1">
                                  <span>{formatCurrency(resteRubrique)}</span>
                                  {rubrique.montantBudgete > 0 && resteRubrique > 0 && (
                                    <div className="mt-1 h-1.5 w-24 rounded-full bg-slate-200">
                                      <div
                                        className="h-1.5 rounded-full bg-emerald-500"
                                        style={{ width: `${resteRatio}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-4 text-center align-top">
                                <span className="inline-flex px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                  {rubrique.typeDepense === 'progressive' ? 'Progressive' : 'Unique'}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-center align-top">
                                <span
                                  className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                                    rubrique.statut === 'terminee'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : rubrique.statut === 'annulee'
                                      ? 'bg-slate-200 text-slate-600'
                                      : 'bg-amber-100 text-amber-700'
                                  }`}
                                >
                                  {rubrique.statut === 'terminee'
                                    ? 'Terminée'
                                    : rubrique.statut === 'annulee'
                                    ? 'Annulée'
                                    : 'En cours'}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right align-top">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    type="button"
                                    onClick={() => setSelectedRubrique(rubrique)}
                                    className="px-4 py-2 rounded-lg text-xs font-semibold shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                                  >
                                    Ajouter mouvement
                                  </Button>
                                  <Button
                                    size="sm"
                                    type="button"
                                    onClick={() => handleVoirMouvementsRubrique(rubrique)}
                                    className="px-4 py-2 rounded-lg text-xs font-semibold shadow-sm bg-slate-700 hover:bg-slate-800 text-white"
                                  >
                                    Voir
                                  </Button>
                                  <Button
                                    size="sm"
                                    type="button"
                                    onClick={() => openEditRubriqueModal(rubrique)}
                                    className="px-4 py-2 rounded-lg text-xs font-semibold shadow-sm bg-orange-500 hover:bg-orange-600 text-white"
                                  >
                                    Modifier
                                  </Button>
                                  <Button
                                    size="sm"
                                    type="button"
                                    className="px-4 py-2 rounded-lg text-xs font-semibold shadow-sm bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() => handleDeleteRubrique(rubrique)}
                                  >
                                    Supprimer
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Formulaire ajout de rubrique */}
                <form onSubmit={handleCreateRubrique} className="mt-6 grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-12 md:col-span-5">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nom de la rubrique</label>
                    <Input
                      value={newRubrique.nom}
                      onChange={(e) => setNewRubrique((prev) => ({ ...prev, nom: e.target.value }))}
                      placeholder="Ex: Fox viande, Internet..."
                      required
                      className="rounded-xl border-slate-300 bg-white shadow-inner text-sm"
                    />
                  </div>
                  <div className="col-span-6 md:col-span-3">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Montant budgété</label>
                    <Input
                      type="number"
                      value={newRubrique.montantBudgete}
                      onChange={(e) =>
                        setNewRubrique((prev) => ({ ...prev, montantBudgete: e.target.value }))
                      }
                      placeholder="Ex: 80000"
                      required
                      className="rounded-xl border-slate-300 bg-white shadow-inner text-sm"
                    />
                  </div>
                  <div className="col-span-6 md:col-span-3">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                    <Select
                      value={newRubrique.typeDepense}
                      onValueChange={(value) =>
                        setNewRubrique((prev) => ({
                          ...prev,
                          typeDepense: value as 'progressive' | 'unique'
                        }))
                      }
                    >
                      <SelectTrigger className="rounded-xl border-slate-300 bg-white shadow-inner text-sm">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="progressive">Progressive</SelectItem>
                        <SelectItem value="unique">Unique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-12 md:col-span-1 flex flex-col items-end gap-2">
                    <Button
                      type="submit"
                      className="mt-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm text-sm font-semibold"
                    >
                      Ajouter une rubrique
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Modal simple pour ajouter un mouvement */}
            {selectedRubrique && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                  <h2 className="text-xl font-bold mb-4">Nouveau mouvement – {selectedRubrique.nom}</h2>
                  <form onSubmit={handleAddMouvement} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Montant</label>
                      <Input
                        type="number"
                        value={mouvementForm.montant}
                        onChange={(e) =>
                          setMouvementForm((prev) => ({ ...prev, montant: e.target.value }))
                        }
                        placeholder="Ex: 20000"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <Input
                        type="date"
                        value={mouvementForm.dateOperation}
                        onChange={(e) =>
                          setMouvementForm((prev) => ({ ...prev, dateOperation: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <Input
                        value={mouvementForm.description}
                        onChange={(e) =>
                          setMouvementForm((prev) => ({ ...prev, description: e.target.value }))
                        }
                        placeholder="Détail du mouvement (optionnel)"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedRubrique(null)}
                      >
                        Annuler
                      </Button>
                      <Button type="submit">Enregistrer</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal pour modifier une rubrique */}
            {editingRubrique && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                  <h2 className="text-xl font-bold mb-4">
                    Modifier la rubrique – {editingRubrique.nom}
                  </h2>
                  <form onSubmit={handleUpdateRubrique} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nom</label>
                      <Input
                        value={editRubriqueForm.nom}
                        onChange={(e) =>
                          setEditRubriqueForm((prev) => ({ ...prev, nom: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Montant budgété</label>
                      <Input
                        type="number"
                        value={editRubriqueForm.montantBudgete}
                        onChange={(e) =>
                          setEditRubriqueForm((prev) => ({
                            ...prev,
                            montantBudgete: e.target.value
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <Select
                        value={editRubriqueForm.typeDepense}
                        onValueChange={(value) =>
                          setEditRubriqueForm((prev) => ({
                            ...prev,
                            typeDepense: value as 'progressive' | 'unique'
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="progressive">Progressive</SelectItem>
                          <SelectItem value="unique">Unique</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingRubrique(null)}
                      >
                        Annuler
                      </Button>
                      <Button type="submit">Enregistrer</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal pour voir les mouvements d'une rubrique */}
            {rubriqueMouvementsRubrique && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">
                    Mouvements – {rubriqueMouvementsRubrique.nom}
                  </h2>
                  {loadingMouvementsRubrique ? (
                    <p className="text-sm text-slate-500">Chargement des mouvements...</p>
                  ) : rubriqueMouvements.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Aucun mouvement enregistré pour cette rubrique.
                    </p>
                  ) : (
                    <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-slate-700">
                          <tr>
                            <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide">
                              Date
                            </th>
                            <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wide">
                              Montant
                            </th>
                            <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide">
                              Description
                            </th>
                            <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wide">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {rubriqueMouvements.map((mvt) => (
                            <tr key={mvt.id} className="bg-white">
                              <td className="px-4 py-2 text-xs text-slate-700">
                                {new Date(mvt.dateOperation).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </td>
                              <td className="px-4 py-2 text-right font-semibold text-rose-600">
                                {formatCurrency(mvt.montant)}
                              </td>
                              <td className="px-4 py-2 text-xs text-slate-600">
                                {mvt.description || '—'}
                              </td>
                              <td className="px-4 py-2 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    className="text-xs"
                                    type="button"
                                    onClick={() => openEditMouvement(mvt)}
                                  >
                                    Modifier
                                  </Button>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    type="button"
                                    className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => handleDeleteMouvementRubrique(mvt)}
                                  >
                                    Supprimer
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setRubriqueMouvementsRubrique(null)
                        setRubriqueMouvements([])
                      }}
                    >
                      Fermer
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal pour modifier un mouvement d'une rubrique */}
            {mouvementEnEdition && rubriqueMouvementsRubrique && budgetMois && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                  <h2 className="text-xl font-bold mb-4">
                    Modifier le mouvement – {rubriqueMouvementsRubrique.nom}
                  </h2>
                  <form onSubmit={handleUpdateMouvementRubrique} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Montant</label>
                      <Input
                        type="number"
                        value={editMouvementForm.montant}
                        onChange={(e) =>
                          setEditMouvementForm((prev) => ({ ...prev, montant: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <Input
                        type="date"
                        value={editMouvementForm.dateOperation}
                        onChange={(e) =>
                          setEditMouvementForm((prev) => ({
                            ...prev,
                            dateOperation: e.target.value
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <Input
                        value={editMouvementForm.description}
                        onChange={(e) =>
                          setEditMouvementForm((prev) => ({
                            ...prev,
                            description: e.target.value
                          }))
                        }
                        placeholder="Détail du mouvement (optionnel)"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setMouvementEnEdition(null)}
                      >
                        Annuler
                      </Button>
                      <Button type="submit">Enregistrer</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}