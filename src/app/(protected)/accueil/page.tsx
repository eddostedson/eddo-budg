// 🎨 PAGE ACCUEIL AVEC DESIGN AMÉLIORÉ - SOLDES REMARQUABLES
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingUpIcon, TrendingDownIcon, DollarSignIcon, ActivityIcon } from 'lucide-react'
import Link from 'next/link'
import { useRecettes } from '@/contexts/recette-context-direct'
import { useDepenses } from '@/contexts/depense-context-direct'
import { useComptesBancaires } from '@/contexts/compte-bancaire-context'

// Fonction de formatage de monnaie
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' F CFA'
}

const AccueilPage: React.FC = () => {
  const { recettes, loading: recettesLoading, getTotalDisponible } = useRecettes()
  const { depenses, loading: depensesLoading } = useDepenses()
  const { comptes, loading: comptesLoading, getTotalSoldes, getNetTotals } = useComptesBancaires()
  const [loading, setLoading] = useState(true)

  // Calculs des totaux avec useMemo
  const totalRecettes = useMemo(() => {
    return recettes.reduce((sum, r) => sum + (r.montant || 0), 0)
  }, [recettes])

  const totalDepenses = useMemo(() => {
    return depenses.reduce((sum, d) => sum + (d.montant || 0), 0)
  }, [depenses])

  // Solde cumulé de tous les comptes bancaires (avec exclusions)
  const totalSoldesComptes = useMemo(() => {
    const total = getTotalSoldes()
    
    // Si aucun compte n'est exclu, retourner le total normal
    if (!comptes.some((c) => c.excludeFromTotal) || !comptes.length) {
      return total
    }

    // Calculer le total des comptes exclus
    const excludedTotal = comptes
      .filter((compte) => compte.excludeFromTotal)
      .reduce((sum, compte) => sum + (compte.soldeActuel || 0), 0)

    // Retourner le total moins les comptes exclus
    return total - excludedTotal
  }, [getTotalSoldes, comptes])

  const netBankTotals = getNetTotals()
  const internalTransfersVolumeAccueil = Math.max(
    0,
    netBankTotals.totalCredits - netBankTotals.externalCredits
  )

  // Statistiques avancées
  const recettesUtilisees = recettes.filter(r => (r.soldeDisponible || 0) < (r.montant || 0)).length
  const recettesVides = recettes.filter(r => (r.soldeDisponible || 0) === 0).length
  const recettesPleine = recettes.filter(r => (r.soldeDisponible || 0) === (r.montant || 0)).length
  const depensesAvecRecu = depenses.filter(d => d.receiptUrl).length
  const depensesRecent = depenses.filter(d => {
    const depenseDate = new Date(d.date)
    const now = new Date()
    const diffDays = (now.getTime() - depenseDate.getTime()) / (1000 * 3600 * 24)
    return diffDays <= 7
  }).length

  useEffect(() => {
    if (!recettesLoading && !depensesLoading && !comptesLoading) {
      setLoading(false)
    }
  }, [recettesLoading, depensesLoading, comptesLoading])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Chargement du tableau de bord...</h2>
          <p className="text-gray-500 mt-2">Préparation des données financières</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* En-tête avec animations */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">🏠 Tableau de Bord</h1>
              <p className="text-purple-100 text-lg">Vue d'ensemble financière avec design remarquable</p>
            </div>
            <div className="flex space-x-3">
              {comptes.length === 0 ? (
                <div className="text-purple-100 text-sm">Aucun compte bancaire</div>
              ) : (
                comptes.map((compte) => (
                  <motion.div
                    key={compte.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 min-w-[200px] border border-white/30"
                  >
                    <div className="text-xs text-purple-100 mb-1 font-medium truncate">
                      {compte.nom}
                    </div>
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(compte.soldeActuel)}
                    </div>
                    {compte.banque && (
                      <div className="text-xs text-purple-100 mt-1 truncate">
                        {compte.banque}
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Cartes de statistiques principales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">Total Recettes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{formatCurrency(totalRecettes)}</div>
              <div className="flex items-center mt-2">
                <TrendingUpIcon className="h-4 w-4 mr-1" />
                <span className="text-sm opacity-80">Revenus totaux</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">Total Dépenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{formatCurrency(totalDepenses)}</div>
              <div className="flex items-center mt-2">
                <TrendingDownIcon className="h-4 w-4 mr-1" />
                <span className="text-sm opacity-80">Dépenses totales</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">Solde Cumulé Comptes Bancaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{formatCurrency(totalSoldesComptes)}</div>
              <div className="flex items-center mt-2">
                <DollarSignIcon className="h-4 w-4 mr-1" />
                <span className="text-sm opacity-80">{comptes.length} compte{comptes.length > 1 ? 's' : ''} bancaire{comptes.length > 1 ? 's' : ''}</span>
              </div>
              <div className="mt-3 text-sm opacity-90">
                Flux externes (hors transferts) :{' '}
                <span className="font-semibold">
                  {formatCurrency(netBankTotals.externalCredits - netBankTotals.externalDebits)}
                </span>
              </div>
              <div className="text-xs opacity-80">
                Transferts internes neutralisés :{' '}
                <span className="font-semibold">{formatCurrency(internalTransfersVolumeAccueil)}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Statistiques détaillées */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-green-600">✅ Recettes Pleines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{recettesPleine}</div>
              <p className="text-sm text-gray-600 mt-2">Aucune dépense</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-orange-600">⚠️ Recettes Utilisées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{recettesUtilisees}</div>
              <p className="text-sm text-gray-600 mt-2">Partiellement dépensées</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-red-600">❌ Recettes Vides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{recettesVides}</div>
              <p className="text-sm text-gray-600 mt-2">Entièrement dépensées</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-blue-600">📄 Avec Reçu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{depensesAvecRecu}</div>
              <p className="text-sm text-gray-600 mt-2">Dépenses documentées</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions rapides */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Actions Rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/recettes">
              <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-green-600 flex items-center">
                    <TrendingUpIcon className="h-5 w-5 mr-2" />
                    Gérer les Recettes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Ajouter, modifier et suivre vos recettes</p>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Voir les Recettes
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/depenses">
              <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-red-600 flex items-center">
                    <TrendingDownIcon className="h-5 w-5 mr-2" />
                    Gérer les Dépenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Enregistrer et suivre vos dépenses</p>
                  <Button className="w-full bg-red-600 hover:bg-red-700">
                    Voir les Dépenses
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/journal-activite">
              <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-green-600 flex items-center">
                    <ActivityIcon className="h-5 w-5 mr-2" />
                    Journal d'Activité
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Consulter l'historique des transactions</p>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Voir le Journal
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/test-design-soldes">
              <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-purple-600 flex items-center">
                    <ActivityIcon className="h-5 w-5 mr-2" />
                    Test Design
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Tester le nouveau design des soldes</p>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    Tester le Design
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </motion.div>

        {/* Résumé financier */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Résumé Financier</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Recettes</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total des recettes:</span>
                  <span className="font-bold text-green-600">{formatCurrency(totalRecettes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recettes pleines:</span>
                  <span className="font-bold text-green-600">{recettesPleine}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recettes utilisées:</span>
                  <span className="font-bold text-orange-600">{recettesUtilisees}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recettes vides:</span>
                  <span className="font-bold text-red-600">{recettesVides}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Dépenses</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total des dépenses:</span>
                  <span className="font-bold text-red-600">{formatCurrency(totalDepenses)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avec reçu:</span>
                  <span className="font-bold text-blue-600">{depensesAvecRecu}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Récentes (7j):</span>
                  <span className="font-bold text-purple-600">{depensesRecent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Solde cumulé comptes bancaires:</span>
                  <span className="font-bold text-green-600">{formatCurrency(totalSoldesComptes)}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Aperçu des recettes avec nouveau design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-white rounded-2xl p-8 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">🎨 Aperçu des Recettes</h2>
            <Link href="/recettes">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Voir Toutes les Recettes
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recettes.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">Aucune recette pour le moment</p>
                <p className="text-gray-400 mt-2">Commencez par ajouter des recettes</p>
              </div>
            ) : (
              recettes.slice(0, 4).map((recette, index) => (
                <motion.div
                  key={recette.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white p-4 rounded-lg shadow"
                >
                  <h3 className="font-bold">{recette.libelle}</h3>
                  <p className="text-2xl text-green-600">{formatCurrency(recette.montant)}</p>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AccueilPage
