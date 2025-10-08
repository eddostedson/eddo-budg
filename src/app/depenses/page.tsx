'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { useDepenses } from '@/contexts/depense-context'
import { useRecettes } from '@/contexts/recette-context'
import { useNotifications } from '@/contexts/notification-context'
import { useConfirm } from '@/components/modern-confirm'
import { CategoryCombobox } from '@/components/ui/category-combobox'
import { Depense } from '@/lib/shared-data'

export default function DepensesPage() {
  const router = useRouter()
  const { depenses, addDepense, deleteDepense, refreshDepenses } = useDepenses()
  const { recettes, refreshRecettes, updateRecette } = useRecettes()
  const { showSuccess, showError, showWarning } = useNotifications()
  const { confirm, ConfirmDialog } = useConfirm()
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const supabase = createClient()

  // Rafraîchir les recettes quand le modal s'ouvre
  useEffect(() => {
    if (showModal) {
      refreshRecettes()
    }
  }, [showModal, refreshRecettes])

  // Écouter les mises à jour de recettes depuis d'autres pages
  useEffect(() => {
    const handleRecetteUpdate = () => {
      console.log('🔄 Recette mise à jour détectée, rafraîchissement...')
      refreshRecettes()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('recetteUpdated', handleRecetteUpdate)
      return () => window.removeEventListener('recetteUpdated', handleRecetteUpdate)
    }
  }, [refreshRecettes])
  const [editingDepense, setEditingDepense] = useState<Depense | null>(null)
  const [selectedRecetteId, setSelectedRecetteId] = useState<string>('')
  
  // Filtres de recherche
  const [searchFilters, setSearchFilters] = useState({
    libelle: '',
    montant: '',
    recetteId: '',
    dateDebut: '',
    dateFin: ''
  })
  
  const [formData, setFormData] = useState({
    libelle: '',
    montant: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    categorie: ''
  })

  // États pour les montants multiples
  const [expenseItems, setExpenseItems] = useState<Array<{id: string, libelle: string, montant: string}>>([
    { id: '1', libelle: '', montant: '' }
  ])
  const [showTooltip, setShowTooltip] = useState(false)

  // États pour l'UX améliorée
  const [newlyAddedId, setNewlyAddedId] = useState<number | null>(null)
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null)
  
  // État pour l'autocomplétion des libellés
  const [showLibelleSuggestions, setShowLibelleSuggestions] = useState(false)
  const [libelleSuggestions, setLibelleSuggestions] = useState<string[]>([])
  
  // Récupérer les libellés uniques des dépenses existantes
  const uniqueLibelles = Array.from(new Set(depenses.map(d => d.libelle).filter(Boolean)))

  // Calculer le total des montants
  const totalExpenseAmount = expenseItems.reduce((total, item) => {
    const montant = parseFloat(item.montant) || 0
    return total + montant
  }, 0)

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

  // Filtrer les dépenses selon les critères de recherche
  const filteredDepenses = depenses.filter(depense => {
    // Recherche par libellé : inclut le libellé de la dépense ET le libellé de la recette associée
    const matchLibelle = !searchFilters.libelle || (() => {
      const searchValue = searchFilters.libelle.toLowerCase()
      
      // Recherche dans le libellé de la dépense
      const matchDepenseLibelle = depense.libelle.toLowerCase().includes(searchValue)
      
      // Recherche dans le libellé de la recette associée
      const recetteAssociee = recettes.find(r => r.id === depense.recetteId)
      const matchRecetteLibelle = recetteAssociee ? 
        recetteAssociee.libelle.toLowerCase().includes(searchValue) : false
      
      return matchDepenseLibelle || matchRecetteLibelle
    })()
    
    // Recherche par montant : inclut le montant de la dépense, le montant initial et le solde disponible de la recette
    const matchMontant = !searchFilters.montant || (() => {
      const searchValue = searchFilters.montant
      const searchNum = parseFloat(searchValue)
      
      // Recherche dans le montant de la dépense
      const matchDepenseMontant = depense.montant.toString().includes(searchValue) ||
        Math.abs(depense.montant - searchNum) < 0.01
      
      // Recherche dans la recette associée (montant initial et solde disponible)
      const recetteAssociee = recettes.find(r => r.id === depense.recetteId)
      let matchRecetteMontant = false
      let matchSoldeDisponible = false
      
      if (recetteAssociee) {
        // Recherche dans le montant initial de la recette
        matchRecetteMontant = recetteAssociee.montant.toString().includes(searchValue) ||
          Math.abs(recetteAssociee.montant - searchNum) < 0.01
        
        // Recherche dans le solde disponible de la recette
        matchSoldeDisponible = recetteAssociee.soldeDisponible.toString().includes(searchValue) ||
          Math.abs(recetteAssociee.soldeDisponible - searchNum) < 0.01
      }
      
      return matchDepenseMontant || matchRecetteMontant || matchSoldeDisponible
    })()
    
    const matchRecette = !searchFilters.recetteId || depense.recetteId === searchFilters.recetteId
    const matchDateDebut = !searchFilters.dateDebut || new Date(depense.date) >= new Date(searchFilters.dateDebut)
    const matchDateFin = !searchFilters.dateFin || new Date(depense.date) <= new Date(searchFilters.dateFin)
    
    return matchLibelle && matchMontant && matchRecette && matchDateDebut && matchDateFin
  }).sort((a, b) => {
    // Trier par date croissante (plus anciennes en haut, plus récentes en bas)
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  // Auto-scroll vers la nouvelle dépense et surlignage
  useEffect(() => {
    if (newlyAddedId && filteredDepenses.length > 0) {
      // Attendre que le DOM soit mis à jour
      setTimeout(() => {
        const element = document.getElementById(`depense-${newlyAddedId}`)
        if (element) {
          // Scroll vers l'élément
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
          
          // Supprimer le surlignage après 5 secondes
          setTimeout(() => {
            setHighlightedRow(null)
            setNewlyAddedId(null)
          }, 5000)
        }
      }, 100)
    }
  }, [newlyAddedId, filteredDepenses])

  // Mettre à jour le montant total dans formData
  useEffect(() => {
    setFormData(prev => ({ ...prev, montant: totalExpenseAmount.toString() }))
  }, [totalExpenseAmount])

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
  const soldeRestantCalcule = selectedRecette ? (() => {
    // Calculer le solde correct en temps réel
    const depensesLiees = depenses.filter(d => d.recetteId === selectedRecette.id)
    const totalDepenses = depensesLiees.reduce((total, depense) => total + depense.montant, 0)
    const soldeCorrect = selectedRecette.montant - totalDepenses
    
    // Recalculer automatiquement le soldeDisponible si incohérent
    if (Math.abs(selectedRecette.soldeDisponible - soldeCorrect) > 0.01) {
      console.log('🔄 Recalcul automatique du solde:', {
        soldeDisponible: selectedRecette.soldeDisponible,
        soldeCorrect,
        difference: selectedRecette.soldeDisponible - soldeCorrect
      })
      // Mettre à jour le soldeDisponible dans le contexte
      updateRecette(selectedRecette.id, {
        ...selectedRecette,
        soldeDisponible: soldeCorrect
      })
    }
    
    return soldeCorrect - parseFloat(formData.montant || '0')
  })() : 0

  const handleOpenModal = async () => {
    // Rafraîchir les recettes avant d'ouvrir le modal
    await refreshRecettes()
    
    // Attendre un peu pour s'assurer que les données sont bien chargées
    setTimeout(async () => {
      await refreshRecettes()
    }, 100)
    
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
      libelle: '',
      montant: depense.montant.toString(),
      date: new Date(depense.date).toISOString().split('T')[0],
      description: ''
    })
    // Créer un item de dépense avec le libellé de la dépense existante
    setExpenseItems([{ id: '1', libelle: depense.libelle, montant: depense.montant.toString() }])
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingDepense(null)
    setSelectedRecetteId('')
    setFormData({
      libelle: '',
      montant: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      categorie: ''
    })
    setExpenseItems([{ id: '1', libelle: '', montant: '' }])
    setShowTooltip(false)
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

    // Vérifier qu'au moins un montant est saisi
    if (totalExpenseAmount <= 0) {
      showWarning(
        "Montant requis",
        "Veuillez saisir au moins un montant pour cette dépense."
      )
      return
    }

    try {
      // Créer une description détaillée des montants multiples
      const detailMontants = expenseItems
        .filter(item => item.montant && parseFloat(item.montant) > 0)
        .map(item => `${item.libelle || 'Dépense'}: ${formatCurrency(parseFloat(item.montant))}`)
        .join(' | ')
      
      const depenseData = {
        recetteId: selectedRecetteId,
        libelle: expenseItems.find(item => item.libelle && item.libelle.trim())?.libelle || 'Dépense',
        montant: totalExpenseAmount,
        date: formData.date,
        description: detailMontants
      }

      console.log('📝 Envoi des données de dépense:', depenseData)

      if (editingDepense) {
        // Logique de mise à jour (à implémenter si nécessaire)
        showSuccess(
          "Dépense mise à jour",
          "Votre dépense a été modifiée avec succès !"
        )
        
        // Fermer le modal immédiatement après la notification
        resetForm()
        setShowModal(false)
      } else {
        await addDepense(depenseData)
        showSuccess(
          "Dépense créée",
          "Votre nouvelle dépense a été enregistrée avec succès !"
        )
        
        // Fermer le modal immédiatement après la notification
        resetForm()
        setShowModal(false)
        
        // Marquer la nouvelle dépense pour le scroll et le surlignage
        // On utilise un ID temporaire basé sur le timestamp
        const tempId = Date.now()
        setNewlyAddedId(tempId)
        setHighlightedRow(tempId)
      }

      // Rafraîchir les données pour voir les soldes mis à jour
      await refreshDepenses()
      await refreshRecettes()
      
      // Notifier les autres composants qu'une dépense a été ajoutée
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('depenseAdded', { 
          detail: { recetteId: selectedRecetteId, montant: parseFloat(formData.montant) }
        }))
      }
    } catch (error) {
      console.error('❌ Erreur lors de la soumission:', error)
      showError(
        "Erreur de création",
        "Une erreur est survenue lors de la création de la dépense. Veuillez réessayer."
      )
    }
  }

  // Fonctions pour gérer les montants multiples
  const addExpenseItem = () => {
    const newId = (expenseItems.length + 1).toString()
    setExpenseItems(prev => [...prev, { id: newId, libelle: '', montant: '' }])
  }

  const removeExpenseItem = (id: string) => {
    if (expenseItems.length > 1) {
      setExpenseItems(prev => prev.filter(item => item.id !== id))
    } else {
      // Si c'est le dernier item, le vider au lieu de le supprimer
      setExpenseItems([{ id: '1', libelle: '', montant: '' }])
    }
  }

  const updateExpenseItem = (id: string, field: 'libelle' | 'montant', value: string) => {
    setExpenseItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
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
      montant: '',
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
                placeholder="Rechercher par libellé (dépense ou recette)"
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
                type="text"
                placeholder="Rechercher par montant (dépense, recette, solde)"
                value={searchFilters.montant}
                onChange={(e) => setSearchFilters({...searchFilters, montant: e.target.value})}
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
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Catégorie</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Recette Source</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">Solde Initial</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">Disponible</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">Montant</th>
                    <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepenses.map((depense) => {
                    const recetteLiee = recettes.find(r => r.id === depense.recetteId)
                    const isHighlighted = highlightedRow === depense.id
                    return (
                      <tr 
                        key={depense.id}
                        id={`depense-${depense.id}`}
                        onClick={() => router.push(`/depenses/${depense.id}`)}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-all duration-500 cursor-pointer ${
                          isHighlighted 
                            ? 'bg-green-100 border-green-300 shadow-lg transform scale-[1.02] highlight-new-item' 
                            : ''
                        }`}
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
                          {depense.categorie ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              🏷️ {depense.categorie}
                            </span>
                          ) : (
                            <span className="italic text-gray-400">Non définie</span>
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
                          {recetteLiee ? (
                            <span className="text-sm font-semibold text-blue-600">
                              {formatCurrency(recetteLiee.montant)}
                            </span>
                          ) : (
                            <span className="italic text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {recetteLiee ? (() => {
                            // Calculer le solde correct en temps réel
                            const depensesLiees = depenses.filter(d => d.recetteId === recetteLiee.id)
                            const totalDepenses = depensesLiees.reduce((total, depense) => total + depense.montant, 0)
                            const soldeCorrect = recetteLiee.montant - totalDepenses
                            
                            return (
                              <span className="text-sm font-semibold text-green-600">
                                {formatCurrency(soldeCorrect)}
                              </span>
                            )
                          })() : (
                            <span className="italic text-gray-400">-</span>
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
          <div className="bg-gradient-to-br from-white via-red-50/30 to-white rounded-3xl shadow-2xl w-full max-w-2xl border-2 border-red-100 overflow-hidden max-h-[90vh] flex flex-col">
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
            
            <div className="flex-1 overflow-y-auto">
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
                    onChange={async (e) => {
                      setSelectedRecetteId(e.target.value)
                      // Rafraîchir les recettes quand on change de sélection
                      await refreshRecettes()
                    }}
                    className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-red-50 border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all appearance-none cursor-pointer font-medium text-gray-800 pr-12"
                    required
                  >
                    <option value="">-- Choisissez la source --</option>
                    {recettes.filter(recette => recette.statutCloture !== 'cloturee').map(recette => {
                      // Calculer le solde correct en temps réel
                      const depensesLiees = depenses.filter(d => d.recetteId === recette.id)
                      const totalDepenses = depensesLiees.reduce((total, depense) => total + depense.montant, 0)
                      const soldeCorrect = recette.montant - totalDepenses
                      
                      return (
                        <option key={recette.id} value={recette.id}>
                          {recette.libelle} • {formatCurrency(soldeCorrect)} disponible
                        </option>
                      )
                    })}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="text-2xl">🔽</span>
                  </div>
                </div>
              </div>

              {/* Solde disponible - Affichage élégant */}
              {selectedRecette && (
                <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-2 border-green-300 rounded-2xl p-5 shadow-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Solde Initial */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl">💰</span>
                      </div>
                      <div>
                        <p className="text-xs text-blue-700 font-medium uppercase tracking-wide">Solde Initial</p>
                        <p className="text-xl font-bold text-blue-700">{formatCurrency(selectedRecette.montant)}</p>
                      </div>
                    </div>

                    {/* Solde Disponible */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl">💎</span>
                      </div>
                      <div>
                        <p className="text-xs text-green-700 font-medium uppercase tracking-wide">Solde Disponible</p>
                        <p className="text-xl font-bold text-green-700">{formatCurrency(selectedRecette.montant - depenses.filter(d => d.recetteId === selectedRecette.id).reduce((total, depense) => total + depense.montant, 0))}</p>
                      </div>
                    </div>

                    {/* Après Dépense */}
                    {formData.montant && parseFloat(formData.montant) > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-2xl">📊</span>
                        </div>
                        <div>
                          <p className="text-xs text-orange-700 font-medium uppercase tracking-wide">Après Dépense</p>
                          <p className={`text-xl font-bold ${
                            soldeRestantCalcule >= 0 
                              ? 'text-blue-600' 
                              : 'text-red-600'
                          }`}>
                            {formatCurrency(soldeRestantCalcule)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Montants Multiples */}
              <div className="group">
                <div className="flex items-center justify-between mb-4">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <span className="text-xl">💵</span>
                    Détail des Dépenses
                    <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addExpenseItem}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                  >
                    <span>+</span>
                    Ajouter
                  </button>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {expenseItems.map((item, index) => (
                    <div key={item.id} className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.libelle}
                          onChange={(e) => updateExpenseItem(item.id, 'libelle', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all text-sm"
                          placeholder={`Dépense ${index + 1}...`}
                        />
                      </div>
                      <div className="w-28">
                        <div className="relative">
                          <input
                            type="number"
                            value={item.montant}
                            onChange={(e) => updateExpenseItem(item.id, 'montant', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all text-sm pr-8"
                            placeholder="0"
                            step="0.01"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                            FCFA
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExpenseItem(item.id)}
                        className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-all flex items-center justify-center"
                        title="Supprimer cette ligne"
                        disabled={expenseItems.length === 1}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Total avec info-bulle */}
                {totalExpenseAmount > 0 && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💰</span>
                        <span className="font-semibold text-gray-700">Total des dépenses:</span>
                      </div>
                      <div 
                        className="relative"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                      >
                        <span className="text-2xl font-bold text-blue-600 cursor-help">
                          {formatCurrency(totalExpenseAmount)}
                        </span>
                        {showTooltip && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-10">
                            <div className="text-center">
                              <div className="font-semibold mb-1">Détail des montants:</div>
                              {expenseItems.map((item, index) => (
                                item.montant && parseFloat(item.montant) > 0 && (
                                  <div key={item.id} className="text-xs">
                                    {item.libelle || `Dépense ${index + 1}`}: {formatCurrency(parseFloat(item.montant))}
                                  </div>
                                )
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Date */}
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

              {/* Catégorie */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="text-xl">🏷️</span>
                  Catégorie
                </label>
                <CategoryCombobox
                  value={formData.categorie}
                  onChange={(value) => setFormData(prev => ({...prev, categorie: value}))}
                  placeholder="Sélectionner ou créer une catégorie..."
                  className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-red-50 border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium"
                />
              </div>



              {/* Boutons - Design moderne - Fixés en bas */}
              <div className="sticky bottom-0 bg-white border-t-2 border-gray-100 pt-4 mt-6">
                <div className="flex gap-4">
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
              </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de confirmation moderne */}
      <ConfirmDialog />

      {/* Bouton flottant pour créer une dépense */}
      <button
        onClick={handleOpenModal}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-6 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3 font-semibold text-lg floating-button"
        title="Créer une nouvelle dépense"
      >
        <span className="text-2xl">+</span>
        <span className="hidden sm:inline">Créer Dépense</span>
      </button>
    </div>
  )
}
