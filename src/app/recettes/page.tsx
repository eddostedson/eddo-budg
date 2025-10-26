// 🎨 PAGE RECETTES AVEC DESIGN AMÉLIORÉ - SOLDES REMARQUABLES
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRecettes } from '@/contexts/recette-context'
import { useDepenses } from '@/contexts/depense-context'
import { useUltraModernToastContext } from '@/contexts/ultra-modern-toast-context'
import { Recette } from '@/lib/shared-data'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, PlusIcon, RefreshCwIcon, TrendingUpIcon, TrendingDownIcon, DollarSignIcon, SearchIcon, CalendarIcon, FilterIcon, XIcon, SaveIcon, Grid3X3Icon, ListIcon, LayoutGridIcon, ArrowUpDownIcon, ArrowUpIcon, ArrowDownIcon, PrinterIcon } from 'lucide-react'
import RecetteCardEnhanced from '@/components/recette-card-enhanced'
import RecettesByAvailability from '@/components/recettes-by-availability'
import { toast } from 'sonner'

const RecettesPage: React.FC = () => {
  const router = useRouter()
  const { recettes, loading, error, refreshRecettes, addRecette, updateRecette, deleteRecette } = useRecettes()
  const { depenses } = useDepenses()
  const { showRecetteCreated, showRecetteUpdated, showRecetteDeleted } = useUltraModernToastContext()
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
  
  const [selectedRecette, setSelectedRecette] = useState<Recette | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pleine' | 'utilisee' | 'vide'>('all')
  const [selectedRecettes, setSelectedRecettes] = useState<string[]>([])
  const [showSelectionSummary, setShowSelectionSummary] = useState(false)
  const [floatingSummaryMinimized, setFloatingSummaryMinimized] = useState(false)
  
  // États pour les modes de vue et tri
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid')
  const [sortBy, setSortBy] = useState<'libelle' | 'montant' | 'date' | 'solde' | 'pourcentage'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    libelle: '',
    montant: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    statut: 'Reçue'
  })
  const [editForm, setEditForm] = useState({
    libelle: '',
    montant: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    statut: 'Reçue'
  })

  // Rafraîchir automatiquement les recettes toutes les 5 secondes
  useEffect(() => {
    const interval = setInterval(async () => {
      console.log('🔄 [RecettesPage] Rafraîchissement automatique des recettes')
      await refreshRecettes()
    }, 5000) // 5 secondes
    
    return () => clearInterval(interval)
  }, [refreshRecettes])

  // Debug: Surveiller les changements d'état du modal
  useEffect(() => {
    console.log('🔍 [Debug] État du modal - showModal:', showModal, 'selectedRecette:', selectedRecette?.libelle)
  }, [showModal, selectedRecette])

  // Calculs des totaux
  const totalRecettes = recettes.reduce((sum, recette) => sum + recette.montant, 0)
  const totalDepenses = depenses.reduce((sum, depense) => sum + depense.montant, 0)
  const totalDisponible = recettes.reduce((sum, recette) => sum + recette.soldeDisponible, 0)

  // Statistiques avancées
  const recettesUtilisees = recettes.filter(r => r.soldeDisponible < r.montant).length
  const recettesVides = recettes.filter(r => r.soldeDisponible === 0).length
  const recettesPleine = recettes.filter(r => r.soldeDisponible === r.montant).length

  const handleRefresh = async () => {
    try {
      await refreshRecettes()
      toast.success("Données rafraîchies avec succès !")
    } catch (error) {
      toast.error("Erreur lors du rafraîchissement")
    }
  }

  const handleViewRecette = (recette: Recette) => {
    // Navigation vers la page de détails avec Next.js router
    router.push(`/recettes/${recette.id}`)
  }

  const handleEditRecette = (recette: Recette) => {
    console.log('🔄 [handleEditRecette] Début de la modification:', recette)
    try {
      setSelectedRecette(recette)
      setEditForm({
        libelle: recette.libelle,
        montant: recette.montant.toString(),
        date: recette.dateReception || new Date().toISOString().split('T')[0],
        description: recette.description || '',
        statut: recette.statut || 'Reçue'
      })
      setShowModal(true)
      console.log('✅ [handleEditRecette] Modal ouvert avec succès')
    } catch (error) {
      console.error('❌ [handleEditRecette] Erreur:', error)
      toast.error('Erreur lors de l\'ouverture du formulaire de modification')
    }
  }

  const handleUpdateRecette = async () => {
    if (!selectedRecette) return

    try {
      // Validation
      if (!editForm.libelle || !editForm.libelle.trim()) {
        toast.error("Le libellé est obligatoire")
        return
      }

      const montant = parseFloat(editForm.montant)
      if (isNaN(montant) || montant <= 0) {
        toast.error("Le montant doit être un nombre positif")
        return
      }

      console.log('🔄 Mise à jour de la recette:', selectedRecette.id, editForm)

      await updateRecette(selectedRecette.id, {
        libelle: editForm.libelle,
        montant: montant,
        description: editForm.description,
        dateReception: editForm.date,
        statut: editForm.statut as any
      })

      showRecetteUpdated(editForm.libelle, montant)
      setShowModal(false)
      setSelectedRecette(null)
      await refreshRecettes()
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error)
      toast.error(`Erreur lors de la mise à jour: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  const handleDeleteRecette = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette recette ?")) {
      try {
        console.log('🗑️ Suppression de la recette:', id)
        const recetteToDelete = recettes.find(r => r.id === id)
        await deleteRecette(id)
        if (recetteToDelete) {
          showRecetteDeleted(recetteToDelete.libelle)
        }
      } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error)
        toast.error(`Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
      }
    }
  }

  // Fonctions de filtrage
  const filteredRecettes = recettes.filter(recette => {
    const matchesSearch = searchTerm === '' || 
      recette.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recette.montant.toString().includes(searchTerm) ||
      recette.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDateFrom = dateFrom === '' || recette.date >= dateFrom
    const matchesDateTo = dateTo === '' || recette.date <= dateTo
    
    // Filtre par statut de la recette
    let matchesStatus = true
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'pleine':
          matchesStatus = recette.soldeDisponible === recette.montant
          break
        case 'utilisee':
          matchesStatus = recette.soldeDisponible < recette.montant && recette.soldeDisponible > 0
          break
        case 'vide':
          matchesStatus = recette.soldeDisponible === 0
          break
      }
    }
    
    return matchesSearch && matchesDateFrom && matchesDateTo && matchesStatus
  })

  // Fonction de tri
  const sortedRecettes = [...filteredRecettes].sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (sortBy) {
      case 'libelle':
        aValue = a.libelle.toLowerCase()
        bValue = b.libelle.toLowerCase()
        break
      case 'montant':
        aValue = a.montant
        bValue = b.montant
        break
      case 'date':
        aValue = new Date(a.dateReception)
        bValue = new Date(b.dateReception)
        break
      case 'solde':
        aValue = a.soldeDisponible
        bValue = b.soldeDisponible
        break
      case 'pourcentage':
        // Tri spécial par pourcentage : 100% → faibles → épuisées
        const aPourcentage = a.montant > 0 ? (a.soldeDisponible / a.montant) * 100 : 0
        const bPourcentage = b.montant > 0 ? (b.soldeDisponible / b.montant) * 100 : 0
        
        // Logique de tri personnalisée pour le pourcentage
        if (aPourcentage === 100 && bPourcentage !== 100) return -1 // 100% en premier
        if (bPourcentage === 100 && aPourcentage !== 100) return 1  // 100% en premier
        if (aPourcentage === 0 && bPourcentage !== 0) return 1      // 0% en dernier
        if (bPourcentage === 0 && aPourcentage !== 0) return -1     // 0% en dernier
        
        // Pour les autres cas, tri par pourcentage décroissant (plus haut pourcentage en premier)
        return bPourcentage - aPourcentage
      default:
        aValue = a.libelle.toLowerCase()
        bValue = b.libelle.toLowerCase()
    }
    
    // Tri normal pour les autres critères
    if (sortBy !== 'pourcentage') {
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    }
    return 0
  })

  const handleCreateRecette = async () => {
    try {
      // Validation
      if (!createForm.libelle || !createForm.libelle.trim()) {
        toast.error("Le libellé est obligatoire")
        return
      }

      const montant = parseFloat(createForm.montant)
      if (isNaN(montant) || montant <= 0) {
        toast.error("Le montant doit être un nombre positif")
        return
      }

      console.log('🔄 Tentative de création de recette:', createForm)

      // Utiliser le contexte pour créer la recette
      await addRecette({
        libelle: createForm.libelle,
        montant: montant,
        soldeDisponible: montant,
        description: createForm.description,
        date: createForm.date,
        statut: createForm.statut as any,
        source: '',
        periodicite: 'unique',
        dateReception: createForm.date,
        categorie: '',
        validationBancaire: false,
        userId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      showRecetteCreated(createForm.libelle, montant)
      setShowCreateModal(false)
      setCreateForm({
        libelle: '',
        montant: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        statut: 'Reçue'
      })
      await refreshRecettes()
    } catch (error) {
      console.error('❌ Erreur lors de la création:', error)
      toast.error(`Erreur lors de la création de la recette: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  const handleCreateFormChange = (field: string, value: string) => {
    setCreateForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const clearFilters = () => {
    setSearchTerm('')
    setDateFrom('')
    setDateTo('')
    setStatusFilter('all')
  }

  // Fonctions de sélection multiple
  const toggleRecetteSelection = (recetteId: string) => {
    setSelectedRecettes(prev => {
      if (prev.includes(recetteId)) {
        return prev.filter(id => id !== recetteId)
      } else {
        return [...prev, recetteId]
      }
    })
  }

  const selectAllRecettes = () => {
    setSelectedRecettes(sortedRecettes.map(r => r.id))
  }

  const clearSelection = () => {
    setSelectedRecettes([])
  }

  // Fonction d'impression du résumé de sélection
  const printSelectionSummary = async () => {
    if (selectedRecettes.length === 0) {
      toast.error("Aucune recette sélectionnée à imprimer")
      return
    }

    const selectedRecettesData = recettes.filter(r => selectedRecettes.includes(r.id))
    const totalSelectedRecettes = selectedRecettesData.reduce((sum, recette) => sum + recette.montant, 0)
    const totalSelectedDepenses = selectedRecettesData.reduce((sum, recette) => sum + (recette.montant - recette.soldeDisponible), 0)
    const totalSelectedSoldes = selectedRecettesData.reduce((sum, recette) => sum + recette.soldeDisponible, 0)
    const pourcentageUtilisation = totalSelectedRecettes > 0 ? Math.round((totalSelectedDepenses / totalSelectedRecettes) * 100) : 0

    // Récupérer toutes les dépenses pour afficher les détails
    const allDepenses = depenses || []

    // Créer le contenu HTML pour l'impression
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Résumé des Recettes Sélectionnées</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #3b82f6;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #1f2937;
              margin: 0;
              font-size: 28px;
            }
            .header .date {
              color: #6b7280;
              margin-top: 5px;
              font-size: 14px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .summary-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
            }
            .summary-card h3 {
              margin: 0 0 10px 0;
              color: #374151;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .summary-card .amount {
              font-size: 24px;
              font-weight: bold;
              margin: 0;
            }
            .summary-card.total-revenues .amount {
              color: #059669;
            }
            .summary-card.total-expenses .amount {
              color: #dc2626;
            }
            .summary-card.available-balance .amount {
              color: #2563eb;
            }
            .summary-card.utilization .amount {
              color: #d97706;
            }
            .progress-bar {
              width: 100%;
              height: 8px;
              background: #e5e7eb;
              border-radius: 4px;
              margin-top: 10px;
              overflow: hidden;
            }
            .progress-fill {
              height: 100%;
              background: linear-gradient(90deg, #ef4444, #f59e0b);
              transition: width 0.3s ease;
            }
            .recettes-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .recettes-table th,
            .recettes-table td {
              border: 1px solid #d1d5db;
              padding: 12px;
              text-align: left;
            }
            .recettes-table th {
              background: #f3f4f6;
              font-weight: 600;
              color: #374151;
            }
            .recettes-table tr:nth-child(even) {
              background: #f9fafb;
            }
            .status-badge {
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
            }
            .status-reçue {
              background: #dcfce7;
              color: #166534;
            }
            .status-attendue {
              background: #fef3c7;
              color: #92400e;
            }
            .recette-section {
              margin-bottom: 40px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
            }
            .recette-title {
              background: #f3f4f6;
              color: #1f2937;
              margin: 0;
              padding: 16px 20px;
              font-size: 18px;
              font-weight: 600;
              border-bottom: 1px solid #e5e7eb;
            }
            .recette-summary {
              padding: 20px;
              background: #f9fafb;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
              padding: 8px 0;
              border-bottom: 1px solid #f3f4f6;
            }
            .summary-row:last-child {
              margin-bottom: 0;
              border-bottom: none;
            }
            .summary-row .label {
              font-weight: 500;
              color: #374151;
              font-size: 14px;
            }
            .summary-row .value {
              font-weight: 600;
              color: #111827;
              font-size: 14px;
            }
            .summary-row .value.amount-initial {
              color: #059669;
            }
            .summary-row .value.amount-spent {
              color: #dc2626;
            }
            .summary-row .value.amount-available {
              color: #2563eb;
            }
            .depenses-title {
              margin: 0;
              padding: 16px 20px;
              background: #fef3c7;
              color: #92400e;
              font-size: 16px;
              font-weight: 600;
              border-top: 1px solid #e5e7eb;
            }
            .depenses-table {
              width: 100%;
              border-collapse: collapse;
              margin: 0;
            }
            .depenses-table th,
            .depenses-table td {
              border: 1px solid #e5e7eb;
              padding: 12px;
              text-align: left;
              font-size: 13px;
            }
            .depenses-table th {
              background: #f9fafb;
              font-weight: 600;
              color: #374151;
            }
            .depenses-table tr:nth-child(even) {
              background: #f9fafb;
            }
            .depenses-table .amount-spent {
              color: #dc2626;
              font-weight: 600;
            }
            .no-depenses {
              padding: 20px;
              text-align: center;
              color: #6b7280;
              font-style: italic;
              background: #f9fafb;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Résumé des Recettes Sélectionnées</h1>
            <div class="date">Généré le ${new Date().toLocaleDateString('fr-FR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</div>
          </div>

          <div class="summary-grid">
            <div class="summary-card total-revenues">
              <h3>Total Recettes</h3>
              <p class="amount">${totalSelectedRecettes.toLocaleString()} F CFA</p>
            </div>
            <div class="summary-card total-expenses">
              <h3>Total Dépensé</h3>
              <p class="amount">${totalSelectedDepenses.toLocaleString()} F CFA</p>
            </div>
            <div class="summary-card available-balance">
              <h3>Solde Disponible</h3>
              <p class="amount">${totalSelectedSoldes.toLocaleString()} F CFA</p>
            </div>
            <div class="summary-card utilization">
              <h3>Taux d'Utilisation</h3>
              <p class="amount">${pourcentageUtilisation}%</p>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${pourcentageUtilisation}%"></div>
              </div>
            </div>
          </div>

          <h2>Détail des Recettes Sélectionnées (${selectedRecettesData.length})</h2>
          ${selectedRecettesData.map(recette => {
            const recetteDepenses = allDepenses.filter(d => d.recetteId === recette.id)
            const totalDepenseRecette = recetteDepenses.reduce((sum, d) => sum + d.montant, 0)
            const pourcentage = recette.montant > 0 ? Math.round((recette.soldeDisponible / recette.montant) * 100) : 0
            
            return `
              <div class="recette-section">
                <h3 class="recette-title">${recette.libelle}</h3>
                <div class="recette-summary">
                  <div class="summary-row">
                    <span class="label">Date de réception:</span>
                    <span class="value">${new Date(recette.dateReception).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div class="summary-row">
                    <span class="label">Montant initial:</span>
                    <span class="value amount-initial">${recette.montant.toLocaleString()} F CFA</span>
                  </div>
                  <div class="summary-row">
                    <span class="label">Total dépensé:</span>
                    <span class="value amount-spent">${totalDepenseRecette.toLocaleString()} F CFA</span>
                  </div>
                  <div class="summary-row">
                    <span class="label">Solde disponible:</span>
                    <span class="value amount-available">${recette.soldeDisponible.toLocaleString()} F CFA</span>
                  </div>
                  <div class="summary-row">
                    <span class="label">Statut:</span>
                    <span class="value"><span class="status-badge status-${recette.statut}">${recette.statut}</span></span>
                  </div>
                  <div class="summary-row">
                    <span class="label">% Disponible:</span>
                    <span class="value">${pourcentage}%</span>
                  </div>
                </div>
                
                ${recetteDepenses.length > 0 ? `
                  <h4 class="depenses-title">Détail des Dépenses (${recetteDepenses.length})</h4>
                  <table class="depenses-table">
                    <thead>
                      <tr>
                        <th>Libellé</th>
                        <th>Date</th>
                        <th>Montant</th>
                        <th>Catégorie</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${recetteDepenses.map(depense => `
                        <tr>
                          <td>${depense.libelle}</td>
                          <td>${new Date(depense.date).toLocaleDateString('fr-FR')}</td>
                          <td class="amount-spent">${depense.montant.toLocaleString()} F CFA</td>
                          <td>${depense.categorie || 'Non spécifiée'}</td>
                          <td>${depense.description || '-'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                ` : `
                  <div class="no-depenses">
                    <p>Aucune dépense enregistrée pour cette recette.</p>
                  </div>
                `}
              </div>
            `
          }).join('')}

          <div class="footer">
            <p>Document généré automatiquement par Budget Manager</p>
            <p>${selectedRecettesData.length} recette(s) sélectionnée(s) • Total: ${totalSelectedRecettes.toLocaleString()} F CFA</p>
          </div>
        </body>
      </html>
    `

    // Ouvrir une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      
      // Attendre que le contenu soit chargé puis imprimer
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)
      }
    }

    toast.success(`Résumé de ${selectedRecettesData.length} recette(s) envoyé à l'impression`)
  }

  // Fonctions pour les modes de vue et tri
  const handleSort = (field: 'libelle' | 'montant' | 'date' | 'solde' | 'pourcentage') => {
    if (sortBy === field) {
      // Pour le tri par pourcentage, on ne change pas l'ordre car il a sa propre logique
      if (field !== 'pourcentage') {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
      }
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (field: 'libelle' | 'montant' | 'date' | 'solde' | 'pourcentage') => {
    if (sortBy !== field) return <ArrowUpDownIcon className="h-4 w-4" />
    if (field === 'pourcentage') return <span className="text-xs">📊</span> // Icône spéciale pour le pourcentage
    return sortOrder === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />
  }


  // Calculs pour les recettes sélectionnées
  const selectedRecettesData = recettes.filter(r => selectedRecettes.includes(r.id))
  const totalSelectedRecettes = selectedRecettesData.reduce((sum, recette) => sum + recette.montant, 0)
  const totalSelectedDepenses = selectedRecettesData.reduce((sum, recette) => sum + (recette.montant - recette.soldeDisponible), 0)
  const totalSelectedSoldes = selectedRecettesData.reduce((sum, recette) => sum + recette.soldeDisponible, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Chargement des recettes...</h2>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* En-tête avec métriques intégrées - STICKY */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`sticky top-16 z-40 text-white p-8 transition-all duration-300 ${
          isPageHeaderSticky 
            ? 'bg-gradient-to-r from-blue-700 via-purple-700 to-indigo-700 shadow-2xl border-b border-white/30 backdrop-blur-xl' 
            : 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 shadow-xl border-b border-white/20'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                💰 Gestion des Recettes
                {isPageHeaderSticky && (
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                    📌 Fixé
                  </span>
                )}
              </h1>
              <p className="text-blue-100 text-lg">Suivi financier avec design remarquable</p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={handleRefresh}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white"
              >
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouvelle Recette
              </Button>
            </div>
          </div>

          {/* Métriques intégrées dans le header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <div>
                  <div className="text-sm font-medium opacity-90">Total Recettes</div>
                  <div className="text-2xl font-bold">{formatCurrency(totalRecettes)}</div>
                    </div>
                <TrendingUpIcon className="h-8 w-8 opacity-80" />
                  </div>
          </div>

            <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium opacity-90">Total Dépenses</div>
                  <div className="text-2xl font-bold">{formatCurrency(totalDepenses)}</div>
                </div>
                <TrendingDownIcon className="h-8 w-8 opacity-80" />
              </div>
            </div>

            <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium opacity-90">Solde Disponible</div>
                  <div className="text-2xl font-bold">{formatCurrency(totalDisponible)}</div>
                </div>
                <DollarSignIcon className="h-8 w-8 opacity-80" />
              </div>
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
            </h3>
            <div className="flex gap-2">
              {selectedRecettes.length > 0 && (
                <Button
                  onClick={() => setShowSelectionSummary(!showSelectionSummary)}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  📊 Résumé ({selectedRecettes.length})
                </Button>
              )}
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

          {/* Affichage des résultats par statut */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Toutes : <span className="font-bold text-gray-900">{recettes.length}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Pleines : <span className="font-bold text-green-600">{recettesPleine}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Utilisées : <span className="font-bold text-orange-600">{recettesUtilisees}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Épuisées : <span className="font-bold text-red-600">{recettesVides}</span>
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium text-gray-700">
                  Résultats : <span className="font-bold text-blue-600">{sortedRecettes.length}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            {/* Filtre par statut */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pleine' | 'utilisee' | 'vide')}
                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="pleine">Recettes pleines</option>
                <option value="utilisee">Recettes utilisées</option>
                <option value="vide">Recettes épuisées</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Résultats */}
            <div className="flex items-center justify-center">
              <Badge variant="outline" className="text-sm">
                {sortedRecettes.length} recette(s) trouvée(s)
              </Badge>
            </div>
          </div>

          {/* Contrôles de sélection multiple - toujours visibles */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-blue-800 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedRecettes.length === sortedRecettes.length && sortedRecettes.length > 0}
                  onChange={selectAllRecettes}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <span className="flex items-center">
                  <span className="mr-2">📋</span>
                  Sélection Multiple
                </span>
              </h4>
              <div className="flex gap-2">
                <Button
                  onClick={selectAllRecettes}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50 transition-colors"
                >
                  ✅ Tout sélectionner
                </Button>
                <Button
                  onClick={clearSelection}
                  variant="outline"
                  size="sm"
                  className="text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  ❌ Tout désélectionner
                </Button>
              </div>
            </div>
            {selectedRecettes.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-sm text-blue-700 bg-white rounded-lg p-2 border border-blue-100"
              >
                <span className="font-medium">🎯 {selectedRecettes.length} recette(s) sélectionnée(s)</span>
                {selectedRecettes.length > 0 && (
                  <span className="ml-2 text-xs text-blue-600">
                    (Total: {totalSelectedRecettes.toLocaleString()} F CFA)
                  </span>
                )}
              </motion.div>
            )}
          </motion.div>

        </motion.div>

        {/* Nouvelles cartes en paysage - optimisées en hauteur */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <TrendingUpIcon className="h-6 w-6" />
                </div>
                <div>
                    <div className="text-sm font-medium opacity-90">Recettes Pleines</div>
                    <div className="text-2xl font-bold">{recettesPleine}</div>
                </div>
              </div>
                <div className="text-right">
                  <div className="text-xs opacity-80">Aucune dépense effectuée</div>
              </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <TrendingDownIcon className="h-6 w-6" />
                </div>
                <div>
                    <div className="text-sm font-medium opacity-90">Recettes Utilisées</div>
                    <div className="text-2xl font-bold">{recettesUtilisees}</div>
                </div>
              </div>
                <div className="text-right">
                  <div className="text-xs opacity-80">Partiellement dépensées</div>
              </div>
            </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white shadow-xl">
            <CardContent className="p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-xl">❌</span>
                  </div>
              <div>
                    <div className="text-sm font-medium opacity-90">Recettes Vides</div>
                    <div className="text-2xl font-bold">{recettesVides}</div>
              </div>
              </div>
                <div className="text-right">
                  <div className="text-xs opacity-80">Entièrement dépensées</div>
            </div>
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
              <CardTitle className="text-lg font-semibold text-green-600">✅ Recettes Pleines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{recettesPleine}</div>
              <p className="text-sm text-gray-600 mt-2">Aucune dépense effectuée</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-orange-600">⚠️ Recettes Utilisées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{recettesUtilisees}</div>
              <p className="text-sm text-gray-600 mt-2">Partiellement dépensées</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-red-600">❌ Recettes Vides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{recettesVides}</div>
              <p className="text-sm text-gray-600 mt-2">Entièrement dépensées</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filtres rapides par statut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FilterIcon className="h-5 w-5 mr-2 text-blue-600" />
              Filtres Rapides par Statut
            </h3>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setStatusFilter('all')}
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                className={`flex items-center space-x-2 ${
                  statusFilter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-blue-50'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span>Toutes ({recettes.length})</span>
              </Button>
              
              <Button
                onClick={() => setStatusFilter('pleine')}
                variant={statusFilter === 'pleine' ? 'default' : 'outline'}
                className={`flex items-center space-x-2 ${
                  statusFilter === 'pleine' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-green-50'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Pleines ({recettesPleine})</span>
              </Button>
              
              <Button
                onClick={() => setStatusFilter('utilisee')}
                variant={statusFilter === 'utilisee' ? 'default' : 'outline'}
                className={`flex items-center space-x-2 ${
                  statusFilter === 'utilisee' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-orange-50'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>Utilisées ({recettesUtilisees})</span>
              </Button>
              
              <Button
                onClick={() => setStatusFilter('vide')}
                variant={statusFilter === 'vide' ? 'default' : 'outline'}
                className={`flex items-center space-x-2 ${
                  statusFilter === 'vide' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-red-50'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Épuisées ({recettesVides})</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Résumé des recettes sélectionnées */}
        {showSelectionSummary && selectedRecettes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center">
                  📊 Résumé des Recettes Sélectionnées
                </h3>
                <Button
                  onClick={() => setShowSelectionSummary(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  ✕
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="text-sm opacity-90">Montant Initial Total</div>
                  <div className="text-2xl font-bold">{totalMontantInitial.toLocaleString()} F CFA</div>
                </div>
                
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="text-sm opacity-90">Solde Disponible Total</div>
                  <div className="text-2xl font-bold text-green-300">{totalSoldeDisponible.toLocaleString()} F CFA</div>
                </div>
                
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="text-sm opacity-90">Total des Dépenses</div>
                  <div className="text-2xl font-bold text-red-300">{totalDepensesSelectionnees.toLocaleString()} F CFA</div>
                </div>
              </div>
              
              <div className="mt-4 text-sm opacity-90">
                {selectedRecettes.length} recette(s) sélectionnée(s) • 
                Pourcentage utilisé: {totalMontantInitial > 0 ? Math.round((totalDepensesSelectionnees / totalMontantInitial) * 100) : 0}%
              </div>
            </div>
          </motion.div>
        )}

        {/* Contrôles de vue et tri */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200 shadow-sm"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Sélecteur de vue */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 flex items-center">
                <LayoutGridIcon className="h-4 w-4 mr-2" />
                Vue :
              </span>
              <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-500 text-white shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Vue grille"
                >
                  <Grid3X3Icon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-500 text-white shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Vue liste"
                >
                  <ListIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'compact' 
                      ? 'bg-blue-500 text-white shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Vue compacte"
                >
                  <LayoutGridIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Contrôles de tri */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Trier par :</span>
              <div className="flex space-x-1">
                {[
                  { key: 'libelle', label: 'Nom' },
                  { key: 'montant', label: 'Montant' },
                  { key: 'date', label: 'Date' },
                  { key: 'solde', label: 'Solde' },
                  { key: 'pourcentage', label: 'Pourcentage' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleSort(key as any)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                      sortBy === key
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <span>{label}</span>
                    {getSortIcon(key as any)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Liste des recettes avec design rectangulaire */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Mes Recettes</h2>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {recettes.length} recettes
            </Badge>
                </div>
                
          <div className={`${
            viewMode === 'list' 
              ? 'space-y-3' 
              : viewMode === 'compact' 
              ? 'space-y-2' 
              : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          }`}>
            {sortedRecettes
              .map((recette, index) => {
                // Calculer le pourcentage pour l'affichage
                const pourcentageDisponible = recette.montant > 0 
                  ? Math.round((recette.soldeDisponible / recette.montant) * 100) 
                  : 0
                
                // Rendu selon le mode de vue
                if (viewMode === 'list') {
                  return (
                    <motion.div
                      key={recette.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="w-full"
                    >
                      <div className="relative bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <input
                              type="checkbox"
                              checked={selectedRecettes.includes(recette.id)}
                              onChange={() => toggleRecetteSelection(recette.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                            />
                            <div>
                              <h3 className="font-semibold text-gray-900">{recette.libelle}</h3>
                              <p className="text-sm text-gray-500">{recette.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">{formatCurrency(recette.montant)}</div>
                              <div className="text-sm text-gray-500">Montant total</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-green-600">{formatCurrency(recette.soldeDisponible)}</div>
                              <div className="text-sm text-gray-500">Disponible</div>
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  pourcentageDisponible >= 80 
                                    ? 'bg-green-100 text-green-700 border-green-300' 
                                    : pourcentageDisponible >= 50 
                                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                                    : pourcentageDisponible >= 20 
                                    ? 'bg-orange-100 text-orange-700 border-orange-300'
                                    : 'bg-red-100 text-red-700 border-red-300'
                                }`}
                              >
                                {pourcentageDisponible}%
                              </Badge>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => handleViewRecette(recette)}
                                variant="outline"
                                size="sm"
                              >
                                Voir
                              </Button>
                              <Button
                                onClick={() => handleEditRecette(recette)}
                                variant="outline"
                                size="sm"
                              >
                                Modifier
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                } else if (viewMode === 'compact') {
                  return (
                    <motion.div
                      key={recette.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * index }}
                      className="w-full"
                    >
                      <div className="relative bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedRecettes.includes(recette.id)}
                              onChange={() => toggleRecetteSelection(recette.id)}
                              className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                            />
                            <div>
                              <h4 className="font-medium text-sm text-gray-900 truncate max-w-32">{recette.libelle}</h4>
                              <p className="text-xs text-gray-500">{recette.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="font-medium text-sm text-gray-900">{formatCurrency(recette.montant)}</div>
                              <div className="text-xs text-gray-500">Total</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-sm text-green-600">{formatCurrency(recette.soldeDisponible)}</div>
                              <div className="text-xs text-gray-500">Disponible</div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`text-xs px-2 py-1 ${
                                pourcentageDisponible >= 80 
                                  ? 'bg-green-100 text-green-700 border-green-300' 
                                  : pourcentageDisponible >= 50 
                                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                                  : pourcentageDisponible >= 20 
                                  ? 'bg-orange-100 text-orange-700 border-orange-300'
                                  : 'bg-red-100 text-red-700 border-red-300'
                              }`}
                            >
                              {pourcentageDisponible}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                } else {
                  // Vue grille (par défaut)
                  return (
                    <motion.div
                      key={recette.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <div className="relative">
                        <RecetteCardEnhanced
                          recette={recette}
                          onView={handleViewRecette}
                          onEdit={handleEditRecette}
                          onDelete={handleDeleteRecette}
                          isSelected={selectedRecettes.includes(recette.id)}
                          onToggleSelection={toggleRecetteSelection}
                          showSelection={true}
                        />
                        {/* Indicateur de sélection amélioré */}
                        {selectedRecettes.includes(recette.id) && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg z-20"
                          >
                            <span className="text-white text-xs font-bold">✓</span>
                          </motion.div>
                        )}
                      </div>
                      {/* Indicateur de pourcentage */}
                      <div className="mt-2 text-center">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            pourcentageDisponible >= 80 
                              ? 'bg-green-100 text-green-700 border-green-300' 
                              : pourcentageDisponible >= 50 
                              ? 'bg-blue-100 text-blue-700 border-blue-300'
                              : pourcentageDisponible >= 20 
                              ? 'bg-orange-100 text-orange-700 border-orange-300'
                              : 'bg-red-100 text-red-700 border-red-300'
                          }`}
                        >
                          {pourcentageDisponible}% disponible
                        </Badge>
                      </div>
                    </motion.div>
                  )
                }
              })}
            </div>
        </motion.div>
      </div>

      {/* MODALE DE CRÉATION DE RECETTE */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Nouvelle Recette</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8"
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Libellé *
                </label>
                <input
                  type="text"
                  value={createForm.libelle}
                  onChange={(e) => handleCreateFormChange('libelle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Salaire Octobre"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (FCFA) *
                </label>
                <input
                  type="number"
                  value={createForm.montant}
                  onChange={(e) => handleCreateFormChange('montant', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 500000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={createForm.date}
                  onChange={(e) => handleCreateFormChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={createForm.statut}
                  onChange={(e) => handleCreateFormChange('statut', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Reçue">Reçue</option>
                  <option value="En attente">En attente</option>
                  <option value="Partielle">Partielle</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => handleCreateFormChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Détails supplémentaires..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => setShowCreateModal(false)}
                variant="outline"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateRecette}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Créer la Recette
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal d'édition */}
      {showModal && selectedRecette && (
        console.log('🎯 [Modal] Affichage du modal - showModal:', showModal, 'selectedRecette:', selectedRecette) || true
      ) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Modifier la Recette</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowModal(false)}
                className="w-8 h-8"
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Libellé *
                </label>
                <input
                  type="text"
                  value={editForm.libelle}
                  onChange={(e) => setEditForm(prev => ({ ...prev, libelle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nom de la recette"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (F CFA) *
                </label>
                <input
                  type="number"
                  value={editForm.montant}
                  onChange={(e) => setEditForm(prev => ({ ...prev, montant: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de réception
                </label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={editForm.statut}
                  onChange={(e) => setEditForm(prev => ({ ...prev, statut: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Reçue">Reçue</option>
                  <option value="En attente">En attente</option>
                  <option value="Annulée">Annulée</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Détails supplémentaires..."
                />
              </div>
            </div>

            <div className="flex space-x-3 p-6 pt-0">
              <Button
                onClick={() => setShowModal(false)}
                variant="outline"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleUpdateRecette}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <SaveIcon className="w-4 h-4 mr-2" />
                Mettre à jour
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Résumé flottant des recettes sélectionnées */}
      {selectedRecettes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 w-80 md:w-96 max-w-[calc(100vw-2rem)] md:max-w-sm"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-blue-200 overflow-hidden">
            {/* En-tête du résumé flottant */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 md:p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center text-sm md:text-base">
                  <span className="mr-2">📊</span>
                  Résumé Sélection
                </h4>
                <div className="flex items-center space-x-2">
                  <div className="text-xs md:text-sm bg-white bg-opacity-20 rounded-full px-2 py-1">
                    {selectedRecettes.length} recette(s)
                  </div>
                  <button
                    onClick={printSelectionSummary}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
                    title="Imprimer le résumé"
                  >
                    <PrinterIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setFloatingSummaryMinimized(!floatingSummaryMinimized)}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
                  >
                    {floatingSummaryMinimized ? '📈' : '📉'}
                  </button>
                </div>
              </div>
            </div>

            {/* Contenu du résumé */}
            {!floatingSummaryMinimized && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 md:p-4 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm text-gray-600">Total Recettes</span>
                  <span className="font-bold text-green-600 text-sm md:text-base">
                    {totalSelectedRecettes.toLocaleString()} F CFA
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm text-gray-600">Total Dépensé</span>
                  <span className="font-bold text-red-600 text-sm md:text-base">
                    {totalSelectedDepenses.toLocaleString()} F CFA
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm text-gray-600">Solde Disponible</span>
                  <span className="font-bold text-blue-600 text-sm md:text-base">
                    {totalSelectedSoldes.toLocaleString()} F CFA
                  </span>
                </div>

                {/* Barre de progression visuelle */}
                <div className="mt-3 md:mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Utilisation</span>
                    <span>{Math.round((totalSelectedDepenses / totalSelectedRecettes) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(totalSelectedDepenses / totalSelectedRecettes) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Bouton pour effacer la sélection */}
                <button
                  onClick={clearSelection}
                  className="w-full mt-3 text-xs text-gray-500 hover:text-red-600 transition-colors"
                >
                  ❌ Effacer la sélection
                </button>
              </motion.div>
            )}

            {/* Version minimisée */}
            {floatingSummaryMinimized && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 text-center"
              >
                <div className="text-lg font-bold text-blue-600">
                  {totalSelectedSoldes.toLocaleString()} F CFA
                </div>
                <div className="text-xs text-gray-500">Solde disponible</div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default RecettesPage