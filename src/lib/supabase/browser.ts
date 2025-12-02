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
        flowType: 'pkce' // Plus sécurisé et stable
      },
      global: {
        headers: {
          'X-Client-Info': 'eddo-budg-app'
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
