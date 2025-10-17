'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotes } from '@/contexts/notes-context'
import { useRecettes } from '@/contexts/recette-context'
import { useNotifications } from '@/contexts/notification-context'
import { useConfirm } from '@/components/modern-confirm'
import { Note, NoteFormData, ConvertNoteToRecetteData, ConvertNoteToDepenseData } from '@/types/notes'
import { formatCurrency } from '@/lib/utils'
import '@/lib/debug-notes'

export default function NotesPage() {
  const router = useRouter()
  const { notes, createNote, updateNote, deleteNote, convertNoteToRecette, convertNoteToDepense, cancelNote, refreshNotes, getNotesByStatus, getNotesByType } = useNotes()
  const { recettes } = useRecettes()
  const { showSuccess, showError, showWarning } = useNotifications()
  const { confirm, ConfirmDialog } = useConfirm()

  const [showModal, setShowModal] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [selectedNoteForConvert, setSelectedNoteForConvert] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<'recette' | 'depense'>('depense')

  // Filtres de recherche
  const [searchFilters, setSearchFilters] = useState({
    libelle: '',
    priorite: '',
    statut: '',
    montantMin: '',
    montantMax: ''
  })

  const [formData, setFormData] = useState<NoteFormData>({
    libelle: '',
    montant: 0,
    description: '',
    date_prevue: '',
    priorite: 'normale',
    type: 'depense'
  })

  const [convertRecetteData, setConvertRecetteData] = useState<ConvertNoteToRecetteData>({
    noteId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    source: 'Note',
    periodicite: 'unique'
  })

  const [convertDepenseData, setConvertDepenseData] = useState<ConvertNoteToDepenseData>({
    noteId: '',
    recetteId: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  })

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      console.log('🔄 Chargement des notes...')
      await refreshNotes()
      console.log('📝 Notes chargées:', notes.length)
    }
    loadData()
  }, [])

  // Filtrer les notes
  const filteredNotes = notes.filter(note => {
    const matchLibelle = !searchFilters.libelle || note.libelle.toLowerCase().includes(searchFilters.libelle.toLowerCase())
    const matchPriorite = !searchFilters.priorite || note.priorite === searchFilters.priorite
    const matchStatut = !searchFilters.statut || note.statut === searchFilters.statut
    const matchMontantMin = !searchFilters.montantMin || note.montant >= parseFloat(searchFilters.montantMin)
    const matchMontantMax = !searchFilters.montantMax || note.montant <= parseFloat(searchFilters.montantMax)
    const matchType = note.type === selectedType
    
    console.log(`🔍 Filtrage note "${note.libelle}":`, {
      matchLibelle,
      matchPriorite,
      matchStatut,
      matchMontantMin,
      matchMontantMax,
      matchType,
      noteType: note.type,
      selectedType,
      finalMatch: matchLibelle && matchPriorite && matchStatut && matchMontantMin && matchMontantMax && matchType
    })
    
    return matchLibelle && matchPriorite && matchStatut && matchMontantMin && matchMontantMax && matchType
  })
  
  console.log('📊 État des notes:', {
    totalNotes: notes.length,
    selectedType,
    filteredNotes: filteredNotes.length,
    notesDetails: notes.map(n => ({ libelle: n.libelle, type: n.type, statut: n.statut }))
  })

  // Séparer les notes par statut et type
  const notesEnAttente = getNotesByStatus('en_attente').filter(note => note.type === selectedType)
  const notesConverties = getNotesByStatus('convertie').filter(note => note.type === selectedType)
  const notesAnnulees = getNotesByStatus('annulee').filter(note => note.type === selectedType)

  // Gestion du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.libelle || formData.montant <= 0) {
      showWarning("Champs requis", "Veuillez remplir le libellé et le montant.")
      return
    }

    try {
      if (editingNote) {
        await updateNote(editingNote.id, formData)
      } else {
        await createNote(formData)
      }
      resetForm()
      setShowModal(false)
    } catch (error) {
      showError("Erreur", "Une erreur est survenue lors de la sauvegarde.")
    }
  }

  const resetForm = () => {
    setFormData({
      libelle: '',
      montant: 0,
      description: '',
      date_prevue: '',
      priorite: 'normale',
      type: selectedType
    })
    setEditingNote(null)
  }

  const handleEdit = (note: Note) => {
    setFormData({
      libelle: note.libelle,
      montant: note.montant,
      description: note.description || '',
      date_prevue: note.date_prevue || '',
      priorite: note.priorite,
      type: note.type
    })
    setEditingNote(note)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm(
      'Supprimer la note',
      'Êtes-vous sûr de vouloir supprimer cette note ? Cette action est irréversible.',
      {
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
      }
    )
    if (confirmed) {
      await deleteNote(id)
    }
  }

  const handleConvert = (note: Note) => {
    setSelectedNoteForConvert(note)
    if (note.type === 'recette') {
      setConvertRecetteData({
        noteId: note.id,
        date: new Date().toISOString().split('T')[0],
        description: note.description || '',
        source: 'Note',
        periodicite: 'unique'
      })
    } else {
      setConvertDepenseData({
        noteId: note.id,
        recetteId: '',
        date: new Date().toISOString().split('T')[0],
        description: note.description || ''
      })
    }
    setShowConvertModal(true)
  }

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedNoteForConvert?.type === 'depense' && !convertDepenseData.recetteId) {
      showWarning("Recette requise", "Veuillez sélectionner une recette.")
      return
    }

    try {
      if (selectedNoteForConvert?.type === 'recette') {
        await convertNoteToRecette(convertRecetteData)
      } else {
        await convertNoteToDepense(convertDepenseData)
      }
      setShowConvertModal(false)
      setSelectedNoteForConvert(null)
    } catch (error) {
      showError("Erreur", "Une erreur est survenue lors de la conversion.")
    }
  }

  const handleCancel = async (id: string) => {
    const confirmed = await confirm(
      'Annuler la note',
      'Êtes-vous sûr de vouloir annuler cette note ?',
      {
        confirmText: 'Annuler',
        cancelText: 'Retour',
        type: 'warning'
      }
    )
    if (confirmed) {
      await cancelNote(id)
    }
  }

  const resetFilters = () => {
    setSearchFilters({
      libelle: '',
      priorite: '',
      statut: '',
      montantMin: '',
      montantMax: ''
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'bg-red-100 text-red-800 border-red-300'
      case 'haute': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'normale': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'basse': return 'bg-gray-100 text-gray-800 border-gray-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'convertie': return 'bg-green-100 text-green-800 border-green-300'
      case 'annulee': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-2xl p-8 mb-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <span className="text-5xl">📝</span>
                Notes
              </h1>
              <p className="text-blue-100 text-lg">Gérez vos recettes et dépenses futures</p>
            </div>
            <div className="flex gap-4">
              {/* Sélecteur de type */}
              <div className="bg-white/20 backdrop-blur-lg rounded-xl p-2 flex gap-2">
                <button
                  onClick={() => setSelectedType('recette')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedType === 'recette' 
                      ? 'bg-white text-blue-600 shadow-lg' 
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  💰 Recettes
                </button>
                <button
                  onClick={() => setSelectedType('depense')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedType === 'depense' 
                      ? 'bg-white text-blue-600 shadow-lg' 
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  💸 Dépenses
                </button>
              </div>
              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                <span className="text-2xl">+</span>
                NOUVELLE NOTE
              </button>
              <button
                onClick={async () => {
                  console.log('🔧 Exécution du diagnostic des notes...')
                  try {
                    const { debugNotes } = await import('@/lib/debug-notes')
                    const result = await debugNotes()
                    console.log('📊 Résultat du diagnostic:', result)
                    if (result.success) {
                      showSuccess("Diagnostic réussi", `Notes trouvées: ${result.notesCount}`)
                      await refreshNotes()
                    } else {
                      showError("Erreur de diagnostic", result.error)
                    }
                  } catch (error) {
                    console.error('❌ Erreur import debug:', error)
                    showError("Erreur de diagnostic", "Impossible de charger le module de debug")
                  }
                }}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-all"
              >
                🔧 Debug
              </button>
              <button
                onClick={async () => {
                  console.log('🧪 Création d\'une note de test...')
                  try {
                    const testNote = {
                      libelle: 'Note de Test Debug',
                      montant: 100.00,
                      description: 'Note créée pour tester l\'affichage',
                      date_prevue: new Date().toISOString().split('T')[0],
                      priorite: 'normale' as const,
                      type: selectedType
                    }
                    await createNote(testNote)
                    showSuccess("Note de test créée", "Une note de test a été créée pour vérifier l'affichage")
                  } catch (error) {
                    console.error('❌ Erreur création note test:', error)
                    showError("Erreur", "Impossible de créer la note de test")
                  }
                }}
                className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-all"
              >
                🧪 Test
              </button>
            </div>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🔍</span>
              Rechercher et Filtrer
            </h3>
            <button
              onClick={resetFilters}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              🔄 Réinitialiser
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Rechercher par libellé..."
              value={searchFilters.libelle}
              onChange={(e) => setSearchFilters({...searchFilters, libelle: e.target.value})}
              className="px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white"
            />
            
            <select
              value={searchFilters.priorite}
              onChange={(e) => setSearchFilters({...searchFilters, priorite: e.target.value})}
              className="px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white focus:outline-none focus:ring-2 focus:ring-white"
            >
              <option value="">Toutes les priorités</option>
              <option value="basse" className="text-gray-900">Basse</option>
              <option value="normale" className="text-gray-900">Normale</option>
              <option value="haute" className="text-gray-900">Haute</option>
              <option value="urgente" className="text-gray-900">Urgente</option>
            </select>
            
            <select
              value={searchFilters.statut}
              onChange={(e) => setSearchFilters({...searchFilters, statut: e.target.value})}
              className="px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white focus:outline-none focus:ring-2 focus:ring-white"
            >
              <option value="">Tous les statuts</option>
              <option value="en_attente" className="text-gray-900">En attente</option>
              <option value="convertie" className="text-gray-900">Convertie</option>
              <option value="annulee" className="text-gray-900">Annulée</option>
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
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Attente</p>
                <p className="text-3xl font-bold text-yellow-600">{notesEnAttente.length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Converties</p>
                <p className="text-3xl font-bold text-green-600">{notesConverties.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Annulées</p>
                <p className="text-3xl font-bold text-red-600">{notesAnnulees.length}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-blue-500"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{note.type === 'recette' ? '💰' : '💸'}</span>
                      <h3 className="text-xl font-bold text-gray-900">{note.libelle}</h3>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(note.montant)}</p>
                    <p className="text-sm text-gray-500">
                      {note.type === 'recette' ? 'Note de recette' : 'Note de dépense'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(note.priorite)}`}>
                      {note.priorite.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(note.statut)}`}>
                      {note.statut.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                {note.description && (
                  <p className="text-gray-600 mb-4 text-sm">{note.description}</p>
                )}

                {note.date_prevue && (
                  <p className="text-sm text-gray-500 mb-4">
                    📅 Prévu le {new Date(note.date_prevue).toLocaleDateString('fr-FR')}
                  </p>
                )}

                <div className="flex gap-2">
                  {note.statut === 'en_attente' && (
                    <>
                      <button
                        onClick={() => handleEdit(note)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={() => handleConvert(note)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        💰 Convertir
                      </button>
                      <button
                        onClick={() => handleCancel(note.id)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        ❌
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredNotes.length === 0 && (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">📝</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucune note</h3>
            <p className="text-gray-600 mb-6">Commencez par créer votre première note de dépense</p>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              + Créer une note
            </button>
          </div>
        )}
      </div>

      {/* Modal de création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/80 via-blue-900/30 to-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-white rounded-3xl shadow-2xl w-full max-w-2xl border-2 border-blue-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 px-8 py-6 relative overflow-hidden">
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-4xl">📝</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1">
                      {editingNote ? 'Modifier la Note' : 'Nouvelle Note'}
                    </h2>
                    <p className="text-blue-100 text-sm">Enregistrez vos dépenses futures</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <span className="text-xl">📝</span>
                    Libellé
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.libelle}
                    onChange={(e) => setFormData({...formData, libelle: e.target.value})}
                    className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                    placeholder={formData.type === 'recette' ? "Ex: Salaire mensuel" : "Ex: Achat matériel informatique"}
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <span className="text-xl">🏷️</span>
                    Type de Note
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as 'recette' | 'depense'})}
                    className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                    required
                  >
                    <option value="recette">💰 Recette</option>
                    <option value="depense">💸 Dépense</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <span className="text-xl">💰</span>
                    Montant
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.montant}
                    onChange={(e) => setFormData({...formData, montant: parseFloat(e.target.value) || 0})}
                    className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-green-50 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all font-medium"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <span className="text-xl">📅</span>
                    Date Prévue
                  </label>
                  <input
                    type="date"
                    value={formData.date_prevue}
                    onChange={(e) => setFormData({...formData, date_prevue: e.target.value})}
                    className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <span className="text-xl">⚡</span>
                    Priorité
                  </label>
                  <select
                    value={formData.priorite}
                    onChange={(e) => setFormData({...formData, priorite: e.target.value as any})}
                    className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                  >
                    <option value="basse">Basse</option>
                    <option value="normale">Normale</option>
                    <option value="haute">Haute</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="text-xl">📄</span>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium resize-none"
                  placeholder="Détails supplémentaires..."
                />
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-8 py-4 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-800 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-3"
                >
                  <span className="text-2xl">💾</span>
                  {editingNote ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de conversion */}
      {showConvertModal && selectedNoteForConvert && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/80 via-green-900/30 to-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white via-green-50/30 to-white rounded-3xl shadow-2xl w-full max-w-2xl border-2 border-green-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 px-8 py-6 relative overflow-hidden">
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-4xl">{selectedNoteForConvert.type === 'recette' ? '💰' : '💸'}</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1">
                      Convertir en {selectedNoteForConvert.type === 'recette' ? 'Recette' : 'Dépense'}
                    </h2>
                    <p className="text-green-100 text-sm">
                      Transformez votre note en {selectedNoteForConvert.type === 'recette' ? 'recette' : 'dépense'} réelle
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all hover:rotate-90 duration-300"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <form onSubmit={handleConvertSubmit} className="p-8 space-y-6">
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4">
                <h3 className="font-bold text-green-800 mb-2">Note à convertir :</h3>
                <p className="text-green-700 font-semibold">{selectedNoteForConvert.libelle}</p>
                <p className="text-green-600">{formatCurrency(selectedNoteForConvert.montant)}</p>
                <p className="text-green-500 text-sm">
                  Type: {selectedNoteForConvert.type === 'recette' ? '💰 Recette' : '💸 Dépense'}
                </p>
              </div>

              {selectedNoteForConvert.type === 'depense' && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <span className="text-xl">💰</span>
                    Recette Source
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={convertDepenseData.recetteId}
                    onChange={(e) => setConvertDepenseData({...convertDepenseData, recetteId: e.target.value})}
                    className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-green-50 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all font-medium"
                    required
                  >
                    <option value="">Sélectionnez une recette</option>
                    {recettes.filter(r => r.statutCloture !== 'cloturee').map(recette => (
                      <option key={recette.id} value={recette.id}>
                        {recette.libelle}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedNoteForConvert.type === 'recette' && (
                <>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                      <span className="text-xl">🏢</span>
                      Source
                    </label>
                    <input
                      type="text"
                      value={convertRecetteData.source}
                      onChange={(e) => setConvertRecetteData({...convertRecetteData, source: e.target.value})}
                      className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-green-50 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all font-medium"
                      placeholder="Ex: Entreprise, Client, etc."
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                      <span className="text-xl">🔄</span>
                      Périodicité
                    </label>
                    <select
                      value={convertRecetteData.periodicite}
                      onChange={(e) => setConvertRecetteData({...convertRecetteData, periodicite: e.target.value as any})}
                      className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-green-50 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all font-medium"
                    >
                      <option value="unique">Unique</option>
                      <option value="mensuelle">Mensuelle</option>
                      <option value="hebdomadaire">Hebdomadaire</option>
                      <option value="annuelle">Annuelle</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="text-xl">📅</span>
                  Date {selectedNoteForConvert.type === 'recette' ? 'de la Recette' : 'de la Dépense'}
                </label>
                <input
                  type="date"
                  value={selectedNoteForConvert.type === 'recette' ? convertRecetteData.date : convertDepenseData.date}
                  onChange={(e) => {
                    if (selectedNoteForConvert.type === 'recette') {
                      setConvertRecetteData({...convertRecetteData, date: e.target.value})
                    } else {
                      setConvertDepenseData({...convertDepenseData, date: e.target.value})
                    }
                  }}
                  className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-green-50 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all font-medium"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="text-xl">📄</span>
                  Description (Optionnel)
                </label>
                <textarea
                  value={selectedNoteForConvert.type === 'recette' ? convertRecetteData.description : convertDepenseData.description}
                  onChange={(e) => {
                    if (selectedNoteForConvert.type === 'recette') {
                      setConvertRecetteData({...convertRecetteData, description: e.target.value})
                    } else {
                      setConvertDepenseData({...convertDepenseData, description: e.target.value})
                    }
                  }}
                  rows={3}
                  className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-green-50 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all font-medium resize-none"
                  placeholder={`Description de la ${selectedNoteForConvert.type === 'recette' ? 'recette' : 'dépense'}...`}
                />
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="px-8 py-4 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-800 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-8 py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 hover:from-green-700 hover:via-emerald-700 hover:to-green-700 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-3"
                >
                  <span className="text-2xl">{selectedNoteForConvert.type === 'recette' ? '💰' : '💸'}</span>
                  Convertir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog />
    </div>
  )
}
