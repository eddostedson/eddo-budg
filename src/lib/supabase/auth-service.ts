// Service d'authentification optimisé avec cache
import { createClient } from './browser'

const supabase = createClient()

interface CachedUser {
  user: any
  timestamp: number
  expiresIn: number
}

class AuthService {
  private static cache: CachedUser | null = null
  private static readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // Obtenir l'utilisateur avec cache
  static async getUser() {
    try {
      // Vérifier le cache
      if (this.cache && this.isCacheValid()) {
        return { data: { user: this.cache.user }, error: null }
      }

      // Appel à Supabase seulement si le cache est expiré
      const result = await supabase.auth.getUser()
      
      // Mettre en cache si succès
      if (result.data.user && !result.error) {
        this.cache = {
          user: result.data.user,
          timestamp: Date.now(),
          expiresIn: this.CACHE_DURATION
        }
      }

      return result
    } catch (error) {
      console.error('❌ Erreur AuthService.getUser:', error)
      return { data: { user: null }, error }
    }
  }

  // Vérifier si le cache est valide
  private static isCacheValid(): boolean {
    if (!this.cache) return false
    return (Date.now() - this.cache.timestamp) < this.cache.expiresIn
  }

  // Invalider le cache (appelé lors de la déconnexion)
  static invalidateCache() {
    this.cache = null
  }

  // Obtenir l'utilisateur depuis le cache uniquement (sans appel réseau)
  static getCachedUser() {
    if (this.cache && this.isCacheValid()) {
      return this.cache.user
    }
    return null
  }

  // Vérifier si l'utilisateur est connecté (rapide)
  static isAuthenticated(): boolean {
    return this.getCachedUser() !== null
  }
}

export default AuthService
