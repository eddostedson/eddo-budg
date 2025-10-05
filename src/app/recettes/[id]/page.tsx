'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { useRecettes } from '@/contexts/recette-context'
import { useDepenses } from '@/contexts/depense-context'

export default function RecetteDetailPage() {
  const router = useRouter()
  const params = useParams()
  const recetteId = params.id as string
  
  const { recettes } = useRecettes()
  const { depenses } = useDepenses()
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const recette = recettes.find(r => r.id === recetteId)
  const depensesLiees = depenses.filter(d => d.recetteId === recetteId)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }
      setLoading(false)
    }
    checkAuth()
  }, [router, supabase.auth])

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

  if (!recette) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Recette introuvable</h1>
          <button
            onClick={() => router.push('/recettes')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            ← Retour aux recettes
          </button>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
  }

  const totalDepense = depensesLiees.reduce((sum, d) => sum + d.montant, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          {/* Navigation */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/recettes')}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              ← Retour aux recettes
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
              <span className="text-5xl">💰</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">{recette.libelle}</h1>
              <p className="text-blue-100">{recette.description}</p>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4 border border-white border-opacity-20">
              <p className="text-blue-100 text-xs font-medium mb-1">MONTANT INITIAL</p>
              <p className="text-2xl font-bold">{formatCurrency(recette.montant)}</p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4 border border-white border-opacity-20">
              <p className="text-blue-100 text-xs font-medium mb-1">TOTAL DÉPENSÉ</p>
              <p className="text-2xl font-bold text-red-300">{formatCurrency(totalDepense)}</p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4 border border-white border-opacity-20">
              <p className="text-blue-100 text-xs font-medium mb-1">SOLDE DISPONIBLE</p>
              <p className="text-2xl font-bold text-green-300">{formatCurrency(recette.soldeDisponible)}</p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4 border border-white border-opacity-20">
              <p className="text-blue-100 text-xs font-medium mb-1">NOMBRE DE DÉPENSES</p>
              <p className="text-2xl font-bold">{depensesLiees.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations de la Recette */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span>📋</span>
                Informations
              </h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Source</p>
                  <p className="text-gray-900">{recette.source}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Date de réception</p>
                  <p className="text-gray-900">{new Date(recette.dateReception).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Date de création</p>
                  <p className="text-gray-900">{new Date(recette.createdAt).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(recette.createdAt).toLocaleTimeString('fr-FR')}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Catégorie</p>
                  <p className="text-gray-900">{recette.categorie || '-'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Périodicité</p>
                  <p className="text-gray-900 capitalize">{recette.periodicite}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Statut</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    recette.statut === 'reçue' ? 'bg-green-100 text-green-700' :
                    recette.statut === 'attendue' ? 'bg-yellow-100 text-yellow-700' :
                    recette.statut === 'retardée' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {recette.statut}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tableau des Transactions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
              {/* Header du tableau */}
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-6 py-5">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="text-3xl">📊</span>
                  Relevé de Transactions
                </h2>
                <p className="text-blue-100 text-sm mt-1">Historique complet des mouvements</p>
              </div>

              {/* Tableau */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Libellé
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-green-700 uppercase tracking-wider">
                        Crédit (+)
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-red-700 uppercase tracking-wider">
                        Débit (-)
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-blue-700 uppercase tracking-wider">
                        Solde
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* Ligne de création de la recette (CRÉDIT) */}
                    <tr className="bg-green-50 hover:bg-green-100 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">✨</span>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {new Date(recette.dateReception).toLocaleDateString('fr-FR', { 
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(recette.createdAt).toLocaleTimeString('fr-FR', { 
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-bold text-gray-900">RECETTE CRÉÉE</div>
                          <div className="text-xs text-gray-600">{recette.libelle}</div>
                          <div className="text-xs text-green-600 font-medium mt-1">Source: {recette.source}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-lg font-bold text-green-600">
                          + {formatCurrency(recette.montant)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-gray-400">-</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 border border-blue-300">
                          <span className="text-sm font-bold text-blue-700">
                            {formatCurrency(recette.montant)}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Lignes des dépenses (DÉBIT) */}
                    {depensesLiees
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((depense, index) => {
                        // Calculer le solde après chaque dépense
                        const soldeApres = recette.montant - depensesLiees
                          .filter(d => new Date(d.date).getTime() <= new Date(depense.date).getTime())
                          .reduce((sum, d) => sum + d.montant, 0)
                        
                        return (
                          <tr key={depense.id} className="bg-red-50 hover:bg-red-100 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">💸</span>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">
                                    {new Date(depense.date).toLocaleDateString('fr-FR', { 
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(depense.createdAt).toLocaleTimeString('fr-FR', { 
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-bold text-gray-900">{depense.libelle}</div>
                                <div className="text-xs text-gray-600">{depense.description || 'Pas de description'}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm text-gray-400">-</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-lg font-bold text-red-600">
                                - {formatCurrency(depense.montant)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className={`inline-flex items-center px-3 py-1 rounded-full ${
                                soldeApres > 0 
                                  ? 'bg-blue-100 border border-blue-300' 
                                  : 'bg-red-100 border border-red-300'
                              }`}>
                                <span className={`text-sm font-bold ${
                                  soldeApres > 0 ? 'text-blue-700' : 'text-red-700'
                                }`}>
                                  {formatCurrency(soldeApres)}
                                </span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>

                  {/* Footer avec solde final */}
                  <tfoot>
                    <tr className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
                      <td colSpan={2} className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">💰</span>
                          <div>
                            <div className="text-sm font-medium uppercase tracking-wide opacity-90">Solde Final</div>
                            <div className="text-xs opacity-75">Au {new Date().toLocaleDateString('fr-FR')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="text-sm opacity-90">Total Crédit</div>
                        <div className="text-lg font-bold">{formatCurrency(recette.montant)}</div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="text-sm opacity-90">Total Débit</div>
                        <div className="text-lg font-bold">{formatCurrency(totalDepense)}</div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className={`inline-flex items-center px-4 py-2 rounded-xl font-bold text-xl shadow-lg ${
                          recette.soldeDisponible > 0 
                            ? 'bg-green-400 text-green-900' 
                            : 'bg-red-400 text-red-900'
                        }`}>
                          {formatCurrency(recette.soldeDisponible)}
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Message si aucune dépense */}
              {depensesLiees.length === 0 && (
                <div className="bg-yellow-50 border-t border-yellow-200 px-6 py-8">
                  <div className="text-center">
                    <div className="text-5xl mb-3">📭</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Aucune dépense enregistrée</h3>
                    <p className="text-gray-600 text-sm mb-4">Cette recette n&apos;a pas encore été utilisée pour des dépenses</p>
                    <button
                      onClick={() => router.push('/depenses')}
                      className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      Créer une dépense
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

