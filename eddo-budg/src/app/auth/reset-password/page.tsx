'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { ModernCard, ModernForm, ModernButton } from '@/components/modern'
import { ModernAccessibleInput } from '@/components/modern-accessibility'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    // Check if we have the necessary parameters
    const code = searchParams.get('code')
    if (!code) {
      setError('Lien de réinitialisation invalide')
    }
  }, [searchParams])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message)
      } else {
        setIsSuccess(true)
        setTimeout(() => {
          router.push('/auth?message=password-updated')
        }, 2000)
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <ModernCard className="w-full max-w-md">
          <div className="p-8 text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-2xl font-bold text-green-600 mb-4">
              Mot de passe mis à jour !
            </h1>
            <p className="text-gray-600 mb-6">
              Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion.
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          </div>
        </ModernCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <ModernCard className="w-full max-w-md">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Nouveau mot de passe
            </h1>
            <p className="text-gray-600">
              Entrez votre nouveau mot de passe
            </p>
          </div>

          <ModernForm onSubmit={handleResetPassword}>
            <div className="space-y-4">
              <ModernAccessibleInput
                type="password"
                label="Nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre nouveau mot de passe"
                required
              />

              <ModernAccessibleInput
                type="password"
                label="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre nouveau mot de passe"
                required
              />

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <ModernButton
                type="submit"
                variant="primary"
                className="w-full"
                loading={isLoading}
                disabled={!password || !confirmPassword}
              >
                {isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
              </ModernButton>

              <ModernButton
                type="button"
                variant="secondary"
                onClick={() => router.push('/auth')}
                className="w-full"
                disabled={isLoading}
              >
                Retour à la connexion
              </ModernButton>
            </div>
          </ModernForm>
        </div>
      </ModernCard>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <ModernCard className="w-full max-w-md">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </ModernCard>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}