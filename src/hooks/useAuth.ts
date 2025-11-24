'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Récupérer la session actuelle avec gestion d'erreur
    const getSession = async () => {
      try {
        setError(null)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erreur lors de la récupération de la session:', error)
          setError(`Erreur d'authentification: ${error.message}`)
        } else {
          setUser(session?.user ?? null)
        }
      } catch (err) {
        console.error('Erreur réseau lors de la récupération de la session:', err)
        setError('Erreur de connexion au serveur d\'authentification')
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Écouter les changements d'authentification avec gestion d'erreur
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          setError(null)
          setUser(session?.user ?? null)
        } catch (err) {
          console.error('Erreur lors du changement d\'état d\'authentification:', err)
          setError('Erreur lors de la mise à jour de l\'authentification')
        } finally {
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signOut = async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Erreur lors de la déconnexion:', error)
        // Si la session n'existe plus côté Supabase (AuthSessionMissingError),
        // on continue quand même la déconnexion locale.
      }
    } catch (err) {
      console.error('Erreur réseau lors de la déconnexion:', err)
    } finally {
      // On nettoie toujours l'état local et on redirige vers la page de connexion.
      setUser(null)
      router.push('/auth')
    }
  }

  return {
    user,
    loading,
    error,
    signOut,
    isAuthenticated: !!user
  }
}
