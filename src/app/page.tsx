'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { AIAssistant } from '@/components/ai-assistant'
import { Budget } from '@/lib/shared-data'
import { useBudgets } from '@/contexts/budget-context'
import { CFAAmount } from '@/components/ui/cfa-logo'

interface SupabaseStatus {
  success: boolean
  message: string
  user: { id: string; email: string } | null
  connection: string
  error?: string
}

// Interface Budget maintenant importée de shared-data

export default function Page() {
  const [status, setStatus] = useState<SupabaseStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewBudgetModal, setShowNewBudgetModal] = useState(false)
  const [selectedColor, setSelectedColor] = useState('bg-purple-500')
  
  // ✅ Utilisation du Context global
  const { budgets, addBudget } = useBudgets()
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    period: 'Mensuel'
  })
  
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    const checkSupabaseStatus = async () => {
      try {
        const response = await fetch('/api/ping-supabase')
        const data = await response.json()
        setStatus(data)
      } catch (error) {
        setStatus({
          success: false,
          message: 'Failed to connect to Supabase',
          user: null,
          connection: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      } finally {
        setLoading(false)
      }
    }

    checkSupabaseStatus()
  }, [])

  // Fonction pour créer un nouveau budget
  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.amount) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    // ✅ Utilisation du Context global
    addBudget({
      name: formData.name,
      description: formData.description,
      amount: parseFloat(formData.amount),
      spent: 0, // ✅ Nouveau budget, pas encore dépensé
      remaining: parseFloat(formData.amount), // ✅ Solde initial = montant total
      period: formData.period,
      color: selectedColor
    })
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      amount: '',
      period: 'Mensuel'
    })
    setSelectedColor('bg-purple-500')
    setShowNewBudgetModal(false)
    
    alert('Budget créé avec succès !')
  }

  // Filtrer les budgets selon la recherche
  const filteredBudgets = budgets.filter(budget => 
    budget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    budget.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            💰 Compta MVP — Hello 👋
          </h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-2 text-gray-300">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2">Bienvenue</CardTitle>
            <CardDescription>
              Connectez-vous pour accéder à votre dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/auth">
              <Button size="lg" className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-slate-900 font-semibold">
                Se connecter
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header section */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-blue-500">💰</span>
              Budgets
            </h1>
            <button 
              onClick={() => setShowNewBudgetModal(true)}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              <span>➕</span>
              CRÉER UN BUDGET
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Filtre et recherche"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            <button 
              onClick={() => alert('Corbeille - Budgets supprimés')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              CORBEILLE
            </button>
            <Link href="/settings" className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              ⚙️
            </Link>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create new budget card */}
          <div 
            onClick={() => setShowNewBudgetModal(true)}
            className="new-site-card h-64 flex flex-col items-center justify-center cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
              <span className="text-2xl text-gray-500 group-hover:text-blue-500">➕</span>
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Nouveau budget</h3>
          </div>

          {/* Budget cards dynamiques */}
          {filteredBudgets.map((budget) => (
            <Link 
              key={budget.id} 
              href={`/budgets/${budget.id}`} 
              className="site-card h-64 overflow-hidden cursor-pointer group relative block"
            >
              <div className={`h-32 bg-gradient-to-br ${budget.color} to-${budget.color.split('-')[1]}-600 relative`}>
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-semibold text-lg mb-1">{budget.name}</h3>
                  <p className="text-white/80 text-sm">{budget.description}</p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">
                    {budget.period.toUpperCase()} • <CFAAmount amount={budget.amount} />
                  </span>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      alert(`Actions pour ${budget.name}: Modifier, Supprimer, Dupliquer`);
                    }}
                    className="flex items-center gap-2 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                  >
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">ACTIONS</span>
                    <span className="text-xs">▼</span>
                  </button>
                </div>
                
                {/* Barre de progression et solde */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Dépensé:</span>
                    <span className="font-medium text-red-600">
                      <CFAAmount amount={budget.spent} />
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Restant:</span>
                    <span className="font-medium text-green-600">
                      <CFAAmount amount={budget.remaining} />
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        budget.remaining > 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ 
                        width: `${Math.min(100, (budget.spent / budget.amount) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* Message si aucun budget trouvé */}
          {filteredBudgets.length === 0 && searchQuery && (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun budget trouvé</h3>
              <p className="text-gray-500">Aucun budget ne correspond à votre recherche "{searchQuery}".</p>
            </div>
          )}
        </div>

        {/* Help section */}
        <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Besoin d'aide avec votre budget ?</h3>
              <p className="text-gray-600">Commandez un développement auprès de nos partenaires</p>
            </div>
            <button 
              onClick={() => alert('Redirection vers nos partenaires financiers')}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              COMMANDEZ MAINTENANT
            </button>
          </div>
        </div>
      </div>

      {/* Assistant IA */}
      <AIAssistant />

      {/* Modal de création de budget */}
      {showNewBudgetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Créer un nouveau budget</h2>
              <button 
                onClick={() => setShowNewBudgetModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form 
              onSubmit={handleCreateBudget}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du budget
                </label>
                <input
                  type="text"
                  placeholder="Ex: Budget Maison, Vacances été..."
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Description de votre budget..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant
                  </label>
                  <input
                    type="number"
                    placeholder="2500"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Période
                  </label>
                  <select 
                    value={formData.period}
                    onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="Mensuel">Mensuel</option>
                    <option value="Hebdomadaire">Hebdomadaire</option>
                    <option value="Annuel">Annuel</option>
                    <option value="Objectif">Objectif</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur du thème
                </label>
                <div className="flex gap-2">
                  {['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500', 'bg-indigo-500'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full ${color} border-2 transition-colors ${
                        selectedColor === color ? 'border-gray-600 scale-110' : 'border-transparent hover:border-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewBudgetModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Créer le budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}