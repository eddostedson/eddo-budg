// Types pour les notes de recettes et dépenses futures
export interface Note {
  id: string
  user_id: string
  libelle: string
  montant: number
  description?: string
  date_prevue?: string
  priorite: 'basse' | 'normale' | 'haute' | 'urgente'
  statut: 'en_attente' | 'convertie' | 'annulee'
  type: 'recette' | 'depense' // Nouveau : type de note
  recette_id?: string // Si convertie en dépense
  created_at: string
  updated_at: string
}

// Alias pour compatibilité
export interface NoteDepense extends Note {
  type: 'depense'
}

export interface NoteRecette extends Note {
  type: 'recette'
}

export interface NoteFormData {
  libelle: string
  montant: number
  description?: string
  date_prevue?: string
  priorite: 'basse' | 'normale' | 'haute' | 'urgente'
  type: 'recette' | 'depense'
}

// Alias pour compatibilité
export interface NoteDepenseFormData extends NoteFormData {
  type: 'depense'
}

export interface NoteRecetteFormData extends NoteFormData {
  type: 'recette'
}

export interface ConvertNoteData {
  noteId: string
  recetteId?: string // Pour les notes de dépenses
  date: string
  description?: string
  type: 'recette' | 'depense'
}

export interface ConvertNoteToRecetteData {
  noteId: string
  date: string
  description?: string
  source: string
  periodicite: 'unique' | 'mensuelle' | 'hebdomadaire' | 'annuelle'
}

export interface ConvertNoteToDepenseData {
  noteId: string
  recetteId: string
  date: string
  description?: string
}
