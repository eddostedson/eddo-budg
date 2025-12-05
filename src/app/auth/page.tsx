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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden transform transition-all duration-300">
        {/* Barre orange en haut */}
        <div className="h-2 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"></div>
        
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Réinitialiser le mot de passe</h3>
          <p className="text-sm text-gray-600 mb-6">Entrez votre adresse email pour recevoir un lien de réinitialisation</p>
          
          {message && (
            <div className={`p-4 rounded-xl mb-4 border-2 ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-300 text-green-800'
                : 'bg-red-50 border-red-300 text-red-800'
            }`}>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <span className="text-sm font-medium">{message.text}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-semibold text-gray-700 mb-2">
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 hover:border-gray-300"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Envoi...</span>
                  </div>
                ) : (
                  'Envoyer le lien'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 font-medium"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Animated Background - Bleu moderne */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700">
        {/* Pattern géométrique moderne */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23 11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-19-26c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}></div>
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 via-transparent to-transparent"></div>
      </div>

      {/* Floating Elements - Orange et Bleu */}
      <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-r from-orange-400/30 to-orange-500/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-40 right-32 w-32 h-32 bg-gradient-to-r from-blue-400/30 to-blue-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-32 left-1/3 w-36 h-36 bg-gradient-to-r from-orange-300/25 to-orange-400/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 right-20 w-28 h-28 bg-gradient-to-r from-blue-300/25 to-blue-400/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Carte blanche moderne avec ombres et effets 3D */}
          <Card className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden transform transition-all duration-500 hover:shadow-3xl">
            {/* Barre orange en haut */}
            <div className="h-2 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"></div>
            
            <CardHeader className="text-center space-y-6 p-8 pb-6">
              {/* Icône avec effet 3D */}
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl transform transition-all duration-300 hover:scale-110 hover:rotate-3" style={{
                boxShadow: '0 10px 30px rgba(251, 146, 60, 0.4), inset 0 2px 10px rgba(255, 255, 255, 0.3)'
              }}>
                <span className="text-4xl">💰</span>
              </div>
              <div>
                <CardTitle className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent">
                  Compta MVP
                </CardTitle>
                <CardDescription className="text-gray-600 mt-3 text-base font-medium">
                  {mode === 'signin' ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6 p-8 pt-2">
              {message && (
                <div
                  className={`p-4 rounded-xl border-2 backdrop-blur-sm ${
                    message.type === 'success'
                      ? 'bg-green-50 border-green-300 text-green-800'
                      : 'bg-red-50 border-red-300 text-red-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${message?.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                    <span className="font-medium text-sm">{message?.text}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-semibold text-sm">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="votre@email.com"
                    required
                    disabled={loading}
                    className="bg-white border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl h-12 transition-all duration-300 hover:border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-semibold text-sm">Mot de passe</Label>
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
                      className="bg-white border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl h-12 transition-all duration-300 hover:border-gray-300 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors duration-200"
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
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold text-sm">Confirmer le mot de passe</Label>
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
                        className="bg-white border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl h-12 transition-all duration-300 hover:border-gray-300 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors duration-200"
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

                {/* Case "Se souvenir de moi" */}
                {mode === 'signin' && (
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-5 h-5 text-orange-500 bg-white border-2 border-gray-300 rounded-lg focus:ring-orange-500/30 focus:ring-2 cursor-pointer"
                    />
                    <label htmlFor="rememberMe" className="text-gray-700 text-sm cursor-pointer">
                      Se souvenir de mes identifiants
                    </label>
                  </div>
                )}

                {/* Bouton principal orange avec gradient */}
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white font-bold py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{mode === 'signin' ? 'Connexion...' : 'Création...'}</span>
                    </div>
                  ) : (
                    mode === 'signin' ? 'Se connecter' : 'Créer le compte'
                  )}
                </Button>
              </form>

              {/* Séparateur moderne */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">Ou</span>
                </div>
              </div>

              {/* Bouton Google avec style moderne */}
              <Button
                type="button"
                variant="outline"
                className="w-full bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-sm"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuer avec Google
              </Button>

              {/* Liens en bas */}
              <div className="text-center space-y-3 pt-2">
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="text-blue-600 hover:text-blue-700 underline text-sm transition-all duration-300 font-medium"
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
                  className="text-orange-600 hover:text-orange-700 underline text-sm transition-all duration-300 font-medium"
                  disabled={loading}
                >
                  {mode === 'signin'
                    ? "Pas encore de compte ? S'inscrire"
                    : "Déjà un compte ? Se connecter"}
                </button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-white/90 text-sm mt-6 font-light drop-shadow-lg">
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
