'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useComptesBancaires } from '@/contexts/compte-bancaire-context'
import { useReceipts } from '@/contexts/receipt-context'
import { CompteBancaire, TransactionBancaire, Receipt } from '@/lib/shared-data'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { 
  ArrowLeftIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  Building2Icon,
  CalendarIcon,
  FileTextIcon,
  TrashIcon,
  EyeIcon,
  PaperclipIcon,
  InfoIcon
} from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { TransactionFormDialog } from '@/components/transaction-form-dialog'
import { ReceiptUpload } from '@/components/receipt-upload'

export default function CompteBancaireDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const compteId = params.id as string
  const highlightTransactionId = searchParams.get('highlight')
  const transactionRefs = useRef<Record<string, HTMLTableRowElement | null>>({})
  const hasScrolledToHighlight = useRef(false)

  const { 
    comptes, 
    transactions, 
    loading, 
    refreshComptes, 
    refreshTransactions,
    getTransactionsByCompte,
    deleteTransaction,
    updateTransaction
  } = useComptesBancaires()

  const { receipts, updateReceipt } = useReceipts()
  
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>('credit')
  const [transactionToEdit, setTransactionToEdit] = useState<TransactionBancaire | null>(null)
  const [showFloatingButtons, setShowFloatingButtons] = useState(false)
  const [editForm, setEditForm] = useState({
    libelle: '',
    description: '',
    categorie: '',
    date: '',
    montant: '',
    receiptUrl: undefined as string | undefined,
    receiptFileName: undefined as string | undefined
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit'>('all')
  const [monthFilter, setMonthFilter] = useState<string>('all')
  const [receiptPreview, setReceiptPreview] = useState<{ url: string; fileName: string } | null>(null)
  const [activeHighlight, setActiveHighlight] = useState<string | null>(highlightTransactionId)

  // ✅ Toujours dériver le compte depuis le contexte pour rester synchronisé
  // (ex: après suppression d'un débit, `refreshComptes()` met à jour le solde)
  const compte: CompteBancaire | null = React.useMemo(
    () => comptes.find((c) => c.id === compteId) ?? null,
    [comptes, compteId]
  )

  // (debug log removed) – no side-effect needed here

  useEffect(() => {
    if (comptes.length === 0) return
    if (compte) return
    toast.error('Compte non trouvé')
    router.push('/comptes-bancaires')
  }, [comptes.length, compte, router])

  useEffect(() => {
    if (compteId) {
      refreshTransactions(compteId)
    }
  }, [compteId, refreshTransactions])

  // Détecter la position de scroll pour afficher/masquer les boutons flottants
  useEffect(() => {
    const handleScroll = () => {
      // Afficher les boutons flottants seulement si on a scrollé de plus de 200px
      const scrollY = window.scrollY || document.documentElement.scrollTop
      setShowFloatingButtons(scrollY > 200)
    }

    window.addEventListener('scroll', handleScroll)
    // Vérifier la position initiale
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const compteTransactions = getTransactionsByCompte(compteId)

  // Scroller automatiquement vers la transaction highlightée (UNE SEULE FOIS)
  useEffect(() => {
    if (!highlightTransactionId || hasScrolledToHighlight.current) {
      return
    }

    // Attendre un peu que le rendu soit terminé
    const timer = setTimeout(() => {
      const element = transactionRefs.current[highlightTransactionId]
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
        
        // Marquer comme scrollé pour éviter de répéter
        hasScrolledToHighlight.current = true
        
        // Retirer le surlignage visuel après 3 secondes
        setTimeout(() => {
          setActiveHighlight(null)
        }, 3000)
        
        // Nettoyer le paramètre URL après 3 secondes pour éviter le re-scroll lors du prochain visit
        setTimeout(() => {
          const url = new URL(window.location.href)
          url.searchParams.delete('highlight')
          window.history.replaceState({}, '', url.toString())
        }, 3000)
      }
    }, 500)

    return () => {
      clearTimeout(timer)
    }
  }, [highlightTransactionId])

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const numericSearchDigits = normalizedSearchTerm.replace(/[^\d]/g, '')
  const searchAmountGlobal = numericSearchDigits ? parseInt(numericSearchDigits, 10) : NaN
  const hasNumericSearchGlobal = !Number.isNaN(searchAmountGlobal)
  const isPureNumericSearch =
    normalizedSearchTerm.length > 0 &&
    /^[0-9\s.,]+$/.test(normalizedSearchTerm) &&
    hasNumericSearchGlobal

  const textContainsNumberEqual = React.useCallback(
    (text: string | null | undefined): boolean => {
      if (!hasNumericSearchGlobal || !text) return false
      const regex = /[0-9][0-9\s.,]*/g
      let match: RegExpExecArray | null
      const lower = text.toLowerCase()
      while ((match = regex.exec(lower)) !== null) {
        const digits = match[0].replace(/[^\d]/g, '')
        if (!digits) continue
        const value = parseInt(digits, 10)
        if (value === searchAmountGlobal) {
          return true
        }
      }
      return false
    },
    [hasNumericSearchGlobal, searchAmountGlobal]
  )

  const filteredTransactions = React.useMemo(() => {
    const term = normalizedSearchTerm

    return compteTransactions.filter((transaction) => {
      if (typeFilter !== 'all' && transaction.typeTransaction !== typeFilter) {
        return false
      }

      // 🎯 Filtre par mois (basé sur dateTransaction)
      if (monthFilter !== 'all') {
        const txMonth = new Date(transaction.dateTransaction).toISOString().slice(0, 7) // YYYY-MM
        if (txMonth !== monthFilter) {
          return false
        }
      }

      if (!term) {
        // Aucun terme de recherche: on applique seulement le filtre de type
        return true
      }

      // 1) Match texte "classique" uniquement si la recherche n'est pas purement numérique
      let textualMatch = false
      if (!isPureNumericSearch) {
        textualMatch =
          (transaction.libelle || '').toLowerCase().includes(term) ||
          (transaction.description || '').toLowerCase().includes(term) ||
          (transaction.categorie || '').toLowerCase().includes(term) ||
          (transaction.reference || '').toLowerCase().includes(term)
      }

      // 2) Match sur les nombres présents dans le texte (ex: "50 000" doit matcher 50000)
      const numericInTextMatch =
        hasNumericSearchGlobal &&
        (textContainsNumberEqual(transaction.libelle) ||
          textContainsNumberEqual(transaction.description) ||
          textContainsNumberEqual(transaction.categorie) ||
          textContainsNumberEqual(transaction.reference))

      // 3) Match sur le montant de la transaction
      let amountMatch = false
      if (hasNumericSearchGlobal) {
        const montantInt = Math.round(transaction.montant || 0)
        amountMatch = montantInt === searchAmountGlobal
      }

      return textualMatch || numericInTextMatch || amountMatch
    })
  }, [
    compteTransactions,
    normalizedSearchTerm,
    typeFilter,
    monthFilter,
    hasNumericSearchGlobal,
    searchAmountGlobal,
    isPureNumericSearch,
    textContainsNumberEqual
  ])

  const hasSearchTerm = normalizedSearchTerm.length > 0
  const hasSearchResults = hasSearchTerm && filteredTransactions.length > 0
  const hasSearchNoResults = hasSearchTerm && filteredTransactions.length === 0

  // 📅 Liste des mois disponibles pour le dropdown (à partir des transactions existantes)
  const availableMonths = React.useMemo(() => {
    const set = new Set<string>()
    compteTransactions.forEach((t) => {
      if (!t.dateTransaction) return
      const key = new Date(t.dateTransaction).toISOString().slice(0, 7) // YYYY-MM
      set.add(key)
    })
    return Array.from(set).sort().reverse()
  }, [compteTransactions])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const highlightText = (text: string | null | undefined) => {
    const value = text || ''
    if (!normalizedSearchTerm) return value

    // 🔢 Cas recherche purement numérique : on surligne uniquement les nombres
    // du texte qui correspondent EXACTEMENT à la valeur recherchée (ex: "50 000" pour 50000)
    if (isPureNumericSearch && hasNumericSearchGlobal) {
      const parts: React.ReactNode[] = []
      const lower = value.toLowerCase()
      const regex = /[0-9][0-9\s.,]*/g
      let lastIndex = 0
      let match: RegExpExecArray | null

      while ((match = regex.exec(lower)) !== null) {
        const start = match.index
        const end = regex.lastIndex
        const raw = value.slice(start, end)
        const digits = raw.replace(/[^\d]/g, '')
        const num = digits ? parseInt(digits, 10) : NaN

        if (start > lastIndex) {
          parts.push(value.slice(lastIndex, start))
        }

        if (!Number.isNaN(num) && num === searchAmountGlobal) {
          parts.push(
            <span
              key={`num-${start}`}
              className="bg-yellow-200 text-slate-900 rounded px-0.5"
            >
              {raw}
            </span>
          )
        } else {
          parts.push(raw)
        }

        lastIndex = end
      }

      if (lastIndex < value.length) {
        parts.push(value.slice(lastIndex))
      }

      return parts.length > 0 ? <>{parts}</> : value
    }

    // 📝 Cas recherche texte classique : on surligne la sous-chaîne recherchée
    const lower = value.toLowerCase()
    const index = lower.indexOf(normalizedSearchTerm)
    if (index === -1) return value

    return (
      <>
        {value.slice(0, index)}
        <span className="bg-yellow-200 text-slate-900 rounded px-0.5">
          {value.slice(index, index + normalizedSearchTerm.length)}
        </span>
        {value.slice(index + normalizedSearchTerm.length)}
      </>
    )
  }

  const handleCrediter = () => {
    setTransactionType('credit')
    setShowTransactionModal(true)
  }

  const handleDebiter = () => {
    setTransactionType('debit')
    setShowTransactionModal(true)
  }

  const openEditModal = (transaction: TransactionBancaire) => {
    setTransactionToEdit(transaction)
    setEditForm({
      libelle: transaction.libelle || '',
      description: transaction.description || '',
      categorie: transaction.categorie || '',
      montant: (transaction.montant ?? 0).toString(),
      date: transaction.dateTransaction
        ? new Date(transaction.dateTransaction).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      receiptUrl: transaction.receiptUrl,
      receiptFileName: transaction.receiptFileName
    })
  }

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transactionToEdit) return

    const normalizedMontant = editForm.montant.replace(/\s/g, '').replace(',', '.')
    const montantNumber = parseFloat(normalizedMontant)
    if (Number.isNaN(montantNumber) || montantNumber <= 0) {
      toast.error('Le montant doit être un nombre positif')
      return
    }

    const dateIso = editForm.date
      ? new Date(editForm.date).toISOString()
      : transactionToEdit.dateTransaction

    const success = await updateTransaction(transactionToEdit.id, {
      libelle: editForm.libelle,
      description: editForm.description,
      categorie: editForm.categorie,
      dateTransaction: dateIso,
      montant: montantNumber,
      receiptUrl: editForm.receiptUrl,
      receiptFileName: editForm.receiptFileName
    })

    if (success) {
      // 🔄 Si cette transaction est liée à un reçu (ex: Cité Kennedy), mettre aussi le reçu à jour
      if (transactionToEdit.typeTransaction === 'credit') {
        const linkedReceipt: Receipt | undefined = receipts.find(
          (r) => r.transactionId === transactionToEdit.id && r.compteId === transactionToEdit.compteId
        )

        if (linkedReceipt) {
          const receiptUpdates: Partial<Receipt> = {}

          if (linkedReceipt.libelle !== editForm.libelle) {
            receiptUpdates.libelle = editForm.libelle
          }
          if ((linkedReceipt.description || '') !== (editForm.description || '')) {
            receiptUpdates.description = editForm.description || undefined
          }
          if (linkedReceipt.montant !== montantNumber) {
            receiptUpdates.montant = montantNumber
          }
          if (linkedReceipt.dateTransaction !== dateIso) {
            receiptUpdates.dateTransaction = dateIso
          }

          if (Object.keys(receiptUpdates).length > 0) {
            const ok = await updateReceipt(linkedReceipt.id, receiptUpdates)
            if (!ok) {
              toast.warning("Le reçu lié à cette transaction n'a pas pu être mis à jour automatiquement.")
            }
          }
        }
      }

      setTransactionToEdit(null)
    }
  }

  const handleDeleteTransaction = async (transaction: TransactionBancaire) => {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer cette transaction de ${formatCurrency(transaction.montant)} ?\n` +
        `Type: ${transaction.typeTransaction === 'credit' ? 'Crédit' : 'Débit'} — ${transaction.libelle}`
    )
    if (!confirmed) return

    const success = await deleteTransaction(transaction.id)
    if (!success) {
      // Le contexte affiche déjà des toasts détaillés
      return
    }
  }

  const getTypeCompteColor = (type: string) => {
    switch (type) {
      case 'courant':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'epargne':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'entreprise':
        return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'operationnel':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getTypeCompteLabel = (type: string) => {
    switch (type) {
      case 'courant':
        return 'Courant'
      case 'epargne':
        return 'Épargne'
      case 'entreprise':
        return 'Entreprise'
      case 'operationnel':
        return 'Compte Opérationnel (Dépenses Courantes)'
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du compte...</p>
        </div>
      </div>
    )
  }

  if (!compte) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Compte non trouvé</p>
        <Button onClick={() => router.push('/comptes-bancaires')} className="mt-4">
          Retour aux comptes
        </Button>
      </div>
    )
  }

  // 📊 Totaux pour la période sélectionnée (monthFilter)
  const transactionsForTotals =
    monthFilter === 'all'
      ? compteTransactions
      : compteTransactions.filter((t) => {
          if (!t.dateTransaction) return false
          const key = new Date(t.dateTransaction).toISOString().slice(0, 7)
          return key === monthFilter
        })

  const totalCredits = transactionsForTotals
    .filter((t) => t.typeTransaction === 'credit')
    .reduce((sum, t) => sum + t.montant, 0)

  const totalDebits = transactionsForTotals
    .filter((t) => t.typeTransaction === 'debit')
    .reduce((sum, t) => sum + t.montant, 0)

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg px-4 py-6 md:px-8 md:py-8">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/comptes-bancaires')}
              className="rounded-xl border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Compte bancaire
              </p>
              <h1 className="mt-1 text-2xl md:text-3xl font-bold text-slate-900">{compte.nom}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {compte.banque || 'Banque non spécifiée'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleCrediter}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold shadow-sm"
            >
              <TrendingUpIcon className="h-4 w-4 mr-2" />
              Créditer
            </Button>
            <Button
              onClick={handleDebiter}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-sm font-semibold shadow-sm disabled:bg-rose-300"
              disabled={compte.soldeActuel === 0}
            >
              <TrendingDownIcon className="h-4 w-4 mr-2" />
              Débiter
            </Button>
          </div>
        </div>
        
        {/* Boutons flottants - Visibles seulement après avoir scrollé */}
        {showFloatingButtons && (
          <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Button
              onClick={handleCrediter}
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-6 text-sm font-semibold shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-110"
              size="lg"
            >
              <TrendingUpIcon className="h-5 w-5 mr-2" />
              Créditer
            </Button>
            <Button
              onClick={handleDebiter}
              className="rounded-full bg-rose-600 hover:bg-rose-700 text-white px-6 py-6 text-sm font-semibold shadow-2xl hover:shadow-rose-500/50 transition-all duration-300 hover:scale-110 disabled:bg-rose-300 disabled:hover:scale-100"
              disabled={compte.soldeActuel === 0}
              size="lg"
            >
              <TrendingDownIcon className="h-5 w-5 mr-2" />
              Débiter
            </Button>
          </div>
        )}

        {/* Cartes résumées - Sticky pour rester visibles lors du scroll */}
        <div className="sticky top-24 z-10 grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl bg-emerald-100 px-5 py-4 shadow-md">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Solde actuel
            </p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-2xl md:text-3xl font-semibold text-emerald-900">
                {formatCurrency(compte.soldeActuel)}
              </p>
              <Building2Icon className="h-10 w-10 text-emerald-500" />
            </div>
          </div>
          <div className="rounded-xl bg-blue-100 px-5 py-4 shadow-md">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
              Total crédits
            </p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-2xl md:text-3xl font-semibold text-blue-900">
                {formatCurrency(totalCredits)}
              </p>
              <TrendingUpIcon className="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <div className="rounded-xl bg-rose-100 px-5 py-4 shadow-md">
            <p className="text-xs font-medium uppercase tracking-wide text-rose-700">
              Total débits
            </p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-2xl md:text-3xl font-semibold text-rose-900">
                {formatCurrency(totalDebits)}
              </p>
              <TrendingDownIcon className="h-10 w-10 text-rose-600" />
            </div>
          </div>
        </div>

        {/* Détails du compte + recherche */}
        <Card className="mb-8 border-slate-200 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Informations du compte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 text-sm">
                <div>
                  <span className="text-xs font-medium text-slate-500">Type de compte</span>
                  <div className="mt-1">
                    <Badge className={`border ml-0 ${getTypeCompteColor(compte.typeCompte)}`}>
                      {getTypeCompteLabel(compte.typeCompte)}
                    </Badge>
                  </div>
                </div>
                {compte.numeroCompte && (
                  <div>
                    <span className="text-xs font-medium text-slate-500">Numéro de compte</span>
                    <p className="mt-1 font-medium text-slate-800">{compte.numeroCompte}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs font-medium text-slate-500">Solde initial</span>
                  <p className="mt-1 font-medium text-slate-800">
                    {formatCurrency(compte.soldeInitial)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500">Devise</span>
                  <p className="mt-1 font-medium text-slate-800">{compte.devise}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500">Date de création</span>
                  <p className="mt-1 font-medium text-slate-800">
                    {new Date(compte.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className="w-full md:w-96">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Recherche dans l&apos;historique
                </label>
                <div className="flex flex-col gap-3">
                  <Input
                    placeholder="Montant exact (ex: 5 000) ou libellé (ex: Push)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`rounded-xl border-slate-300 bg-white shadow-inner text-sm ${
                      hasSearchResults ? 'border-emerald-500 bg-emerald-50 focus-visible:ring-emerald-500' : ''
                    } ${
                      hasSearchNoResults ? 'border-rose-500 bg-rose-50 focus-visible:ring-rose-500' : ''
                    }`}
                    aria-invalid={hasSearchNoResults || undefined}
                  />
                  <div className="flex flex-wrap gap-2 items-center text-xs">
                    <span className="text-slate-500 font-medium mr-1">Type :</span>
                    <button
                      type="button"
                      onClick={() => setTypeFilter('all')}
                      className={`px-3 py-1 rounded-full border text-xs font-semibold ${
                        typeFilter === 'all'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Tous
                    </button>
                    <button
                      type="button"
                      onClick={() => setTypeFilter('credit')}
                      className={`px-3 py-1 rounded-full border text-xs font-semibold ${
                        typeFilter === 'credit'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      Crédits
                    </button>
                    <button
                      type="button"
                      onClick={() => setTypeFilter('debit')}
                      className={`px-3 py-1 rounded-full border text-xs font-semibold ${
                        typeFilter === 'debit'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
                      }`}
                    >
                      Débits
                    </button>
                  </div>

                  {/* 🎯 Nouveau : filtre par mois */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 font-medium">Mois :</span>
                    <Select
                      value={monthFilter}
                      onValueChange={(value) => setMonthFilter(value)}
                    >
                      <SelectTrigger className="h-8 w-40 rounded-full border-slate-300 bg-white text-xs">
                        <SelectValue placeholder="Tous les mois" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les mois</SelectItem>
                        {availableMonths.map((m) => {
                          const [year, month] = m.split('-')
                          const label = new Date(`${m}-01T00:00:00`).toLocaleDateString('fr-FR', {
                            month: 'long',
                            year: 'numeric'
                          })
                          return (
                            <SelectItem key={m} value={m}>
                              {label.charAt(0).toUpperCase() + label.slice(1)}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Résumé du total pour la période et le type sélectionnés */}
                  <p className="text-[11px] text-slate-500">
                    {monthFilter === 'all'
                      ? typeFilter === 'credit'
                        ? `Total crédits (toute la période) : ${formatCurrency(totalCredits)}`
                        : typeFilter === 'debit'
                          ? `Total débits (toute la période) : ${formatCurrency(totalDebits)}`
                          : `Total crédits : ${formatCurrency(totalCredits)} • Total débits : ${formatCurrency(totalDebits)}`
                      : (() => {
                          const label = new Date(`${monthFilter}-01T00:00:00`).toLocaleDateString('fr-FR', {
                            month: 'long',
                            year: 'numeric'
                          })
                          const moisLabel = label.charAt(0).toUpperCase() + label.slice(1)
                          if (typeFilter === 'credit') {
                            return `Total crédits pour ${moisLabel} : ${formatCurrency(totalCredits)}`
                          }
                          if (typeFilter === 'debit') {
                            return `Total débits pour ${moisLabel} : ${formatCurrency(totalDebits)}`
                          }
                          return `Total crédits pour ${moisLabel} : ${formatCurrency(totalCredits)} • Total débits : ${formatCurrency(totalDebits)}`
                        })()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historique des transactions */}
        <Card className="border-slate-200 shadow-none">
          <CardHeader className="px-0 pt-0 pb-4">
            <CardTitle className="text-base font-semibold text-slate-900">
              Historique des transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {compteTransactions.length === 0 ? (
              <div className="text-center py-12">
                <FileTextIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Aucune transaction</h3>
                <p className="text-slate-500 mb-6">
                  Aucune transaction enregistrée pour ce compte.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={handleCrediter}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold shadow-sm"
                  >
                    <TrendingUpIcon className="h-4 w-4 mr-2" />
                    Créditer le compte
                  </Button>
                  <Button
                    onClick={handleDebiter}
                    className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-sm font-semibold shadow-sm disabled:bg-rose-300"
                    disabled={compte.soldeActuel === 0}
                  >
                    <TrendingDownIcon className="h-4 w-4 mr-2" />
                    Débiter le compte
                  </Button>
                </div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-700 font-medium mb-1">
                  Aucune transaction ne correspond à ce filtre
                </p>
                <p className="text-slate-500 text-sm">
                  Modifie ta recherche (montant exact ou mot-clé dans le libellé).
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white text-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wide">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wide">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wide">
                          Libellé
                        </th>
                        <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wide">
                          Montant
                        </th>
                        <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wide">
                          Solde avant
                        </th>
                        <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wide">
                          Solde après
                        </th>
                        <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wide">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredTransactions.map((transaction, index) => {
                        const isHighlighted = activeHighlight === transaction.id
                        const rowBg = isHighlighted
                          ? 'bg-amber-100 hover:bg-amber-200 ring-2 ring-amber-400 ring-inset'
                          : index % 2 === 0
                            ? 'bg-white hover:bg-indigo-50/50'
                            : 'bg-slate-50 hover:bg-indigo-50/50'

                        return (
                          <motion.tr
                            key={transaction.id}
                            ref={(el) => {
                              transactionRefs.current[transaction.id] = el
                            }}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.04 * index }}
                            className={`${rowBg} transition-all duration-300`}
                          >
                            <td className="px-6 py-3 text-sm text-slate-700">
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-slate-400" />
                                {formatDate(transaction.dateTransaction)}
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <Badge
                                className={
                                  transaction.typeTransaction === 'credit'
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-100 text-rose-700 border border-rose-200'
                                }
                              >
                                {transaction.typeTransaction === 'credit' ? (
                                  <>
                                    <TrendingUpIcon className="h-3 w-3 mr-1" /> Crédit
                                  </>
                                ) : (
                                  <>
                                    <TrendingDownIcon className="h-3 w-3 mr-1" /> Débit
                                  </>
                                )}
                              </Badge>
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="font-medium text-slate-900">
                                  {highlightText(transaction.libelle)}
                                </div>
                                {transaction.categorie && (
                                  <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded whitespace-nowrap">
                                    {highlightText(transaction.categorie)}
                                  </span>
                                )}
                                {transaction.reference && (
                                  <span className="text-xs text-slate-400 whitespace-nowrap">
                                    Ref: {highlightText(transaction.reference)}
                                  </span>
                                )}
                                {/* Icône info avec tooltip pour la description */}
                                {transaction.description && (
                                  <div className="relative inline-block group">
                                    <button
                                      type="button"
                                      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
                                      title="Voir la description"
                                    >
                                      <InfoIcon className="h-3.5 w-3.5 text-blue-600" />
                                    </button>
                                    {/* Tooltip au survol - positionné à droite */}
                                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-[100] invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                      <div className="bg-slate-900 text-white text-xs rounded-lg shadow-2xl p-4 min-w-[300px] max-w-[400px] border border-slate-700">
                                        <div className="font-bold mb-2 text-yellow-300 text-sm">📝 Description</div>
                                        <div className="whitespace-pre-wrap leading-relaxed text-white font-semibold">
                                          {transaction.description}
                                        </div>
                                        {/* Flèche pointant vers la gauche */}
                                        <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-slate-900"></div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-3 text-right font-semibold">
                              <span
                                className={`${
                                  transaction.typeTransaction === 'credit'
                                    ? 'text-emerald-600'
                                    : 'text-rose-600'
                                } ${
                                  hasNumericSearchGlobal &&
                                  Math.round(transaction.montant || 0) === searchAmountGlobal
                                    ? 'bg-yellow-200 text-slate-900 rounded px-1'
                                    : ''
                                }`}
                              >
                                {transaction.typeTransaction === 'credit' ? '+' : '-'}
                                {formatCurrency(transaction.montant)}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-right text-sm text-slate-600">
                              {formatCurrency(transaction.soldeAvant)}
                            </td>
                            <td className="px-6 py-3 text-right text-sm font-semibold text-slate-800">
                              {formatCurrency(transaction.soldeApres)}
                            </td>
                            <td className="px-6 py-3 text-right">
                              <div className="flex justify-end gap-1.5">
                                {/* Bouton Voir le reçu pour les débits avec reçu */}
                                {transaction.typeTransaction === 'debit' && transaction.receiptUrl && (
                                  <Button
                                    size="sm"
                                    type="button"
                                    onClick={() => setReceiptPreview({ 
                                      url: transaction.receiptUrl!, 
                                      fileName: transaction.receiptFileName || 'Reçu' 
                                    })}
                                    className="px-2 py-1.5 rounded-md text-[11px] font-semibold shadow-sm bg-blue-500 hover:bg-blue-600 text-white"
                                    title="Voir le reçu"
                                  >
                                    <PaperclipIcon className="h-3.5 w-3.5 mr-0.5" />
                                    Reçu
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  type="button"
                                  onClick={() => openEditModal(transaction)}
                                  className="px-2 py-1.5 rounded-md text-[11px] font-semibold shadow-sm bg-orange-500 hover:bg-orange-600 text-white whitespace-nowrap"
                                >
                                  Modifier
                                </Button>
                                <Button
                                  size="sm"
                                  type="button"
                                  className="px-2 py-1.5 rounded-md text-[11px] font-semibold shadow-sm bg-red-600 hover:bg-red-700 text-white whitespace-nowrap"
                                  onClick={() => handleDeleteTransaction(transaction)}
                                >
                                  <TrashIcon className="h-3.5 w-3.5 mr-0.5" />
                                  Supprimer
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      {/* Modal de transaction */}
      <TransactionFormDialog
        open={showTransactionModal}
        onOpenChange={setShowTransactionModal}
        compte={compte}
        type={transactionType}
      />

      {/* Modal de prévisualisation du reçu */}
      {receiptPreview && (
        <Dialog open={!!receiptPreview} onOpenChange={(open) => !open && setReceiptPreview(null)}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PaperclipIcon className="h-5 w-5 text-blue-600" />
                {receiptPreview.fileName}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {receiptPreview.url.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={receiptPreview.url}
                  className="w-full h-[600px] border rounded-lg"
                  title={receiptPreview.fileName}
                />
              ) : (
                <img
                  src={receiptPreview.url}
                  alt={receiptPreview.fileName}
                  className="w-full h-auto rounded-lg border"
                />
              )}
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReceiptPreview(null)}
              >
                Fermer
              </Button>
              <Button
                type="button"
                onClick={() => window.open(receiptPreview.url, '_blank')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                Ouvrir dans un nouvel onglet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de modification de transaction (libellé / description / catégorie / date) */}
        {transactionToEdit && (
          <Dialog open={!!transactionToEdit} onOpenChange={(open) => !open && setTransactionToEdit(null)}>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Modifier la transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateTransaction} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="edit-libelle">
                    Libellé
                  </label>
                  <Input
                    id="edit-libelle"
                    value={editForm.libelle}
                    onChange={(e) => setEditForm({ ...editForm, libelle: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="edit-montant">
                    Montant
                  </label>
                  <Input
                    id="edit-montant"
                    type="number"
                    step="0.01"
                    value={editForm.montant}
                    onChange={(e) => setEditForm({ ...editForm, montant: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Type de transaction :{' '}
                    <span className="font-medium">
                      {transactionToEdit.typeTransaction === 'credit' ? 'Crédit (+)' : 'Débit (-)'}
                    </span>
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="edit-description">
                    Description
                  </label>
                  <Textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="edit-categorie">
                    Catégorie
                  </label>
                  <Input
                    id="edit-categorie"
                    value={editForm.categorie}
                    onChange={(e) => setEditForm({ ...editForm, categorie: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="edit-date">
                    Date
                  </label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    required
                  />
                </div>

                {/* 📎 Upload de reçu pour les débits */}
                {transactionToEdit.typeTransaction === 'debit' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Reçu (optionnel)
                    </Label>
                    <ReceiptUpload
                      onReceiptUploaded={(url, fileName) => {
                        setEditForm({ ...editForm, receiptUrl: url, receiptFileName: fileName })
                      }}
                      onReceiptRemoved={() => {
                        setEditForm({ ...editForm, receiptUrl: undefined, receiptFileName: undefined })
                      }}
                      currentReceiptUrl={editForm.receiptUrl}
                      currentFileName={editForm.receiptFileName}
                    />
                    <p className="text-xs text-gray-500">
                      Vous pouvez joindre ou modifier le reçu de cette dépense
                    </p>
                  </div>
                )}
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTransactionToEdit(null)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit">Enregistrer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}

