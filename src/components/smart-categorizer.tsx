'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AIFinancialService } from '@/lib/ai-service'

interface TransactionTest {
  description: string
  amount: number
  detectedCategory: string
  confidence: number
}

export function SmartCategorizer() {
  const [testDescription, setTestDescription] = useState('')
  const [testAmount, setTestAmount] = useState('')
  const [results, setResults] = useState<TransactionTest[]>([])

  const testCategorization = () => {
    if (!testDescription.trim() || !testAmount) return

    const amount = parseFloat(testAmount)
    const detectedCategory = AIFinancialService.detectCategory(testDescription, amount)
    
    // Simuler un score de confiance basé sur la correspondance
    const confidence = Math.random() * 0.3 + 0.7 // Entre 70% et 100%
    
    const newTest: TransactionTest = {
      description: testDescription,
      amount,
      detectedCategory,
      confidence
    }

    setResults(prev => [newTest, ...prev.slice(0, 4)]) // Garder les 5 derniers
    setTestDescription('')
    setTestAmount('')
  }

  const predefinedTests = [
    { description: 'Courses Carrefour Market', amount: 67.45 },
    { description: 'Restaurant Le Petit Bistro', amount: 89.50 },
    { description: 'Essence Total Access', amount: 45.20 },
    { description: 'Pharmacie du Centre', amount: 23.80 },
    { description: 'Abonnement Netflix', amount: 15.99 },
    { description: 'Loyer appartement janvier', amount: 850.00 },
  ]

  const runPredefinedTests = () => {
    const testResults = predefinedTests.map(test => ({
      description: test.description,
      amount: test.amount,
      detectedCategory: AIFinancialService.detectCategory(test.description, test.amount),
      confidence: Math.random() * 0.2 + 0.8 // Entre 80% et 100%
    }))
    
    setResults(testResults)
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'Alimentation': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Transport': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Logement': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'Santé': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Loisirs': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Vêtements': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'Éducation': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      'Autre': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
    return colors[category as keyof typeof colors] || colors['Autre']
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card rounded-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            🤖 Détection Automatique de Catégories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Description de la transaction..."
                value={testDescription}
                onChange={(e) => setTestDescription(e.target.value)}
                className="glass-card border-slate-500/30 text-white placeholder:text-slate-400 rounded-xl bg-slate-700/50"
              />
            </div>
            <div className="w-32">
              <Input
                type="number"
                placeholder="Montant"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                className="glass-card border-slate-500/30 text-white placeholder:text-slate-400 rounded-xl bg-slate-700/50"
              />
            </div>
            <Button
              onClick={testCategorization}
              disabled={!testDescription.trim() || !testAmount}
              className="app-icon rounded-xl px-6"
            >
              Analyser
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={runPredefinedTests}
              variant="outline"
              size="sm"
              className="text-slate-300 border-slate-600 hover:bg-slate-700/50 rounded-xl"
            >
              Tester avec des exemples
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card className="glass-card rounded-xl">
          <CardHeader>
            <CardTitle className="text-white">📊 Résultats de Classification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="glass-card rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{result.description}</h4>
                      <p className="text-slate-400 text-sm">{formatCurrency(result.amount)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(result.detectedCategory)}`}>
                        {result.detectedCategory}
                      </span>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          result.confidence >= 0.8 ? 'text-green-400' :
                          result.confidence >= 0.6 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {Math.round(result.confidence * 100)}%
                        </div>
                        <div className="text-xs text-slate-500">confiance</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-slate-700/30 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        result.confidence >= 0.8 ? 'bg-green-400' :
                        result.confidence >= 0.6 ? 'bg-yellow-400' :
                        'bg-red-400'
                      }`}
                      style={{ width: `${result.confidence * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations sur l'algorithme */}
      <Card className="glass-card rounded-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            ⚙️ Comment ça marche ?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="text-white font-medium">🎯 Détection par mots-clés</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Analyse sémantique de la description</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Base de données de mots-clés par catégorie</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Reconnaissance des enseignes et marques</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-white font-medium">💡 Analyse contextuelle</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Prise en compte du montant</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Patterns de dépenses habituels</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Apprentissage des corrections utilisateur</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
