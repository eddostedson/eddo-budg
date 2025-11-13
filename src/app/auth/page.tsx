'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/browser'
// import { useToast } from '@/contexts/toast-context' // Supprimé
import { EyeIcon, EyeOffIcon } from 'lucide-react'
// Composant de réinitialisation de mot de passe
const ResetPasswordModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ 
          type: 'success', 
          text: 'Email de réinitialisation envoyé ! Vérifiez votre boîte mail.' 
        })
        setEmail('')
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

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Réinitialiser le mot de passe</h3>
        
        {message && (
          <div className={`p-4 rounded-lg mb-4 ${
            message.type === 'success' 
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
              Adresse email
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const SuccessMessage = ({ message }: { message: string }) => {
  return (
    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
      {message}
    </div>
  )
}

type AuthMode = 'signin' | 'signup'

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  // const { showSuccess, showError } = useToast() // Supprimé
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [rememberMe, setRememberMe] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const searchParams = useSearchParams()

  const supabase = createClient()

  // Gérer les messages de succès depuis l'URL
  useEffect(() => {
    const message = searchParams.get('message')
    if (message === 'password-updated') {
      setSuccessMessage('Votre mot de passe a été mis à jour avec succès !')
      setShowSuccessMessage(true)
    }
  }, [searchParams])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setMessage(null)
  }

  // ✅ Vider les champs par défaut (sauf si "Se souvenir")
  const clearFields = () => {
    if (!rememberMe) {
      setFormData({
        email: '',
        password: '',
        confirmPassword: ''
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (mode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' })
          setLoading(false)
          return
        }
        if (formData.password.length < 6) {
          setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' })
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
        } else {
          setMessage({
            type: 'success',
            text: 'Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse.'
          })
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
          // ✅ Vider les champs après connexion réussie
          clearFields()
          setTimeout(() => {
            window.location.href = '/accueil'
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-20 left-40 w-40 h-40 bg-gradient-to-r from-blue-400/20 to-cyan-500/20 rounded-full blur-xl animate-pulse delay-2000"></div>
      <div className="absolute top-60 left-1/2 w-20 h-20 bg-gradient-to-r from-green-400/20 to-emerald-500/20 rounded-full blur-xl animate-pulse delay-3000"></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="text-center space-y-6 p-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl animate-bounce">
                <span className="text-3xl">💰</span>
              </div>
              <div>
                <CardTitle className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
                  Compta MVP
                </CardTitle>
                <CardDescription className="text-white/80 mt-3 text-lg">
                  {mode === 'signin' ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              {message && (
                <div
                  className={`p-4 rounded-2xl border backdrop-blur-sm ${
                    message.type === 'success'
                      ? 'bg-green-500/20 border-green-400/30 text-green-100'
                      : 'bg-red-500/20 border-red-400/30 text-red-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${message?.type === 'success' ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                    <span className="font-medium">{message?.text}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-white font-semibold text-sm">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="votre@email.com"
                    required
                    disabled={loading}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-yellow-400 focus:ring-yellow-400/30 rounded-2xl h-12 transition-all duration-300 hover:bg-white/15"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="password" className="text-white font-semibold text-sm">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      required
                      disabled={loading}
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-yellow-400 focus:ring-yellow-400/30 rounded-2xl h-12 transition-all duration-300 hover:bg-white/15 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {mode === 'signup' && (
                  <div className="space-y-3">
                    <Label htmlFor="confirmPassword" className="text-white font-semibold text-sm">Confirmer le mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        required
                        disabled={loading}
                        className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-yellow-400 focus:ring-yellow-400/30 rounded-2xl h-12 transition-all duration-300 hover:bg-white/15 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200"
                        disabled={loading}
                      >
                        {showConfirmPassword ? (
                          <EyeOffIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* ✅ Case "Se souvenir de moi" pour la connexion */}
                {mode === 'signin' && (
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-5 h-5 text-yellow-400 bg-white/10 border-white/30 rounded-lg focus:ring-yellow-400/30 focus:ring-2"
                    />
                    <label htmlFor="rememberMe" className="text-white/90 text-sm">
                      Se souvenir de mes identifiants
                    </label>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 hover:from-yellow-500 hover:via-orange-600 hover:to-pink-600 text-white font-bold py-4 rounded-2xl transition-all duration-300 hover:scale-105 shadow-2xl shadow-yellow-400/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{mode === 'signin' ? 'Connexion...' : 'Création...'}</span>
                    </div>
                  ) : (
                    mode === 'signin' ? 'Se connecter' : 'Créer le compte'
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-6 bg-gradient-to-r from-indigo-900 to-purple-900 text-white/80 font-medium">Ou</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/40 py-4 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg backdrop-blur-sm"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuer avec Google
              </Button>

              <div className="text-center space-y-3">
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="text-blue-400 hover:text-blue-300 underline text-sm transition-all duration-300 hover:scale-105 font-medium"
                    disabled={loading}
                  >
                    Mot de passe oublié ?
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin')
                    setMessage(null)
                    setFormData({ email: '', password: '', confirmPassword: '' })
                  }}
                  className="text-yellow-400 hover:text-yellow-300 underline text-sm transition-all duration-300 hover:scale-105 font-medium"
                  disabled={loading}
                >
                  {mode === 'signin'
                    ? "Pas encore de compte ? S'inscrire"
                    : "Déjà un compte ? Se connecter"}
                </button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-white/60 text-sm mt-8 font-light">
            En vous connectant, vous acceptez nos conditions d&apos;utilisation
          </p>
        </div>
      </div>

      {/* Modal de réinitialisation de mot de passe */}
      <ResetPasswordModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
      />

      {/* Message de succès */}
      {showSuccessMessage && (
        <SuccessMessage
          message={successMessage}
        />
      )}
    </div>
  )
}
