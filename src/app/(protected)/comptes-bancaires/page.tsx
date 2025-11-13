'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useComptesBancaires } from '@/contexts/compte-bancaire-context'
import { CompteBancaire } from '@/lib/shared-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { 
  Building2Icon, 
  PlusIcon, 
  ArrowRightIcon, 
  TrendingUpIcon, 
  TrendingDownIcon,
  WalletIcon,
  DatabaseIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { CompteFormDialog } from '@/components/compte-form-dialog'
import { TransactionFormDialog } from '@/components/transaction-form-dialog'

export default function ComptesBancairesPage() {
  const router = useRouter()
  const { 
    comptes, 
    loading, 
    refreshComptes, 
    getTotalSoldes,
    initializeDefaultComptes,
    deleteCompte
  } = useComptesBancaires()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [selectedCompte, setSelectedCompte] = useState<CompteBancaire | null>(null)
  const [compteToEdit, setCompteToEdit] = useState<CompteBancaire | null>(null)
  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>('credit')

  const totalSoldes = getTotalSoldes()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleViewCompte = (compte: CompteBancaire) => {
    router.push(`/comptes-bancaires/${compte.id}`)
  }

  const handleEditCompte = (compte: CompteBancaire) => {
    setCompteToEdit(compte)
    setShowEditModal(true)
  }

  const handleDeleteCompte = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) {
      const success = await deleteCompte(id)
      if (success) {
        await refreshComptes()
      }
    }
  }

  const handleCrediter = (compte: CompteBancaire) => {
    setSelectedCompte(compte)
    setTransactionType('credit')
    setShowTransactionModal(true)
  }

  const handleDebiter = (compte: CompteBancaire) => {
    setSelectedCompte(compte)
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
          <p className="mt-4 text-gray-600">Chargement des comptes bancaires...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🏦 Comptes Bancaires</h1>
          <p className="text-gray-600">Gérez vos comptes bancaires et transactions</p>
        </div>
        <div className="flex gap-3">
          {comptes.length === 0 && (
            <Button
              onClick={initializeDefaultComptes}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <DatabaseIcon className="h-4 w-4 mr-2" />
              Initialiser 3 Comptes
            </Button>
          )}
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nouveau Compte
          </Button>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Total des Soldes</p>
                <p className="text-3xl font-bold">{formatCurrency(totalSoldes)}</p>
              </div>
              <WalletIcon className="h-12 w-12 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">Nombre de Comptes</p>
                <p className="text-3xl font-bold">{comptes.length}</p>
              </div>
              <Building2Icon className="h-12 w-12 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-1">Comptes Actifs</p>
                <p className="text-3xl font-bold">{comptes.filter(c => c.actif).length}</p>
              </div>
              <TrendingUpIcon className="h-12 w-12 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des comptes */}
      {comptes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Building2Icon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun compte bancaire</h3>
            <p className="text-gray-500 mb-6">Créez votre premier compte bancaire ou initialisez 3 comptes par défaut</p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={initializeDefaultComptes}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <DatabaseIcon className="h-4 w-4 mr-2" />
                Initialiser 3 Comptes
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Créer un Compte
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {comptes.map((compte, index) => (
            <motion.div
              key={compte.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <Building2Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-800">{compte.nom}</CardTitle>
                        {compte.banque && (
                          <p className="text-sm text-gray-500">{compte.banque}</p>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={getTypeCompteColor(compte.typeCompte)}
                    >
                      {getTypeCompteLabel(compte.typeCompte)}
                    </Badge>
                  </div>
                  {compte.numeroCompte && (
                    <p className="text-xs text-gray-500">N° {compte.numeroCompte}</p>
                  )}
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Solde actuel */}
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                      <div className="text-sm opacity-90 mb-1">Solde Actuel</div>
                      <div className="text-3xl font-bold mb-2">
                        {formatCurrency(compte.soldeActuel)}
                      </div>
                      <div className="text-xs opacity-90">
                        Solde initial: {formatCurrency(compte.soldeInitial)}
                      </div>
                    </div>

                    {/* Actions rapides */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => handleCrediter(compte)}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm"
                        size="sm"
                      >
                        <TrendingUpIcon className="h-3 w-3 mr-1" />
                        Créditer
                      </Button>
                      <Button
                        onClick={() => handleDebiter(compte)}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm"
                        size="sm"
                        disabled={compte.soldeActuel === 0}
                      >
                        <TrendingDownIcon className="h-3 w-3 mr-1" />
                        Débiter
                      </Button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewCompte(compte)}
                      >
                        <ArrowRightIcon className="h-3 w-3 mr-1" />
                        Voir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleEditCompte(compte)}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteCompte(compte.id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CompteFormDialog
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open)
          if (!open) setCompteToEdit(null)
        }}
      />

      <CompteFormDialog
        open={showEditModal}
        onOpenChange={(open) => {
          setShowEditModal(open)
          if (!open) {
            setCompteToEdit(null)
            refreshComptes()
          }
        }}
        compteToEdit={compteToEdit}
      />

      <TransactionFormDialog
        open={showTransactionModal}
        onOpenChange={setShowTransactionModal}
        compte={selectedCompte}
        type={transactionType}
      />
    </div>
  )
}

