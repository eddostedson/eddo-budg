'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { useRecettes } from '@/contexts/recette-context'
import { useDepenses } from '@/contexts/depense-context'
import { Recette } from '@/lib/shared-data'

const COLORS = [
  'bg-purple-500',
  'bg-blue-500', 
  'bg-green-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-red-500',
  'bg-yellow-500'
]

export default function RecettesPage() {
  const router = useRouter()
  const { recettes, addRecette, deleteRecette, updateRecette, getTotalRecettes, getTotalDisponible } = useRecettes()
  const { depenses } = useDepenses()
  const [showModal, setShowModal] = useState(false)
  const [editingRecette, setEditingRecette] = useState<Recette | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  // Filtres de recherche
  const [searchFilters, setSearchFilters] = useState({
    libelle: '',
    montantMin: '',
    montantMax: '',
    source: '',
    dateDebut: '',
    dateFin: '',
    statut: ''
  })
  
  const [formData, setFormData] = useState({
    libelle: '',
    description: '',
    montant: '',
    source: '',
    periodicite: 'unique' as Recette['periodicite'],
    dateReception: new Date().toISOString().split('T')[0],
    categorie: '',
    statut: 'reçue' as Recette['statut']
  })

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
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleEditClick = (recette: Recette) => {
    setEditingRecette(recette)
    setFormData({
      libelle: recette.libelle,
      description: recette.description,
      montant: recette.montant.toString(),
      source: recette.source,
      periodicite: recette.periodicite,
      dateReception: new Date(recette.dateReception).toISOString().split('T')[0],
      categorie: recette.categorie,
      statut: recette.statut
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingRecette(null)
    setFormData({
      libelle: '',
      description: '',
      montant: '',
      source: '',
      periodicite: 'unique',
      dateReception: new Date().toISOString().split('T')[0],
      categorie: '',
      statut: 'reçue'
    })
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const recetteData = {
      ...formData,
      montant: parseFloat(formData.montant)
    }

    if (editingRecette) {
      // Mise à jour
      await updateRecette(editingRecette.id, recetteData)
      alert('Recette mise à jour !')
    } else {
      // Création
      await addRecette(recetteData)
      alert('Recette créée !')
    }
    
    resetForm()
    setShowModal(false)
  }
  
  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette recette ?')) {
      await deleteRecette(id)
      alert('Recette supprimée !')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
  }

  // Filtrer les recettes selon les critères de recherche
  const filteredRecettes = recettes.filter(recette => {
    const matchLibelle = !searchFilters.libelle || recette.libelle.toLowerCase().includes(searchFilters.libelle.toLowerCase())
    const matchMontantMin = !searchFilters.montantMin || recette.montant >= parseFloat(searchFilters.montantMin)
    const matchMontantMax = !searchFilters.montantMax || recette.montant <= parseFloat(searchFilters.montantMax)
    const matchSource = !searchFilters.source || recette.source.toLowerCase().includes(searchFilters.source.toLowerCase())
    const matchDateDebut = !searchFilters.dateDebut || new Date(recette.dateReception) >= new Date(searchFilters.dateDebut)
    const matchDateFin = !searchFilters.dateFin || new Date(recette.dateReception) <= new Date(searchFilters.dateFin)
    const matchStatut = !searchFilters.statut || recette.statut === searchFilters.statut
    
    return matchLibelle && matchMontantMin && matchMontantMax && matchSource && matchDateDebut && matchDateFin && matchStatut
  })

  const handlePrint = (orientation: 'portrait' | 'landscape') => {
    const printWindow = window.open('', '', 'width=800,height=600')
    if (!printWindow) return

    const totalFiltered = filteredRecettes.reduce((sum, r) => sum + r.montant, 0)
    const totalDisponibleFiltered = filteredRecettes.reduce((sum, r) => sum + r.soldeDisponible, 0)
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Liste des Recettes</title>
        <style>
          @page { size: A4 ${orientation}; margin: 20mm; }
          body { font-family: Arial, sans-serif; font-size: 12px; }
          h1 { text-align: center; color: #2563EB; margin-bottom: 20px; }
          .info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #2563EB; color: white; padding: 10px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          tr:hover { background-color: #f5f5f5; }
          .total { font-weight: bold; background-color: #DBEAFE; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
        </style>
      </head>
      <body>
        <h1>💰 LISTE DES RECETTES</h1>
        <div class="info">
          <p><strong>Date d'impression:</strong> ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          <p><strong>Nombre de recettes:</strong> ${filteredRecettes.length}</p>
          ${searchFilters.libelle ? `<p><strong>Filtre Libellé:</strong> ${searchFilters.libelle}</p>` : ''}
          ${searchFilters.source ? `<p><strong>Filtre Source:</strong> ${searchFilters.source}</p>` : ''}
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Libellé</th>
              <th>Source</th>
              <th>Statut</th>
              <th style="text-align: right;">Montant</th>
              <th style="text-align: right;">Solde Disponible</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRecettes.map(recette => `
              <tr>
                <td>${new Date(recette.dateReception).toLocaleDateString('fr-FR')}</td>
                <td><strong>${recette.libelle}</strong></td>
                <td>${recette.source}</td>
                <td><span style="text-transform: capitalize;">${recette.statut}</span></td>
                <td style="text-align: right; color: #2563EB;"><strong>${formatCurrency(recette.montant)}</strong></td>
                <td style="text-align: right; color: #059669;"><strong>${formatCurrency(recette.soldeDisponible)}</strong></td>
              </tr>
            `).join('')}
            <tr class="total">
              <td colspan="4" style="text-align: right;"><strong>TOTAUX:</strong></td>
              <td style="text-align: right;"><strong>${formatCurrency(totalFiltered)}</strong></td>
              <td style="text-align: right;"><strong>${formatCurrency(totalDisponibleFiltered)}</strong></td>
            </tr>
          </tbody>
        </table>
        <div class="footer">
          <p>Document généré automatiquement par Eddo-Budg - ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const resetFilters = () => {
    setSearchFilters({
      libelle: '',
      montantMin: '',
      montantMax: '',
      source: '',
      dateDebut: '',
      dateFin: '',
      statut: ''
    })
  }

  const getTotalDepense = () => {
    return depenses.reduce((total, depense) => total + depense.montant, 0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          {/* Navigation */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.push('/accueil')}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              🏠 Accueil
            </button>
            <button
              onClick={() => router.push('/depenses')}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              💸 Dépenses
            </button>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <span className="text-5xl">💰</span>
                Recettes
              </h1>
              <p className="text-blue-100 text-lg">Gérez vos sources de revenus</p>
            </div>
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <span className="text-2xl">+</span>
              CRÉER UNE RECETTE
            </button>
          </div>

          {/* Barre de Recherche */}
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🔍</span>
                Rechercher et Filtrer
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={resetFilters}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  🔄 Réinitialiser
                </button>
                <button
                  onClick={() => handlePrint('portrait')}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                  disabled={filteredRecettes.length === 0}
                >
                  🖨️ Portrait
                </button>
                <button
                  onClick={() => handlePrint('landscape')}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                  disabled={filteredRecettes.length === 0}
                >
                  🖨️ Paysage
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
              <input
                type="text"
                placeholder="Rechercher par libellé..."
                value={searchFilters.libelle}
                onChange={(e) => setSearchFilters({...searchFilters, libelle: e.target.value})}
                className="px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white"
              />
              
              <input
                type="text"
                placeholder="Source..."
                value={searchFilters.source}
                onChange={(e) => setSearchFilters({...searchFilters, source: e.target.value})}
                className="px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white"
              />
              
              <select
                value={searchFilters.statut}
                onChange={(e) => setSearchFilters({...searchFilters, statut: e.target.value})}
                className="px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white focus:outline-none focus:ring-2 focus:ring-white"
              >
                <option value="">Tous les statuts</option>
                <option value="attendue" className="text-gray-900">Attendue</option>
                <option value="reçue" className="text-gray-900">Reçue</option>
                <option value="retardée" className="text-gray-900">Retardée</option>
                <option value="annulée" className="text-gray-900">Annulée</option>
              </select>
              
              <input
                type="number"
                placeholder="Montant min"
                value={searchFilters.montantMin}
                onChange={(e) => setSearchFilters({...searchFilters, montantMin: e.target.value})}
                className="px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white"
              />
              
              <input
                type="number"
                placeholder="Montant max"
                value={searchFilters.montantMax}
                onChange={(e) => setSearchFilters({...searchFilters, montantMax: e.target.value})}
                className="px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white"
              />
              
              <input
                type="date"
                value={searchFilters.dateDebut}
                onChange={(e) => setSearchFilters({...searchFilters, dateDebut: e.target.value})}
                className="px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white focus:outline-none focus:ring-2 focus:ring-white"
                title="Date début"
              />
              
              <input
                type="date"
                value={searchFilters.dateFin}
                onChange={(e) => setSearchFilters({...searchFilters, dateFin: e.target.value})}
                className="px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white focus:outline-none focus:ring-2 focus:ring-white"
                title="Date fin"
              />
            </div>
            
            {filteredRecettes.length !== recettes.length && (
              <p className="text-white text-sm mt-3">
                📌 {filteredRecettes.length} résultat(s) sur {recettes.length} recette(s)
              </p>
            )}
          </div>

          {/* Statistiques Principales - 4 Conteneurs de Même Taille */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total des Recettes */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border-2 border-white border-opacity-30 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">💎</span>
                </div>
                <div>
                  <p className="text-blue-100 text-xs font-medium">TOTAL RECETTES</p>
                  <p className="text-[10px] text-blue-200">Revenus totaux</p>
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight drop-shadow-lg">
                {formatCurrency(getTotalRecettes())}
              </div>
            </div>

            {/* Total Dépensé */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border-2 border-white border-opacity-30 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-12 h-12 bg-red-400 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">💸</span>
                </div>
                <div>
                  <p className="text-blue-100 text-xs font-medium">TOTAL DÉPENSÉ</p>
                  <p className="text-[10px] text-blue-200">Montant utilisé</p>
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight drop-shadow-lg">
                {formatCurrency(getTotalDepense())}
              </div>
            </div>

            {/* Solde Disponible */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border-2 border-white border-opacity-30 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-12 h-12 bg-green-400 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">💰</span>
                </div>
                <div>
                  <p className="text-blue-100 text-xs font-medium">SOLDE DISPONIBLE</p>
                  <p className="text-[10px] text-blue-200">Reste à utiliser</p>
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight drop-shadow-lg">
                {formatCurrency(getTotalDisponible())}
              </div>
            </div>

            {/* Nombre de Recettes */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border-2 border-white border-opacity-30 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-12 h-12 bg-purple-400 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <p className="text-blue-100 text-xs font-medium">NOMBRE RECETTES</p>
                  <p className="text-[10px] text-blue-200">Sources actives</p>
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight drop-shadow-lg">
                {recettes.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Recettes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecettes.map((recette, index) => (
            <div 
              key={recette.id}
              onClick={() => router.push(`/recettes/${recette.id}`)}
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-blue-500 cursor-pointer"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{recette.libelle}</h3>
                    <p className="text-2xl font-bold text-blue-600 mb-1">{formatCurrency(recette.montant)}</p>
                    <p className="text-xs text-gray-500 mb-3">Montant initial</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full ${COLORS[index % COLORS.length]}`}></div>
                </div>
                
                {/* Solde Disponible - Encadré */}
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-green-700">💰 Solde Disponible</span>
                    <span className="text-xl font-bold text-green-600">{formatCurrency(recette.soldeDisponible)}</span>
                  </div>
                  {recette.soldeDisponible < recette.montant && (
                    <p className="text-xs text-green-600 mt-1">
                      Dépensé : {formatCurrency(recette.montant - recette.soldeDisponible)}
                    </p>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-4 h-10">{recette.description}</p>
                
                <div className="text-xs text-gray-500 space-y-2">
                  <div className="flex justify-between"><span className="font-medium">Source:</span> <span>{recette.source}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Date:</span> <span>{new Date(recette.dateReception).toLocaleDateString('fr-FR')}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Statut:</span> <span className="font-bold capitalize">{recette.statut}</span></div>
                </div>
                
                {/* Actions */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditClick(recette)
                    }} 
                    className="bg-white/80 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(recette.id)
                    }} 
                    className="bg-white/80 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRecettes.length === 0 && (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">💰</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucune recette</h3>
            <p className="text-gray-600 mb-6">Commencez par créer votre première source de revenus</p>
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              + Créer une recette
            </button>
          </div>
        )}

        {/* Liste des Dépenses */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-4xl">💸</span>
                Liste des Dépenses
              </h2>
              <p className="text-gray-600 mt-2">Détail de toutes les dépenses effectuées sur vos recettes</p>
            </div>
            <button
              onClick={() => router.push('/depenses')}
              className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Gérer les dépenses →
            </button>
          </div>

          {depenses.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Libellé</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Description</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold">Montant</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">Recette liée</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {depenses.map((depense, index) => {
                      const recetteAssociee = recettes.find(r => r.id === depense.recetteId)
                      return (
                        <tr key={depense.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(depense.date).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {depense.libelle}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                            {depense.description || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-red-600 text-right">
                            {formatCurrency(depense.montant)}
                          </td>
                          <td className="px-6 py-4 text-sm text-center">
                            {recetteAssociee ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {recetteAssociee.libelle}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-sm font-bold text-gray-900">
                        TOTAL DES DÉPENSES
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-red-600 text-right">
                        {formatCurrency(getTotalDepense())}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune dépense</h3>
              <p className="text-gray-600 mb-6">Vous n&apos;avez pas encore effectué de dépenses</p>
              <button
                onClick={() => router.push('/depenses')}
                className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Créer une dépense
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {/* Modal Ultra-Moderne */}
      {showModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/80 via-blue-900/30 to-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-white rounded-3xl shadow-2xl w-full max-w-2xl border-2 border-blue-100 overflow-hidden">
            {/* Header avec dégradé */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 px-8 py-6 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-4xl">💰</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1">
                      {editingRecette ? '✏️ Modifier' : '✨ Nouvelle Recette'}
                    </h2>
                    <p className="text-blue-100 text-sm">Enregistrez vos sources de revenus</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all hover:rotate-90 duration-300"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Libellé */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="text-xl">🏷️</span>
                  Libellé
                  <span className="text-blue-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="libelle" 
                  value={formData.libelle} 
                  onChange={handleInputChange} 
                  className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium" 
                  placeholder="Ex: Salaire, Prime, Revenu..."
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
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  rows={4} 
                  className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all resize-none" 
                  placeholder="Ajoutez des détails supplémentaires..."
                />
              </div>

              {/* Montant et Source */}
              <div className="grid grid-cols-2 gap-5">
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <span className="text-xl">💵</span>
                    Montant
                    <span className="text-blue-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      name="montant" 
                      value={formData.montant} 
                      onChange={handleInputChange} 
                      className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold text-lg pr-20" 
                      placeholder="0"
                      required 
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      FCFA
                    </span>
                  </div>
                </div>

                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <span className="text-xl">🏢</span>
                    Source
                  </label>
                  <input 
                    type="text" 
                    name="source" 
                    value={formData.source} 
                    onChange={handleInputChange} 
                    className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium" 
                    placeholder="Ex: Entreprise, Client..."
                  />
                </div>
              </div>

              {/* Date et Statut */}
              <div className="grid grid-cols-2 gap-5">
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <span className="text-xl">📅</span>
                    Date de réception
                    <span className="text-blue-500">*</span>
                  </label>
                  <input 
                    type="date" 
                    name="dateReception" 
                    value={formData.dateReception} 
                    onChange={handleInputChange} 
                    className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium" 
                    required 
                  />
                </div>

                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <span className="text-xl">🎯</span>
                    Statut
                  </label>
                  <div className="relative">
                    <select 
                      name="statut" 
                      value={formData.statut} 
                      onChange={handleInputChange} 
                      className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all appearance-none cursor-pointer font-medium pr-12"
                    >
                      <option value="reçue">✅ Reçue</option>
                      <option value="attendue">⏳ Attendue</option>
                      <option value="retardée">⚠️ Retardée</option>
                      <option value="annulée">❌ Annulée</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <span className="text-2xl">🔽</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Boutons - Design moderne */}
              <div className="flex gap-4 pt-6 border-t-2 border-gray-100">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all hover:shadow-lg transform hover:scale-105 active:scale-95"
                >
                  ❌ Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 hover:from-blue-700 hover:via-purple-600 hover:to-blue-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
                >
                  {editingRecette ? '💾 Enregistrer' : '✨ Créer la Recette'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
