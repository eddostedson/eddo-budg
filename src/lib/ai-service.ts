// Service IA pour l'analyse financière et les prédictions
import { Transaction } from './shared-data'

export interface ExpensePattern {
  category: string
  averageAmount: number
  frequency: 'daily' | 'weekly' | 'monthly'
  trend: 'increasing' | 'decreasing' | 'stable'
  confidence: number
}

export interface BudgetPrediction {
  month: string
  predictedAmount: number
  confidence: number
  factors: string[]
  recommendations: string[]
}

export interface AIInsight {
  type: 'warning' | 'opportunity' | 'prediction' | 'optimization'
  title: string
  description: string
  impact: number // en euros
  priority: 'high' | 'medium' | 'low'
  actionable: boolean
}

export interface SpendingAnalysis {
  totalSpent: number
  categoryBreakdown: Record<string, number>
  patterns: ExpensePattern[]
  anomalies: string[]
  insights: AIInsight[]
}

export class AIFinancialService {
  // Analyse les patterns de dépenses
  static analyzeSpendingPatterns(transactions: any[]): ExpensePattern[] {
    const patterns: ExpensePattern[] = []
    
    // Grouper par catégorie
    const categoryGroups = transactions.reduce((groups, transaction) => {
      const category = transaction.category || 'Autre'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(transaction)
      return groups
    }, {} as Record<string, any[]>)

    // Analyser chaque catégorie
    Object.entries(categoryGroups).forEach(([category, categoryTransactions]) => {
      const amounts = (categoryTransactions as Transaction[]).map(t => Math.abs(t.amount))
      const averageAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length
      
      // Calculer la tendance (simplifié)
      const recentTransactions = (categoryTransactions as Transaction[]).slice(-5)
      const olderTransactions = (categoryTransactions as Transaction[]).slice(0, -5)
      
      const recentAvg = recentTransactions.length > 0 
        ? recentTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / recentTransactions.length 
        : 0
      const olderAvg = olderTransactions.length > 0 
        ? olderTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / olderTransactions.length 
        : recentAvg

      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
      if (recentAvg > olderAvg * 1.1) trend = 'increasing'
      else if (recentAvg < olderAvg * 0.9) trend = 'decreasing'

      patterns.push({
        category,
        averageAmount,
        frequency: this.determineFrequency(categoryTransactions as Transaction[]),
        trend,
        confidence: Math.min(0.95, (categoryTransactions as Transaction[]).length / 10) // Plus de données = plus de confiance
      })
    })

    return patterns.sort((a, b) => b.averageAmount - a.averageAmount)
  }

