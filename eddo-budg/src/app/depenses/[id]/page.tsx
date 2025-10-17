'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { useDepenses } from '@/contexts/depense-context'
import { useRecettes } from '@/contexts/recette-context'

export default function DepenseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const depenseId = params.id as string
  
  const { depenses } = useDepenses()
  const { recettes } = useRecettes()
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const depense = depenses.find(d => d.id.toString() === depenseId)
  const recetteAssociee = depense ? recettes.find(r => r.id === depense.recetteId) : null

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!depense) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Dépense introuvable</h1>
          <button
            onClick={() => router.push('/depenses')}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
          >
            ← Retour aux dépenses
          </button>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          {/* Navigation */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/depenses')}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              ← Retour aux dépenses
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
              <span className="text-5xl">💸</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">{depense.libelle}</h1>
              <p className="text-red-100">{depense.description || 'Pas de description'}</p>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4 border border-white border-opacity-20">
              <p className="text-red-100 text-xs font-medium mb-1">MONTANT DÉPENSÉ</p>
              <p className="text-2xl font-bold">{formatCurrency(depense.montant)}</p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4 border border-white border-opacity-20">
              <p className="text-red-100 text-xs font-medium mb-1">DATE DE DÉPENSE</p>
              <p className="text-2xl font-bold">{new Date(depense.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4 border border-white border-opacity-20">
              <p className="text-red-100 text-xs font-medium mb-1">RECETTE SOURCE</p>
              <p className="text-xl font-bold">{recetteAssociee ? recetteAssociee.libelle : 'Aucune'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations de la Dépense */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span>📋</span>
                Informations
              </h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Libellé</p>
                  <p className="text-gray-900 font-semibold">{depense.libelle}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Description</p>
                  <p className="text-gray-900">{depense.description || 'Pas de description'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Montant</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(depense.montant)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Date de la dépense</p>
                  <p className="text-gray-900">{new Date(depense.date).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Date de création</p>
                  <p className="text-gray-900">{new Date(depense.createdAt).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(depense.createdAt).toLocaleTimeString('fr-FR')}
                  </p>
                </div>
                
                {recetteAssociee && (
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-2">Recette associée</p>
                    <button
                      onClick={() => router.push(`/recettes/${recetteAssociee.id}`)}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-between"
                    >
                      <div className="text-left">
                        <div className="text-sm font-bold">{recetteAssociee.libelle}</div>
                        <div className="text-xs opacity-90">Cliquez pour voir les détails</div>
                      </div>
                      <span className="text-xl">→</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tableau de Transaction */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
              {/* Header du tableau */}
              <div className="bg-gradient-to-r from-red-600 via-orange-600 to-pink-600 px-6 py-5">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="text-3xl">📊</span>
                  Détail de la Transaction
                </h2>
                <p className="text-red-100 text-sm mt-1">Mouvement de sortie d&apos;argent</p>
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
                        Solde Recette
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* Ligne de la recette source (si disponible) */}
                    {recetteAssociee && (
                      <tr className="bg-green-50 hover:bg-green-100 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">💰</span>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {new Date(recetteAssociee.dateReception).toLocaleDateString('fr-FR', { 
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-500">Avant dépense</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-bold text-gray-900">RECETTE SOURCE</div>
                            <div className="text-xs text-gray-600">{recetteAssociee.libelle}</div>
                            <div className="text-xs text-green-600 font-medium mt-1">Solde avant cette dépense</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(recetteAssociee.montant)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm text-gray-400">-</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 border border-blue-300">
                            <span className="text-sm font-bold text-blue-700">
                              {formatCurrency(recetteAssociee.montant - (depenses.filter(d => d.recetteId === recetteAssociee.id).reduce((total, d) => total + d.montant, 0) - depense.montant))}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Ligne de la dépense (DÉBIT) */}
                    <tr className="bg-red-50 hover:bg-red-100 transition-colors">
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
                        {recetteAssociee ? (() => {
                          const soldeCorrect = recetteAssociee.montant - depenses.filter(d => d.recetteId === recetteAssociee.id).reduce((total, d) => total + d.montant, 0)
                          return (
                            <div className={`inline-flex items-center px-3 py-1 rounded-full ${
                              soldeCorrect > 0 
                                ? 'bg-blue-100 border border-blue-300' 
                                : 'bg-red-100 border border-red-300'
                            }`}>
                              <span className={`text-sm font-bold ${
                                soldeCorrect > 0 ? 'text-blue-700' : 'text-red-700'
                              }`}>
                                {formatCurrency(soldeCorrect)}
                              </span>
                            </div>
                          )
                        })() : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  </tbody>

                  {/* Footer avec impact */}
                  <tfoot>
                    <tr className="bg-gradient-to-r from-red-600 via-orange-600 to-pink-600 text-white">
                      <td colSpan={2} className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">📉</span>
                          <div>
                            <div className="text-sm font-medium uppercase tracking-wide opacity-90">Impact de la Dépense</div>
                            <div className="text-xs opacity-75">Déduction effectuée</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="text-sm opacity-90">Solde Avant</div>
                        <div className="text-lg font-bold">
                          {recetteAssociee ? formatCurrency(recetteAssociee.montant - (depenses.filter(d => d.recetteId === recetteAssociee.id).reduce((total, d) => total + d.montant, 0) - depense.montant)) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="text-sm opacity-90">Montant Dépensé</div>
                        <div className="text-lg font-bold">{formatCurrency(depense.montant)}</div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className={`inline-flex items-center px-4 py-2 rounded-xl font-bold text-xl shadow-lg ${
                          recetteAssociee && (recetteAssociee.montant - depenses.filter(d => d.recetteId === recetteAssociee.id).reduce((total, d) => total + d.montant, 0)) > 0
                            ? 'bg-green-400 text-green-900' 
                            : 'bg-red-400 text-red-900'
                        }`}>
                          {recetteAssociee ? formatCurrency(recetteAssociee.montant - depenses.filter(d => d.recetteId === recetteAssociee.id).reduce((total, d) => total + d.montant, 0)) : '-'}
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Message si aucune recette associée */}
              {!recetteAssociee && (
                <div className="bg-yellow-50 border-t border-yellow-200 px-6 py-8">
                  <div className="text-center">
                    <div className="text-5xl mb-3">⚠️</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Aucune recette associée</h3>
                    <p className="text-gray-600 text-sm mb-4">Cette dépense n&apos;est pas liée à une source de revenus</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => router.push('/depenses')}
                className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-gray-700 transition-all duration-200"
              >
                ← Retour à la liste
              </button>
              {recetteAssociee && (
                <button
                  onClick={() => router.push(`/recettes/${recetteAssociee.id}`)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Voir la recette source →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}




