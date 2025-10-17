'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { useRecettes } from '@/contexts/recette-context'
import { useDepenses } from '@/contexts/depense-context'
import { useNotifications } from '@/contexts/notification-context'
import { useConfirm } from '@/components/modern-confirm'
import TransfertModal from '@/components/transfer-modal'
import RentalIncomeForm from '@/components/rental-income-form'
import RentalEditModal from '@/components/rental-edit-modal'
import { Recette } from '@/lib/shared-data'
import { UnifiedPrintButton } from '@/components/UnifiedPrintButton'
import { HighlightText, shouldHighlight } from '@/lib/highlight-utils'
import { ReceiptPreview } from '@/components/receipt-preview'
import { ReceiptUpload } from '@/components/receipt-upload'
import { ReceiptSidebar } from '@/components/receipt-sidebar'
import { BankValidationBadge } from '@/components/bank-validation-badge'
import { CertifiedSummary } from '@/components/certified-summary'
import { CertifiedDebug } from '@/components/certified-debug'

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
  const { recettes, addRecette, deleteRecette, updateRecette, getTotalRecettes, getTotalDisponible, getTotalCertified, getTotalCertifiedAmount, getCertifiedRecettes, refreshRecettes, toggleBankValidation } = useRecettes()
  const { depenses } = useDepenses()
  const { showSuccess, showError, showWarning } = useNotifications()
  const { confirm, ConfirmDialog } = useConfirm()
  const [showModal, setShowModal] = useState(false)
  const [editingRecette, setEditingRecette] = useState<Recette | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // États pour l'UX améliorée
  const [newlyAddedId, setNewlyAddedId] = useState<number | null>(null)
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null)
  
  // États pour le modal de transfert
  const [showTransfertModal, setShowTransfertModal] = useState(false)
  const [selectedRecetteForTransfert, setSelectedRecetteForTransfert] = useState<Recette | null>(null)
  
  // États pour le formulaire de loyers
  const [showRentalModal, setShowRentalModal] = useState(false)
  const [showRentalEditModal, setShowRentalEditModal] = useState(false)
  const [selectedRentalRecette, setSelectedRentalRecette] = useState<Recette | null>(null)
  
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

  // États pour les reçus
  const [receiptUrl, setReceiptUrl] = useState<string>('')
  const [receiptFileName, setReceiptFileName] = useState<string>('')
  
  // États pour le panneau latéral d'aperçu
  const [showReceiptSidebar, setShowReceiptSidebar] = useState(false)
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string>('')
  const [selectedReceiptFileName, setSelectedReceiptFileName] = useState<string>('')

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

  // Écouter les mises à jour de recettes et dépenses depuis d'autres pages
  useEffect(() => {
    const handleRecetteUpdate = () => {
      console.log('🔄 Recette mise à jour détectée, rafraîchissement...')
      refreshRecettes()
    }

    const handleDepenseAdded = () => {
      console.log('💰 Dépense ajoutée détectée, rafraîchissement des recettes...')
      refreshRecettes()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('recetteUpdated', handleRecetteUpdate)
      window.addEventListener('depenseAdded', handleDepenseAdded)
      return () => {
        window.removeEventListener('recetteUpdated', handleRecetteUpdate)
        window.removeEventListener('depenseAdded', handleDepenseAdded)
      }
    }
  }, [refreshRecettes])

  // Auto-scroll vers la nouvelle recette et surlignage
  useEffect(() => {
    if (newlyAddedId && recettes.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`recette-${newlyAddedId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setTimeout(() => {
            setHighlightedRow(null)
            setNewlyAddedId(null)
          }, 5000)
        }
      }, 100)
    }
  }, [newlyAddedId, recettes])

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
    // Vérifier si c'est une recette de loyers
    if (recette.source === 'Loyers' && recette.description.includes('Détail des loyers:')) {
      setSelectedRentalRecette(recette)
      setShowRentalEditModal(true)
    } else {
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
      setReceiptUrl(recette.receiptUrl || '')
      setReceiptFileName(recette.receiptFileName || '')
      setShowModal(true)
    }
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
    setReceiptUrl('')
    setReceiptFileName('')
  }

  // Fonction pour ouvrir l'aperçu du reçu dans le panneau latéral
  const handleViewReceipt = (receiptUrl: string, fileName: string) => {
    setSelectedReceiptUrl(receiptUrl)
    setSelectedReceiptFileName(fileName)
    setShowReceiptSidebar(true)
  }

  // Fonction pour gérer le survol instantané
  const handleReceiptHover = (receiptUrl: string, fileName: string) => {
    setSelectedReceiptUrl(receiptUrl)
    setSelectedReceiptFileName(fileName)
    setShowReceiptSidebar(true)
  }

  // Fonction pour gérer la sortie du survol
  const handleReceiptLeave = () => {
    setShowReceiptSidebar(false)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Empêcher les soumissions multiples
    if (isSubmitting) return
    
    setIsSubmitting(true)

    const recetteData = {
      ...formData,
      montant: parseFloat(formData.montant),
      receiptUrl: receiptUrl || null,
      receiptFileName: receiptFileName || null
    }

    try {
      if (editingRecette) {
        // Mise à jour
        await updateRecette(editingRecette.id, recetteData)
        showSuccess(
          "Recette mise à jour",
          "Votre recette a été modifiée avec succès !"
        )
      } else {
        // Création
        await addRecette(recetteData)
        showSuccess(
          "Recette créée",
          "Votre nouvelle recette a été enregistrée avec succès !"
        )
        
        // Marquer la nouvelle recette pour le scroll et le surlignage
        // On utilise un ID temporaire basé sur le timestamp
        const tempId = Date.now()
        setNewlyAddedId(tempId)
        setHighlightedRow(tempId)
      }
      
      resetForm()
      setShowModal(false)
    } catch (error) {
      showError(
        "Erreur de création",
        "Une erreur est survenue lors de la création de la recette. Veuillez réessayer."
      )
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDelete = async (id: string) => {
    const confirmed = await confirm(
      'Supprimer la recette',
      'Êtes-vous sûr de vouloir supprimer cette recette ? Cette action est irréversible.',
      {
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
      }
    )
    if (confirmed) {
      try {
        await deleteRecette(id)
        showSuccess(
          "Recette supprimée",
          "La recette a été supprimée avec succès !"
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

  // Fonction pour parser et afficher les détails des loyers
  const parseRentalDetails = (description: string) => {
    if (!description.includes('Détail des loyers:')) {
      return null
    }

    const lines = description.split('\n')
    const rentalDetails = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Chercher les lignes qui contiennent les détails des villas
      if (line.includes('Villa') && line.includes('FCFA')) {
        const villaMatch = line.match(/(Villa \d+ Pièces[^:]*):\s*(\d+(?:\s*\d+)*)\s*FCFA/)
        if (villaMatch) {
          const villaName = villaMatch[1].trim()
          const amount = villaMatch[2].replace(/\s/g, '')
          
          // Chercher le nom du locataire dans la ligne suivante
          let tenantName = ''
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim()
            const tenantMatch = nextLine.match(/Locataire:\s*(.+)/)
            if (tenantMatch) {
              tenantName = tenantMatch[1].trim()
            }
          }
          
          rentalDetails.push({
            villa: villaName,
            amount: parseInt(amount),
            tenant: tenantName
          })
        }
      }
    }
    
    return rentalDetails
  }

  // Fonction pour ouvrir le modal de transfert
  const handleOpenTransfertModal = (recette: Recette) => {
    setSelectedRecetteForTransfert(recette)
    setShowTransfertModal(true)
  }

  // Fonction pour fermer le modal de transfert
  const handleCloseTransfertModal = () => {
    setShowTransfertModal(false)
    setSelectedRecetteForTransfert(null)
  }

  // Séparer les recettes actives et clôturées
  const recettesActives = recettes.filter(recette => recette.statutCloture === 'active' || !recette.statutCloture)
  const recettesCloturees = recettes.filter(recette => recette.statutCloture === 'cloturee')

  // Filtrer les recettes selon les critères de recherche
  const filteredRecettesActives = recettesActives.filter(recette => {
    const matchLibelle = !searchFilters.libelle || recette.libelle.toLowerCase().includes(searchFilters.libelle.toLowerCase())
    const matchMontantMin = !searchFilters.montantMin || recette.montant >= parseFloat(searchFilters.montantMin)
    const matchMontantMax = !searchFilters.montantMax || recette.montant <= parseFloat(searchFilters.montantMax)
    const matchSource = !searchFilters.source || recette.source.toLowerCase().includes(searchFilters.source.toLowerCase())
    const matchDateDebut = !searchFilters.dateDebut || new Date(recette.dateReception) >= new Date(searchFilters.dateDebut)
    const matchDateFin = !searchFilters.dateFin || new Date(recette.dateReception) <= new Date(searchFilters.dateFin)
    const matchStatut = !searchFilters.statut || recette.statut === searchFilters.statut
    
    return matchLibelle && matchMontantMin && matchMontantMax && matchSource && matchDateDebut && matchDateFin && matchStatut
  }).sort((a, b) => {
    // Trier par date de création décroissante (plus récentes en haut, plus anciennes en bas)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
            <div className="flex gap-3">
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
              <button
                onClick={() => setShowRentalModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                <span className="text-2xl">🏠</span>
                ENREGISTRER LOYERS
              </button>
            </div>
          </div>

          {/* Barre de Recherche */}
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Rechercher et Filtrer
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={resetFilters}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  🔄 Réinitialiser
                </button>
                <UnifiedPrintButton
                  onPrint={handlePrint}
                  disabled={filteredRecettesActives.length === 0}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher par libellé..."
                  value={searchFilters.libelle}
                  onChange={(e) => setSearchFilters({...searchFilters, libelle: e.target.value})}
                  className="w-full px-4 py-2 pl-10 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white transition-all duration-200 hover:bg-opacity-30"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-200">
                  🔍
                </div>
                {searchFilters.libelle && (
                  <button
                    onClick={() => setSearchFilters({...searchFilters, libelle: ''})}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white hover:text-red-300 transition-colors"
                    title="Effacer la recherche"
                  >
                    ✕
                  </button>
                )}
              </div>
              
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
            
            {/* Indicateur de résultats de recherche */}
            {filteredRecettesActives.length !== recettesActives.length && (
              <div className="mt-4 p-3 bg-white bg-opacity-10 backdrop-blur-sm rounded-xl border border-white border-opacity-20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🔍</span>
                    <div>
                      <p className="text-white font-semibold">
                        {filteredRecettesActives.length} résultat(s) trouvé(s)
                      </p>
                      <p className="text-blue-100 text-sm">
                        sur {recettesActives.length} recette(s) actives
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSearchFilters({
                      libelle: '',
                      montantMin: '',
                      montantMax: '',
                      source: '',
                      dateDebut: '',
                      dateFin: '',
                      statut: ''
                    })}
                    className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
                    title="Effacer tous les filtres"
                  >
                    <span>🗑️</span>
                    <span>Effacer</span>
                  </button>
                </div>
              </div>
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

            {/* Recettes Certifiées */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border-2 border-white border-opacity-30 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🏆</span>
                </div>
                <div>
                  <p className="text-blue-100 text-xs font-medium">SOLDE CERTIFIÉ</p>
                  <p className="text-[10px] text-blue-200">Disponible vérifié</p>
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight drop-shadow-lg">
                {formatCurrency(getTotalCertified())}
              </div>
              <div className="text-xs text-yellow-200 mt-1">
                {getCertifiedRecettes().length} recette(s) validée(s)
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
        
        {/* En-tête avec indicateur de tri */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">💰 Liste des Recettes</h2>
                <p className="text-gray-600">Vos sources de revenus organisées</p>
              </div>
              <div className="text-sm text-blue-600 flex items-center">
                <span className="mr-2">🕒</span>
                Trié par date de création (plus récentes en haut)
              </div>
            </div>
          </div>
        </div>

        {/* Résumé des Recettes Certifiées */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Résumé des Recettes Certifiées</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  refreshRecettes()
                  showSuccess("Données rafraîchies", "Les données ont été mises à jour")
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                🔄 Rafraîchir
              </button>
              <button
                onClick={() => {
                  console.log('🔍 Debug - Recettes actuelles:', recettes)
                  console.log('🔍 Debug - Recettes certifiées:', getCertifiedRecettes())
                  console.log('🔍 Debug - Total certifié:', getTotalCertified())
                  showSuccess("Debug envoyé", "Vérifiez la console du navigateur (F12)")
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                🐛 Debug
              </button>
            </div>
          </div>
          <CertifiedSummary 
            totalCertified={getTotalCertified()}
            totalRecettes={getTotalRecettes()}
            totalCertifiedAmount={getTotalCertifiedAmount()}
            certifiedRecettes={getCertifiedRecettes()}
          />
        </div>


        {/* Indicateur de correspondances */}
        {searchFilters.libelle && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-green-600">🔍</span>
              <span className="text-green-800 font-medium">
                {filteredRecettesActives.filter(recette => 
                  shouldHighlight(recette.libelle, searchFilters.libelle) || 
                  (recette.description && shouldHighlight(recette.description, searchFilters.libelle))
                ).length} correspondance(s) trouvée(s) pour "{searchFilters.libelle}"
              </span>
            </div>
          </div>
        )}

        {/* Recettes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecettesActives.map((recette, index) => {
            const isHighlighted = highlightedRow === parseInt(recette.id)
            const isLibelleMatch = shouldHighlight(recette.libelle, searchFilters.libelle)
            const isDescriptionMatch = recette.description && shouldHighlight(recette.description, searchFilters.libelle)
            const hasSearchMatch = isLibelleMatch || isDescriptionMatch
            
            // Calculer le solde correct en temps réel
            const depensesLiees = depenses.filter(d => d.recetteId === recette.id)
            const totalDepenses = depensesLiees.reduce((total, depense) => total + depense.montant, 0)
            const soldeCorrect = recette.montant - totalDepenses
            
            return (
              <div
                key={recette.id}
                id={`recette-${recette.id}`}
                onClick={() => {
                  // Précharger les données pour une navigation plus rapide
                  router.prefetch(`/recettes/${recette.id}`)
                  router.push(`/recettes/${recette.id}`)
                }}
                className={`group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 border-l-4 cursor-pointer ${
                  isHighlighted
                    ? 'bg-green-100 border-green-300 shadow-2xl transform scale-[1.02] highlight-new-item'
                    : hasSearchMatch
                    ? 'border-green-500 bg-green-50'
                    : 'border-blue-500'
                }`}
              >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      <HighlightText 
                        text={recette.libelle} 
                        searchTerm={searchFilters.libelle} 
                      />
                    </h3>
                    <p className="text-2xl font-bold text-blue-600 mb-1">{formatCurrency(recette.montant)}</p>
                    <p className="text-xs text-gray-500 mb-3">Montant initial</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full ${COLORS[index % COLORS.length]}`}></div>
                </div>
                
                {/* Solde Disponible - Encadré */}
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-green-700">💰 Solde Disponible</span>
                    <span className="text-xl font-bold text-green-600">{formatCurrency(soldeCorrect)}</span>
                  </div>
                  {totalDepenses > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      Dépensé : {formatCurrency(totalDepenses)}
                    </p>
                  )}
                </div>
                
                {/* Badge de validation bancaire */}
                <div className="mb-4">
                  <BankValidationBadge 
                    recette={recette}
                    onToggleValidation={toggleBankValidation}
                    className="w-full"
                  />
                </div>

                
                {/* Affichage des détails des loyers ou description normale */}
                {recette.source === 'Loyers' && parseRentalDetails(recette.description) ? (
                  <div className="text-sm text-gray-600 mb-4">
                    <div className="font-medium text-gray-800 mb-3">Détail des loyers:</div>
                    {parseRentalDetails(recette.description)?.map((rental, index) => (
                      <div key={index} className="mb-3">
                        <div className="font-medium text-gray-700 mb-1">{rental.villa}:</div>
                        <div className="ml-2">
                          <input
                            type="text"
                            value={formatCurrency(rental.amount)}
                            readOnly
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700"
                          />
                          {rental.tenant && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-xs">👤</span>
                              <span className="text-xs text-gray-600">Locataire: {rental.tenant}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 mb-4 h-10">
                    <HighlightText 
                      text={recette.description} 
                      searchTerm={searchFilters.libelle} 
                    />
                  </p>
                )}
                
                <div className="text-xs text-gray-500 space-y-2">
                  <div className="flex justify-between"><span className="font-medium">Source:</span> <span>{recette.source}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Date:</span> <span>{new Date(recette.dateReception).toLocaleDateString('fr-FR')}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Créé le:</span> <span className="text-blue-600 font-medium">{new Date(recette.createdAt).toLocaleDateString('fr-FR')}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Statut:</span> <span className="font-bold capitalize">{recette.statut}</span></div>
                  
                  {/* Reçu */}
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Reçu:</span>
                    {recette.receiptUrl ? (
                      <div
                        onMouseEnter={() => handleReceiptHover(recette.receiptUrl!, recette.receiptFileName || '')}
                        onMouseLeave={handleReceiptLeave}
                        className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 text-xs font-medium hover:bg-green-50 px-2 py-1 rounded transition-colors cursor-pointer"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Voir
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditClick(recette)
                    }} 
                    className="bg-white/80 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                    title="Modifier la recette"
                  >
                    ✏️
                  </button>
                  {soldeCorrect > 0 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenTransfertModal(recette)
                      }} 
                      className="bg-white/80 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                      title="Transférer le solde restant"
                    >
                      🔄
                    </button>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(recette.id)
                    }} 
                    className="bg-white/80 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                    title="Supprimer la recette"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
            )
          })}
        </div>

        {filteredRecettesActives.length === 0 && recettesCloturees.length === 0 && (
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

        {/* Section des Recettes Clôturées */}
        {recettesCloturees.length > 0 && (
          <div className="mt-12">
            <div className="bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <span className="text-4xl">🔒</span>
                    Recettes Clôturées
                  </h2>
                  <p className="text-orange-100 text-lg mt-2">Recettes avec solde épuisé (solde = 0)</p>
                </div>
                <div className="bg-white/20 backdrop-blur-lg rounded-xl px-4 py-2">
                  <span className="text-2xl font-bold text-white">{recettesCloturees.length}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recettesCloturees.map((recette, index) => {
                const depensesLiees = depenses.filter(d => d.recetteId === recette.id)
                const totalDepenses = depensesLiees.reduce((total, depense) => total + depense.montant, 0)
                const soldeCorrect = recette.montant - totalDepenses
                
                return (
                  <div
                    key={recette.id}
                    className="group relative bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 border-l-4 border-orange-500 cursor-pointer"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{recette.libelle}</h3>
                          <p className="text-2xl font-bold text-orange-600 mb-1">{formatCurrency(recette.montant)}</p>
                          <p className="text-xs text-gray-500 mb-3">Montant initial</p>
                        </div>
                        <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                      </div>
                      
                      {/* Solde Épuisé - Encadré Orange */}
                      <div className="bg-orange-100 border-2 border-orange-500 rounded-xl p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-orange-700">🔒 Solde Épuisé</span>
                          <span className="text-xl font-bold text-orange-600">{formatCurrency(soldeCorrect)}</span>
                        </div>
                        <p className="text-xs text-orange-600 mt-1">
                          Dépensé : {formatCurrency(totalDepenses)}
                        </p>
                      </div>
                      
                      {/* Affichage des détails des loyers ou description normale */}
                      {recette.source === 'Loyers' && parseRentalDetails(recette.description) ? (
                        <div className="text-sm text-gray-600 mb-4">
                          <div className="font-medium text-gray-800 mb-3">Détail des loyers:</div>
                          {parseRentalDetails(recette.description)?.map((rental, index) => (
                            <div key={index} className="mb-3">
                              <div className="font-medium text-gray-700 mb-1">{rental.villa}:</div>
                              <div className="ml-2">
                                <input
                                  type="text"
                                  value={formatCurrency(rental.amount)}
                                  readOnly
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700"
                                />
                                {rental.tenant && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs">👤</span>
                                    <span className="text-xs text-gray-600">Locataire: {rental.tenant}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 mb-4 h-10">{recette.description}</p>
                      )}
                      
                      <div className="text-xs text-gray-500 space-y-2">
                        <div className="flex justify-between"><span className="font-medium">Source:</span> <span>{recette.source}</span></div>
                        <div className="flex justify-between"><span className="font-medium">Date:</span> <span>{new Date(recette.dateReception).toLocaleDateString('fr-FR')}</span></div>
                        <div className="flex justify-between"><span className="font-medium">Statut:</span> <span className="font-bold text-orange-600">Clôturée</span></div>
                        
                        {/* Reçu */}
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Reçu:</span>
                          {recette.receiptUrl ? (
                            <div
                              onMouseEnter={() => handleReceiptHover(recette.receiptUrl!, recette.receiptFileName || '')}
                              onMouseLeave={handleReceiptLeave}
                              className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 text-xs font-medium hover:bg-green-50 px-2 py-1 rounded transition-colors cursor-pointer"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Voir
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions pour recettes clôturées */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/recettes/${recette.id}`)
                          }} 
                          className="bg-white/80 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                          title="Voir les détails"
                        >
                          👁️
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(recette.id)
                          }} 
                          className="bg-white/80 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                          title="Supprimer la recette"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
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

              {/* Reçu */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="text-xl">📄</span>
                  Reçu
                  <span className="text-xs text-gray-500 font-normal ml-2">(Optionnel)</span>
                </label>
                <ReceiptUpload
                  onReceiptUploaded={(url, fileName) => {
                    setReceiptUrl(url)
                    setReceiptFileName(fileName)
                  }}
                  onReceiptRemoved={() => {
                    setReceiptUrl('')
                    setReceiptFileName('')
                  }}
                  currentReceiptUrl={receiptUrl}
                  currentFileName={receiptFileName}
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
                  disabled={isSubmitting}
                  className={`flex-1 px-6 py-4 font-bold rounded-2xl shadow-lg transition-all transform ${
                    isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 hover:from-blue-700 hover:via-purple-600 hover:to-blue-700 hover:shadow-xl hover:scale-105 active:scale-95'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enregistrement...
                    </span>
                  ) : (
                    editingRecette ? '💾 Enregistrer' : '✨ Créer la Recette'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de transfert */}
      <TransfertModal
        isOpen={showTransfertModal}
        onClose={handleCloseTransfertModal}
        recetteSourceId={selectedRecetteForTransfert?.id}
        montantDisponible={selectedRecetteForTransfert ? 
          selectedRecetteForTransfert.montant - depenses.filter(d => d.recetteId === selectedRecetteForTransfert.id).reduce((total, depense) => total + depense.montant, 0) 
          : 0
        }
      />

      {/* Modal pour enregistrer les loyers */}
      <RentalIncomeForm
        isOpen={showRentalModal}
        onClose={() => setShowRentalModal(false)}
        onSuccess={() => {
          refreshRecettes()
          setShowRentalModal(false)
        }}
      />

      {/* Modal pour modifier les loyers */}
      <RentalEditModal
        isOpen={showRentalEditModal}
        onClose={() => {
          setShowRentalEditModal(false)
          setSelectedRentalRecette(null)
        }}
        recette={selectedRentalRecette}
        onSuccess={() => {
          refreshRecettes()
          setShowRentalEditModal(false)
          setSelectedRentalRecette(null)
        }}
      />

      {/* Boutons flottants */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        {/* Bouton pour les loyers */}
        <button
          onClick={() => setShowRentalModal(true)}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3 font-semibold text-lg floating-button"
          title="Enregistrer vos loyers"
        >
          <span className="text-2xl">🏠</span>
          <span className="hidden sm:inline">Loyers</span>
        </button>
        
        {/* Bouton pour créer une recette */}
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3 font-semibold text-lg floating-button"
          title="Créer une nouvelle recette"
        >
          <span className="text-2xl">+</span>
          <span className="hidden sm:inline">Créer Recette</span>
        </button>
      </div>

      {/* Dialog de confirmation */}
      <ConfirmDialog />

      {/* Panneau latéral pour l'aperçu des reçus */}
      <ReceiptSidebar
        isOpen={showReceiptSidebar}
        onClose={() => setShowReceiptSidebar(false)}
        receiptUrl={selectedReceiptUrl}
        fileName={selectedReceiptFileName}
        autoClose={false}
      />

    </div>
  )
}
