'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useComptesBancaires } from '@/contexts/compte-bancaire-context'
import { CompteBancaire, TransactionBancaire } from '@/lib/shared-data'
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
  TrashIcon
} from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { TransactionFormDialog } from '@/components/transaction-form-dialog'

export default function CompteBancaireDetailPage() {
  const params = useParams()
  const router = useRouter()
  const compteId = params.id as string
  
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
  
  const [compte, setCompte] = useState<CompteBancaire | null>(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>('credit')
  const [transactionToEdit, setTransactionToEdit] = useState<TransactionBancaire | null>(null)
  const [editForm, setEditForm] = useState({
    libelle: '',
    description: '',
    categorie: '',
    date: '',
    montant: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit'>('all')

  useEffect(() => {
    if (comptes.length > 0) {
      const foundCompte = comptes.find(c => c.id === compteId)
      if (foundCompte) {
        setCompte(foundCompte)
      } else {
        toast.error('Compte non trouvé')
        router.push('/comptes-bancaires')
      }
    }
  }, [comptes, compteId, router])

  useEffect(() => {
    if (compteId) {
      refreshTransactions(compteId)
    }
  }, [compteId, refreshTransactions])

  const compteTransactions = getTransactionsByCompte(compteId)

  const filteredTransactions = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const numericDigits = term.replace(/[^\d]/g, '')
    const searchAmount = numericDigits ? parseInt(numericDigits, 10) : NaN
    const hasNumericSearch = !Number.isNaN(searchAmount)

    return compteTransactions.filter((transaction) => {
      if (typeFilter !== 'all' && transaction.typeTransaction !== typeFilter) {
        return false
      }

      if (!term) {
        // Aucun terme de recherche: on applique seulement le filtre de type
        return true
      }

      const libelleMatch =
        (transaction.libelle || '').toLowerCase().includes(term) ||
        (transaction.description || '').toLowerCase().includes(term) ||
        (transaction.categorie || '').toLowerCase().includes(term) ||
        (transaction.reference || '').toLowerCase().includes(term)

      let amountMatch = false
      if (hasNumericSearch) {
        const montantInt = Math.round(transaction.montant || 0)
        amountMatch = montantInt === searchAmount
      }

      return libelleMatch || amountMatch
    })
  }, [compteTransactions, searchTerm, typeFilter])

  const hasSearchTerm = searchTerm.trim().length > 0
  const hasSearchResults = hasSearchTerm && filteredTransactions.length > 0
  const hasSearchNoResults = hasSearchTerm && filteredTransactions.length === 0

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
        : new Date().toISOString().split('T')[0]
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
      montant: montantNumber
    })

    if (success) {
      setTransactionToEdit(null)
      await refreshTransactions(compteId)
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

  const totalCredits = compteTransactions
    .filter(t => t.typeTransaction === 'credit')
    .reduce((sum, t) => sum + t.montant, 0)
  
  const totalDebits = compteTransactions
    .filter(t => t.typeTransaction === 'debit')
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

        {/* Cartes résumées */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
              <div className="w-full md:w-80">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Recherche dans l&apos;historique
                </label>
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
                <div className="flex flex-wrap gap-2 mt-3 text-xs items-center">
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
                        const rowBg =
                          index % 2 === 0
                            ? 'bg-white hover:bg-indigo-50/50'
                            : 'bg-slate-50 hover:bg-indigo-50/50'

                        return (
                          <motion.tr
                            key={transaction.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.04 * index }}
                            className={`${rowBg} transition-colors`}
                          >
                            <td className="px-6 py-4 text-sm text-slate-700">
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-slate-400" />
                                {formatDate(transaction.dateTransaction)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
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
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-medium text-slate-900">
                                  {transaction.libelle}
                                </div>
                                {transaction.description && (
                                  <div className="text-xs text-slate-500 mt-1">
                                    {transaction.description}
                                  </div>
                                )}
                                {transaction.categorie && (
                                  <div className="text-xs text-indigo-600 mt-1 font-medium">
                                    {transaction.categorie}
                                  </div>
                                )}
                                {transaction.reference && (
                                  <div className="text-xs text-slate-400 mt-1">
                                    Ref: {transaction.reference}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td
                              className={`px-6 py-4 text-right font-semibold ${
                                transaction.typeTransaction === 'credit'
                                  ? 'text-emerald-600'
                                  : 'text-rose-600'
                              }`}
                            >
                              {transaction.typeTransaction === 'credit' ? '+' : '-'}
                              {formatCurrency(transaction.montant)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-slate-600">
                              {formatCurrency(transaction.soldeAvant)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-semibold text-slate-800">
                              {formatCurrency(transaction.soldeApres)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  type="button"
                                  onClick={() => openEditModal(transaction)}
                                  className="px-3 py-2 rounded-lg text-xs font-semibold shadow-sm bg-orange-500 hover:bg-orange-600 text-white"
                                >
                                  Modifier
                                </Button>
                                <Button
                                  size="sm"
                                  type="button"
                                  className="px-3 py-2 rounded-lg text-xs font-semibold shadow-sm bg-red-600 hover:bg-red-700 text-white"
                                  onClick={() => handleDeleteTransaction(transaction)}
                                >
                                  <TrashIcon className="h-4 w-4 mr-1" />
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

