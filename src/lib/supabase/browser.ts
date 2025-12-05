import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    // ❌ Erreur de configuration claire au lieu d'un vague "Failed to fetch"
    console.error('❌ Configuration Supabase manquante.', {
      hasUrl: !!url,
      hasAnonKey: !!anonKey
    })
    throw new Error(
      'Configuration Supabase manquante. Vérifiez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans votre fichier .env.local.'
    )
  }

  return createBrowserClient(url, anonKey, {
      auth: {
        // Configuration optimisée pour la stabilité
        persistSession: true,
        autoRefreshToken: true, // Réactivé pour éviter les erreurs de session
        detectSessionInUrl: true, // Réactivé pour la gestion des redirections
        flowType: 'pkce', // Plus sécurisé et stable
        // Gestion des erreurs réseau
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'sb-auth-token'
      },
      global: {
        headers: {
          'X-Client-Info': 'eddo-budg-app'
        },
        // Timeout pour éviter les requêtes qui pendent indéfiniment
        fetch: async (url, options = {}) => {
          const maxRetries = 2
          let lastError: Error | null = null
          
          for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
              // Créer un AbortController pour le timeout
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 secondes
              
              const response = await fetch(url, {
                ...options,
                signal: controller.signal
              })
              
              clearTimeout(timeoutId)
              
              // Si la requête réussit, retourner la réponse
              if (response.ok || response.status < 500) {
                return response
              }
              
              // Pour les erreurs serveur (5xx), on peut retry
              if (response.status >= 500 && attempt < maxRetries) {
                clearTimeout(timeoutId)
                // Attendre avant de retry (backoff exponentiel)
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
                continue
              }
              
              return response
            } catch (error: any) {
              lastError = error
              
              // Si c'est une erreur réseau et qu'on peut retry
              if (
                (error.name === 'AbortError' || 
                 error.message?.includes('Failed to fetch') || 
                 error.message?.includes('NetworkError') ||
                 error.message?.includes('Network request failed')) &&
                attempt < maxRetries
              ) {
                // Attendre avant de retry (backoff exponentiel)
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
                continue
              }
              
              // Si on ne peut plus retry, lancer l'erreur
              throw error
            }
          }
          
          // Si on arrive ici, tous les retries ont échoué
          throw lastError || new Error('Failed to fetch after retries')
        }
      },
      db: {
        schema: 'public'
      },
      realtime: {
        enabled: false // Désactivé pour la performance
      }
  })
}
