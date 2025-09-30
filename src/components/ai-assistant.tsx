'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBudgets } from '@/contexts/budget-context'
import { useTransactions } from '@/contexts/transaction-context'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card' // ✅ Supprimé car non utilisé

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  type?: 'text' | 'suggestion' | 'analysis'
}

interface AIInsight {
  type: 'warning' | 'tip' | 'prediction'
  title: string
  description: string
  action?: string
}

export function AIAssistant() {
  const { budgets } = useBudgets()
  const { transactions } = useTransactions()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Bonjour ! 👋 Je suis votre assistant financier IA. Je peux vous aider à analyser vos dépenses, prédire vos budgets et optimiser votre gestion financière. Comment puis-je vous aider ?',
      timestamp: new Date(),
      type: 'text'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // ✅ Insights basés sur les VRAIES données
  const getRealInsights = (): AIInsight[] => {
    // Si pas de données, afficher des messages d'encouragement
    if (budgets.length === 0 && transactions.length === 0) {
      return [
        {
          type: 'tip',
          title: '🎯 Commencez votre analyse financière',
          description: 'Créez votre premier budget et ajoutez quelques transactions pour obtenir des insights personnalisés.',
          action: 'Créer un budget'
        },
        {
          type: 'tip',
          title: '💡 Première étape recommandée',
          description: '1. Créez un budget mensuel 2. Ajoutez vos premières transactions 3. Obtenez des insights IA personnalisés',
          action: 'Commencer'
        }
      ]
    }

    // Si il y a des données, générer des insights basés sur les vraies données
    const insights: AIInsight[] = []
    
    // Analyse des budgets
    if (budgets.length > 0) {
      const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0)
      const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0)
      const totalRemaining = budgets.reduce((sum, budget) => sum + budget.remaining, 0)
      
      if (totalSpent > totalBudget * 0.8) {
        insights.push({
          type: 'warning',
          title: 'Budget en voie de dépassement',
          description: `Vous avez dépensé ${Math.round((totalSpent / totalBudget) * 100)}% de votre budget total.`,
          action: 'Voir les détails'
        })
      }
      
      if (totalRemaining > totalBudget * 0.5) {
        insights.push({
          type: 'tip',
          title: 'Économie disponible',
          description: `Vous avez encore ${totalRemaining.toLocaleString()} F CFA disponibles dans vos budgets.`,
          action: 'Optimiser'
        })
      }
    }
    
    // Analyse des transactions
    if (transactions.length > 0) {
      const totalTransactions = transactions.length
      const avgTransaction = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / totalTransactions
      
      insights.push({
        type: 'prediction',
        title: 'Analyse de vos habitudes',
        description: `Basé sur vos ${totalTransactions} transactions, montant moyen: ${avgTransaction.toFixed(0)} F CFA.`,
        action: 'Analyser'
      })
    }
    
    return insights
  }

  const aiInsights = getRealInsights()

  const simulateAIResponse = async (userMessage: string) => {
    setIsTyping(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    let response = ''
    const lowerMessage = userMessage.toLowerCase()
    
    if (lowerMessage.includes('budget') || lowerMessage.includes('dépense')) {
      response = `📊 D'après l'analyse de vos données, voici ce que je constate :

• Vos dépenses moyennes sont de 2,150€/mois
• Votre catégorie principale est "Alimentation" (35%)
• Tendance : +12% vs mois dernier

💡 **Recommandations IA** :
- Réduire les achats impulsifs le weekend
- Optimiser vos abonnements (3 services non utilisés détectés)
- Prévoir une épargne automatique de 300€/mois

Voulez-vous que je génère un plan d'optimisation personnalisé ?`
    } else if (lowerMessage.includes('économie') || lowerMessage.includes('épargne')) {
      response = `💰 **Analyse d'optimisation IA** :

Potentiel d'économie détecté : **450€/mois**

🎯 **Actions prioritaires** :
1. Abonnements inutiles : -89€/mois
2. Optimisation courses : -180€/mois  
3. Transport partagé : -120€/mois
4. Négociation assurances : -61€/mois

📈 **Impact sur 12 mois** : 5,400€ d'économies !

Souhaitez-vous que je configure ces optimisations automatiquement ?`
    } else if (lowerMessage.includes('prédiction') || lowerMessage.includes('prévision')) {
      response = `🔮 **Prédictions IA pour les 3 prochains mois** :

**Février 2024** : 2,350€ (+8.5%)
- Pic prévu : Saint-Valentin (+150€)
- Économie possible : 280€

**Mars 2024** : 2,180€ (-2.1%)
- Retour à la normale post-fêtes
- Opportunité épargne : 320€

**Avril 2024** : 2,420€ (+12.3%)
- Vacances de Pâques prévues
- Budget recommandé : 2,600€

🧠 **Confiance de prédiction** : 87%
Basé sur 18 mois d'historique et patterns saisonniers.`
    } else {
      response = `🤖 Je comprends votre question ! Voici comment je peux vous aider :

**Analyses disponibles** :
• 📊 Analyse détaillée de vos dépenses
• 🔮 Prédictions budgétaires intelligentes  
• 💡 Suggestions d'optimisation personnalisées
• ⚠️ Alertes et recommandations proactives

**Exemples de questions** :
- "Analyse mes dépenses du mois"
- "Comment économiser plus ?"
- "Prédis mes dépenses futures"
- "Optimise mon budget alimentation"

Que souhaitez-vous explorer en premier ?`
    }

    const assistantMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      type: 'analysis'
    }

    setMessages(prev => [...prev, assistantMessage])
    setIsTyping(false)
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    
    await simulateAIResponse(inputValue)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* AI Insights Panel */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          🧠 Insights IA
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {aiInsights.map((insight, index) => (
            <div key={index} className="glass-card rounded-xl p-4 transition-all duration-300 hover:scale-105">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  insight.type === 'warning' ? 'bg-red-500/20 text-red-400' :
                  insight.type === 'tip' ? 'bg-green-500/20 text-green-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {insight.type === 'warning' ? '⚠️' : insight.type === 'tip' ? '💡' : '🔮'}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium text-sm mb-1">{insight.title}</h3>
                  <p className="text-slate-300 text-xs mb-2">{insight.description}</p>
                  {insight.action && (
                    <Button variant="ghost" size="sm" className="text-xs h-6 px-2 text-slate-400 hover:text-white">
                      {insight.action}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Chat Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full app-icon shadow-lg hover:scale-110 transition-all duration-300"
        >
          <span className="text-2xl">🤖</span>
        </Button>
      </div>

      {/* AI Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] glass-card rounded-2xl border border-slate-600/30 shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-600/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 app-icon rounded-full flex items-center justify-center">
                🤖
              </div>
              <div>
                <h3 className="text-white font-semibold">Assistant IA</h3>
                <p className="text-slate-400 text-xs">En ligne</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white w-8 h-8 p-0"
            >
              ✕
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'glass-card text-white'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="glass-card rounded-2xl p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-slate-400 text-xs">Assistant IA réfléchit...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-600/30">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question..."
                className="flex-1 glass-card border-slate-500/30 text-white placeholder:text-slate-400 rounded-xl bg-slate-700/50"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="px-4 app-icon rounded-xl"
              >
                <span className="text-lg">📤</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
