'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/browser'
import { useToast } from '@/contexts/toast-context'

type AuthMode = 'signin' | 'signup'

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { showSuccess, showError, showInfo } = useToast()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })

  const supabase = createClient()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (mode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' })
          showError('Erreur de validation', 'Les mots de passe ne correspondent pas')
          setLoading(false)
          return
        }
        if (formData.password.length < 6) {
          setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' })
          showError('Mot de passe trop court', 'Le mot de passe doit contenir au moins 6 caractères')
          setLoading(false)
          return
        }

        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { emailRedirectTo: window.location.origin }
        })

        if (error) {
          setMessage({ type: 'error', text: error.message })
          showError('Erreur d\'inscription', error.message)
        } else {
          setMessage({
            type: 'success',
            text: 'Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse.'
          })
          showSuccess('Inscription réussie !', 'Vérifie ta boîte mail pour confirmer ton adresse.')
          setFormData({ email: '', password: '', confirmPassword: '' })
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (error) {
          setMessage({ type: 'error', text: error.message })
        } else if (data.user) {
          // Créer le profil s'il n'existe pas
          await fetch('/api/ensure-profile', { cache: 'no-store' }).catch(() => {})
          setMessage({ type: 'success', text: 'Connexion réussie ! Redirection...' })
          showSuccess('Connexion réussie !', `Bienvenue ${data.user.email} !`)
          setTimeout(() => {
            window.location.href = '/'
          }, 1000)
        }
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Une erreur est survenue'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      })
      if (error) setMessage({ type: 'error', text: error.message })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erreur lors de la connexion Google'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
            💰 Compta MVP
          </h1>
          <p className="text-gray-300">
            {mode === 'signin' ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
          </p>
        </div>

        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white">{mode === 'signin' ? 'Connexion' : 'Inscription'}</CardTitle>
            <CardDescription className="text-gray-300">
              {mode === 'signin'
                ? 'Entrez vos identifiants pour accéder à votre compte'
                : 'Créez un nouveau compte pour commencer'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <div
                className={`mb-4 p-3 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-900/20 border border-green-800/30 text-green-400'
                    : 'bg-red-900/20 border border-red-800/30 text-red-400'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="votre@email.com"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>

              {mode === 'signup' && (
                <div>
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {mode === 'signin' ? 'Connexion...' : 'Création...'}
                  </div>
                ) : mode === 'signin' ? 'Se connecter' : 'Créer le compte'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Ou</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full mt-4"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuer avec Google
              </Button>
            </div>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin')
                  setMessage(null)
                  setFormData({ email: '', password: '', confirmPassword: '' })
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
                disabled={loading}
              >
                {mode === 'signin'
                  ? "Pas encore de compte ? S’inscrire"
                  : "Déjà un compte ? Se connecter"}
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            En vous connectant, vous acceptez nos conditions d&apos;utilisation
          </p>
        </div>
      </div>
    </div>
  )
}
