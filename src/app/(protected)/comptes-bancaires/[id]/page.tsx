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
  FileTextIcon
} from 'lucide-react'
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
    getTransactionsByCompte
  } = useComptesBancaires()
  
  const [compte, setCompte] = useState<CompteBancaire | null>(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>('credit')

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

  const getTypeCompteColor = (type: string) => {
    switch (type) {
      case 'courant':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'epargne':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'entreprise':
        return 'bg-purple-100 text-purple-700 border-purple-300'
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </tr>
                </thead>
                <tbody>
                  {compteTransactions.map((transaction, index) => (
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
        onOpenChange={(open) => {
          setShowTransactionModal(open)
          if (!open) {
            refreshComptes()
            refreshTransactions(compteId)
          }
        }}
        compte={compte}
        type={transactionType}
      />
    </div>
  )
}

