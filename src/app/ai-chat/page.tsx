'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { useRecettes } from '@/contexts/recette-context'
import { useDepenses } from '@/contexts/depense-context'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIChatPage() {
  const router = useRouter()
  const supabase = createClient()
  const { recettes, getTotalRecettes, getTotalDisponible } = useRecettes()
  const { depenses } = useDepenses()
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }
      setLoading(false)
      // Message de bienvenue
      addAssistantMessage(
        "👋 Bonjour ! Je suis votre assistant financier IA. Je connais toutes vos recettes et dépenses. Posez-moi n'importe quelle question sur vos finances ! Par exemple :\n\n" +
        "• Quel est mon solde actuel ?\n" +
        "• Combien j'ai dépensé ce mois-ci ?\n" +
        "• Quelles sont mes plus grandes dépenses ?\n" +
        "• Puis-je me permettre une dépense de 50 000 FCFA ?\n" +
        "• Comment optimiser mon budget ?"
      )
    }
    checkAuth()
  }, [router, supabase.auth])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const addAssistantMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date()
    }])
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
  }

  const getTotalDepenses = () => {
    return depenses.reduce((total, depense) => total + depense.montant, 0)
  }

  const getSolde = () => {
    return getTotalRecettes() - getTotalDepenses()
  }

  const analyzeQuestion = async (question: string): Promise<string> => {
    const q = question.toLowerCase()

    // Analyse du solde
    if (q.includes('solde') || q.includes('reste') || q.includes('disponible')) {
      const solde = getSolde()
      return `💰 Votre solde actuel est de **${formatCurrency(solde)}**.\n\n` +
        `📊 Détails :\n` +
        `• Total recettes : ${formatCurrency(getTotalRecettes())}\n` +
        `• Total dépenses : ${formatCurrency(getTotalDepenses())}\n` +
        `• Solde disponible : ${formatCurrency(getTotalDisponible())}\n\n` +
        (solde > 0 
          ? `✅ Excellente santé financière ! Vous êtes en excédent.` 
          : `⚠️ Attention, vous êtes en déficit. Pensez à réduire vos dépenses.`)
    }

    // Total des recettes
    if (q.includes('recette') && (q.includes('total') || q.includes('combien'))) {
      const total = getTotalRecettes()
      return `💰 Vous avez **${recettes.length} recette(s)** pour un total de **${formatCurrency(total)}**.\n\n` +
        `📋 Détail de vos recettes :\n` +
        recettes.map(r => `• ${r.libelle} : ${formatCurrency(r.montant)} (Solde : ${formatCurrency(r.soldeDisponible)})`).join('\n') +
        `\n\n✨ Conseil : Diversifiez vos sources de revenus pour plus de stabilité !`
    }

    // Total des dépenses
    if (q.includes('dépens') && (q.includes('total') || q.includes('combien'))) {
      const total = getTotalDepenses()
      return `💸 Vous avez effectué **${depenses.length} dépense(s)** pour un total de **${formatCurrency(total)}**.\n\n` +
        `📋 Détail de vos dépenses :\n` +
        depenses.slice(0, 5).map(d => `• ${d.libelle} : ${formatCurrency(d.montant)} (${new Date(d.date).toLocaleDateString('fr-FR')})`).join('\n') +
        (depenses.length > 5 ? `\n• ... et ${depenses.length - 5} autres dépenses` : '')
    }

    // Plus grande dépense
    if (q.includes('plus grand') || q.includes('plus élevé') || q.includes('maximum')) {
      if (depenses.length === 0) {
        return `📭 Vous n'avez aucune dépense enregistrée pour le moment.`
      }
      const maxDepense = depenses.reduce((max, d) => d.montant > max.montant ? d : max)
      return `🔝 Votre plus grande dépense est **"${maxDepense.libelle}"** d'un montant de **${formatCurrency(maxDepense.montant)}** le ${new Date(maxDepense.date).toLocaleDateString('fr-FR')}.\n\n` +
        `💡 Astuce : Vérifiez si cette dépense était vraiment nécessaire et si elle correspond à vos priorités financières.`
    }

    // Moyenne des dépenses
    if (q.includes('moyenne')) {
      if (depenses.length === 0) {
        return `📭 Vous n'avez aucune dépense pour calculer une moyenne.`
      }
      const moyenne = getTotalDepenses() / depenses.length
      return `📊 La moyenne de vos dépenses est de **${formatCurrency(moyenne)}**.\n\n` +
        `Les dépenses supérieures à cette moyenne :\n` +
        depenses.filter(d => d.montant > moyenne).map(d => `• ${d.libelle} : ${formatCurrency(d.montant)}`).join('\n') +
        `\n\n💡 Surveillez les dépenses au-dessus de la moyenne pour optimiser votre budget.`
    }

    // Puis-je me permettre une dépense ?
    const montantMatch = q.match(/(\d+[\s,.]?\d*)\s*(fcfa|f|franc)?/)
    if ((q.includes('puis-je') || q.includes('peux') || q.includes('permettre') || q.includes('acheter')) && montantMatch) {
      const montant = parseFloat(montantMatch[1].replace(/[\s,.]/g, ''))
      const solde = getSolde()
      const pourcentage = (montant / solde) * 100
      
      if (montant <= solde) {
        return `✅ **Oui, vous pouvez vous permettre cette dépense de ${formatCurrency(montant)} !**\n\n` +
          `📊 Analyse :\n` +
          `• Solde actuel : ${formatCurrency(solde)}\n` +
          `• Après dépense : ${formatCurrency(solde - montant)}\n` +
          `• Cette dépense représente ${pourcentage.toFixed(1)}% de votre solde\n\n` +
          (pourcentage > 30 
            ? `⚠️ Attention : Cette dépense est significative (>${pourcentage.toFixed(0)}% de votre solde). Assurez-vous qu'elle est bien nécessaire.` 
            : `✨ Cette dépense est raisonnable par rapport à votre solde.`)
      } else {
        return `❌ **Non, cette dépense de ${formatCurrency(montant)} dépasse votre solde actuel.**\n\n` +
          `📊 Situation :\n` +
          `• Solde actuel : ${formatCurrency(solde)}\n` +
          `• Montant manquant : ${formatCurrency(montant - solde)}\n\n` +
          `💡 Suggestions :\n` +
          `• Attendez votre prochaine recette\n` +
          `• Cherchez une alternative moins chère\n` +
          `• Réduisez d'autres dépenses non essentielles`
      }
    }

    // Conseils d'optimisation
    if (q.includes('conseil') || q.includes('optimis') || q.includes('améliorer') || q.includes('économis')) {
      const tauxEpargne = ((getTotalRecettes() - getTotalDepenses()) / getTotalRecettes()) * 100
      return `🎯 **Conseils pour optimiser vos finances :**\n\n` +
        `📊 Votre taux d'épargne actuel : **${tauxEpargne.toFixed(1)}%**\n` +
        (tauxEpargne < 20 ? `⚠️ Objectif recommandé : 20%\n\n` : `✅ Excellent ! Vous dépassez les 20% recommandés.\n\n`) +
        `💡 Recommandations :\n` +
        `• Mettez en place un virement automatique vers l'épargne\n` +
        `• Utilisez la règle des 24h pour les achats non essentiels\n` +
        `• Suivez la règle 50/30/20 : 50% besoins, 30% envies, 20% épargne\n` +
        `• Comparez les prix avant chaque achat important\n` +
        `• Planifiez vos repas pour réduire les dépenses alimentaires\n\n` +
        `📈 Si vous économisiez 10% de plus, vous auriez ${formatCurrency(getTotalRecettes() * 0.1)} supplémentaires !`
    }

    // Prédiction/Projection
    if (q.includes('prévision') || q.includes('prédic') || q.includes('futur') || q.includes('prochain')) {
      if (depenses.length === 0) {
        return `📭 Pas assez de données pour faire une prédiction. Ajoutez quelques dépenses d'abord.`
      }
      const moyenneJournaliere = getTotalDepenses() / depenses.length
      const projectionMensuelle = moyenneJournaliere * 30
      return `🔮 **Projection financière :**\n\n` +
        `📊 Basé sur vos ${depenses.length} dépenses :\n` +
        `• Dépense moyenne : ${formatCurrency(moyenneJournaliere)}\n` +
        `• Projection mensuelle : ${formatCurrency(projectionMensuelle)}\n\n` +
        `💰 Pour maintenir un solde positif, visez au moins ${formatCurrency(projectionMensuelle)} de recettes par mois.\n\n` +
        `✨ Tendance : ${projectionMensuelle < getTotalRecettes() ? '✅ Vous êtes sur la bonne voie !' : '⚠️ Vos dépenses dépassent vos recettes actuelles.'}`
    }

    // Statistiques générales
    if (q.includes('statistic') || q.includes('résumé') || q.includes('vue d\'ensemble')) {
      return `📊 **Résumé de vos finances :**\n\n` +
        `💰 **Recettes :**\n` +
        `• Nombre : ${recettes.length}\n` +
        `• Total : ${formatCurrency(getTotalRecettes())}\n` +
        `• Disponible : ${formatCurrency(getTotalDisponible())}\n\n` +
        `💸 **Dépenses :**\n` +
        `• Nombre : ${depenses.length}\n` +
        `• Total : ${formatCurrency(getTotalDepenses())}\n` +
        `• Moyenne : ${formatCurrency(depenses.length > 0 ? getTotalDepenses() / depenses.length : 0)}\n\n` +
        `📈 **Bilan :**\n` +
        `• Solde : ${formatCurrency(getSolde())}\n` +
        `• Taux d'épargne : ${((getTotalRecettes() - getTotalDepenses()) / getTotalRecettes() * 100).toFixed(1)}%\n` +
        `• Santé financière : ${getSolde() > 0 ? '✅ Excellente' : '⚠️ À surveiller'}`
    }

    // Recettes spécifiques
    if (q.includes('quelle recette') || q.includes('mes recettes')) {
      if (recettes.length === 0) {
        return `📭 Vous n'avez aucune recette enregistrée. Créez-en une pour commencer !`
      }
      return `💰 **Vos ${recettes.length} recette(s) :**\n\n` +
        recettes.map((r, i) => 
          `**${i + 1}. ${r.libelle}**\n` +
          `   • Montant initial : ${formatCurrency(r.montant)}\n` +
          `   • Solde disponible : ${formatCurrency(r.soldeDisponible)}\n` +
          `   • Source : ${r.source}\n` +
          `   • Statut : ${r.statut}\n`
        ).join('\n') +
        `\n✨ Conseil : La recette "${recettes.reduce((max, r) => r.soldeDisponible > max.soldeDisponible ? r : max).libelle}" a le plus de fonds disponibles !`
    }

    // Comparaison
    if (q.includes('compar')) {
      const ratio = (getTotalDepenses() / getTotalRecettes()) * 100
      return `📊 **Comparaison Recettes vs Dépenses :**\n\n` +
        `💰 Recettes totales : ${formatCurrency(getTotalRecettes())}\n` +
        `💸 Dépenses totales : ${formatCurrency(getTotalDepenses())}\n` +
        `📈 Différence : ${formatCurrency(Math.abs(getSolde()))}\n\n` +
        `📉 Vous dépensez **${ratio.toFixed(1)}%** de vos recettes.\n\n` +
        (ratio < 80 
          ? `✅ Excellent ! Vous gérez bien votre budget.` 
          : ratio < 100 
            ? `⚠️ Attention, vous approchez du seuil critique.`
            : `❌ Vous dépensez plus que vos revenus !`)
    }

    // Question par défaut
    return `🤔 Je n'ai pas bien compris votre question. Voici ce que je peux vous aider à savoir :\n\n` +
      `💡 **Questions courantes :**\n` +
      `• "Quel est mon solde ?"\n` +
      `• "Combien j'ai de recettes ?"\n` +
      `• "Quelle est ma plus grande dépense ?"\n` +
      `• "Puis-je me permettre 50000 FCFA ?"\n` +
      `• "Donne-moi des conseils pour économiser"\n` +
      `• "Quelle est ma projection pour ce mois ?"\n` +
      `• "Fais-moi un résumé de mes finances"\n\n` +
      `📊 Posez-moi votre question autrement, je suis là pour vous aider !`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Ajouter le message de l'utilisateur
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simuler un délai de réflexion
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Analyser et répondre
    const response = await analyzeQuestion(input)
    addAssistantMessage(response)
    setIsTyping(false)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-6 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/accueil')}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all"
            >
              ← Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-lg rounded-full flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Chat Financier IA</h1>
                <p className="text-sm text-indigo-100">Assistant intelligent personnel</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">En ligne</span>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                    : 'bg-white shadow-lg border border-gray-100'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🤖</span>
                    <span className="text-xs text-gray-500 font-medium">Assistant IA</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap break-words">{message.content}</div>
                <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white shadow-lg border border-gray-100 rounded-2xl px-6 py-4 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🤖</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question sur vos finances..."
              className="flex-1 px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all text-gray-900 placeholder-gray-400"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Envoyer 🚀
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}































