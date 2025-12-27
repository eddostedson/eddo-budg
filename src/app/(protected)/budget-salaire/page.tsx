'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { BudgetSalaireMois, BudgetSalaireRubrique, BudgetSalaireMouvement } from '@/lib/shared-data'
import { BudgetSalaireService } from '@/lib/supabase/budget-salaire-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search as SearchIcon } from 'lucide-react'
import { useUltraModernToastContext } from '@/contexts/ultra-modern-toast-context'

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
  const { showSuccess, showError } = useUltraModernToastContext()

  const today = new Date()
  const [annee, setAnnee] = useState(today.getFullYear())
  const [mois, setMois] = useState(today.getMonth() + 1)

  const [loadingAuth, setLoadingAuth] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [budgetMois, setBudgetMois] = useState<BudgetSalaireMois | null>(null)
  const [rubriques, setRubriques] = useState<BudgetSalaireRubrique[]>([])
  const [mouvementsBudget, setMouvementsBudget] = useState<BudgetSalaireMouvement[]>([])
  const [previousRubriquesTemplate, setPreviousRubriquesTemplate] = useState<{
    budgetMoisId: string
    label: string
    annee: number
    mois: number
    rubriquesCount: number
  } | null>(null)
  const [autoCopyRubriques, setAutoCopyRubriques] = useState(true)
  const [copyingRubriques, setCopyingRubriques] = useState(false)
  const autoAdvanceRef = useRef<{ justJumped: boolean; totalJumps: number }>({ justJumped: false, totalJumps: 0 })

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

  // Recherche ultramoderne sur les rubriques (libellés + montants)
  const [rubriqueSearch, setRubriqueSearch] = useState('')
  // Pour éviter que la fenêtre auto ne se rouvre en boucle pour la même recherche
  const [autoOpenSearchKey, setAutoOpenSearchKey] = useState<string | null>(null)

  // Préparation de la recherche (texte ou montant exact)
  const trimmedRubriqueSearch = rubriqueSearch.trim()
  const hasRubriqueSearch = trimmedRubriqueSearch !== ''
  const rubriqueSearchLower = trimmedRubriqueSearch.toLowerCase()
  const rubriqueNumericSearchRaw = rubriqueSearchLower.replace(/\s/g, '')
  const isRubriqueNumericSearch =
    rubriqueNumericSearchRaw !== '' && /^[0-9]+$/.test(rubriqueNumericSearchRaw)
  const rubriqueNumericValue = isRubriqueNumericSearch
    ? parseInt(rubriqueNumericSearchRaw, 10)
    : null

  const rubriqueHasMovementDescriptionMatch = (rubriqueId: string) => {
    if (!hasRubriqueSearch || isRubriqueNumericSearch) return false

    return mouvementsBudget.some(
      (mvt) =>
        mvt.rubriqueId === rubriqueId &&
        (mvt.description || '').toLowerCase().includes(rubriqueSearchLower)
    )
  }

  // Fonction ultra-précise pour identifier TOUTES les raisons du match
  const getRubriqueMatchReasons = (rubrique: BudgetSalaireRubrique): string[] => {
    if (!hasRubriqueSearch) return []

    const reasons: string[] = []
    const resteRubrique = rubrique.montantBudgete - rubrique.montantDepense

    if (isRubriqueNumericSearch && rubriqueNumericValue !== null) {
      // Recherche numérique
      if (rubrique.montantBudgete === rubriqueNumericValue) {
        reasons.push('Budgeté')
      }
      if (rubrique.montantDepense === rubriqueNumericValue) {
        reasons.push('Dépensé')
      }
      if (resteRubrique === rubriqueNumericValue) {
        reasons.push('Reste')
      }
      const mouvementMatch = mouvementsBudget.find(
        (mvt) => mvt.rubriqueId === rubrique.id && mvt.montant === rubriqueNumericValue
      )
      if (mouvementMatch) {
        reasons.push('Mouvement')
      }
    } else {
      // Recherche textuelle
      if (rubrique.nom.toLowerCase().includes(rubriqueSearchLower)) {
        reasons.push('Nom')
      }
      const mouvementDescMatch = mouvementsBudget.find(
        (mvt) =>
          mvt.rubriqueId === rubrique.id &&
          (mvt.description || '').toLowerCase().includes(rubriqueSearchLower)
      )
      if (mouvementDescMatch) {
        reasons.push('Mouvement')
      }
    }

    return reasons
  }

  const filteredRubriques = rubriques.filter((rubrique) => {
    if (!hasRubriqueSearch) return true

    if (isRubriqueNumericSearch && rubriqueNumericValue !== null) {
      const resteRubriqueNumeric = rubrique.montantBudgete - rubrique.montantDepense
      const hasMovementWithAmount = mouvementsBudget.some(
        (mvt) => mvt.rubriqueId === rubrique.id && mvt.montant === rubriqueNumericValue
      )
      return (
        rubrique.montantBudgete === rubriqueNumericValue ||
        rubrique.montantDepense === rubriqueNumericValue ||
        resteRubriqueNumeric === rubriqueNumericValue ||
        hasMovementWithAmount
      )
    }

    const matchesNom = rubrique.nom.toLowerCase().includes(rubriqueSearchLower)
    const matchesMovementDescription = rubriqueHasMovementDescriptionMatch(rubrique.id)

    return matchesNom || matchesMovementDescription
  })

  const highlightRubriqueNom = (nom: string) => {
    if (!hasRubriqueSearch || isRubriqueNumericSearch) return nom

    const lower = nom.toLowerCase()
    const index = lower.indexOf(rubriqueSearchLower)
    if (index === -1) return nom

    const before = nom.slice(0, index)
    const match = nom.slice(index, index + trimmedRubriqueSearch.length)
    const after = nom.slice(index + trimmedRubriqueSearch.length)

    return (
      <>
        {before}
        <span className="bg-yellow-200 text-slate-900 rounded px-1">{match}</span>
        {after}
      </>
    )
  }

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

  interface LoadDataResult {
    budget: BudgetSalaireMois | null
    rubriques: BudgetSalaireRubrique[]
    previousTemplate: {
      budgetMoisId: string
      label: string
      annee: number
      mois: number
      rubriquesCount: number
    } | null
  }

  const loadData = async (forceRevenuCreation?: number): Promise<LoadDataResult> => {
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
        setPreviousRubriquesTemplate(null)
        setMouvementsBudget([])
        return { budget: null, rubriques: [], previousTemplate: null }
      }

      const rubs = await BudgetSalaireService.getRubriques(budget.id)
      const mouvementsBudgetData = await BudgetSalaireService.getMouvementsPourBudget(budget.id)

      // Recalculer les montants dépensés à partir des mouvements pour une cohérence totale
      const depenseParRubrique: Record<string, number> = {}
      let totalDepenseCalcule = 0

      mouvementsBudgetData.forEach((mvt) => {
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
      setMouvementsBudget(mouvementsBudgetData)
      let template: LoadDataResult['previousTemplate'] = null

      // Préparer un "template" (rubriques du mois précédent) uniquement si le mois courant est vide.
      if (rubs.length === 0) {
        const prevBudgetMonth = mois === 1 ? 12 : mois - 1
        const prevBudgetYear = mois === 1 ? annee - 1 : annee
        const prevBudgetLabel = `${MONTHS[prevBudgetMonth - 1]} ${prevBudgetYear}`

        const prevBudget = await BudgetSalaireService.getBudgetMois(prevBudgetYear, prevBudgetMonth)
        if (prevBudget) {
          const prevRubs = await BudgetSalaireService.getRubriques(prevBudget.id)
          if (prevRubs.length > 0) {
            template = {
              budgetMoisId: prevBudget.id,
              label: prevBudgetLabel,
              annee: prevBudgetYear,
              mois: prevBudgetMonth,
              rubriquesCount: prevRubs.length
            }
          }
        }
      }

      setPreviousRubriquesTemplate(template)

      return { budget: budgetCorrige, rubriques: rubriquesCorrigees, previousTemplate: template }
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [annee, mois])

  const totalBudgete = rubriques.reduce((sum, r) => sum + r.montantBudgete, 0)
  const totalDepense = budgetMois?.montantDepenseTotal ?? 0
  const disponiblePourBudget = (budgetMois?.revenuMensuel ?? 0) - totalBudgete
  const resteApresDepensesReelles = (budgetMois?.revenuMensuel ?? 0) - totalDepense
  const margeSurBudget = totalBudgete - totalDepense

  useEffect(() => {
    if (!budgetMois) return

    // Si on vient de sauter, on attend le prochain chargement
    if (autoAdvanceRef.current.justJumped) {
      autoAdvanceRef.current.justJumped = false
      return
    }

    // Si la marge est positive, on reset et on reste sur ce mois
    if (margeSurBudget > 0) {
      autoAdvanceRef.current.totalJumps = 0
      return
    }

    // Marge nulle ou négative + moins de 12 sauts → on avance au mois suivant
    if (autoAdvanceRef.current.totalJumps >= 12) {
      return
    }

    const nextMonthValue = mois === 12 ? 1 : mois + 1
    const nextYearValue = mois === 12 ? annee + 1 : annee

    autoAdvanceRef.current.justJumped = true
    autoAdvanceRef.current.totalJumps += 1

    setAnnee(nextYearValue)
    setMois(nextMonthValue)
  }, [budgetMois, margeSurBudget])

  const handleCreateBudgetMois = async (e: React.FormEvent) => {
    e.preventDefault()
    const revenu = parseFloat(revenuInput.replace(',', '.'))
    if (Number.isNaN(revenu) || revenu <= 0) {
      alert('Veuillez saisir un revenu valide pour le mois.')
      return
    }
    const result = await loadData(revenu)
    setRevenuInput('')

    if (
      autoCopyRubriques &&
      result?.budget &&
      result?.previousTemplate &&
      (result.rubriques?.length ?? 0) === 0
    ) {
      const confirmed = window.confirm(
        `Copier automatiquement les rubriques de ${result.previousTemplate.label} ?\n\n` +
          'Les montants budgétés seront identiques et les dépenses redémarreront à 0.'
      )
      if (confirmed) {
        await copyRubriquesFromTemplate(result.previousTemplate, result.budget)
      }
    }
  }

  // Mois précédent (pour afficher "Revenu du mois de {mois précédent} {année}")
  const previousMonthIndex = mois === 1 ? 11 : mois - 2
  const previousMonthYear = mois === 1 ? annee - 1 : annee
  const previousMonthLabel = MONTHS[previousMonthIndex]
  const currentMonthLabel = MONTHS[mois - 1]

  const parseYearMonthFromDateInput = (value: string): { year: number; month: number } | null => {
    // value attendu: YYYY-MM-DD
    const parts = value.split('-')
    if (parts.length < 2) return null
    const year = Number(parts[0])
    const month = Number(parts[1])
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null
    return { year, month }
  }

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

  const closeMouvementsModal = () => {
    setRubriqueMouvementsRubrique(null)
    setRubriqueMouvements([])
    // Marquer cette recherche comme déjà traitée pour ne pas rouvrir automatiquement
    if (hasRubriqueSearch) {
      setAutoOpenSearchKey(trimmedRubriqueSearch)
    }
  }

  // Ouvrir automatiquement la fenêtre des mouvements quand une seule rubrique correspond à la recherche
  useEffect(() => {
    if (!hasRubriqueSearch) {
      // Reset quand on efface la recherche
      if (autoOpenSearchKey !== null) {
        setAutoOpenSearchKey(null)
      }
      return
    }
    if (rubriqueMouvementsRubrique) return
    if (filteredRubriques.length !== 1) return
    // Ne pas rouvrir si on a déjà ouvert (ou fermé) pour cette recherche
    if (autoOpenSearchKey === trimmedRubriqueSearch) return

    const [uniqueRubrique] = filteredRubriques
    setAutoOpenSearchKey(trimmedRubriqueSearch)
    // Appel sans await pour ne pas bloquer le rendu
    void handleVoirMouvementsRubrique(uniqueRubrique)
  }, [hasRubriqueSearch, trimmedRubriqueSearch, filteredRubriques, rubriqueMouvementsRubrique, autoOpenSearchKey])

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

    const editYm = parseYearMonthFromDateInput(editMouvementForm.dateOperation)
    if (!editYm || editYm.year !== annee || editYm.month !== mois) {
      alert(
        `La date du mouvement (${editMouvementForm.dateOperation}) n'appartient pas à ${currentMonthLabel} ${annee}.\n\n` +
          `➡️ Astuce: change d'abord le mois/année en haut, puis modifie ce mouvement dans le bon budget.`
      )
      return
    }

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

  const copyRubriquesFromTemplate = async (
    template: NonNullable<LoadDataResult['previousTemplate']>,
    targetBudget: BudgetSalaireMois
  ) => {
    setCopyingRubriques(true)
    try {
      const result = await BudgetSalaireService.copyRubriquesFromBudget({
        fromBudgetMoisId: template.budgetMoisId,
        toBudgetMoisId: targetBudget.id
      })

      if (!result.success) {
        showError(
          'Erreur',
          "Impossible de copier les rubriques du mois précédent. Réessaie dans quelques secondes.",
          'delete'
        )
        return false
      }

      await loadData()

      if (result.insertedCount > 0) {
        showSuccess(
          '✅ Rubriques copiées',
          `${result.insertedCount} rubriques importées depuis ${template.label}. Dépensé réinitialisé à 0.`,
          'success'
        )
      } else {
        showSuccess(
          'ℹ️ Aucune rubrique copiée',
          "Le mois courant contient déjà des rubriques, ou il n'y avait rien à importer.",
          'edit'
        )
      }
      return result.insertedCount > 0
    } finally {
      setCopyingRubriques(false)
    }
  }

  const handleAddMouvement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!budgetMois || !selectedRubrique) return

    // ✅ Un mouvement est rattaché au budget du mois affiché via la rubrique (pas via la date).
    // On empêche les dates hors mois pour éviter de ranger des dépenses de Janvier dans Décembre.
    const ym = parseYearMonthFromDateInput(mouvementForm.dateOperation)
    if (!ym || ym.year !== annee || ym.month !== mois) {
      alert(
        `La date du mouvement (${mouvementForm.dateOperation}) n'appartient pas à ${currentMonthLabel} ${annee}.\n\n` +
          `➡️ Change le mois/année en haut (ex: Janvier 2026) puis ajoute le mouvement, ` +
          `pour que l'historique reste cohérent.`
      )
      return
    }

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

  const handleCopyRubriquesFromPreviousMonth = async () => {
    if (!budgetMois || !previousRubriquesTemplate) return
    if (rubriques.length > 0) return

    await copyRubriquesFromTemplate(previousRubriquesTemplate, budgetMois)
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
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md pb-5 mb-8 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Budget mensuel</p>
              <h1 className="mt-1 text-2xl md:text-3xl font-bold text-slate-900">Budget Salaire</h1>
              <p className="mt-1 text-sm text-slate-500 max-w-xl">
                Suivi premium de ton salaire et des dépenses par rubriques, indépendant des comptes bancaires.
              </p>
              {/* Ligne mois + recherche rubriques */}
              <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-xl">
                <Select value={String(mois)} onValueChange={(value) => setMois(parseInt(value, 10))}>
                  <SelectTrigger className="w-[120px] rounded-xl border-slate-300 bg-slate-50/80 shadow-inner text-sm">
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

                {/* Champ de recherche ultramoderne pour les rubriques */}
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="h-5 w-5 text-indigo-500" />
                  </span>
                  <Input
                    type="text"
                    value={rubriqueSearch}
                    onChange={(e) => setRubriqueSearch(e.target.value)}
                    placeholder="Rechercher une rubrique, montant ou mouvement..."
                    className="w-full min-w-[260px] pl-11 pr-24 py-3 rounded-2xl border-2 border-indigo-300 bg-white shadow-lg text-sm md:text-base placeholder:text-slate-400 focus-visible:ring-4 focus-visible:ring-indigo-300 focus-visible:ring-offset-0 focus-visible:border-indigo-500 transition-all duration-300 hover:shadow-xl"
                  />
                  {hasRubriqueSearch && (
                    <>
                      <button
                        type="button"
                        onClick={() => setRubriqueSearch('')}
                        className="absolute inset-y-0 right-12 flex items-center pr-2 text-slate-400 hover:text-slate-700 transition-colors"
                        title="Effacer la recherche"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <span className="absolute inset-y-0 right-2 flex items-center pr-2">
                        <span className="inline-flex items-center rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                          {filteredRubriques.length}
                        </span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                type="number"
                value={annee}
                onChange={(e) => setAnnee(parseInt(e.target.value, 10) || today.getFullYear())}
                className="w-[110px] rounded-xl border-slate-300 bg-slate-50/80 shadow-inner text-sm"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const prevMonth = mois === 1 ? 12 : mois - 1
                  const prevYear = mois === 1 ? annee - 1 : annee
                  setAnnee(prevYear)
                  setMois(prevMonth)
                }}
                className="rounded-xl px-4 py-2 text-sm font-semibold"
              >
                Mois précédent
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const nextMonth = mois === 12 ? 1 : mois + 1
                  const nextYear = mois === 12 ? annee + 1 : annee
                  setAnnee(nextYear)
                  setMois(nextMonth)
                }}
                className="rounded-xl px-4 py-2 text-sm font-semibold"
              >
                Mois suivant
              </Button>
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
                    <div className="mt-3 flex items-start gap-2 text-xs text-slate-600">
                      <input
                        id="autoCopyRubriques"
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 rounded border-slate-300"
                        checked={autoCopyRubriques}
                        onChange={(e) => setAutoCopyRubriques(e.target.checked)}
                      />
                      <label htmlFor="autoCopyRubriques" className="leading-5">
                        Copier automatiquement les rubriques du mois précédent après création
                        (confirmation demandée, dépensé remis à 0).
                      </label>
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
                  Salaire (payé fin {previousMonthLabel} {previousMonthYear})
                </p>
                <p className="mt-2 text-2xl md:text-3xl font-semibold text-slate-900">
                  {formatCurrency(budgetMois.revenuMensuel)}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Utilisé pour les dépenses de {currentMonthLabel} {annee}
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
              {margeSurBudget > 0 && (
                <div className="rounded-xl bg-emerald-100/80 px-5 py-4 shadow-md">
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
                    Marge sur le budget (plafonds - dépenses)
                  </p>
                  <p className="mt-2 text-2xl md:text-3xl font-semibold text-emerald-900">
                    {formatCurrency(margeSurBudget)}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-900/80">
                    Différence entre le total budgété et le total dépensé ce mois. Si ce montant devient
                    négatif, les plafonds sont dépassés.
                  </p>
                </div>
              )}
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
                {/* Panneau de résultats de recherche ultra moderne */}
                {hasRubriqueSearch && filteredRubriques.length > 0 && (
                  <div className="mb-4 rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-4 shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 rounded-full bg-indigo-600 p-2">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-indigo-900">
                          {filteredRubriques.length} résultat{filteredRubriques.length > 1 ? 's' : ''} trouvé{filteredRubriques.length > 1 ? 's' : ''} pour « {trimmedRubriqueSearch} »
                        </h3>
                        <p className="mt-1 text-xs text-slate-700">
                          {isRubriqueNumericSearch ? (
                            <>
                              Recherche numérique : <span className="font-semibold">{formatCurrency(rubriqueNumericValue ?? 0)}</span>
                              <br />
                              <span className="text-[11px] text-slate-600">
                                Critères : montant budgeté, dépensé, reste ou mouvement exact
                              </span>
                            </>
                          ) : (
                            <>
                              Recherche textuelle dans : <span className="font-semibold">noms de rubriques</span> et{' '}
                              <span className="font-semibold">descriptions de mouvements</span>
                            </>
                          )}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {Array.from(
                            new Set(
                              filteredRubriques.flatMap((r) => getRubriqueMatchReasons(r))
                            )
                          ).map((reason) => {
                            const count = filteredRubriques.filter((r) =>
                              getRubriqueMatchReasons(r).includes(reason)
                            ).length
                            return (
                              <span
                                key={reason}
                                className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm border border-indigo-200"
                              >
                                {reason} ({count})
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {hasRubriqueSearch && filteredRubriques.length === 0 && (
                  <div className="mb-4 rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 p-4 shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 rounded-full bg-rose-600 p-2">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-rose-900">
                          Aucun résultat trouvé
                        </h3>
                        <p className="mt-1 text-xs text-slate-700">
                          Aucune rubrique ou montant ne correspond à{' '}
                          <span className="font-semibold">« {trimmedRubriqueSearch} »</span>
                        </p>
                        <p className="mt-1 text-[11px] text-slate-600">
                          💡 Essayez : un nom de rubrique, un montant (ex: 50000), ou un mot-clé de mouvement
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Aide: copier les rubriques du mois précédent pour ne pas tout ressaisir */}
                {!hasRubriqueSearch && rubriques.length === 0 && budgetMois && previousRubriquesTemplate && (
                  <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-3">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="text-sm text-slate-800">
                        <p className="font-semibold">
                          Import rapide des rubriques
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Copier {previousRubriquesTemplate.rubriquesCount} rubriques depuis{' '}
                          <span className="font-semibold">{previousRubriquesTemplate.label}</span> : mêmes montants budgétés,
                          <span className="font-semibold"> dépensé = 0</span> pour ce mois.
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={handleCopyRubriquesFromPreviousMonth}
                        disabled={loadingData || copyingRubriques}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {copyingRubriques ? 'Copie...' : 'Copier les rubriques'}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60">
                  <div className="overflow-x-auto max-h-[calc(100vh-260px)] relative">
                    <table className="min-w-full text-sm">
                      <thead className="bg-white text-slate-700 sticky top-0 z-10">
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
                        {filteredRubriques.map((rubrique, index) => {
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

                          const hasMovementDescriptionMatch = rubriqueHasMovementDescriptionMatch(rubrique.id)
                          const matchReasons = getRubriqueMatchReasons(rubrique)

                          const highlightBudget =
                            isRubriqueNumericSearch &&
                            rubriqueNumericValue !== null &&
                            rubrique.montantBudgete === rubriqueNumericValue
                          const highlightDepense =
                            isRubriqueNumericSearch &&
                            rubriqueNumericValue !== null &&
                            rubrique.montantDepense === rubriqueNumericValue
                          const highlightReste =
                            isRubriqueNumericSearch &&
                            rubriqueNumericValue !== null &&
                            resteRubrique === rubriqueNumericValue

                          const reasonBadgeColors: Record<string, string> = {
                            Nom: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white',
                            Budgeté: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
                            Dépensé: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white',
                            Reste: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
                            Mouvement: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                          }

                          return (
                            <tr key={rubrique.id} className={`${rowBg} transition-colors`}>
                              <td className="px-5 py-4 align-top">
                                <div className="inline-flex items-start gap-2">
                                  <span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />
                                  <div className="flex-1">
                                    <span className="font-semibold text-slate-900">
                                      {highlightRubriqueNom(rubrique.nom)}
                                    </span>
                                    {hasRubriqueSearch && matchReasons.length > 0 && (
                                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                        {matchReasons.map((reason) => (
                                          <span
                                            key={reason}
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm ${
                                              reasonBadgeColors[reason] || 'bg-slate-500 text-white'
                                            }`}
                                          >
                                            <svg
                                              className="h-2.5 w-2.5"
                                              fill="currentColor"
                                              viewBox="0 0 20 20"
                                            >
                                              <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                              />
                                            </svg>
                                            {reason}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-right align-top font-semibold text-slate-900">
                                <span
                                  className={
                                    highlightBudget
                                      ? 'inline-block rounded px-1 bg-yellow-200 text-slate-900'
                                      : undefined
                                  }
                                >
                                  {formatCurrency(rubrique.montantBudgete)}
                                </span>
                              </td>
                              <td className={`px-5 py-4 text-right align-top font-semibold ${depenseClass}`}>
                                <div className="flex flex-col items-end gap-1">
                                  <span
                                    className={
                                      highlightDepense
                                        ? 'inline-block rounded px-1 bg-yellow-200 text-slate-900'
                                        : undefined
                                    }
                                  >
                                    {formatCurrency(rubrique.montantDepense)}
                                  </span>
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
                                  <span
                                    className={
                                      highlightReste
                                        ? 'inline-block rounded px-1 bg-yellow-200 text-slate-900'
                                        : undefined
                                    }
                                  >
                                    {formatCurrency(resteRubrique)}
                                  </span>
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

            {/* Modal pour voir les mouvements d'une rubrique (s'ouvre aussi auto après une recherche) */}
            {rubriqueMouvementsRubrique && (
              <div
                className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                onClick={closeMouvementsModal}
              >
                <div
                  className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6"
                  onClick={(e) => e.stopPropagation()}
                >
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
                          {rubriqueMouvements.map((mvt) => {
                            const desc = mvt.description || '—'
                            const lowerDesc = desc.toLowerCase()
                            const hasTextMatch =
                              hasRubriqueSearch &&
                              !isRubriqueNumericSearch &&
                              lowerDesc.includes(rubriqueSearchLower)

                            const highlightDescription = () => {
                              if (!hasTextMatch) return desc
                              const index = lowerDesc.indexOf(rubriqueSearchLower)
                              const before = desc.slice(0, index)
                              const match = desc.slice(
                                index,
                                index + trimmedRubriqueSearch.length
                              )
                              const after = desc.slice(index + trimmedRubriqueSearch.length)
                              return (
                                <>
                                  {before}
                                  <span className="bg-yellow-200 text-slate-900 rounded px-1">
                                    {match}
                                  </span>
                                  {after}
                                </>
                              )
                            }

                            return (
                              <tr
                                key={mvt.id}
                                className={
                                  hasTextMatch
                                    ? 'bg-yellow-50'
                                    : 'bg-white'
                                }
                              >
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
                                  {highlightDescription()}
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
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeMouvementsModal}
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