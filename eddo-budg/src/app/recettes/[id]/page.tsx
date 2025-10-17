'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { useRecettes } from '@/contexts/recette-context'
import { useDepenses } from '@/contexts/depense-context'
import { useNotifications } from '@/contexts/notification-context'

export default function RecetteDetailPage() {
  const router = useRouter()
  const params = useParams()
  const recetteId = params.id as string
  
  const { recettes, updateRecette, refreshRecettes } = useRecettes()
  const { depenses, addDepense, refreshDepenses } = useDepenses()
  const { showSuccess, showError } = useNotifications()
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // États pour les versements supplémentaires
  const [showVersementModal, setShowVersementModal] = useState(false)
  const [versementData, setVersementData] = useState({
    montant: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })

  // États pour la création de dépense
  const [showDepenseModal, setShowDepenseModal] = useState(false)
  const [depenseData, setDepenseData] = useState({
    libelle: '',
    montant: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    categorie: ''
  })

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

  // Fonctions pour gérer les versements supplémentaires
  const handleVersementSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!versementData.montant || parseFloat(versementData.montant) <= 0) {
      showError("Montant invalide", "Veuillez saisir un montant valide.")
      return
    }

    try {
      const nouveauMontant = parseFloat(versementData.montant)
      const montantTotal = recette.montant + nouveauMontant
      
      // Ajouter le versement dans la description
      const nouvelleDescription = recette.description + 
        `\n\nVersement ajouté: ${formatCurrency(nouveauMontant)} FCFA - ${versementData.description || 'Versement supplémentaire'}`
      
      // Mettre à jour la recette avec le nouveau montant total et la description
      await updateRecette(recetteId, {
        ...recette,
        montant: montantTotal,
        soldeDisponible: recette.soldeDisponible + nouveauMontant,
        description: nouvelleDescription
      })

      // Rafraîchir les recettes pour s'assurer que tous les contextes sont à jour
      await refreshRecettes()
      
      // Notifier les autres composants qu'une recette a été mise à jour
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('recetteUpdated', { 
          detail: { recetteId, newAmount: montantTotal, newSolde: recette.soldeDisponible + nouveauMontant }
        }))
      }
      
      showSuccess(
        "Versement ajouté",
        `Versement de ${formatCurrency(nouveauMontant)} ajouté avec succès !`
      )
      
      setVersementData({ montant: '', description: '', date: new Date().toISOString().split('T')[0] })
      setShowVersementModal(false)
    } catch (error) {
      showError(
        "Erreur d'ajout",
        "Une erreur est survenue lors de l'ajout du versement."
      )
    }
  }

  // Fonctions pour gérer la création de dépense
  const handleDepenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!depenseData.libelle || !depenseData.montant) {
      showError("Erreur", "Veuillez remplir tous les champs obligatoires")
      return
    }

    const montant = parseFloat(depenseData.montant)
    if (montant <= 0) {
      showError("Erreur", "Le montant doit être supérieur à 0")
      return
    }

    if (montant > recette.soldeDisponible) {
      showError("Erreur", "Le montant de la dépense ne peut pas dépasser le solde disponible")
      return
    }

    try {
      await addDepense({
        libelle: depenseData.libelle,
        montant: montant,
        description: depenseData.description,
        date: depenseData.date,
        categorie: depenseData.categorie,
        recetteId: recetteId
      })

      // Mettre à jour le solde de la recette
      const nouveauSolde = recette.soldeDisponible - montant
      await updateRecette(recetteId, { soldeDisponible: nouveauSolde })

      showSuccess(
        "Dépense créée",
        `Dépense de ${formatCurrency(montant)} créée avec succès !`
      )
      
      setDepenseData({ 
        libelle: '', 
        montant: '', 
        description: '', 
        date: new Date().toISOString().split('T')[0],
        categorie: ''
      })
      setShowDepenseModal(false)
      
      // Rafraîchir les données
      refreshRecettes()
      refreshDepenses()
    } catch (error) {
      showError(
        "Erreur de création",
        "Une erreur est survenue lors de la création de la dépense."
      )
    }
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

  // Fonction pour calculer le montant initial (sans les versements)
  const getMontantInitial = () => {
    if (!recette.description.includes('Versement ajouté')) {
      return recette.montant
    }
    
    const versements = recette.description.split('\n')
      .filter(line => line.includes('Versement ajouté'))
      .reduce((total, line) => {
        const match = line.match(/Versement ajouté: ([\d\s,]+) FCFA/)
        if (match) {
          const amountStr = match[1].replace(/\s/g, '').replace(/,/g, '.')
          return total + parseFloat(amountStr)
        }
        return total
      }, 0)
    
    return recette.montant - versements
  }

  // Fonction pour obtenir tous les versements
  const getVersements = () => {
    if (!recette.description.includes('Versement ajouté')) {
      return []
    }
    
    return recette.description.split('\n')
      .filter(line => line.includes('Versement ajouté'))
      .map((line, index) => {
        const match = line.match(/Versement ajouté: ([\d\s,]+) FCFA/)
        if (match) {
          const amountStr = match[1].replace(/\s/g, '').replace(/,/g, '.')
          return {
            id: index,
            montant: parseFloat(amountStr),
            ligne: line
          }
        }
        return {
          id: index,
          montant: 0,
          ligne: line
        }
      })
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
              <p className="text-2xl font-bold text-green-300">{formatCurrency(recette.montant - totalDepense)}</p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4 border border-white border-opacity-20">
              <p className="text-blue-100 text-xs font-medium mb-1">NOMBRE DE DÉPENSES</p>
              <p className="text-2xl font-bold">{depensesLiees.length}</p>
            </div>
          </div>

          {/* Boutons d'Action */}
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={() => setShowVersementModal(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3 font-semibold text-lg"
            >
              <span className="text-2xl">💰</span>
              Ajouter un versement
            </button>
            
            <button
              onClick={() => setShowDepenseModal(true)}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-8 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3 font-semibold text-lg"
            >
              <span className="text-2xl">💸</span>
              Créer une dépense
            </button>
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

                {/* Historique des versements */}
                {recette.description.includes('Versement ajouté') && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <span>💰</span>
                      Historique des versements
                    </h3>
                    <div className="space-y-2">
                      {recette.description.split('\n').filter(line => line.includes('Versement ajouté')).map((line, index) => {
                        const match = line.match(/Versement ajouté: ([\d\s,]+) FCFA/)
                        if (match) {
                          return (
                            <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-green-700">Versement #{index + 1}</span>
                                <span className="text-sm font-bold text-green-800">{match[1]} FCFA</span>
                              </div>
                            </div>
                          )
                        }
                        return null
                      })}
                    </div>
                  </div>
                )}
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
                          <div className="text-sm font-bold text-gray-900">RECETTE INITIALE</div>
                          <div className="text-xs text-gray-600">{recette.libelle}</div>
                          <div className="text-xs text-blue-600 font-medium mt-1">Source: {recette.source}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-lg font-bold text-blue-600">
                          + {formatCurrency(getMontantInitial())}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-gray-400">-</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 border border-blue-300">
                          <span className="text-sm font-bold text-blue-700">
                            {formatCurrency(getMontantInitial())}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Lignes des versements (CRÉDIT) */}
                    {getVersements().map((versement, index) => {
                      const soldeApresVersement = getMontantInitial() + 
                        getVersements().slice(0, index + 1).reduce((total, v) => total + v.montant, 0)
                      
                      return (
                        <tr key={`versement-${versement.id}`} className="bg-green-50 hover:bg-green-100 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">💰</span>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {new Date(recette.updatedAt).toLocaleDateString('fr-FR', { 
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(recette.updatedAt).toLocaleTimeString('fr-FR', { 
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-bold text-gray-900">VERSEMENT AJOUTÉ</div>
                              <div className="text-xs text-gray-600">Versement #{index + 1}</div>
                              <div className="text-xs text-green-600 font-medium mt-1">Source: Versement</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-lg font-bold text-green-600">
                              + {formatCurrency(versement.montant)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm text-gray-400">-</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 border border-green-300">
                              <span className="text-sm font-bold text-green-700">
                                {formatCurrency(soldeApresVersement)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}

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
                          (recette.montant - totalDepense) > 0 
                            ? 'bg-green-400 text-green-900' 
                            : 'bg-red-400 text-red-900'
                        }`}>
                          {formatCurrency(recette.montant - totalDepense)}
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

      {/* Modal Ajouter Versement */}
      {showVersementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <span>💰</span>
                    Ajouter un versement
                  </h2>
                  <p className="text-green-100 text-sm mt-1">Augmenter le montant de cette recette</p>
                </div>
                <button
                  onClick={() => setShowVersementModal(false)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all hover:rotate-90 duration-300"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <form onSubmit={handleVersementSubmit} className="p-6 space-y-6">
              {/* Montant du versement */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="text-xl">💵</span>
                  Montant du versement
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={versementData.montant}
                    onChange={(e) => setVersementData(prev => ({...prev, montant: e.target.value}))}
                    className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-green-50 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all font-bold text-lg pr-20"
                    placeholder="0"
                    required
                    min="1"
                    step="0.01"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    FCFA
                  </span>
                </div>
              </div>

              {/* Date du versement */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="text-xl">📅</span>
                  Date du versement
                </label>
                <input
                  type="date"
                  value={versementData.date}
                  onChange={(e) => setVersementData(prev => ({...prev, date: e.target.value}))}
                  className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-green-50 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all font-medium"
                  required
                />
              </div>

              {/* Description */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="text-xl">📝</span>
                  Description
                  <span className="text-xs text-gray-500 font-normal ml-2">(Optionnel)</span>
                </label>
                <textarea
                  value={versementData.description}
                  onChange={(e) => setVersementData(prev => ({...prev, description: e.target.value}))}
                  rows={3}
                  className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-green-50 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all resize-none"
                  placeholder="Ex: Versement complémentaire, Bonus, Remboursement..."
                />
              </div>

              {/* Résumé */}
              {versementData.montant && parseFloat(versementData.montant) > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4">
                  <h4 className="font-bold text-green-800 mb-2">Résumé du versement :</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Montant actuel :</span>
                      <span className="font-semibold">{formatCurrency(recette.montant)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nouveau versement :</span>
                      <span className="font-semibold text-green-600">+{formatCurrency(parseFloat(versementData.montant))}</span>
                    </div>
                    <div className="flex justify-between border-t border-green-300 pt-2">
                      <span className="text-gray-600 font-bold">Nouveau total :</span>
                      <span className="font-bold text-green-700">{formatCurrency(recette.montant + parseFloat(versementData.montant))}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowVersementModal(false)}
                  className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all transform hover:scale-105 active:scale-95"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
                >
                  💰 Ajouter le versement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de création de dépense */}
      {showDepenseModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/80 via-red-900/30 to-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white via-red-50/30 to-white rounded-3xl shadow-2xl w-full max-w-2xl border-2 border-red-100 overflow-hidden">
            {/* Header avec dégradé */}
            <div className="bg-gradient-to-r from-red-600 via-orange-500 to-red-600 px-8 py-6 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-white/10"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-4xl">💸</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1">
                      ✨ Nouvelle Dépense
                    </h2>
                    <p className="text-red-100 text-sm">Créez une dépense liée à cette recette</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDepenseModal(false)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all hover:rotate-90 duration-300"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <form onSubmit={handleDepenseSubmit} className="p-8 space-y-6">
              {/* Libellé */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="text-xl">📝</span>
                  Libellé de la dépense
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={depenseData.libelle}
                  onChange={(e) => setDepenseData(prev => ({...prev, libelle: e.target.value}))}
                  className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-red-50 border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium hover:shadow-lg"
                  placeholder="Ex: Transport, Nourriture, Équipement..."
                  required
                />
              </div>

              {/* Montant */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="text-xl">💰</span>
                  Montant de la dépense
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={depenseData.montant}
                    onChange={(e) => setDepenseData(prev => ({...prev, montant: e.target.value}))}
                    className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-red-50 border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-bold text-lg pr-20 hover:shadow-lg"
                    placeholder="0"
                    required
                    min="1"
                    step="0.01"
                    max={recette.soldeDisponible}
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    FCFA
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <span>💡</span>
                  Solde disponible: <span className="font-semibold text-green-600">{formatCurrency(recette.soldeDisponible)}</span>
                </p>
              </div>

              {/* Date */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="text-xl">📅</span>
                  Date de la dépense
                </label>
                <input
                  type="date"
                  value={depenseData.date}
                  onChange={(e) => setDepenseData(prev => ({...prev, date: e.target.value}))}
                  className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-red-50 border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium hover:shadow-lg"
                  required
                />
              </div>

              {/* Catégorie */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="text-xl">🏷️</span>
                  Catégorie
                </label>
                <select
                  value={depenseData.categorie}
                  onChange={(e) => setDepenseData(prev => ({...prev, categorie: e.target.value}))}
                  className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-red-50 border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium hover:shadow-lg"
                >
                  <option value="">Sélectionner une catégorie</option>
                  <option value="Transport">🚗 Transport</option>
                  <option value="Nourriture">🍽️ Nourriture</option>
                  <option value="Équipement">⚙️ Équipement</option>
                  <option value="Maintenance">🔧 Maintenance</option>
                  <option value="Autres">📦 Autres</option>
                </select>
              </div>

              {/* Description */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="text-xl">📝</span>
                  Description
                  <span className="text-xs text-gray-500 font-normal ml-2">(Optionnel)</span>
                </label>
                <textarea
                  value={depenseData.description}
                  onChange={(e) => setDepenseData(prev => ({...prev, description: e.target.value}))}
                  rows={3}
                  className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-red-50 border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all resize-none hover:shadow-lg"
                  placeholder="Détails supplémentaires sur cette dépense..."
                />
              </div>

              {/* Résumé */}
              {depenseData.montant && parseFloat(depenseData.montant) > 0 && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-4">
                  <h4 className="font-bold text-red-800 mb-2">Résumé de la dépense :</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Solde actuel :</span>
                      <span className="font-semibold">{formatCurrency(recette.soldeDisponible)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nouvelle dépense :</span>
                      <span className="font-semibold text-red-600">-{formatCurrency(parseFloat(depenseData.montant))}</span>
                    </div>
                    <div className="flex justify-between border-t border-red-300 pt-2">
                      <span className="text-gray-600 font-bold">Nouveau solde :</span>
                      <span className="font-bold text-red-700">{formatCurrency(recette.soldeDisponible - parseFloat(depenseData.montant))}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowDepenseModal(false)}
                  className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all transform hover:scale-105 active:scale-95 hover:shadow-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>💸</span>
                  Créer la dépense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

