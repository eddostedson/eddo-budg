import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Configuration optimisée pour la performance
        persistSession: true,
        autoRefreshToken: false, // Désactivé pour la performance
        detectSessionInUrl: false, // Désactivé pour la performance
        flowType: 'implicit' // Plus rapide que pkce
      },
      global: {
        headers: {
          'X-Client-Info': 'eddo-budg-app-fast'
        }
      },
      db: {
        schema: 'public'
      },
      realtime: {
        enabled: false // Désactivé pour la performance
      }
    }
  )
}
