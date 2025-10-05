'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { useDepenses } from '@/contexts/depense-context'
import { useRecettes } from '@/contexts/recette-context'
import { useNotifications } from '@/contexts/notification-context'
import { useConfirm } from '@/components/modern-confirm'
import { Depense } from '@/lib/shared-data'

export default function DepensesPage() {
  const router = useRouter()
  const { depenses, addDepense, deleteDepense, refreshDepenses } = useDepenses()
  const { recettes, refreshRecettes } = useRecettes()
  const { showSuccess, showError, showWarning } = useNotifications()
  const { confirm, ConfirmDialog } = useConfirm()
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const [showModal, setShowModal] = useState(false)
  const [editingDepense, setEditingDepense] = useState<Depense | null>(null)
  const [selectedRecetteId, setSelectedRecetteId] = useState<string>('')
  
  // Filtres de recherche
  const [searchFilters, setSearchFilters] = useState({
    libelle: '',
    montantMin: '',
    montantMax: '',
    recetteId: '',
    dateDebut: '',
    dateFin: ''
  })
  
  const [formData, setFormData] = useState({
    libelle: '',
    montant: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
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

  const selectedRecette = recettes.find(r => r.id === selectedRecetteId)
  const soldeRestantCalcule = selectedRecette 
    ? selectedRecette.soldeDisponible - parseFloat(formData.montant || '0')
    : 0

  const handleOpenModal = () => {
    if (recettes.length === 0) {
      showWarning(
        "Recette requise",
        "Veuillez d'abord créer au moins une recette avant d'ajouter une dépense."
      )
      return
    }
    resetForm()
    setShowModal(true)
  }

  const handleEditClick = (depense: Depense) => {
    setEditingDepense(depense)
    setSelectedRecetteId(depense.recetteId || '')
    setFormData({
      libelle: depense.libelle,
      montant: depense.montant.toString(),
      date: new Date(depense.date).toISOString().split('T')[0],
      description: depense.description
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingDepense(null)
    setSelectedRecetteId('')
    setFormData({
      libelle: '',
      montant: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Vérifier qu'une recette est sélectionnée
    if (!selectedRecetteId) {
      showWarning(
        "Recette requise",
        "Veuillez sélectionner une recette pour cette dépense."
      )
      return
    }

    try {
      const depenseData = {
        recetteId: selectedRecetteId,
        libelle: formData.libelle,
        montant: parseFloat(formData.montant),
        date: formData.date,
        description: formData.description
      }

      console.log('📝 Envoi des données de dépense:', depenseData)

      if (editingDepense) {
        // Logique de mise à jour (à implémenter si nécessaire)
        showSuccess(
          "Dépense mise à jour",
          "Votre dépense a été modifiée avec succès !"
        )
      } else {
        await addDepense(depenseData)
        showSuccess(
          "Dépense créée",
          "Votre nouvelle dépense a été enregistrée avec succès !"
        )
      }

      // Rafraîchir les données pour voir les soldes mis à jour
      await refreshDepenses()
      await refreshRecettes()
      
      resetForm()
      setShowModal(false)
    } catch (error) {
      console.error('❌ Erreur lors de la soumission:', error)
      showError(
        "Erreur de création",
        "Une erreur est survenue lors de la création de la dépense. Veuillez réessayer."
      )
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = await confirm(
      'Supprimer la dépense',
      'Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action est irréversible.',
      {
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
      }
    )
    
    if (confirmed) {
      try {
        await deleteDepense(id)
        await refreshDepenses()
        await refreshRecettes()
        showSuccess(
          "Dépense supprimée",
          "La dépense a été supprimée avec succès !"
        )
      } catch (error) {
        showError(
          "Erreur de suppression",
          "Une erreur est survenue lors de la suppression. Veuillez réessayer."
        )
      }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
  }

  const getTotalDepenses = () => {
    return filteredDepenses.reduce((total, depense) => total + depense.montant, 0)
  }

  // Filtrer les dépenses selon les critères de recherche
  const filteredDepenses = depenses.filter(depense => {
    const matchLibelle = !searchFilters.libelle || depense.libelle.toLowerCase().includes(searchFilters.libelle.toLowerCase())
    const matchMontantMin = !searchFilters.montantMin || depense.montant >= parseFloat(searchFilters.montantMin)
    const matchMontantMax = !searchFilters.montantMax || depense.montant <= parseFloat(searchFilters.montantMax)
    const matchRecette = !searchFilters.recetteId || depense.recetteId === searchFilters.recetteId
    const matchDateDebut = !searchFilters.dateDebut || new Date(depense.date) >= new Date(searchFilters.dateDebut)
    const matchDateFin = !searchFilters.dateFin || new Date(depense.date) <= new Date(searchFilters.dateFin)
    
    return matchLibelle && matchMontantMin && matchMontantMax && matchRecette && matchDateDebut && matchDateFin
  })

  const handlePrint = (orientation: 'portrait' | 'landscape') => {
    const printWindow = window.open('', '', 'width=800,height=600')
    if (!printWindow) return

    const totalFiltered = filteredDepenses.reduce((sum, d) => sum + d.montant, 0)
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Liste des Dépenses</title>
        <style>
          @page { size: A4 ${orientation}; margin: 20mm; }
          body { font-family: Arial, sans-serif; font-size: 12px; }
          h1 { text-align: center; color: #DC2626; margin-bottom: 20px; }
          .info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #DC2626; color: white; padding: 10px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          tr:hover { background-color: #f5f5f5; }
          .total { font-weight: bold; background-color: #FEE2E2; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
        </style>
      </head>
      <body>
        <h1>📊 LISTE DES DÉPENSES</h1>
        <div class="info">
          <p><strong>Date d'impression:</strong> ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          <p><strong>Nombre de dépenses:</strong> ${filteredDepenses.length}</p>
          ${searchFilters.libelle ? `<p><strong>Filtre Libellé:</strong> ${searchFilters.libelle}</p>` : ''}
          ${searchFilters.recetteId ? `<p><strong>Filtre Recette:</strong> ${recettes.find(r => r.id === searchFilters.recetteId)?.libelle}</p>` : ''}
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Libellé</th>
              <th>Description</th>
              <th>Recette Source</th>
              <th style="text-align: right;">Montant</th>
            </tr>
          </thead>
          <tbody>
            ${filteredDepenses.map(depense => {
              const recette = recettes.find(r => r.id === depense.recetteId)
              return `
                <tr>
                  <td>${new Date(depense.date).toLocaleDateString('fr-FR')}</td>
                  <td><strong>${depense.libelle}</strong></td>
                  <td>${depense.description || '-'}</td>
                  <td>${recette ? recette.libelle : 'Aucune'}</td>
                  <td style="text-align: right; color: #DC2626;"><strong>${formatCurrency(depense.montant)}</strong></td>
                </tr>
              `
            }).join('')}
            <tr class="total">
              <td colspan="4" style="text-align: right;"><strong>TOTAL:</strong></td>
              <td style="text-align: right;"><strong>${formatCurrency(totalFiltered)}</strong></td>
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
      recetteId: '',
      dateDebut: '',
      dateFin: ''
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-8 shadow-lg">
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
              onClick={() => router.push('/recettes')}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              💰 Recettes
            </button>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <span className="text-5xl">💸</span>
                Dépenses
              </h1>
              <p className="text-red-100 text-lg">Gérez vos sorties d&apos;argent</p>
            </div>
            <button
              onClick={handleOpenModal}
              className="bg-white text-red-600 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <span className="text-2xl">+</span>
              CRÉER UNE DÉPENSE
            </button>
          </div>

          {/* Barre de Recherche */}
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20">
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
                  disabled={filteredDepenses.length === 0}
                >
                  🖨️ Portrait
                </button>
                <button
                  onClick={() => handlePrint('landscape')}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                  disabled={filteredDepenses.length === 0}
                >
                  🖨️ Paysage
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
              <input
                type="text"
                placeholder="Rechercher par libellé..."
                value={searchFilters.libelle}
                onChange={(e) => setSearchFilters({...searchFilters, libelle: e.target.value})}
                className="px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-red-200 focus:outline-none focus:ring-2 focus:ring-white"
              />
              
              <select
                value={searchFilters.recetteId}
                onChange={(e) => setSearchFilters({...searchFilters, recetteId: e.target.value})}
                className="px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white focus:outline-none focus:ring-2 focus:ring-white"
              >
                <option value="">Toutes les recettes</option>
                {recettes.map(recette => (
                  <option key={recette.id} value={recette.id} className="text-gray-900">
                    {recette.libelle}
                  </option>
                ))}
              </select>
              
              <input
                type="number"
                placeholder="Montant min"
                value={searchFilters.montantMin}
                onChange={(e) => setSearchFilters({...searchFilters, montantMin: e.target.value})}
                className="px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-red-200 focus:outline-none focus:ring-2 focus:ring-white"
              />
              
              <input
                type="number"
                placeholder="Montant max"
                value={searchFilters.montantMax}
                onChange={(e) => setSearchFilters({...searchFilters, montantMax: e.target.value})}
                className="px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-red-200 focus:outline-none focus:ring-2 focus:ring-white"
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
            
            {filteredDepenses.length !== depenses.length && (
              <p className="text-white text-sm mt-3">
                📌 {filteredDepenses.length} résultat(s) sur {depenses.length} dépense(s)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="text-gray-600 text-sm font-medium mb-2">Total des dépenses</div>
            <div className="text-3xl font-bold text-red-600">{formatCurrency(getTotalDepenses())}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="text-gray-600 text-sm font-medium mb-2">Nombre de dépenses</div>
            <div className="text-3xl font-bold text-gray-900">{filteredDepenses.length}</div>
          </div>
        </div>

        {/* Dépenses Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white">
            <h2 className="text-xl font-bold">Liste des dépenses</h2>
          </div>
          
          {filteredDepenses.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-8xl mb-6">💸</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucune dépense</h3>
              <p className="text-gray-600 mb-6">Commencez par créer votre première dépense</p>
              <button
                onClick={handleOpenModal}
                className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                + Créer une dépense
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Date</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Libellé</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Recette Source</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">Montant</th>
                    <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepenses.map((depense) => {
                    const recetteLiee = recettes.find(r => r.id === depense.recetteId)
                    return (
                      <tr 
                        key={depense.id} 
                        onClick={() => router.push(`/depenses/${depense.id}`)}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {new Date(depense.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-medium text-gray-900">{depense.libelle}</div>
                          {depense.description && (
                            <div className="text-xs text-gray-500 mt-1">{depense.description}</div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-sm">
                          {recetteLiee ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/recettes/${recetteLiee.id}`)
                              }}
                              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium hover:underline"
                            >
                              <span>💰</span>
                              {recetteLiee.libelle}
                            </button>
                          ) : (
                            <span className="italic text-gray-400">Aucune</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="text-sm font-bold text-red-600">
                            -{formatCurrency(depense.montant)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                           <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditClick(depense)
                            }}
                            className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors font-medium text-sm mr-2"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(depense.id)
                            }}
                            className="text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors font-medium text-sm"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Ultra-Moderne */}
      {showModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/80 via-red-900/30 to-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white via-red-50/30 to-white rounded-3xl shadow-2xl w-full max-w-2xl border-2 border-red-100 overflow-hidden">
            {/* Header avec dégradé */}
            <div className="bg-gradient-to-r from-red-600 via-orange-500 to-red-600 px-8 py-6 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-4xl">💸</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1">
                      {editingDepense ? '✏️ Modifier' : '✨ Nouvelle Dépense'}
                    </h2>
                    <p className="text-red-100 text-sm">Enregistrez vos sorties d&apos;argent</p>
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
              {/* Sélection de la recette - Card moderne */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="text-xl">💰</span>
                  Recette Source
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedRecetteId}
                    onChange={(e) => setSelectedRecetteId(e.target.value)}
                    className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-red-50 border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all appearance-none cursor-pointer font-medium text-gray-800 pr-12"
                    required
                  >
                    <option value="">-- Choisissez la source --</option>
                    {recettes.map(recette => (
                      <option key={recette.id} value={recette.id}>
                        {recette.libelle} • {formatCurrency(recette.soldeDisponible)} disponible
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="text-2xl">🔽</span>
                  </div>
                </div>
              </div>

              {/* Solde disponible - Affichage élégant */}
              {selectedRecette && (
                <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-2 border-green-300 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl">💎</span>
                      </div>
                      <div>
                        <p className="text-xs text-green-700 font-medium uppercase tracking-wide">Solde Disponible</p>
                        <p className="text-2xl font-bold text-green-700">{formatCurrency(selectedRecette.soldeDisponible)}</p>
                      </div>
                    </div>
                    {formData.montant && parseFloat(formData.montant) > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-gray-600 font-medium">Après dépense</p>
                        <p className={`text-xl font-bold ${
                          selectedRecette.soldeDisponible - parseFloat(formData.montant) >= 0 
                            ? 'text-blue-600' 
                            : 'text-red-600'
                        }`}>
                          {formatCurrency(selectedRecette.soldeDisponible - parseFloat(formData.montant))}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Montant et Date - Grid moderne */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <span className="text-xl">💵</span>
                    Montant
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.montant}
                      onChange={(e) => setFormData(prev => ({...prev, montant: e.target.value}))}
                      className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-red-50 border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-bold text-lg pr-20"
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
                    <span className="text-xl">📅</span>
                    Date
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({...prev, date: e.target.value}))}
                    className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-red-50 border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              {/* Libellé - Input stylisé */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="text-xl">🏷️</span>
                  Libellé
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.libelle}
                  onChange={(e) => setFormData(prev => ({...prev, libelle: e.target.value}))}
                  className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-red-50 border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium"
                  placeholder="Ex: Facture d'électricité, Loyer, Transport..."
                  required
                />
              </div>

              {/* Description - Textarea moderne */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="text-xl">📝</span>
                  Description
                  <span className="text-xs text-gray-500 font-normal ml-2">(Optionnel)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                  rows={4}
                  className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-red-50 border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all resize-none"
                  placeholder="Ajoutez des détails supplémentaires..."
                />
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
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 hover:from-red-700 hover:via-orange-600 hover:to-red-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
                >
                  {editingDepense ? '💾 Enregistrer' : '✨ Créer la Dépense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog de confirmation moderne */}
      <ConfirmDialog />
    </div>
  )
}
