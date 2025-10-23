// 🚀 ARCHITECTURE DIRECTE - PAGE DE TEST
'use client'

import React, { useState, useEffect } from 'react'
import { Recette } from '@/lib/shared-data'
import { formatCurrency } from '@/lib/utils'
import { DirectService } from '@/lib/supabase/direct-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const TestArchitectureDirectPage: React.FC = () => {
  const [recettes, setRecettes] = useState<Recette[]>([])
  const [loading, setLoading] = useState(true)
  const [totalDisponible, setTotalDisponible] = useState(0)
  const [totalDepenses, setTotalDepenses] = useState(0)
  const [testResults, setTestResults] = useState<string[]>([])

  // 🔄 CHARGER LES RECETTES (ARCHITECTURE DIRECTE)
  const loadRecettes = async () => {
    try {
      setLoading(true)
      setTestResults(prev => [...prev, '🔄 Début du chargement avec l\'architecture directe...'])
      
      const data = await DirectService.getRecettes()
      setRecettes(data)
      
      const total = await DirectService.getTotalDisponible()
      setTotalDisponible(total)
      
      const totalDep = await DirectService.getTotalDepenses()
      setTotalDepenses(totalDep)
      
      setTestResults(prev => [...prev, `✅ Recettes chargées: ${data.length}`])
      setTestResults(prev => [...prev, `📊 Total disponible: ${formatCurrency(total)}`])
      setTestResults(prev => [...prev, `💰 Total dépenses: ${formatCurrency(totalDep)}`])
      
      console.log('✅ Architecture directe - Données chargées:', data.length)
      console.log('📊 Total disponible:', total)
      console.log('💰 Total dépenses:', totalDep)
    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error)
      setTestResults(prev => [...prev, `❌ Erreur: ${error}`])
    } finally {
      setLoading(false)
    }
  }

  // 🧪 TESTER LE CALCUL DU SOLDE D'UNE RECETTE
  const testSoldeRecette = async (recetteId: string) => {
    try {
      const solde = await DirectService.getSoldeRecette(recetteId)
      const recette = recettes.find(r => r.id === recetteId)
      if (recette) {
        setTestResults(prev => [...prev, `🔍 ${recette.libelle}: Solde calculé = ${formatCurrency(solde)}`])
      }
    } catch (error) {
      setTestResults(prev => [...prev, `❌ Erreur calcul solde: ${error}`])
    }
  }

  useEffect(() => {
    loadRecettes()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement avec l'architecture directe...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-8 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-2">🚀 Architecture Directe - Test</h1>
          <p className="text-green-100">Test de la nouvelle architecture simplifiée</p>
          <Badge variant="secondary" className="bg-white text-green-600 mt-2">
            Version de test - Architecture Directe
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-l-4 border-green-500">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Total Recettes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {formatCurrency(recettes.reduce((total, r) => total + r.montant, 0))}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg border-l-4 border-blue-500">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Solde Disponible</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                {formatCurrency(totalDisponible)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg border-l-4 border-red-500">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Total Dépenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">
                {formatCurrency(totalDepenses)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg border-l-4 border-gray-400">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Nombre de Recettes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-700">{recettes.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tests et Résultats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Tests */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-800">🧪 Tests de l'Architecture Directe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={loadRecettes}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                🔄 Recharger les Données
              </Button>
              
              <Button
                onClick={() => {
                  setTestResults(prev => [...prev, '🧪 Test de cohérence des données...'])
                  const totalRecettes = recettes.reduce((total, r) => total + r.montant, 0)
                  const soldeTotal = recettes.reduce((total, r) => total + r.soldeDisponible, 0)
                  const difference = totalRecettes - soldeTotal
                  setTestResults(prev => [...prev, `📊 Total recettes: ${formatCurrency(totalRecettes)}`])
                  setTestResults(prev => [...prev, `💎 Solde total: ${formatCurrency(soldeTotal)}`])
                  setTestResults(prev => [...prev, `💰 Différence (dépenses): ${formatCurrency(difference)}`])
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                📊 Tester la Cohérence
              </Button>

              <Button
                onClick={() => {
                  setTestResults(prev => [...prev, '🔍 Test des soldes individuels...'])
                  recettes.slice(0, 3).forEach(recette => {
                    testSoldeRecette(recette.id)
                  })
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                🔍 Tester les Soldes
              </Button>
            </CardContent>
          </Card>

          {/* Résultats */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-800">📋 Résultats des Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-gray-500 text-center">Aucun test exécuté</p>
                ) : (
                  <div className="space-y-2">
                    {testResults.map((result, index) => (
                      <div key={index} className="text-sm font-mono bg-white p-2 rounded border">
                        {result}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={() => setTestResults([])}
                variant="outline"
                className="w-full mt-4"
              >
                🗑️ Effacer les Résultats
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Liste des Recettes */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Liste des Recettes (Architecture Directe)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recettes.map(recette => (
            <Card key={recette.id} className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                <CardTitle className="text-lg font-bold">{recette.libelle}</CardTitle>
                <Badge variant="secondary" className="bg-white text-green-600 w-fit">
                  {recette.statut}
                </Badge>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Montant initial:</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(recette.montant)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Solde disponible:</span>
                    <span className="font-bold text-green-600 text-lg">{formatCurrency(recette.soldeDisponible)}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Créé le: {new Date(recette.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                  <Button
                    onClick={() => testSoldeRecette(recette.id)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    🔍 Tester le Solde
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {recettes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune recette trouvée</h3>
            <p className="text-gray-500">Vérifiez la connexion à la base de données</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TestArchitectureDirectPage