  // Détermine la fréquence des transactions
  private static determineFrequency(transactions: any[]): 'daily' | 'weekly' | 'monthly' {
    if (transactions.length < 2) return 'monthly'
    
    const dates = transactions.map(t => new Date(t.date)).sort()
    const intervals = []
    
    for (let i = 1; i < dates.length; i++) {
      const diff = dates[i].getTime() - dates[i-1].getTime()
      intervals.push(diff / (1000 * 60 * 60 * 24)) // en jours
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
    
    if (avgInterval <= 3) return 'daily'
    if (avgInterval <= 10) return 'weekly'
    return 'monthly'
  }

  // Prédit les dépenses futures
  static predictFutureExpenses(patterns: ExpensePattern[], months: number = 3): BudgetPrediction[] {
    const predictions: BudgetPrediction[] = []
    const currentDate = new Date()
    
    for (let i = 1; i <= months; i++) {
      const targetDate = new Date(currentDate)
      targetDate.setMonth(targetDate.getMonth() + i)
      
      let predictedAmount = 0
      const factors: string[] = []
      const recommendations: string[] = []
      
      patterns.forEach(pattern => {
        let monthlyAmount = pattern.averageAmount
        
        // Ajuster selon la fréquence
        if (pattern.frequency === 'weekly') {
          monthlyAmount *= 4.33 // moyenne de semaines par mois
        } else if (pattern.frequency === 'daily') {
          monthlyAmount *= 30
        }
        
        // Appliquer la tendance
        if (pattern.trend === 'increasing') {
          monthlyAmount *= 1.05 // +5% par mois
          factors.push(`${pattern.category}: tendance croissante`)
        } else if (pattern.trend === 'decreasing') {
          monthlyAmount *= 0.95 // -5% par mois
          factors.push(`${pattern.category}: tendance décroissante`)
        }
        
        // Ajustements saisonniers (simplifié)
        const month = targetDate.getMonth()
        if (pattern.category === 'Alimentation' && month === 11) { // Décembre
          monthlyAmount *= 1.2 // Fêtes de fin d'année
          factors.push('Augmentation saisonnière (fêtes)')
        }
        
        predictedAmount += monthlyAmount
      })
      
      // Générer des recommandations
      if (predictedAmount > 2500) {
        recommendations.push('Considérer une réduction des dépenses non essentielles')
      }
      if (patterns.some(p => p.trend === 'increasing' && p.category === 'Loisirs')) {
        recommendations.push('Surveiller les dépenses de loisirs en hausse')
      }
      
      predictions.push({
        month: targetDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        predictedAmount: Math.round(predictedAmount),
        confidence: Math.min(0.9, patterns.reduce((avg, p) => avg + p.confidence, 0) / patterns.length),
        factors,
        recommendations
      })
    }
    
    return predictions
  }

  // Génère des insights IA
  static generateInsights(analysis: SpendingAnalysis, patterns: ExpensePattern[]): AIInsight[] {
    const insights: AIInsight[] = []
    
    // Détection de dépassement de budget
    const totalBudget = 2500 // Budget exemple
    if (analysis.totalSpent > totalBudget * 0.8) {
      insights.push({
        type: 'warning',
        title: 'Budget en voie de dépassement',
        description: `Vous avez dépensé ${Math.round((analysis.totalSpent / totalBudget) * 100)}% de votre budget mensuel`,
        impact: analysis.totalSpent - totalBudget,
        priority: 'high',
        actionable: true
      })
    }
    
    // Opportunités d'économie
    const highestCategory = Object.entries(analysis.categoryBreakdown)
      .sort(([,a], [,b]) => b - a)[0]
    
    if (highestCategory && highestCategory[1] > totalBudget * 0.3) {
      insights.push({
        type: 'opportunity',
        title: 'Optimisation possible',
        description: `${highestCategory[0]} représente ${Math.round((highestCategory[1] / analysis.totalSpent) * 100)}% de vos dépenses`,
        impact: highestCategory[1] * 0.15, // 15% d'économie potentielle
        priority: 'medium',
        actionable: true
      })
    }
    
    // Prédictions basées sur les tendances
    const increasingPatterns = patterns.filter(p => p.trend === 'increasing')
    if (increasingPatterns.length > 0) {
      const totalIncrease = increasingPatterns.reduce((sum, p) => sum + p.averageAmount, 0)
      insights.push({
        type: 'prediction',
        title: 'Tendance de dépenses croissante',
        description: `${increasingPatterns.length} catégories montrent une tendance à la hausse`,
        impact: totalIncrease * 0.05 * 12, // Impact annuel estimé
        priority: 'medium',
        actionable: true
      })
    }
    
    // Optimisations automatiques
    insights.push({
      type: 'optimization',
      title: 'Épargne automatique recommandée',
      description: 'Basé sur vos habitudes, vous pourriez épargner 200€/mois automatiquement',
      impact: 200,
      priority: 'low',
      actionable: true
    })
    
    return insights.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 }
      return priorityWeight[b.priority] - priorityWeight[a.priority]
    })
  }

  // Détection automatique de catégorie
  static detectCategory(description: string, amount: number): string {
    const lowerDesc = description.toLowerCase()
    
    // Règles de détection basées sur des mots-clés
    const categoryRules = {
      'Alimentation': ['supermarché', 'restaurant', 'boulangerie', 'marché', 'courses', 'carrefour', 'leclerc', 'auchan'],
      'Transport': ['essence', 'métro', 'bus', 'train', 'uber', 'taxi', 'parking', 'péage'],
      'Logement': ['loyer', 'edf', 'gdf', 'eau', 'internet', 'assurance habitation'],
      'Santé': ['pharmacie', 'médecin', 'dentiste', 'mutuelle', 'hôpital', 'clinique'],
      'Loisirs': ['cinéma', 'théâtre', 'concert', 'sport', 'gym', 'netflix', 'spotify'],
      'Vêtements': ['zara', 'h&m', 'uniqlo', 'vêtement', 'chaussure', 'mode'],
      'Éducation': ['école', 'université', 'formation', 'livre', 'cours']
    }
    
    for (const [category, keywords] of Object.entries(categoryRules)) {
      if (keywords.some(keyword => lowerDesc.includes(keyword))) {
        return category
      }
    }
    
    // Règles basées sur le montant
    if (amount > 1000) return 'Logement'
    if (amount < 10) return 'Divers'
    
    return 'Autre'
  }

  // Suggestions d'optimisation personnalisées
  static generateOptimizationSuggestions(patterns: ExpensePattern[]): string[] {
    const suggestions: string[] = []
    
    patterns.forEach(pattern => {
      if (pattern.trend === 'increasing' && pattern.confidence > 0.7) {
        switch (pattern.category) {
          case 'Alimentation':
            suggestions.push('Planifiez vos repas à l\'avance pour réduire les achats impulsifs')
            suggestions.push('Utilisez des applications de cashback pour vos courses')
            break
          case 'Transport':
            suggestions.push('Considérez le covoiturage ou les transports en commun')
            suggestions.push('Optimisez vos trajets pour réduire la consommation')
            break
          case 'Loisirs':
            suggestions.push('Recherchez des activités gratuites ou moins chères')
            suggestions.push('Négociez vos abonnements ou changez d\'offres')
            break
        }
      }
    })
    
    // Suggestions générales
    suggestions.push('Mettez en place un virement automatique vers votre épargne')
    suggestions.push('Renégociez vos contrats d\'assurance annuellement')
    suggestions.push('Utilisez la règle des 24h pour les achats non essentiels')
    
    return [...new Set(suggestions)] // Supprimer les doublons
  }
}

// Données de démonstration pour les tests
export const mockTransactions = [
  { id: 1, amount: -45.50, category: 'Alimentation', description: 'Courses Carrefour', date: '2024-01-15' },
  { id: 2, amount: -12.00, category: 'Transport', description: 'Métro', date: '2024-01-16' },
  { id: 3, amount: -89.99, category: 'Loisirs', description: 'Abonnement Netflix', date: '2024-01-17' },
  { id: 4, amount: -156.78, category: 'Alimentation', description: 'Restaurant Le Petit Bistro', date: '2024-01-18' },
  { id: 5, amount: -25.30, category: 'Transport', description: 'Essence Total', date: '2024-01-19' },
  { id: 6, amount: -67.45, category: 'Vêtements', description: 'H&M', date: '2024-01-20' },
  { id: 7, amount: -34.20, category: 'Santé', description: 'Pharmacie', date: '2024-01-21' },
  { id: 8, amount: -123.45, category: 'Alimentation', description: 'Courses Leclerc', date: '2024-01-22' },
]
