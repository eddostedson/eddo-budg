// 🎨 PAGE DÉPENSES AVEC DESIGN AMÉLIORÉ - SOLDES REMARQUABLES
'use client'

import React, { useState, useEffect } from 'react'
import { useDepenses } from '@/contexts/depense-context'
import { useRecettes } from '@/contexts/recette-context'
import { useUltraModernToastContext } from '@/contexts/ultra-modern-toast-context'
import { Depense } from '@/lib/shared-data'
import { formatCurrency } from '@/lib/utils'
import { RecetteService } from '@/lib/supabase/database'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, PlusIcon, RefreshCwIcon, TrendingUpIcon, TrendingDownIcon, DollarSignIcon, ReceiptIcon, EditIcon, TrashIcon, AlertTriangleIcon, SaveIcon, XIcon, SearchIcon, CalendarIcon, FilterIcon } from 'lucide-react'
import RecetteCardEnhanced from '@/components/recette-card-enhanced'
import RecetteInfoCard from '@/components/recette-info-card'
import { toast } from 'sonner'

const DepensesPage: React.FC = () => {
  const { depenses, loading, error, refreshDepenses, addDepense, updateDepense, deleteDepense } = useDepenses()
  const { recettes, refreshRecettes } = useRecettes()
  const { showSuccess, showError, showInfo } = useUltraModernToastContext()
  
  // État pour forcer la mise à jour de l'interface
  const [forceUpdate, setForceUpdate] = useState(0)
  const [isPageHeaderSticky, setIsPageHeaderSticky] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Détecter quand la section devient sticky
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setIsPageHeaderSticky(scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  const [selectedDepense, setSelectedDepense] = useState<Depense | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [depenseToDelete, setDepenseToDelete] = useState<Depense | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [depenseToEdit, setDepenseToEdit] = useState<Depense | null>(null)
  const [editForm, setEditForm] = useState({
    libelle: '',
    montant: '',
    date: '',
    description: '',
    categorie: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    libelle: '',
    montant: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    categorie: '',
    recetteId: ''
  })
  const [selectedRecette, setSelectedRecette] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(true)

  // Calculs des totaux
  const totalDepenses = depenses.reduce((sum, depense) => sum + depense.montant, 0)
  const totalRecettes = recettes.reduce((sum, recette) => sum + recette.montant, 0)
  const totalDisponible = recettes.reduce((sum, recette) => sum + recette.soldeDisponible, 0)

  // Statistiques avancées
  const depensesAvecRecu = depenses.filter(d => d.receiptUrl).length
  const depensesSansRecu = depenses.filter(d => !d.receiptUrl).length
  const depensesRecent = depenses.filter(d => {
    const depenseDate = new Date(d.date)
    const now = new Date()
    const diffDays = (now.getTime() - depenseDate.getTime()) / (1000 * 3600 * 24)
    return diffDays <= 7
  }).length

  const handleRefresh = async () => {
    try {
      await refreshDepenses()
      await refreshRecettes()
      toast.success("Dépenses rafraîchies avec succès !")
    } catch (error) {
      toast.error("Erreur lors du rafraîchissement")
    }
  }

  // Fonction de test pour forcer la mise à jour du solde
  const handleTestSoldeUpdate = async () => {
    try {
      console.log('🧪 Test de mise à jour du solde...')
      showInfo("🧪 Test Solde", "Test de mise à jour du solde en cours...")
      
      // Forcer la mise à jour de toutes les recettes
      for (const recette of recettes) {
        console.log(`🔄 Mise à jour du solde pour: ${recette.libelle}`)
        
        // Récupérer toutes les dépenses liées à cette recette
        const depensesLiees = depenses.filter(d => d.recetteId === recette.id)
        const totalDepenses = depensesLiees.reduce((sum, d) => sum + d.montant, 0)
        const nouveauSolde = recette.montant - totalDepenses
        
        console.log(`📊 ${recette.libelle}:`)
        console.log(`   - Montant initial: ${recette.montant}`)
        console.log(`   - Total dépenses: ${totalDepenses}`)
        console.log(`   - Nouveau solde: ${nouveauSolde}`)
        console.log(`   - Ancien solde: ${recette.soldeDisponible}`)
        
        // Mettre à jour le solde en base
        const result = await RecetteService.updateRecette(recette.id, {
          soldeDisponible: nouveauSolde
        })
        
        if (result) {
          console.log(`✅ Solde mis à jour pour ${recette.libelle}: ${nouveauSolde}`)
        } else {
          console.error(`❌ Échec de la mise à jour pour ${recette.libelle}`)
        }
      }
      
      // Rafraîchir les données
      await refreshRecettes()
      await refreshDepenses()
      
      showSuccess("✅ Test Terminé", "Mise à jour du solde testée avec succès")
    } catch (error) {
      console.error('❌ Erreur lors du test:', error)
      showError("Erreur de Test", `Erreur lors du test: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  const handleViewDepense = (depense: Depense) => {
    setSelectedDepense(depense)
    setShowModal(true)
  }

  const handleEditDepense = (depense: Depense) => {
    setDepenseToEdit(depense)
    setEditForm({
      libelle: depense.libelle,
      montant: depense.montant.toString(),
      date: depense.date,
      description: depense.description || '',
      categorie: depense.categorie || ''
    })
    setShowEditModal(true)
  }

  const handleUpdateDepense = async () => {
    if (!depenseToEdit) return

    try {
      // Validation
      if (!editForm.libelle || !editForm.libelle.trim()) {
        showError("Validation Erreur", "Le libellé est obligatoire")
        return
      }

      const montant = parseFloat(editForm.montant)
      if (isNaN(montant) || montant <= 0) {
        showError("Validation Erreur", "Le montant doit être un nombre positif")
        return
      }

      console.log('🔄 Mise à jour de la dépense:', depenseToEdit.id, editForm)

      await updateDepense(depenseToEdit.id, {
        libelle: editForm.libelle,
        montant: montant,
        date: editForm.date,
        description: editForm.description,
        categorie: editForm.categorie
      })

      showInfo("✨ Dépense Modifiée !", `${editForm.libelle} mise à jour avec un montant de ${montant.toLocaleString()} F CFA`)
      setShowEditModal(false)
      setDepenseToEdit(null)
      await refreshDepenses()
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error)
      showError("Erreur de Modification", `Impossible de modifier la dépense: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  const handleDeleteDepense = (depense: Depense) => {
    setDepenseToDelete(depense)
    setShowDeleteModal(true)
  }

  const confirmDeleteDepense = async () => {
    if (!depenseToDelete) return
    
    try {
      console.log('🗑️ Suppression de la dépense:', depenseToDelete.id)
      
      // Fermer le modal et afficher la notification IMMÉDIATEMENT
      setShowDeleteModal(false)
      showError("🗑️ Dépense Supprimée !", `${depenseToDelete.libelle} a été supprimée définitivement`)
      
      const depenseId = depenseToDelete.id
      setDepenseToDelete(null)
      
      // Supprimer en arrière-plan
      deleteDepense(depenseId).then(() => {
        console.log('✅ Dépense supprimée, mise à jour en arrière-plan')
      }).catch(error => {
        console.error('❌ Erreur lors de la suppression:', error)
      })
      
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error)
      showError("Erreur de Suppression", `Impossible de supprimer la dépense: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  const handleFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveEdit = async () => {
    if (!depenseToEdit) return
    
    try {
      // Ici vous pouvez appeler votre service de mise à jour
      // await DepenseService.updateDepense(depenseToEdit.id, editForm)
      toast.success("Dépense modifiée avec succès !")
      setShowEditModal(false)
      setDepenseToEdit(null)
      await refreshDepenses()
    } catch (error) {
      toast.error("Erreur lors de la modification de la dépense")
    }
  }

  // Fonctions de filtrage avec logs de débogage
  const filteredDepenses = depenses.filter(depense => {
    const matchesSearch = searchTerm === '' || 
      depense.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      depense.montant.toString().includes(searchTerm) ||
      depense.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDateFrom = dateFrom === '' || depense.date >= dateFrom
    const matchesDateTo = dateTo === '' || depense.date <= dateTo
    
    const result = matchesSearch && matchesDateFrom && matchesDateTo
    
    // Log de débogage pour chaque dépense
    if (searchTerm || dateFrom || dateTo) {
      console.log(`🔍 Filtrage dépense "${depense.libelle}":`, {
        searchTerm,
        dateFrom,
        dateTo,
        matchesSearch,
        matchesDateFrom,
        matchesDateTo,
        result
      })
    }
    
    return result
  })

  // Log du nombre de résultats filtrés
  useEffect(() => {
    console.log(`📊 Filtres actifs:`, {
      searchTerm,
      dateFrom,
      dateTo,
      totalDepenses: depenses.length,
      filteredDepenses: filteredDepenses.length
    })
  }, [searchTerm, dateFrom, dateTo, depenses.length, filteredDepenses.length])

  const handleCreateDepense = async () => {
    try {
      // Validation
      if (!createForm.recetteId) {
        showError("Validation Erreur", "Veuillez sélectionner une recette")
        return
      }

      if (!createForm.libelle || !createForm.libelle.trim()) {
        showError("Validation Erreur", "Le libellé est obligatoire")
        return
      }

      const montant = parseFloat(createForm.montant)
      if (isNaN(montant) || montant <= 0) {
        showError("Validation Erreur", "Le montant doit être un nombre positif")
        return
      }

      // Validation du solde négatif
      if (!canCreateDepense()) {
        showError("Validation Erreur", "Impossible de créer cette dépense : le solde de la recette deviendrait négatif !")
        return
      }

      console.log('🔄 Tentative de création de dépense:', createForm)

      // Fermer le modal et réinitialiser le formulaire IMMÉDIATEMENT
      setShowCreateModal(false)
      setCreateForm({
        libelle: '',
        montant: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        categorie: '',
        recetteId: ''
      })
      setSelectedRecette(null)
      
      // Afficher la notification immédiatement
      showSuccess("💰 Dépense Créée !", `${createForm.libelle} ajoutée pour ${montant.toLocaleString()} F CFA`)
      
      // Créer la dépense en arrière-plan
      addDepense({
        libelle: createForm.libelle,
        montant: montant,
        date: createForm.date,
        description: createForm.description,
        recetteId: createForm.recetteId || '',
        categorie: createForm.categorie,
        userId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).then(() => {
        // Rafraîchir en arrière-plan après la création
        console.log('✅ Dépense créée, rafraîchissement en arrière-plan')
      })
      
      // Debug: Vérifier le solde après création
      console.log('🔍 Vérification du solde après création de dépense:')
      const recetteAssociee = recettes.find(r => r.id === createForm.recetteId)
      if (recetteAssociee) {
        console.log('📋 Recette associée:', {
          libelle: recetteAssociee.libelle,
          montantInitial: recetteAssociee.montant,
          soldeDisponible: recetteAssociee.soldeDisponible
        })
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création:', error)
      showError("Erreur de Création", `Impossible de créer la dépense: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  const handleCreateFormChange = (field: string, value: string) => {
    setCreateForm(prev => ({
      ...prev,
      [field]: value
    }))

    // Si c'est le champ recetteId, mettre à jour la recette sélectionnée
    if (field === 'recetteId') {
      const recette = recettes.find(r => r.id === value)
      setSelectedRecette(recette || null)
    }
  }

  // Calculer le solde après dépense
  const getSoldeApresDepense = () => {
    if (!selectedRecette || !createForm.montant) return null
    
    const montantDepense = parseFloat(createForm.montant) || 0
    const soldeApres = selectedRecette.soldeDisponible - montantDepense
    
    return {
      soldeDisponible: selectedRecette.soldeDisponible,
      montantDepense,
      soldeApres,
      isNegative: soldeApres < 0
    }
  }

  // Vérifier si la dépense peut être créée (solde non négatif)
  const canCreateDepense = () => {
    if (!selectedRecette || !createForm.montant || !createForm.libelle.trim()) return false
    const calcul = getSoldeApresDepense()
    return calcul && !calcul.isNegative
  }

  const clearFilters = () => {
    setSearchTerm('')
    setDateFrom('')
    setDateTo('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Chargement des dépenses...</h2>
          <p className="text-gray-500 mt-2">Préparation des données financières</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={handleRefresh} className="bg-red-600 hover:bg-red-700">
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* En-tête avec animations - STICKY */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`sticky top-16 z-40 text-white p-8 transition-all duration-300 ${
          isPageHeaderSticky 
            ? 'bg-gradient-to-r from-red-700 via-orange-700 to-pink-700 shadow-2xl border-b border-white/30 backdrop-blur-xl' 
            : 'bg-gradient-to-r from-red-600 via-orange-600 to-pink-600 shadow-xl border-b border-white/20'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                💸 Gestion des Dépenses
                {isPageHeaderSticky && (
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                    📌 Fixé
                  </span>
                )}
              </h1>
              <p className="text-red-100 text-lg">Suivi financier avec design remarquable</p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={handleRefresh}
                variant="secondary"
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white"
              >
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button
                onClick={handleTestSoldeUpdate}
                variant="secondary"
                className="bg-yellow-500 bg-opacity-20 hover:bg-opacity-30 text-yellow-200 border-yellow-300"
              >
                <DollarSignIcon className="h-4 w-4 mr-2" />
                Test Solde
              </Button>
              <Button
                onClick={async () => {
                  console.log('🔄 Rafraîchissement manuel des recettes...')
                  await refreshRecettes()
                  setForceUpdate(prev => prev + 1)
                  showInfo("🔄 Rafraîchi !", "Recettes et soldes mis à jour")
                }}
                variant="secondary"
                className="bg-blue-500 bg-opacity-20 hover:bg-opacity-30 text-blue-200 border-blue-300"
              >
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                Rafraîchir
              </Button>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-white text-red-600 hover:bg-red-50"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouvelle Dépense
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto p-8">
        {/* SECTION DE FILTRES */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <FilterIcon className="h-5 w-5 mr-2 text-blue-600" />
              Filtres et Recherche
              {(searchTerm || dateFrom || dateTo) && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                  Actifs
                </Badge>
              )}
            </h3>
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
                className="text-gray-600"
              >
                {showFilters ? 'Masquer' : 'Afficher'} les filtres
              </Button>
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="text-gray-600"
              >
                Effacer les filtres
              </Button>
            </div>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              {/* Recherche */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par libellé, montant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Date de début */}
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  placeholder="Date de début"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Date de fin */}
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  placeholder="Date de fin"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Résultats avec indicateur de filtres actifs */}
              <div className="flex items-center justify-center">
                <Badge 
                  variant="outline" 
                  className={`text-sm ${
                    (searchTerm || dateFrom || dateTo) 
                      ? 'bg-blue-100 text-blue-700 border-blue-300' 
                      : 'bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  {filteredDepenses.length} dépense(s) trouvée(s)
                  {(searchTerm || dateFrom || dateTo) && ' (filtrées)'}
                </Badge>
              </div>
            </motion.div>
          )}
        </motion.div>
        {/* Cartes de statistiques globales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">Total Dépenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalDepenses)}</div>
              <div className="flex items-center mt-2">
                <TrendingDownIcon className="h-4 w-4 mr-1" />
                <span className="text-sm opacity-80">Dépenses totales</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">Total Recettes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalRecettes)}</div>
              <div className="flex items-center mt-2">
                <TrendingUpIcon className="h-4 w-4 mr-1" />
                <span className="text-sm opacity-80">Revenus totaux</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">Solde Disponible</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalDisponible)}</div>
              <div className="flex items-center mt-2">
                <DollarSignIcon className="h-4 w-4 mr-1" />
                <span className="text-sm opacity-80">Disponible</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">Statut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{depenses.length}</div>
              <div className="flex items-center mt-2">
                <span className="text-sm opacity-80">Dépenses enregistrées</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Statistiques détaillées */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-green-600">📄 Avec Reçu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{depensesAvecRecu}</div>
              <p className="text-sm text-gray-600 mt-2">Dépenses documentées</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-orange-600">📝 Sans Reçu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{depensesSansRecu}</div>
              <p className="text-sm text-gray-600 mt-2">À documenter</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-blue-600">🕒 Récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{depensesRecent}</div>
              <p className="text-sm text-gray-600 mt-2">Dernière semaine</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Liste des dépenses avec design amélioré */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Mes Dépenses</h2>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {depenses.length} dépenses
            </Badge>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepenses.map((depense, index) => (
              <motion.div
                key={depense.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-800">
                        {depense.libelle}
                      </CardTitle>
                      {depense.receiptUrl && (
                        <Badge variant="secondary" className="bg-green-100 text-green-600">
                          <ReceiptIcon className="h-3 w-3 mr-1" />
                          Reçu
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Montant avec design remarquable */}
                      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-4 text-white">
                        <div className="text-sm font-medium opacity-90 mb-1">Montant</div>
                        <div className="text-2xl font-black">{formatCurrency(depense.montant)}</div>
                      </div>

                      {/* Informations de la recette associée */}
                      {depense.recetteId && (
                        <RecetteInfoCard 
                          recetteId={depense.recetteId} 
                          className="mb-4"
                        />
                      )}

                      {/* Informations détaillées */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Date:</span>
                          <span className="font-medium">{new Date(depense.date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        
                        {depense.categorie && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Catégorie:</span>
                            <span className="font-medium">{depense.categorie}</span>
                          </div>
                        )}

                        {depense.description && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Description:</span>
                            <p className="mt-1">{depense.description}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions - Icônes agrandies avec fond */}
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          onClick={() => handleEditDepense(depense)}
                          variant="ghost"
                          size="icon"
                          className="w-10 h-10 bg-green-100 hover:bg-green-200 text-green-600 rounded-full"
                        >
                          <EditIcon className="w-5 h-5" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteDepense(depense)}
                          variant="ghost"
                          size="icon"
                          className="w-10 h-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-full"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Aperçu des recettes avec nouveau design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl p-8 shadow-lg mt-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">🎨 Recettes Disponibles</h2>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {recettes.length} recettes
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recettes.slice(0, 4).map((recette, index) => (
              <motion.div
                key={recette.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <RecetteCardEnhanced
                  recette={recette}
                  onView={() => {}}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              </motion.div>
            ))}
          </div>
          
          {recettes.length > 4 && (
            <div className="text-center mt-6">
              <Badge variant="outline" className="text-lg px-4 py-2">
                + {recettes.length - 4} autres recettes
              </Badge>
            </div>
          )}
        </motion.div>
      </div>

      {/* MODALE DE MODIFICATION */}
      {showEditModal && depenseToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Modifier la Dépense</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8"
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Libellé
                </label>
                <input
                  type="text"
                  value={editForm.libelle}
                  onChange={(e) => handleFormChange('libelle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (FCFA)
                </label>
                <input
                  type="number"
                  value={editForm.montant}
                  onChange={(e) => handleFormChange('montant', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => handleFormChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <input
                  type="text"
                  value={editForm.categorie}
                  onChange={(e) => handleFormChange('categorie', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => setShowEditModal(false)}
                variant="outline"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleUpdateDepense}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <SaveIcon className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODALE DE SUPPRESSION */}
      {showDeleteModal && depenseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangleIcon className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Confirmer la suppression
              </h3>
              <p className="text-gray-600">
                Êtes-vous sûr de vouloir supprimer cette dépense ?
              </p>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800">{depenseToDelete.libelle}</p>
                <p className="text-sm text-gray-600">
                  {formatCurrency(depenseToDelete.montant)} • {depenseToDelete.date}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => setShowDeleteModal(false)}
                variant="outline"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={confirmDeleteDepense}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODALE DE CRÉATION DE DÉPENSE - DESIGN ULTRA-MODERNE */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.6 
            }}
            className="relative bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[95vh] overflow-y-auto border border-gray-200"
          >
            {/* Effet de brillance subtil */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-50/50 via-gray-50/50 to-blue-50/50"></div>
            
            {/* Header avec design futuriste */}
            <div className="relative flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <DollarSignIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Nouvelle Dépense
                  </h3>
                  <p className="text-gray-600 text-sm">Créer une nouvelle transaction</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCreateModal(false)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl border border-gray-200"
              >
                <XIcon className="w-5 h-5" />
              </Button>
            </div>

            <div className="relative space-y-6">
              {/* 1. Recette associée - Premier champ avec design futuriste */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="relative group"
              >
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mr-2"></div>
                  Recette associée *
                </label>
                <div className="relative">
                  <select
                    value={createForm.recetteId}
                    onChange={(e) => handleCreateFormChange('recetteId', e.target.value)}
                    className="w-full px-4 py-4 bg-white border border-gray-300 rounded-2xl text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 appearance-none cursor-pointer hover:border-gray-400"
                  >
                    <option value="" className="bg-white text-gray-800">Sélectionner une recette</option>
                    {recettes.length > 0 ? (
                      recettes.map(recette => (
                        <option key={recette.id} value={recette.id} className="bg-white text-gray-800">
                          {recette.libelle} - {formatCurrency(recette.soldeDisponible)} disponible
                        </option>
                      ))
                    ) : (
                      <option value="" className="bg-white text-gray-800" disabled>
                        Aucune recette disponible
                      </option>
                    )}
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {/* Affichage du solde disponible avec design spectaculaire */}
                {selectedRecette && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="mt-4 relative overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-2xl p-4 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
                            <DollarSignIcon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-blue-200">
                            Solde Disponible
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            {formatCurrency(selectedRecette.soldeDisponible)}
                          </div>
                          <div className="text-xs text-blue-300">F CFA</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* 2. Libellé avec design futuriste */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="relative group"
              >
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-400 rounded-full mr-2"></div>
                  Libellé *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={createForm.libelle}
                    onChange={(e) => handleCreateFormChange('libelle', e.target.value)}
                    className="w-full px-4 py-4 bg-white border border-gray-300 rounded-2xl text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-400"
                    placeholder="Ex: Achat matériel"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                </div>
              </motion.div>

              {/* 3. Montant avec calcul dynamique et design spectaculaire */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="relative group"
              >
                <label className="block text-sm font-semibold text-purple-200 mb-3 flex items-center">
                  <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full mr-2 animate-pulse"></div>
                  Montant (FCFA) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={createForm.montant}
                    onChange={(e) => handleCreateFormChange('montant', e.target.value)}
                    className="w-full px-4 py-4 bg-white/5 border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 backdrop-blur-sm hover:bg-white/10"
                    placeholder="Ex: 50000"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                
                {/* Affichage du solde après dépense avec design futuriste */}
                {selectedRecette && createForm.montant && (
                  (() => {
                    const calcul = getSoldeApresDepense()
                    if (!calcul) return null
                    
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                        className={`mt-4 relative overflow-hidden rounded-2xl border backdrop-blur-sm ${
                          calcul.isNegative 
                            ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-400/30' 
                            : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/30'
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                calcul.isNegative 
                                  ? 'bg-gradient-to-r from-red-400 to-pink-400' 
                                  : 'bg-gradient-to-r from-green-400 to-emerald-400'
                              }`}>
                                {calcul.isNegative ? (
                                  <AlertTriangleIcon className="w-4 h-4 text-white" />
                                ) : (
                                  <TrendingUpIcon className="w-4 h-4 text-white" />
                                )}
                              </div>
                              <span className={`text-sm font-semibold ${
                                calcul.isNegative ? 'text-red-200' : 'text-green-200'
                              }`}>
                                Solde après dépense
                              </span>
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold bg-clip-text text-transparent ${
                                calcul.isNegative 
                                  ? 'bg-gradient-to-r from-red-400 to-pink-400' 
                                  : 'bg-gradient-to-r from-green-400 to-emerald-400'
                              }`}>
                                {formatCurrency(calcul.soldeApres)}
                              </div>
                              <div className={`text-xs ${
                                calcul.isNegative ? 'text-red-300' : 'text-green-300'
                              }`}>F CFA</div>
                            </div>
                          </div>
                          {calcul.isNegative && (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="mt-3 flex items-center space-x-2 text-red-300 text-sm"
                            >
                              <AlertTriangleIcon className="w-4 h-4" />
                              <span>Attention: Le solde sera négatif !</span>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })()
                )}
              </motion.div>

              {/* 4. Date avec design futuriste */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="relative group"
              >
                <label className="block text-sm font-semibold text-purple-200 mb-3 flex items-center">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full mr-2 animate-pulse"></div>
                  Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={createForm.date}
                    onChange={(e) => handleCreateFormChange('date', e.target.value)}
                    className="w-full px-4 py-4 bg-white/5 border border-white/20 rounded-2xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm hover:bg-white/10"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <CalendarIcon className="w-5 h-5 text-white/40" />
                  </div>
                </div>
              </motion.div>

              {/* 5. Catégorie avec design futuriste */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="relative group"
              >
                <label className="block text-sm font-semibold text-purple-200 mb-3 flex items-center">
                  <div className="w-2 h-2 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full mr-2 animate-pulse"></div>
                  Catégorie
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={createForm.categorie}
                    onChange={(e) => handleCreateFormChange('categorie', e.target.value)}
                    className="w-full px-4 py-4 bg-white/5 border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 backdrop-blur-sm hover:bg-white/10"
                    placeholder="Ex: Matériel, Transport, etc."
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                </div>
              </motion.div>

              {/* 6. Description avec design futuriste */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="relative group"
              >
                <label className="block text-sm font-semibold text-purple-200 mb-3 flex items-center">
                  <div className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mr-2 animate-pulse"></div>
                  Description
                </label>
                <div className="relative">
                  <textarea
                    value={createForm.description}
                    onChange={(e) => handleCreateFormChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-4 bg-white/5 border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 resize-none"
                    placeholder="Détails supplémentaires..."
                  />
                  <div className="absolute right-4 top-4 pointer-events-none">
                    <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Boutons avec design futuriste */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex space-x-4 mt-8"
            >
              <Button
                onClick={() => setShowCreateModal(false)}
                variant="outline"
                className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300 rounded-2xl transition-all duration-300 hover:scale-105"
              >
                <XIcon className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button
                onClick={handleCreateDepense}
                disabled={!canCreateDepense()}
                className={`flex-1 h-12 rounded-2xl shadow-lg transition-all duration-300 ${
                  canCreateDepense() 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-xl hover:scale-105' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400'
                }`}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                {canCreateDepense() ? 'Créer la Dépense' : 'Solde Insuffisant'}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default DepensesPage