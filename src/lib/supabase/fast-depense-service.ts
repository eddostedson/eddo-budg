// Service d'enregistrement ultra-rapide pour les dépenses
import { createClient } from './browser'

const supabase = createClient()

export interface FastDepense {
  id?: number
  libelle: string
  montant: number
  date: string
  description?: string
  recetteId?: string
  categorie?: string
}

export class FastDepenseService {
  // Enregistrement ultra-rapide sans logs ni vérifications
  static async createDepense(depense: Omit<FastDepense, 'id'>): Promise<FastDepense | null> {
    try {
      // Authentification rapide sans cache
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Insertion directe sans logs
      const { data, error } = await supabase
        .from('depenses')
        .insert({
          user_id: user.id,
          libelle: depense.libelle,
          montant: depense.montant,
          date: depense.date,
          description: depense.description || '',
          recette_id: depense.recetteId || null,
          categorie: depense.categorie || null
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        libelle: data.libelle,
        montant: parseFloat(data.montant),
        date: data.date,
        description: data.description,
        recetteId: data.recette_id,
        categorie: data.categorie
      }
    } catch (error) {
      console.error('Erreur FastDepenseService:', error)
      return null
    }
  }

  // Test de performance
  static async performanceTest(): Promise<number> {
    const start = performance.now()
    
    try {
      await this.createDepense({
        libelle: 'Test Performance',
        montant: 1000,
        date: new Date().toISOString().split('T')[0],
        description: 'Test de performance'
      })
    } catch (error) {
      // Ignorer l'erreur pour le test
    }
    
    return performance.now() - start
  }
}
