'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useComptesBancaires } from '@/contexts/compte-bancaire-context'
import { CompteBancaire, TransactionBancaire } from '@/lib/shared-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'
import { 
  ArrowLeftIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  Building2Icon,
  CalendarIcon,
  FileTextIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
  PrinterIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { TransactionFormDialog } from '@/components/transaction-form-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

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
    updateTransaction,
    deleteTransaction
  } = useComptesBancaires()
  
  const [compte, setCompte] = useState<CompteBancaire | null>(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>('credit')
  const [editingTransaction, setEditingTransaction] = useState<TransactionBancaire | null>(null)
  const [searchFilter, setSearchFilter] = useState('')
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait')

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

  // Filtrer les transactions par montant et libellé
  const filteredTransactions = compteTransactions.filter(transaction => {
    if (!searchFilter) return true
    
    // Normaliser la recherche : enlever les espaces multiples et convertir en minuscules
    const searchNormalized = searchFilter.toLowerCase().trim().replace(/\s+/g, ' ')
    
    // Normaliser le libellé pour la recherche (enlever les espaces multiples)
    const libelleStr = (transaction.libelle || '').toLowerCase().replace(/\s+/g, ' ')
    const matchesLibelle = libelleStr.includes(searchNormalized)
    
    // Recherche dans la description si elle existe
    const descriptionStr = (transaction.description || '').toLowerCase().replace(/\s+/g, ' ')
    const matchesDescription = descriptionStr.includes(searchNormalized)
    
    // Recherche dans la catégorie si elle existe
    const categorieStr = (transaction.categorie || '').toLowerCase().replace(/\s+/g, ' ')
    const matchesCategorie = categorieStr.includes(searchNormalized)
    
    // Recherche exacte dans le montant (seulement si la recherche ressemble à un nombre)
    const isNumericSearch = /^[\d\s.,]+$/.test(searchFilter.trim())
    let matchesMontant = false
    
    if (isNumericSearch) {
      // Normaliser la recherche en enlevant tous les séparateurs (espaces, points, virgules)
      const searchNormalise = searchNormalized
        .replace(/f cfa/gi, '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(/,/g, '')
        .trim()
      
      if (searchNormalise) {
        // Convertir le montant en string et comparer exactement
        const montantStr = Math.round(transaction.montant).toString()
        
        // Comparaison exacte : la recherche normalisée doit correspondre exactement au montant
        matchesMontant = montantStr === searchNormalise
      }
    }
    
    // Retourner true si au moins un critère correspond
    return matchesLibelle || matchesDescription || matchesCategorie || matchesMontant
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Fonction pour surligner le texte correspondant à la recherche
  const highlightText = (text: string, search: string) => {
    if (!search || !text) return text
    
    const searchNormalized = search.trim().replace(/\s+/g, ' ')
    const textNormalized = text.replace(/\s+/g, ' ')
    
    // Créer une regex insensible à la casse pour trouver toutes les occurrences
    const regex = new RegExp(`(${searchNormalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = textNormalized.split(regex)
    
    return (
      <>
        {parts.map((part, index) => {
          // Vérifier si cette partie correspond à la recherche (insensible à la casse)
          if (part.toLowerCase() === searchNormalized.toLowerCase()) {
            return (
              <mark key={index} className="bg-yellow-300 text-gray-900 font-semibold px-1 rounded">
                {part}
              </mark>
            )
          }
          return <span key={index}>{part}</span>
        })}
      </>
    )
  }

  // Fonction pour surligner le montant si la recherche correspond
  const highlightAmount = (amount: number, search: string) => {
    if (!search) {
      return formatCurrency(amount)
    }
    
    const isNumericSearch = /^[\d\s.,]+$/.test(search.trim())
    if (!isNumericSearch) {
      return formatCurrency(amount)
    }
    
    // Normaliser la recherche
    const searchNormalise = search
      .toLowerCase()
      .replace(/f cfa/gi, '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(/,/g, '')
      .trim()
    
    if (!searchNormalise) {
      return formatCurrency(amount)
    }
    
    const montantStr = Math.round(amount).toString()
    const matches = montantStr === searchNormalise
    
    if (matches) {
      const formatted = formatCurrency(amount)
      // Le montant formaté contient des espaces comme séparateurs de milliers
      // On doit surligner la partie numérique correspondante
      // Exemple: "2 000 F CFA" pour 2000
      
      // Créer une regex pour trouver le nombre dans le texte formaté (en ignorant les espaces)
      const numberInFormatted = formatted.match(/[\d\s]+/)?.[0] || ''
      const numberWithoutSpaces = numberInFormatted.replace(/\s/g, '')
      
      if (numberWithoutSpaces === montantStr) {
        // Surligner le nombre dans le texte formaté
        const parts = formatted.split(/([\d\s]+)/)
        
        return (
          <>
            {parts.map((part, index) => {
              const partWithoutSpaces = part.replace(/\s/g, '')
              if (partWithoutSpaces === montantStr && /[\d\s]+/.test(part)) {
                return (
                  <mark key={index} className="bg-yellow-300 text-gray-900 font-semibold px-1 rounded">
                    {part}
                  </mark>
                )
              }
              return <span key={index}>{part}</span>
            })}
          </>
        )
      }
    }
    
    return formatCurrency(amount)
  }

  const handleCrediter = () => {
    setTransactionType('credit')
    setEditingTransaction(null)
    setShowTransactionModal(true)
  }

  const handleDebiter = () => {
    setTransactionType('debit')
    setEditingTransaction(null)
    setShowTransactionModal(true)
  }

  const handleEditTransaction = (transaction: TransactionBancaire) => {
    setEditingTransaction(transaction)
    setTransactionType(transaction.typeTransaction)
    setShowTransactionModal(true)
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action est irréversible.')) {
      await deleteTransaction(transactionId)
      refreshComptes()
      refreshTransactions(compteId)
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

  // Calculer les totaux pour toutes les transactions
  const totalCreditsAll = compteTransactions
    .filter(t => t.typeTransaction === 'credit')
    .reduce((sum, t) => sum + t.montant, 0)
  
  const totalDebitsAll = compteTransactions
    .filter(t => t.typeTransaction === 'debit')
    .reduce((sum, t) => sum + t.montant, 0)

  // Calculer les totaux pour les transactions filtrées (si recherche active)
  const totalCreditsFiltered = filteredTransactions
    .filter(t => t.typeTransaction === 'credit')
    .reduce((sum, t) => sum + t.montant, 0)
  
  const totalDebitsFiltered = filteredTransactions
    .filter(t => t.typeTransaction === 'debit')
    .reduce((sum, t) => sum + t.montant, 0)

  // Utiliser les totaux filtrés si une recherche est active, sinon tous les totaux
  const totalCredits = searchFilter ? totalCreditsFiltered : totalCreditsAll
  const totalDebits = searchFilter ? totalDebitsFiltered : totalDebitsAll
  const soldeDisponible = totalCredits - totalDebits

  const handlePrint = (orientation: 'portrait' | 'landscape' = 'portrait') => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relevé de Compte - ${compte?.nom}</title>
          <style>
            @page {
              size: A4 ${orientation === 'landscape' ? 'landscape' : 'portrait'};
              margin: 20mm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #000;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .account-info {
              margin-bottom: 30px;
            }
            .account-info table {
              width: 100%;
              border-collapse: collapse;
            }
            .account-info td {
              padding: 8px;
              border-bottom: 1px solid #ddd;
            }
            .account-info td:first-child {
              font-weight: bold;
              width: 200px;
            }
            .transactions-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .transactions-table th,
            .transactions-table td {
              padding: 10px;
              text-align: left;
              border: 1px solid #ddd;
            }
            .transactions-table th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .transactions-table .credit {
              color: green;
            }
            .transactions-table .debit {
              color: red;
            }
            .summary {
              margin-top: 30px;
              padding: 20px;
              background-color: #f9f9f9;
              border: 1px solid #ddd;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Relevé de Compte</h1>
            <p><strong>${compte?.nom}</strong></p>
            <p>${compte?.banque || 'Banque non spécifiée'}</p>
          </div>
          
          <div class="account-info">
            <table>
              <tr>
                <td>Type de compte:</td>
                <td>${getTypeCompteLabel(compte?.typeCompte || '')}</td>
              </tr>
              <tr>
                <td>Numéro de compte:</td>
                <td>${compte?.numeroCompte || 'N/A'}</td>
              </tr>
              <tr>
                <td>Solde initial:</td>
                <td>${formatCurrency(compte?.soldeInitial || 0)}</td>
              </tr>
              <tr>
                <td>Solde actuel:</td>
                <td><strong>${formatCurrency(compte?.soldeActuel || 0)}</strong></td>
              </tr>
              <tr>
                <td>Date d'impression:</td>
                <td>${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
            </table>
          </div>
          
          <h2>Historique des Transactions</h2>
          <table class="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Libellé</th>
                <th style="text-align: right;">Montant</th>
                <th style="text-align: right;">Solde Avant</th>
                <th style="text-align: right;">Solde Après</th>
              </tr>
            </thead>
            <tbody>
              ${compteTransactions.map(transaction => `
                <tr>
                  <td>${formatDate(transaction.dateTransaction)}</td>
                  <td>${transaction.typeTransaction === 'credit' ? 'Crédit' : 'Débit'}</td>
                  <td>${transaction.libelle || ''}${transaction.categorie ? ' - ' + transaction.categorie : ''}${transaction.reference ? ' (Ref: ' + transaction.reference + ')' : ''}</td>
                  <td style="text-align: right;" class="${transaction.typeTransaction === 'credit' ? 'credit' : 'debit'}">
                    ${transaction.typeTransaction === 'credit' ? '+' : '-'}${formatCurrency(transaction.montant)}
                  </td>
                  <td style="text-align: right;">${formatCurrency(transaction.soldeAvant)}</td>
                  <td style="text-align: right;"><strong>${formatCurrency(transaction.soldeApres)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <div class="summary-row">
              <strong>Total Crédits:</strong>
              <strong>${formatCurrency(totalCredits)}</strong>
            </div>
            <div class="summary-row">
              <strong>Total Débits:</strong>
              <strong>${formatCurrency(totalDebits)}</strong>
            </div>
            <div class="summary-row" style="border-top: 2px solid #000; margin-top: 10px; padding-top: 10px;">
              <strong>Solde Actuel:</strong>
              <strong>${formatCurrency(compte?.soldeActuel || 0)}</strong>
            </div>
          </div>
          
          <div class="footer">
            <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          </div>
        </body>
      </html>
    `
    
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

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
                <p className="text-green-100 text-sm mb-1">
                  {searchFilter ? 'Solde Disponible (Filtré)' : 'Solde Actuel'}
                </p>
                <p className="text-3xl font-bold">
                  {searchFilter ? formatCurrency(soldeDisponible) : formatCurrency(compte.soldeActuel)}
                </p>
                {searchFilter && (
                  <p className="text-green-200 text-xs mt-1">
                    {filteredTransactions.length} transaction(s) trouvée(s)
                  </p>
                )}
              </div>
              <Building2Icon className="h-12 w-12 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">
                  {searchFilter ? 'Total Crédits (Filtré)' : 'Total Crédits'}
                </p>
                <p className="text-3xl font-bold">{formatCurrency(totalCredits)}</p>
                {searchFilter && (
                  <p className="text-blue-200 text-xs mt-1">
                    Sur {compteTransactions.filter(t => t.typeTransaction === 'credit').length} crédit(s)
                  </p>
                )}
              </div>
              <TrendingUpIcon className="h-12 w-12 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm mb-1">
                  {searchFilter ? 'Total Débits (Filtré)' : 'Total Débits'}
                </p>
                <p className="text-3xl font-bold">{formatCurrency(totalDebits)}</p>
                {searchFilter && (
                  <p className="text-red-200 text-xs mt-1">
                    Sur {compteTransactions.filter(t => t.typeTransaction === 'debit').length} débit(s)
                  </p>
                )}
              </div>
              <TrendingDownIcon className="h-12 w-12 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Champ de recherche pour filtrer les transactions */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher par montant ou libellé..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-10 text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Historique des transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Historique des Transactions</CardTitle>
            {compteTransactions.length > 0 && (
              <Button
                onClick={() => setShowPrintDialog(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <PrinterIcon className="h-4 w-4" />
                Imprimer
              </Button>
            )}
          </div>
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
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
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
                          <div className="font-medium text-gray-800">
                            {searchFilter ? highlightText(transaction.libelle || '', searchFilter) : transaction.libelle}
                          </div>
                          {transaction.description && (
                            <div className="text-xs text-gray-500 mt-1">
                              {searchFilter ? highlightText(transaction.description, searchFilter) : transaction.description}
                            </div>
                          )}
                          {transaction.categorie && (
                            <div className="text-xs text-blue-600 mt-1 font-medium">
                              {searchFilter ? highlightText(transaction.categorie, searchFilter) : transaction.categorie}
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
                        {searchFilter ? highlightAmount(transaction.montant, searchFilter) : formatCurrency(transaction.montant)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {formatCurrency(transaction.soldeAvant)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-gray-800">
                        {formatCurrency(transaction.soldeApres)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTransaction(transaction)}
                            className="h-8 px-3"
                          >
                            <EditIcon className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="h-8 px-3"
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
        onOpenChange={(open) => {
          setShowTransactionModal(open)
          if (!open) {
            setEditingTransaction(null)
            refreshComptes()
            refreshTransactions(compteId)
          }
        }}
        compte={compte}
        type={transactionType}
        transactionToEdit={editingTransaction}
      />

      {/* Dialogue de sélection d'orientation pour l'impression */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Options d'impression</DialogTitle>
            <DialogDescription>
              Choisissez l'orientation du document à imprimer
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-base font-medium mb-4 block">Orientation</Label>
            <div className="flex gap-4">
              <Button
                variant={printOrientation === 'portrait' ? 'default' : 'outline'}
                onClick={() => setPrintOrientation('portrait')}
                className="flex-1"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-12 border-2 border-current rounded"></div>
                  <span>Portrait</span>
                </div>
              </Button>
              <Button
                variant={printOrientation === 'landscape' ? 'default' : 'outline'}
                onClick={() => setPrintOrientation('landscape')}
                className="flex-1"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-8 border-2 border-current rounded"></div>
                  <span>Paysage</span>
                </div>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPrintDialog(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                handlePrint(printOrientation)
                setShowPrintDialog(false)
              }}
            >
              <PrinterIcon className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

