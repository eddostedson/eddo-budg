'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true)
  const { transactions } = useTransactions()

  const handleQuery = () => {
    setIsLoading(true)
    
    // Pour l'instant, c'est une réponse simulée.
    // L'intégration réelle avec un service d'IA viendrait ici.
    const lowerCaseQuery = query.toLowerCase()
    if (lowerCaseQuery.includes('dépenses')) {
      const totalSpent = transactions.reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : 0), 0)
      setResponse(`Le total de vos dépenses est de ${totalSpent.toFixed(2)} FCFA.`)
    } else if (lowerCaseQuery.includes('revenus')) {
      const totalIncome = transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : 0), 0)
      setResponse(`Le total de vos revenus est de ${totalIncome.toFixed(2)} FCFA.`)
    } else {
      setResponse("Désolé, je peux seulement répondre à des questions sur les dépenses et les revenus pour le moment.")
    }
    
    setIsLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleQuery()
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
          {/* The following insights are no longer relevant as budgets are removed */}
          {/* {aiInsights.map((insight, index) => ( */}
          {/*   <div key={index} className="glass-card rounded-xl p-4 transition-all duration-300 hover:scale-105"> */}
          {/*     <div className="flex items-start gap-3"> */}
          {/*       <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${ */}
          {/*         insight.type === 'warning' ? 'bg-red-500/20 text-red-400' : */}
          {/*         insight.type === 'tip' ? 'bg-green-500/20 text-green-400' : */}
          {/*         'bg-blue-500/20 text-blue-400' */}
          {/*       }`}> */}
          {/*         {insight.type === 'warning' ? '⚠️' : insight.type === 'tip' ? '💡' : '🔮'} */}
          {/*       </div> */}
          {/*       <div className="flex-1"> */}
          {/*         <h3 className="text-white font-medium text-sm mb-1">{insight.title}</h3> */}
          {/*         <p className="text-slate-300 text-xs mb-2">{insight.description}</p> */}
          {/*         {insight.action && ( */}
          {/*           <Button variant="ghost" size="sm" className="text-xs h-6 px-2 text-slate-400 hover:text-white"> */}
          {/*             {insight.action} */}
          {/*           </Button> */}
          {/*         )} */}
          {/*       </div> */}
          {/*     </div> */}
          {/*   </div> */}
          {/* ))} */}
        </div>
      </div>

      {/* AI Chat Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsMinimized(!isMinimized)}
          className="w-14 h-14 rounded-full app-icon shadow-lg hover:scale-110 transition-all duration-300"
        >
          <span className="text-2xl">🤖</span>
        </Button>
      </div>

      {/* AI Chat Window */}
      {!isMinimized && (
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
              onClick={() => setIsMinimized(true)}
              className="text-slate-400 hover:text-white w-8 h-8 p-0"
            >
              ✕
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* The following messages are no longer relevant as budgets are removed */}
            {/* {messages.map((message) => ( */}
            {/*   <div */}
            {/*     key={message.id} */}
            {/*     className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`} */}
            {/*   > */}
            {/*     <div */}
            {/*       className={`max-w-[80%] rounded-2xl p-3 ${ */}
            {/*         message.role === 'user' */}
            {/*           ? 'bg-blue-500 text-white' */}
            {/*           : 'glass-card text-white' */}
            {/*       }`} */}
            {/*     > */}
            {/*       <div className="whitespace-pre-wrap text-sm">{message.content}</div> */}
            {/*       <div className="text-xs opacity-70 mt-1"> */}
            {/*         {message.timestamp.toLocaleTimeString('fr-FR', {  */}
            {/*           hour: '2-digit',  */}
            {/*           minute: '2-digit'  */}
            {/*         })} */}
            {/*       </div> */}
            {/*     </div> */}
            {/*   </div> */}
            {/* ))} */}
            
            {isLoading && (
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question..."
                className="flex-1 glass-card border-slate-500/30 text-white placeholder:text-slate-400 rounded-xl bg-slate-700/50"
                disabled={isLoading}
              />
              <Button
                onClick={handleQuery}
                disabled={!query.trim() || isLoading}
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
