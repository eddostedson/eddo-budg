// 🎨 PAGE DE TEST - DESIGN SOLDES REMARQUABLES
'use client'

import React, { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import SoldeDisponibleEnhanced from '@/components/solde-disponible-enhanced'
import RecetteCardEnhanced from '@/components/recette-card-enhanced'
import { RefreshCwIcon, EyeIcon } from 'lucide-react'

const TestDesignSoldesPage: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0)

  // Données de test pour démontrer les différents états
  const testRecettes = [
    {
      id: '1',
      userId: 'test',
      libelle: 'PBF Ahokokro',
      montant: 100000,
      soldeDisponible: 11000,
      date: new Date().toISOString(),
      description: 'Recette avec solde faible',
      receiptUrl: undefined,
      receiptFileName: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statut: 'Reçue'
    },
    {
      id: '2',
      userId: 'test',
      libelle: 'PBF Niambrun',
      montant: 50000,
      soldeDisponible: 50000,
      date: new Date().toISOString(),
      description: 'Recette pleine - aucune dépense',
      receiptUrl: undefined,
      receiptFileName: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statut: 'Reçue'
    },
    {
      id: '3',
      userId: 'test',
      libelle: 'EXPERTISE Juillet 2025',
      montant: 462000,
      soldeDisponible: 0,
      date: new Date().toISOString(),
      description: 'Recette épuisée - entièrement dépensée',
      receiptUrl: undefined,
      receiptFileName: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statut: 'Reçue'
    },
    {
      id: '4',
      userId: 'test',
      libelle: 'BSIC - SOLDE EXPERTISE',
      montant: 1639219,
      soldeDisponible: 1639219,
      date: new Date().toISOString(),
      description: 'Recette avec montant important',
      receiptUrl: undefined,
      receiptFileName: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statut: 'Reçue'
    }
  ]

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleViewRecette = (recette: any) => {
    console.log('Voir recette:', recette)
  }

  const handleEditRecette = (recette: any) => {
    console.log('Modifier recette:', recette)
  }

  const handleDeleteRecette = (id: string) => {
    console.log('Supprimer recette:', id)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">🎨 Test Design Soldes Remarquables</h1>
              <p className="text-blue-100 text-lg">Démonstration des composants améliorés</p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="secondary"
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white"
            >
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Section 1: Test des soldes individuels */}
        <motion.div
          key={refreshKey}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6">💎 Test des Soldes Individuels</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testRecettes.map((recette, index) => (
              <motion.div
                key={recette.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="bg-white shadow-lg p-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      {recette.libelle}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Initial: {formatCurrency(recette.montant)}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <SoldeDisponibleEnhanced
                      montant={recette.soldeDisponible}
                      montantInitial={recette.montant}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Section 2: Test des cartes recettes complètes */}
        <motion.div
          key={refreshKey + 1}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6">🎨 Test des Cartes Recettes Complètes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {testRecettes.map((recette, index) => (
              <motion.div
                key={recette.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <RecetteCardEnhanced
                  recette={recette}
                  onView={handleViewRecette}
                  onEdit={handleEditRecette}
                  onDelete={handleDeleteRecette}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Section 3: Comparaison avant/après */}
        <motion.div
          key={refreshKey + 2}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6">📊 Comparaison Avant/Après</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Avant */}
            <Card className="bg-gray-50 border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-600">❌ Design Ancien</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-green-100 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Solde Disponible</div>
                    <div className="text-lg font-bold text-gray-800">
                      {formatCurrency(testRecettes[0].soldeDisponible)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Design basique, peu visible, pas d'animations
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Après */}
            <Card className="bg-white border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-blue-600">✅ Design Nouveau</CardTitle>
              </CardHeader>
              <CardContent>
                <SoldeDisponibleEnhanced
                  montant={testRecettes[0].soldeDisponible}
                  montantInitial={testRecettes[0].montant}
                />
                <div className="text-sm text-blue-600 mt-4">
                  Design remarquable, animations, couleurs dynamiques
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Section 4: Instructions */}
        <motion.div
          key={refreshKey + 3}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🚀 Instructions d'Intégration</h2>
          <div className="space-y-4 text-gray-700">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">1️⃣</span>
              <div>
                <p className="font-semibold">Remplacer la page recettes actuelle :</p>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  src/app/recettes/page.tsx
                </code>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">2️⃣</span>
              <div>
                <p className="font-semibold">Utiliser les nouveaux composants :</p>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  SoldeDisponibleEnhanced & RecetteCardEnhanced
                </code>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">3️⃣</span>
              <div>
                <p className="font-semibold">Personnaliser selon vos besoins :</p>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  Couleurs, animations, tailles
                </code>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default TestDesignSoldesPage
