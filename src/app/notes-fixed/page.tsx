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

export default function NotesFixedPage() {
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

  // Fonction pour surligner le texte
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => {
      const isMatch = part.toLowerCase() === searchTerm.toLowerCase()
      return isMatch ? (
        <mark key={index} className="bg-green-200 text-green-900 px-1 rounded font-medium">
          {part}
        </mark>
      ) : (
        <span key={index}>{part}</span>
      )
    })
  }

  // Fonction pour vérifier si un texte contient le terme de recherche
  const hasMatch = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return false
    return text.toLowerCase().includes(searchTerm.toLowerCase())
  }

  // Filtrer les notes
  const filteredNotes = notes.filter(note => {
    const matchLibelle = !searchFilters.libelle || hasMatch(note.libelle, searchFilters.libelle) || 
                        (note.description && hasMatch(note.description, searchFilters.libelle))
    const matchPriorite = !searchFilters.priorite || note.priorite === searchFilters.priorite
    const matchStatut = !searchFilters.statut || note.statut === searchFilters.statut
    const matchMontantMin = !searchFilters.montantMin || note.montant >= parseFloat(searchFilters.montantMin)
    const matchMontantMax = !searchFilters.montantMax || note.montant <= parseFloat(searchFilters.montantMax)
    
    return matchLibelle && matchPriorite && matchStatut && matchMontantMin && matchMontantMax
  })

  // Fonctions de couleur
  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case 'urgente': return 'bg-red-100 text-red-800 border-red-300'
      case 'haute': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'normale': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'basse': return 'bg-gray-100 text-gray-800 border-gray-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'convertie': return 'bg-green-100 text-green-800 border-green-300'
      case 'annulee': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await refreshNotes()
        setLoading(false)
      } catch (error) {
        console.error('Erreur lors du chargement des notes:', error)
        setLoading(false)
      }
    }
    checkAuth()
  }, [refreshNotes])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des notes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📝 Notes</h1>
          <p className="text-gray-600">Gérez vos notes de dépenses et recettes futures</p>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher par libellé</label>
              <input
                type="text"
                value={searchFilters.libelle}
                onChange={(e) => setSearchFilters(prev => ({...prev, libelle: e.target.value}))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Rechercher..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
              <select
                value={searchFilters.priorite}
                onChange={(e) => setSearchFilters(prev => ({...prev, priorite: e.target.value}))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Toutes</option>
                <option value="urgente">Urgente</option>
                <option value="haute">Haute</option>
                <option value="normale">Normale</option>
                <option value="basse">Basse</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={searchFilters.statut}
                onChange={(e) => setSearchFilters(prev => ({...prev, statut: e.target.value}))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous</option>
                <option value="en_attente">En attente</option>
                <option value="convertie">Convertie</option>
                <option value="annulee">Annulée</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Montant min</label>
              <input
                type="number"
                value={searchFilters.montantMin}
                onChange={(e) => setSearchFilters(prev => ({...prev, montantMin: e.target.value}))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Montant max</label>
              <input
                type="number"
                value={searchFilters.montantMax}
                onChange={(e) => setSearchFilters(prev => ({...prev, montantMax: e.target.value}))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="∞"
              />
            </div>
          </div>
        </div>

        {/* Indicateur de correspondances */}
        {searchFilters.libelle && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-green-600">🔍</span>
              <span className="text-green-800 font-medium">
                {filteredNotes.filter(note => 
                  hasMatch(note.libelle, searchFilters.libelle) || 
                  (note.description && hasMatch(note.description, searchFilters.libelle))
                ).length} correspondance(s) trouvée(s) pour "{searchFilters.libelle}"
              </span>
            </div>
          </div>
        )}

        {/* Liste des notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => {
            const isLibelleMatch = hasMatch(note.libelle, searchFilters.libelle)
            const isDescriptionMatch = note.description && hasMatch(note.description, searchFilters.libelle)
            const hasAnyMatch = isLibelleMatch || isDescriptionMatch
            
            return (
              <div
                key={note.id}
                className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 ${
                  hasAnyMatch ? 'border-green-500 bg-green-50' : 'border-blue-500'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{note.type === 'recette' ? '💰' : '💸'}</span>
                        <h3 className="text-xl font-bold text-gray-900">
                          {highlightText(note.libelle, searchFilters.libelle)}
                        </h3>
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
                    <p className="text-gray-600 mb-4 text-sm">
                      {highlightText(note.description, searchFilters.libelle)}
                    </p>
                  )}

                  {note.date_prevue && (
                    <p className="text-sm text-gray-500 mb-4">
                      📅 Prévu le {new Date(note.date_prevue).toLocaleDateString('fr-FR')}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingNote(note)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      ✏️ Modifier
                    </button>
                    {note.statut === 'en_attente' && (
                      <button
                        onClick={() => setSelectedNoteForConvert(note)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        💰 Convertir
                      </button>
                    )}
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredNotes.length === 0 && (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">📝</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucune note</h3>
            <p className="text-gray-600 mb-8">Commencez par créer votre première note</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              ✨ Nouvelle Note
            </button>
          </div>
        )}

        {/* Bouton d'ajout flottant */}
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center text-2xl"
        >
          +
        </button>
      </div>
    </div>
  )
}







