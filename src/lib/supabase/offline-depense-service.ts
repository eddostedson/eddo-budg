// Service d'enregistrement OFFLINE-FIRST (instantané)
import { createClient } from './browser'
import LocalCache from './local-cache'

const supabase = createClient()

export interface OfflineDepense {
  id?: number
  libelle: string
  montant: number
  date: string
  description?: string
  recetteId?: string
  categorie?: string
  synced?: boolean // Indique si c'est synchronisé avec Supabase
}

export class OfflineDepenseService {
  private static QUEUE_KEY = 'depenses_queue'
  private static CACHE_KEY = 'depenses_cache'

  // Enregistrer IMMÉDIATEMENT en local
  static async createDepenseOffline(depense: Omit<OfflineDepense, 'id'>): Promise<OfflineDepense> {
    // Créer la dépense avec un ID temporaire
    const offlineDepense: OfflineDepense = {
      ...depense,
      id: Date.now(), // ID temporaire
      synced: false
    }

    // Sauvegarder dans le cache local
    const cached = LocalCache.get<OfflineDepense[]>(this.CACHE_KEY) || []
    cached.unshift(offlineDepense)
    LocalCache.set(this.CACHE_KEY, cached)

    // Ajouter à la file d'attente de synchronisation
    this.addToQueue(offlineDepense)

    // Synchroniser en arrière-plan (sans attendre)
    this.syncQueue().catch(err => console.error('Sync error:', err))

    return offlineDepense
  }

  // Ajouter à la file d'attente
  private static addToQueue(depense: OfflineDepense) {
    const queue = this.getQueue()
    queue.push(depense)
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue))
  }

  // Récupérer la file d'attente
  private static getQueue(): OfflineDepense[] {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(this.QUEUE_KEY)
    return stored ? JSON.parse(stored) : []
  }

  // Synchroniser la file d'attente avec Supabase (en arrière-plan)
  static async syncQueue() {
    const queue = this.getQueue()
    if (queue.length === 0) return

    console.log(`🔄 Synchronisation de ${queue.length} dépenses...`)

    const synced: OfflineDepense[] = []
    const failed: OfflineDepense[] = []

    for (const depense of queue) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) continue

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

        if (!error && data) {
          // Mise à jour du cache avec le vrai ID
          depense.id = data.id
          depense.synced = true
          synced.push(depense)
          console.log(`✅ Dépense synchronisée: ${depense.libelle}`)
        } else {
          failed.push(depense)
        }
      } catch (error) {
        failed.push(depense)
      }
    }

    // Mettre à jour la file d'attente (garder les échecs)
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(failed))

    // Mettre à jour le cache
    const cached = LocalCache.get<OfflineDepense[]>(this.CACHE_KEY) || []
    synced.forEach(syncedDepense => {
      const index = cached.findIndex(d => d.id === syncedDepense.id)
      if (index !== -1) {
        cached[index] = syncedDepense
      }
    })
    LocalCache.set(this.CACHE_KEY, cached)

    console.log(`✅ ${synced.length} synchronisées, ${failed.length} en attente`)
  }

  // Récupérer les dépenses du cache local
  static getCachedDepenses(): OfflineDepense[] {
    return LocalCache.get<OfflineDepense[]>(this.CACHE_KEY) || []
  }

  // Vérifier si des dépenses sont en attente de synchronisation
  static hasPendingSync(): boolean {
    return this.getQueue().length > 0
  }
}
