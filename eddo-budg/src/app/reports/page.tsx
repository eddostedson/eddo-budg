'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  const reportData = {
    totalIncome: 4700.00,
    totalExpenses: 2150.00,
    savings: 2550.00,
    categoryBreakdown: [
      { category: 'Alimentation', amount: 680.00, percentage: 32 },
      { category: 'Transport', amount: 420.00, percentage: 20 },
      { category: 'Loisirs', amount: 380.00, percentage: 18 },
      { category: 'Santé', amount: 250.00, percentage: 12 },
      { category: 'Vêtements', amount: 180.00, percentage: 8 },
      { category: 'Divers', amount: 240.00, percentage: 11 },
    ]
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header section */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-blue-500">📈</span>
              Rapports
            </h1>
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => alert('Génération du rapport PDF en cours...')}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              📊 Exporter PDF
            </Button>
            <Button 
              onClick={() => alert('Rapport envoyé par email !')}
              variant="outline" 
              className="border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              📧 Envoyer par email
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Revenus Totaux</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(reportData.totalIncome)}
              </div>
              <p className="text-xs text-gray-500 mt-1">+12% vs période précédente</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Dépenses Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(reportData.totalExpenses)}
              </div>
              <p className="text-xs text-gray-500 mt-1">-5% vs période précédente</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Épargne</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(reportData.savings)}
              </div>
              <p className="text-xs text-gray-500 mt-1">+38% vs période précédente</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Taux d&apos;épargne</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((reportData.savings / reportData.totalIncome) * 100)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Objectif: 30%</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category breakdown */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Répartition par Catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.categoryBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ 
                          backgroundColor: `hsl(${index * 60}, 70%, 50%)` 
                        }}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">{item.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.amount)}
                      </div>
                      <div className="text-xs text-gray-500">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trends chart placeholder */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Évolution Mensuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">📈</div>
                  <p className="text-gray-500 text-sm">Graphique d&apos;évolution</p>
                  <p className="text-gray-400 text-xs mt-1">Intégration Chart.js à venir</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed analysis */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Analyse Détaillée</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Points Positifs</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">Épargne en hausse de 38%</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">Réduction des dépenses transport</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">Revenus stables et croissants</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Points d&apos;Attention</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">⚠</span>
                    <span className="text-sm text-gray-700">Dépenses loisirs en augmentation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">⚠</span>
                    <span className="text-sm text-gray-700">Budget alimentation à surveiller</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">⚠</span>
                    <span className="text-sm text-gray-700">Plusieurs achats impulsifs détectés</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="bg-blue-50 border border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
              💡 Recommandations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">1</span>
                </div>
                <div>
                  <h5 className="font-medium text-blue-900">Optimiser le budget alimentation</h5>
                  <p className="text-sm text-blue-700">Planifiez vos repas à l&apos;avance pour réduire les dépenses impulsives de 15-20%.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">2</span>
                </div>
                <div>
                  <h5 className="font-medium text-blue-900">Automatiser l&apos;épargne</h5>
                  <p className="text-sm text-blue-700">Mettez en place un virement automatique de 400€/mois pour atteindre votre objectif.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">3</span>
                </div>
                <div>
                  <h5 className="font-medium text-blue-900">Réviser les abonnements</h5>
                  <p className="text-sm text-blue-700">3 abonnements non utilisés détectés. Économie potentielle: 89€/mois.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
