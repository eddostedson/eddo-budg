'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { Note, NoteFormData, ConvertNoteToRecetteData, ConvertNoteToDepenseData } from '@/types/notes'
import { NotesService } from '@/lib/supabase/notes-service'
import { useNotifications } from './notification-context'

interface NotesContextType {
  notes: Note[]
  loading: boolean
  error: string | null
  createNote: (note: NoteFormData) => Promise<boolean>
  updateNote: (id: string, note: Partial<NoteFormData>) => Promise<boolean>
  deleteNote: (id: string) => Promise<boolean>
  convertNoteToRecette: (convertData: ConvertNoteToRecetteData) => Promise<boolean>
  convertNoteToDepense: (convertData: ConvertNoteToDepenseData) => Promise<boolean>
  cancelNote: (id: string) => Promise<boolean>
  refreshNotes: () => Promise<void>
  getNotesByStatus: (status: string) => Note[]
  getNotesByPriority: (priority: string) => Note[]
  getNotesByType: (type: 'recette' | 'depense') => Note[]
}

const NotesContext = createContext<NotesContextType | undefined>(undefined)

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showSuccess, showError, showWarning } = useNotifications()

  // Rafraîchir les notes
  const refreshNotes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('🔄 Rafraîchissement des notes...')
      const data = await NotesService.getNotes()
      console.log('📝 Notes récupérées:', data.length, 'notes')
      console.log('📋 Détails des notes:', data.map(n => ({ 
        id: n.id, 
        libelle: n.libelle, 
        statut: n.statut, 
        type: n.type,
        createdAt: n.createdAt 
      })))
      console.log('🔍 Données brutes des notes:', data)
      setNotes(data)
    } catch (err) {
      console.error("❌ Erreur lors du rafraîchissement des notes:", err)
      setError("Échec du chargement des notes.")
      showError("Erreur de chargement", "Impossible de charger les notes.")
    } finally {
      setLoading(false)
    }
  }, [showError])

  // Charger les notes au montage
  useEffect(() => {
    refreshNotes()
  }, [refreshNotes])

  // Créer une nouvelle note
  const createNote = async (note: NoteFormData) => {
    setLoading(true)
    setError(null)
    try {
      console.log('➕ Création d\'une nouvelle note:', note.libelle)
      const newNote = await NotesService.createNote(note)
      if (newNote) {
        console.log('✅ Note créée avec succès:', newNote.id)
        const typeLabel = note.type === 'recette' ? 'recette' : 'dépense'
        showSuccess("Note créée", `Votre note de ${typeLabel} a été enregistrée avec succès !`)
        
        // Ajouter immédiatement à l'état local pour un feedback instantané
        setNotes(prev => [newNote, ...prev])
        
        // Rafraîchir en arrière-plan pour s'assurer de la cohérence
        refreshNotes().catch(error => {
          console.error('❌ Erreur lors du rafraîchissement en arrière-plan:', error)
        })
        
        return true
      } else {
        console.error('❌ Échec de la création de la note - createNote a retourné null')
        showError("Erreur de création", "Une erreur est survenue lors de la création de la note.")
        return false
      }
    } catch (err: any) {
      console.error("❌ Erreur lors de la création de la note:", err)
      setError(err.message || "Échec de la création de la note.")
      showError("Erreur de création", err.message || "Une erreur est survenue lors de la création de la note.")
      return false
    } finally {
      setLoading(false)
    }
  }

  // Mettre à jour une note
  const updateNote = async (id: string, note: Partial<NoteFormData>) => {
    setLoading(true)
    setError(null)
    try {
      const updatedNote = await NotesService.updateNote(id, note)
      if (updatedNote) {
        showSuccess("Note mise à jour", "Votre note a été modifiée avec succès !")
        await refreshNotes()
        return true
      } else {
        showError("Erreur de mise à jour", "Une erreur est survenue lors de la mise à jour de la note.")
        return false
      }
    } catch (err: any) {
      console.error("Failed to update note:", err)
      setError(err.message || "Échec de la mise à jour de la note.")
      showError("Erreur de mise à jour", err.message || "Une erreur est survenue lors de la mise à jour de la note.")
      return false
    } finally {
      setLoading(false)
    }
  }

  // Supprimer une note
  const deleteNote = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const success = await NotesService.deleteNote(id)
      if (success) {
        showSuccess("Note supprimée", "Votre note a été supprimée avec succès !")
        await refreshNotes()
        return true
      } else {
        showError("Erreur de suppression", "Une erreur est survenue lors de la suppression de la note.")
        return false
      }
    } catch (err: any) {
      console.error("Failed to delete note:", err)
      setError(err.message || "Échec de la suppression de la note.")
      showError("Erreur de suppression", err.message || "Une erreur est survenue lors de la suppression de la note.")
      return false
    } finally {
      setLoading(false)
    }
  }

  // Convertir une note en recette
  const convertNoteToRecette = async (convertData: ConvertNoteToRecetteData) => {
    setLoading(true)
    setError(null)
    try {
      const success = await NotesService.convertNoteToRecette(convertData)
      if (success) {
        showSuccess("Note convertie", "Votre note a été convertie en recette avec succès !")
        await refreshNotes()
        return true
      } else {
        showError("Erreur de conversion", "Une erreur est survenue lors de la conversion de la note.")
        return false
      }
    } catch (err: any) {
      console.error("Failed to convert note to recette:", err)
      setError(err.message || "Échec de la conversion de la note.")
      showError("Erreur de conversion", err.message || "Une erreur est survenue lors de la conversion de la note.")
      return false
    } finally {
      setLoading(false)
    }
  }

  // Convertir une note en dépense
  const convertNoteToDepense = async (convertData: ConvertNoteToDepenseData) => {
    setLoading(true)
    setError(null)
    try {
      const success = await NotesService.convertNoteToDepense(convertData)
      if (success) {
        showSuccess("Note convertie", "Votre note a été convertie en dépense avec succès !")
        await refreshNotes()
        return true
      } else {
        showError("Erreur de conversion", "Une erreur est survenue lors de la conversion de la note.")
        return false
      }
    } catch (err: any) {
      console.error("Failed to convert note to depense:", err)
      setError(err.message || "Échec de la conversion de la note.")
      showError("Erreur de conversion", err.message || "Une erreur est survenue lors de la conversion de la note.")
      return false
    } finally {
      setLoading(false)
    }
  }

  // Annuler une note
  const cancelNote = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const success = await NotesService.cancelNote(id)
      if (success) {
        showSuccess("Note annulée", "Votre note a été annulée avec succès !")
        await refreshNotes()
        return true
      } else {
        showError("Erreur d'annulation", "Une erreur est survenue lors de l'annulation de la note.")
        return false
      }
    } catch (err: any) {
      console.error("Failed to cancel note:", err)
      setError(err.message || "Échec de l'annulation de la note.")
      showError("Erreur d'annulation", err.message || "Une erreur est survenue lors de l'annulation de la note.")
      return false
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les notes par statut
  const getNotesByStatus = (status: string) => {
    return notes.filter(note => note.statut === status)
  }

  // Filtrer les notes par priorité
  const getNotesByPriority = (priority: string) => {
    return notes.filter(note => note.priorite === priority)
  }

  // Filtrer les notes par type
  const getNotesByType = (type: 'recette' | 'depense') => {
    return notes.filter(note => note.type === type)
  }

  const value: NotesContextType = {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    convertNoteToRecette,
    convertNoteToDepense,
    cancelNote,
    refreshNotes,
    getNotesByStatus,
    getNotesByPriority,
    getNotesByType
  }

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  )
}

export function useNotes() {
  const context = useContext(NotesContext)
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider')
  }
  return context
}
