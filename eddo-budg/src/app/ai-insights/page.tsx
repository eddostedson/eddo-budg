'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { useRecettes } from '@/contexts/recette-context'
import { useDepenses } from '@/contexts/depense-context'
import { AIFinancialService, type AIInsight } from '@/lib/ai-service'

export default function AIInsightsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { recettes } = useRecettes()
  const { depenses } = useDepenses()
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }
      setLoading(false)
      // Analyser automatiquement au chargement
      performAnalysis()
    }
    checkAuth()
  }, [router, supabase.auth, recettes, depenses])

  const performAnalysis = async () => {
    setAnalyzing(true)
    
    // Simuler un délai d'analyse IA
    await new Promise(resolve => setTimeout(resolve, 1500))

    const totalRecettes = recettes.reduce((sum, r) => sum + r.montant, 0)
    const totalDepenses = depenses.reduce((sum, d) => sum + d.montant, 0)
    const soldeTotal = totalRecettes - totalDepenses

    const generatedInsights: AIInsight[] = []

    // Insight 1: Analyse du solde
    if (soldeTotal > 0) {
      generatedInsights.push({
        type: 'opportunity',
        title: '💰 Excellente santé financière',
        description: `Votre solde positif de ${formatCurrency(soldeTotal)} indique une gestion saine. Considérez d'investir une partie dans un compte d'épargne ou un projet.`,
        impact: soldeTotal * 0.05, // 5% d'intérêt potentiel
        priority: 'medium',
        actionable: true
      })
    } else if (soldeTotal < 0) {
      generatedInsights.push({
        type: 'warning',
        title: '⚠️ Déficit budgétaire détecté',
        description: `Vous avez un déficit de ${formatCurrency(Math.abs(soldeTotal))}. Il est recommandé de réduire les dépenses non essentielles ou d'augmenter vos sources de revenus.`,
        impact: Math.abs(soldeTotal),
        priority: 'high',
        actionable: true
      })
    }

    // Insight 2: Taux d'épargne
    if (totalRecettes > 0) {
      const tauxEpargne = ((totalRecettes - totalDepenses) / totalRecettes) * 100
      if (tauxEpargne >= 20) {
        generatedInsights.push({
          type: 'optimization',
          title: '🎯 Excellent taux d\'épargne',
          description: `Vous épargnez ${tauxEpargne.toFixed(1)}% de vos revenus. C'est au-dessus de la recommandation de 20% ! Continuez ainsi.`,
          impact: totalRecettes - totalDepenses,
          priority: 'low',
          actionable: false
        })
      } else if (tauxEpargne < 10) {
        generatedInsights.push({
          type: 'optimization',
          title: '📊 Amélioration du taux d\'épargne possible',
          description: `Votre taux d'épargne est de ${tauxEpargne.toFixed(1)}%. Essayez d'atteindre 20% en réduisant vos dépenses de ${formatCurrency((totalRecettes * 0.2 - (totalRecettes - totalDepenses)))}.`,
          impact: totalRecettes * 0.2 - (totalRecettes - totalDepenses),
          priority: 'medium',
          actionable: true
        })
      }
    }

    // Insight 3: Analyse des dépenses par recette
    const recettesAvecDepenses = recettes.map(recette => {
      const depensesLiees = depenses.filter(d => d.recetteId === recette.id)
      const totalDepense = depensesLiees.reduce((sum, d) => sum + d.montant, 0)
      const tauxUtilisation = (totalDepense / recette.montant) * 100
      return { recette, tauxUtilisation, totalDepense }
    })

    const recettesSurUtilisees = recettesAvecDepenses.filter(r => r.tauxUtilisation > 90)
    if (recettesSurUtilisees.length > 0) {
      recettesSurUtilisees.forEach(({ recette, tauxUtilisation }) => {
        generatedInsights.push({
          type: 'warning',
          title: `⚡ Recette "${recette.libelle}" presque épuisée`,
          description: `Vous avez utilisé ${tauxUtilisation.toFixed(1)}% de cette recette. Planifiez vos prochaines dépenses avec attention.`,
          impact: recette.soldeDisponible,
          priority: 'high',
          actionable: true
        })
      })
    }

    // Insight 4: Prédiction mensuelle
    if (depenses.length > 0) {
      const depensesMoyennes = totalDepenses / (depenses.length || 1)
      const projectionMensuelle = depensesMoyennes * 30
      
      generatedInsights.push({
        type: 'prediction',
        title: '🔮 Projection mensuelle',
        description: `Basé sur vos dépenses actuelles, vous dépenserez environ ${formatCurrency(projectionMensuelle)} ce mois-ci.`,
        impact: projectionMensuelle,
        priority: 'medium',
        actionable: false
      })
    }

    // Insight 5: Diversification des recettes
    if (recettes.length === 1) {
      generatedInsights.push({
        type: 'opportunity',
        title: '🌟 Diversifiez vos sources de revenus',
        description: 'Vous n\'avez qu\'une seule source de revenus. Envisagez de créer des revenus complémentaires pour plus de stabilité financière.',
        impact: totalRecettes * 0.3, // 30% de revenus supplémentaires potentiels
        priority: 'medium',
        actionable: true
      })
    } else if (recettes.length >= 3) {
      generatedInsights.push({
        type: 'optimization',
        title: '✨ Excellente diversification',
        description: `Vous avez ${recettes.length} sources de revenus différentes. Cette diversification réduit vos risques financiers.`,
        impact: 0,
        priority: 'low',
        actionable: false
      })
    }

    // Insight 6: Recommandations d'optimisation
    const depensesElevees = depenses.filter(d => d.montant > totalDepenses / depenses.length * 2)
    if (depensesElevees.length > 0) {
      generatedInsights.push({
        type: 'optimization',
        title: '🔍 Dépenses inhabituelles détectées',
        description: `${depensesElevees.length} dépense(s) sont significativement plus élevées que votre moyenne. Vérifiez si elles sont justifiées.`,
        impact: depensesElevees.reduce((sum, d) => sum + d.montant, 0) * 0.2,
        priority: 'medium',
        actionable: true
      })
    }

    setInsights(generatedInsights)
    setAnalyzing(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low': return 'bg-green-100 text-green-800 border-green-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️'
      case 'opportunity': return '💡'
      case 'prediction': return '🔮'
      case 'optimization': return '⚙️'
      default: return '📊'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  const totalRecettes = recettes.reduce((sum, r) => sum + r.montant, 0)
  const totalDepenses = depenses.reduce((sum, d) => sum + d.montant, 0)
  const soldeTotal = totalRecettes - totalDepenses

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white px-6 py-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.push('/accueil')}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              🏠 Accueil
            </button>
            <button
              onClick={() => router.push('/ai-chat')}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              💬 Discuter avec l'IA
            </button>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <span className="text-5xl">🤖</span>
                Assistant IA Financier
              </h1>
              <p className="text-purple-100 text-lg">Analyses et recommandations personnalisées</p>
            </div>
            <button
              onClick={performAnalysis}
              disabled={analyzing}
              className="bg-white text-purple-600 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                  Analyse en cours...
                </>
              ) : (
                <>
                  <span className="text-2xl">🔄</span>
                  Réanalyser
                </>
              )}
            </button>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-5 border border-white border-opacity-20">
              <p className="text-purple-100 text-sm font-medium mb-1">Total Recettes</p>
              <p className="text-3xl font-bold">{formatCurrency(totalRecettes)}</p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-5 border border-white border-opacity-20">
              <p className="text-purple-100 text-sm font-medium mb-1">Total Dépenses</p>
              <p className="text-3xl font-bold">{formatCurrency(totalDepenses)}</p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-5 border border-white border-opacity-20">
              <p className="text-purple-100 text-sm font-medium mb-1">Solde</p>
              <p className={`text-3xl font-bold ${soldeTotal >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {formatCurrency(soldeTotal)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {analyzing ? (
          <div className="text-center py-20">
            <div className="inline-block animate-bounce mb-6">
              <span className="text-8xl">🤖</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Analyse en cours...</h2>
            <p className="text-gray-600 text-lg mb-8">L'IA examine vos données financières</p>
            <div className="flex justify-center gap-2">
              <div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">📊</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Commencez votre analyse</h2>
            <p className="text-gray-600 text-lg mb-8">Ajoutez des recettes et dépenses pour obtenir des insights personnalisés</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => router.push('/recettes')}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Ajouter une recette
              </button>
              <button
                onClick={() => router.push('/depenses')}
                className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Ajouter une dépense
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                🎯 {insights.length} Insight{insights.length > 1 ? 's' : ''} détecté{insights.length > 1 ? 's' : ''}
              </h2>
              <p className="text-gray-600">Recommandations basées sur l'analyse de vos {recettes.length} recette(s) et {depenses.length} dépense(s)</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-l-4 border-purple-500"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{getTypeIcon(insight.type)}</div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{insight.title}</h3>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 border ${getPriorityColor(insight.priority)}`}>
                            {insight.priority === 'high' ? 'Priorité haute' : insight.priority === 'medium' ? 'Priorité moyenne' : 'Info'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 leading-relaxed">{insight.description}</p>

                    {insight.impact > 0 && (
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <p className="text-sm text-purple-700 font-medium">
                          💰 Impact potentiel: <span className="font-bold text-lg">{formatCurrency(insight.impact)}</span>
                        </p>
                      </div>
                    )}

                    {insight.actionable && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <span>✅</span>
                          Action recommandée
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

