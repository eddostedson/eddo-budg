'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Goal {
  id: number
  title: string
  description: string
  targetAmount: number
  currentAmount: number
  deadline: string
  category: string
  status: 'active' | 'completed' | 'paused'
}

const mockGoals: Goal[] = [
  {
    id: 1,
    title: 'Vacances en Europe',
    description: 'Voyage de 2 semaines en Europe cet été',
    targetAmount: 3000,
    currentAmount: 1850,
    deadline: '2024-06-01',
    category: 'Loisirs',
    status: 'active'
  },
  {
    id: 2,
    title: 'Fonds d\'urgence',
    description: '6 mois de dépenses en réserve',
    targetAmount: 12000,
    currentAmount: 7500,
    deadline: '2024-12-31',
    category: 'Sécurité',
    status: 'active'
  },
  {
    id: 3,
    title: 'Nouvelle voiture',
    description: 'Apport pour achat véhicule électrique',
    targetAmount: 8000,
    currentAmount: 3200,
    deadline: '2024-09-15',
    category: 'Transport',
    status: 'active'
  },
  {
    id: 4,
    title: 'Formation développement',
    description: 'Cours en ligne et certifications',
    targetAmount: 1500,
    currentAmount: 1500,
    deadline: '2024-03-01',
    category: 'Éducation',
    status: 'completed'
  }
]

export default function GoalsPage() {
  const [goals] = useState<Goal[]>(mockGoals)
  const [, setShowNewGoalForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'paused'>('all')

  const filteredGoals = goals.filter(goal => 
    filterStatus === 'all' || goal.status === filterStatus
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100)
  }

  const getDaysRemaining = (deadline: string) => {
    const today = new Date()
    const target = new Date(deadline)
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'Loisirs': 'bg-purple-100 text-purple-800',
      'Sécurité': 'bg-green-100 text-green-800',
      'Transport': 'bg-blue-100 text-blue-800',
      'Éducation': 'bg-orange-100 text-orange-800',
      'Logement': 'bg-red-100 text-red-800',
      'Santé': 'bg-pink-100 text-pink-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé'
      case 'paused': return 'En pause'
      default: return 'Actif'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header section */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-blue-500">🎯</span>
              Objectifs d&apos;Épargne
            </h1>
            <Button 
              onClick={() => {
                setShowNewGoalForm(true);
                alert('Ouverture du formulaire de nouvel objectif');
              }}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              <span>➕</span>
              NOUVEL OBJECTIF
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'completed')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="all">Tous les objectifs</option>
              <option value="active">Actifs</option>
              <option value="completed">Terminés</option>
              <option value="paused">En pause</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <span className="text-blue-600">🎯</span>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Objectifs Actifs</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {goals.filter(g => g.status === 'active').length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                    <span className="text-green-600">✅</span>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Objectifs Atteints</div>
                  <div className="text-2xl font-bold text-green-600">
                    {goals.filter(g => g.status === 'completed').length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                    <span className="text-purple-600">💰</span>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Total Épargné</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(goals.reduce((sum, g) => sum + g.currentAmount, 0))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                    <span className="text-orange-600">🎯</span>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Objectif Total</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(goals.reduce((sum, g) => sum + g.targetAmount, 0))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((goal) => {
            const progress = getProgressPercentage(goal.currentAmount, goal.targetAmount)
            const daysRemaining = getDaysRemaining(goal.deadline)
            
            return (
              <Card key={goal.id} className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                        {goal.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{goal.description}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(goal.category)}`}>
                        {goal.category}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                        {getStatusText(goal.status)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Progression</span>
                        <span className="font-semibold text-gray-900">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            goal.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Amount info */}
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-500">Épargné</div>
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(goal.currentAmount)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Objectif</div>
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(goal.targetAmount)}
                        </div>
                      </div>
                    </div>

                    {/* Deadline info */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Échéance</span>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {formatDate(goal.deadline)}
                        </div>
                        {goal.status === 'active' && (
                          <div className={`text-xs ${daysRemaining > 30 ? 'text-green-600' : daysRemaining > 7 ? 'text-orange-600' : 'text-red-600'}`}>
                            {daysRemaining > 0 ? `${daysRemaining} jours restants` : 'Échéance dépassée'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    {goal.status === 'active' && (
                      <div className="flex gap-2 pt-2">
                        <Button 
                          onClick={() => alert(`Ajout de fonds à l'objectif: ${goal.title}`)}
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs"
                        >
                          💰 Ajouter
                        </Button>
                        <Button 
                          onClick={() => alert(`Modification de l'objectif: ${goal.title}`)}
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs"
                        >
                          ✏️ Modifier
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Empty state */}
        {filteredGoals.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun objectif trouvé</h3>
            <p className="text-gray-500 mb-4">Créez votre premier objectif d&apos;épargne pour commencer.</p>
            <Button 
              onClick={() => {
                setShowNewGoalForm(true);
                alert('Ouverture du formulaire de nouvel objectif');
              }}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              Créer un objectif
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
