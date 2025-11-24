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
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/comptes-bancaires')}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{compte.nom}</h1>
            <p className="text-gray-600">{compte.banque || 'Banque non spécifiée'}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleCrediter}
            className="bg-green-600 hover:bg-green-700"
          >
            <TrendingUpIcon className="h-4 w-4 mr-2" />
            Créditer
          </Button>
          <Button
            onClick={handleDebiter}
            className="bg-red-600 hover:bg-red-700"
            disabled={compte.soldeActuel === 0}
          >
            <TrendingDownIcon className="h-4 w-4 mr-2" />
            Débiter
          </Button>
        </div>
      </div>

      {/* Informations du compte */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">Solde Actuel</p>
                <p className="text-3xl font-bold">{formatCurrency(compte.soldeActuel)}</p>
              </div>
              <Building2Icon className="h-12 w-12 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Total Crédits</p>
                <p className="text-3xl font-bold">{formatCurrency(totalCredits)}</p>
              </div>
              <TrendingUpIcon className="h-12 w-12 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm mb-1">Total Débits</p>
                <p className="text-3xl font-bold">{formatCurrency(totalDebits)}</p>
              </div>
              <TrendingDownIcon className="h-12 w-12 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Détails du compte */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Informations du Compte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              <div>
                <span className="text-sm text-gray-600">Type de compte:</span>
                <Badge className={`ml-2 ${getTypeCompteColor(compte.typeCompte)}`}>
                  {getTypeCompteLabel(compte.typeCompte)}
                </Badge>
              </div>
              {compte.numeroCompte && (
                <div>
                  <span className="text-sm text-gray-600">Numéro de compte:</span>
                  <span className="ml-2 font-medium">{compte.numeroCompte}</span>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-600">Solde initial:</span>
                <span className="ml-2 font-medium">{formatCurrency(compte.soldeInitial)}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Devise:</span>
                <span className="ml-2 font-medium">{compte.devise}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Date de création:</span>
                <span className="ml-2 font-medium">
                  {new Date(compte.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
            <div className="w-full md:w-80">
              <Input
                placeholder="Montant exact (ex: 5 000) ou libellé (ex: Push)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${hasSearchResults ? 'border-green-500 bg-green-50 focus-visible:ring-green-500' : ''} ${
                  hasSearchNoResults ? 'border-red-500 bg-red-50 focus-visible:ring-red-500' : ''
                }`}
                aria-invalid={hasSearchNoResults || undefined}
              />
              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                <span className="text-gray-600 font-medium mr-1">Type:</span>
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  className={`px-2 py-1 rounded-full border ${
                    typeFilter === 'all'
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Tous
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('credit')}
                  className={`px-2 py-1 rounded-full border ${
                    typeFilter === 'credit'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-green-700 border-green-300 hover:bg-green-50'
                  }`}
                >
                  Crédits
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('debit')}
                  className={`px-2 py-1 rounded-full border ${
                    typeFilter === 'debit'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-red-700 border-red-300 hover:bg-red-50'
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
      <Card>
        <CardHeader>
          <CardTitle>Historique des Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {compteTransactions.length === 0 ? (
            <div className="text-center py-12">
              <FileTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune transaction</h3>
              <p className="text-gray-500 mb-6">Aucune transaction enregistrée pour ce compte</p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleCrediter}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <TrendingUpIcon className="h-4 w-4 mr-2" />
                  Créditer le compte
                </Button>
                <Button
                  onClick={handleDebiter}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={compte.soldeActuel === 0}
                >
                  <TrendingDownIcon className="h-4 w-4 mr-2" />
                  Débiter le compte
                </Button>
              </div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 font-medium mb-1">Aucune transaction ne correspond à ce filtre</p>
              <p className="text-gray-500 text-sm">Modifiez votre recherche (montant exact ou mot-clé dans le libellé).</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Libellé</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Montant</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Solde Avant</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Solde Après</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction, index) => (
                    <motion.tr
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className={`border-b ${
                        transaction.typeTransaction === 'credit'
                          ? 'bg-green-50 hover:bg-green-100'
                          : 'bg-red-50 hover:bg-red-100'
                      }`}
                    >
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          {formatDate(transaction.dateTransaction)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            transaction.typeTransaction === 'credit'
                              ? 'bg-green-600 text-white'
                              : 'bg-red-600 text-white'
                          }
                        >
                          {transaction.typeTransaction === 'credit' ? (
                            <><TrendingUpIcon className="h-3 w-3 mr-1" /> Crédit</>
                          ) : (
                            <><TrendingDownIcon className="h-3 w-3 mr-1" /> Débit</>
                          )}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-800">{transaction.libelle}</div>
                          {transaction.description && (
                            <div className="text-xs text-gray-500 mt-1">{transaction.description}</div>
                          )}
                          {transaction.categorie && (
                            <div className="text-xs text-blue-600 mt-1 font-medium">
                              {transaction.categorie}
                            </div>
                          )}
                          {transaction.reference && (
                            <div className="text-xs text-gray-400 mt-1">Ref: {transaction.reference}</div>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${
                        transaction.typeTransaction === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.typeTransaction === 'credit' ? '+' : '-'}
                        {formatCurrency(transaction.montant)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {formatCurrency(transaction.soldeAvant)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-gray-800">
                        {formatCurrency(transaction.soldeApres)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(transaction)}
                          >
                            Modifier
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteTransaction(transaction)}
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
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
  )
}

