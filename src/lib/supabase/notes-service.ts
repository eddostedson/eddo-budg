import { createClient } from './browser'
import { Note, NoteFormData, ConvertNoteToRecetteData, ConvertNoteToDepenseData } from '@/types/notes'

const supabase = createClient()

export class NotesService {
  // Récupérer toutes les notes de l'utilisateur
  static async getNotes(): Promise<Note[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification pour les notes:', authError)
        return []
      }

      const { data, error } = await supabase
        .from('notes_depenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erreur Supabase lors de la récupération des notes:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('❌ Erreur inattendue lors de la récupération des notes:', error)
      return []
    }
  }

  // Créer une nouvelle note
  static async createNote(note: NoteFormData): Promise<Note | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification pour la création de note:', authError)
        throw new Error("Utilisateur non authentifié")
      }

      const { data, error } = await supabase
        .from('notes_depenses')
        .insert({
          user_id: user.id,
          libelle: note.libelle,
          montant: note.montant,
          description: note.description,
          date_prevue: note.date_prevue,
          priorite: note.priorite,
          type: note.type
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur Supabase lors de la création de la note:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('❌ Erreur inattendue lors de la création de la note:', error)
      return null
    }
  }

  // Mettre à jour une note
  static async updateNote(id: string, note: Partial<NoteFormData>): Promise<Note | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification pour la mise à jour de note:', authError)
        throw new Error("Utilisateur non authentifié")
      }

      const { data, error } = await supabase
        .from('notes_depenses')
        .update(note)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur Supabase lors de la mise à jour de la note:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('❌ Erreur inattendue lors de la mise à jour de la note:', error)
      return null
    }
  }

  // Supprimer une note
  static async deleteNote(id: string): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification pour la suppression de note:', authError)
        throw new Error("Utilisateur non authentifié")
      }

      const { error } = await supabase
        .from('notes_depenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Erreur Supabase lors de la suppression de la note:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('❌ Erreur inattendue lors de la suppression de la note:', error)
      return false
    }
  }

  // Convertir une note en recette
  static async convertNoteToRecette(convertData: ConvertNoteToRecetteData): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification pour la conversion de note en recette:', authError)
        throw new Error("Utilisateur non authentifié")
      }

      // Utiliser la fonction SQL pour la conversion
      const { data, error } = await supabase.rpc('convertir_note_en_recette', {
        p_note_id: convertData.noteId,
        p_date: convertData.date,
        p_description: convertData.description,
        p_source: convertData.source,
        p_periodicite: convertData.periodicite
      })

      if (error) {
        console.error('❌ Erreur Supabase lors de la conversion de la note en recette:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('❌ Erreur inattendue lors de la conversion de la note en recette:', error)
      return false
    }
  }

  // Convertir une note en dépense
  static async convertNoteToDepense(convertData: ConvertNoteToDepenseData): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification pour la conversion de note en dépense:', authError)
        throw new Error("Utilisateur non authentifié")
      }

      // Utiliser la fonction SQL pour la conversion
      const { data, error } = await supabase.rpc('convertir_note_en_depense', {
        p_note_id: convertData.noteId,
        p_recette_id: convertData.recetteId,
        p_date: convertData.date,
        p_description: convertData.description
      })

      if (error) {
        console.error('❌ Erreur Supabase lors de la conversion de la note en dépense:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('❌ Erreur inattendue lors de la conversion de la note en dépense:', error)
      return false
    }
  }

  // Annuler une note
  static async cancelNote(id: string): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification pour l\'annulation de note:', authError)
        throw new Error("Utilisateur non authentifié")
      }

      const { error } = await supabase
        .from('notes_depenses')
        .update({ statut: 'annulee' })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Erreur Supabase lors de l\'annulation de la note:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('❌ Erreur inattendue lors de l\'annulation de la note:', error)
      return false
    }
  }
}
