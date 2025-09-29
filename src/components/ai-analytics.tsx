'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AIFinancialService, mockTransactions, ExpensePattern, BudgetPrediction, AIInsight } from '@/lib/ai-service'

export function AIAnalytics() {
  const [patterns, setPatterns] = useState<ExpensePattern[]>([])
  const [predictions, setPredictions] = useState<BudgetPrediction[]>([])
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    performAIAnalysis()
  }, [])

  const performAIAnalysis = async () => {
    setIsAnalyzing(true)
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Analyser les patterns
    const detectedPatterns = AIFinancialService.analyzeSpendingPatterns(mockTransactions)
    setPatterns(detectedPatterns)
    
    // Générer les prédictions
    const futurePredictions = AIFinancialService.predictFutureExpenses(detectedPatterns, 3)
    setPredictions(futurePredictions)
    
    // Calculer l'analyse globale
    const totalSpent = mockTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const categoryBreakdown = mockTransactions.reduce((breakdown, t) => {
      const category = t.category || 'Autre'
      breakdown[category] = (breakdown[category] || 0) + Math.abs(t.amount)
      return breakdown
    }, {} as Record<string, number>)
    
    const analysis = {
      totalSpent,
      categoryBreakdown,
      patterns: detectedPatterns,
      anomalies: [],
      insights: []
    }
    
    // Générer les insights
    const aiInsights = AIFinancialService.generateInsights(analysis, detectedPatterns)
    setInsights(aiInsights)
    
    setIsAnalyzing(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400'
    if (confidence >= 0.6) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '📈'
      case 'decreasing': return '📉'
      default: return '➡️'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500/50 bg-red-500/10'
      case 'medium': return 'border-yellow-500/50 bg-yellow-500/10'
      default: return 'border-blue-500/50 bg-blue-500/10'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton d'analyse */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">🧠 Analyse IA</h1>
          <p className="text-slate-300">Intelligence artificielle appliquée à vos finances</p>
        </div>
        <Button
          onClick={performAIAnalysis}
          disabled={isAnalyzing}
          className="app-icon px-6 py-3 rounded-xl"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              Analyse en cours...
            </>
          ) : (
            <>
              🔄 Nouvelle analyse
            </>
          )}
        </Button>
      </div>

      {/* Insights IA prioritaires */}
      {insights.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">🎯 Insights Prioritaires</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {insights.slice(0, 3).map((insight, index) => (
              <Card key={index} className={`glass-card rounded-xl border ${getPriorityColor(insight.priority)}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      {insight.type === 'warning' ? '⚠️' : 
                       insight.type === 'opportunity' ? '💡' : 
                       insight.type === 'prediction' ? '🔮' : '⚡'}
                      {insight.title}
                    </CardTitle>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      insight.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      insight.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {insight.priority}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 text-sm mb-3">{insight.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-green-400 font-semibold">
                      {insight.impact > 0 ? '+' : ''}{formatCurrency(insight.impact)}
                    </span>
                    {insight.actionable && (
                      <Button variant="ghost" size="sm" className="text-xs h-6">
                        Action
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Patterns de dépenses détectés */}
      {patterns.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">📊 Patterns Détectés</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {patterns.slice(0, 6).map((pattern, index) => (
              <Card key={index} className="glass-card rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-medium">{pattern.category}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getTrendIcon(pattern.trend)}</span>
                      <span className={`text-xs ${getConfidenceColor(pattern.confidence)}`}>
                        {Math.round(pattern.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Montant moyen</span>
                      <span className="text-white">{formatCurrency(pattern.averageAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fréquence</span>
                      <span className="text-white capitalize">{pattern.frequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tendance</span>
                      <span className={`${
                        pattern.trend === 'increasing' ? 'text-red-400' :
                        pattern.trend === 'decreasing' ? 'text-green-400' :
                        'text-slate-400'
                      }`}>
                        {pattern.trend === 'increasing' ? 'En hausse' :
                         pattern.trend === 'decreasing' ? 'En baisse' :
                         'Stable'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Prédictions futures */}
      {predictions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">🔮 Prédictions IA</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            {predictions.map((prediction, index) => (
              <Card key={index} className="glass-card rounded-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>{prediction.month}</span>
                    <span className={`text-sm ${getConfidenceColor(prediction.confidence)}`}>
                      Confiance: {Math.round(prediction.confidence * 100)}%
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-blue-400 mb-1">
                      {formatCurrency(prediction.predictedAmount)}
                    </div>
                    <div className="text-slate-400 text-sm">Dépenses prédites</div>
                  </div>

                  {prediction.factors.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-white font-medium text-sm mb-2">Facteurs clés:</h4>
                      <ul className="space-y-1">
                        {prediction.factors.slice(0, 2).map((factor, idx) => (
                          <li key={idx} className="text-slate-300 text-xs flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {prediction.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium text-sm mb-2">Recommandations:</h4>
                      <ul className="space-y-1">
                        {prediction.recommendations.slice(0, 2).map((rec, idx) => (
                          <li key={idx} className="text-slate-300 text-xs flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">✓</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions d'optimisation */}
      <Card className="glass-card rounded-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            💡 Suggestions d'Optimisation IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {AIFinancialService.generateOptimizationSuggestions(patterns).slice(0, 6).map((suggestion, index) => (
              <div key={index} className="flex items-start gap-3 p-3 glass-card rounded-lg">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-400 text-xs">✓</span>
                </div>
                <p className="text-slate-300 text-sm">{suggestion}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
