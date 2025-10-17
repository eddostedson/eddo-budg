'use client'

import { useState } from 'react'
import { ModernModal, ModernCard, ModernForm, ModernButton } from './index'
import { ModernAccessibleInput } from '@/components/modern-accessibility'
import { createClient } from '@/lib/supabase/browser'

interface ResetPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ResetPasswordModal({ isOpen, onClose }: ResetPasswordModalProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        setError(error.message)
      } else {
        setIsSuccess(true)
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setError(null)
    setIsSuccess(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <ModernModal isOpen={isOpen} onClose={handleClose}>
      <ModernCard className="w-full max-w-md mx-auto">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Réinitialiser le mot de passe
            </h2>
            <p className="text-gray-600">
              Entrez votre adresse email pour recevoir un lien de réinitialisation
            </p>
          </div>

          {isSuccess ? (
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-green-600 mb-2">
                Email envoyé !
              </h3>
              <p className="text-gray-600 mb-4">
                Vérifiez votre boîte email et cliquez sur le lien pour réinitialiser votre mot de passe.
              </p>
              <ModernButton
                onClick={handleClose}
                variant="primary"
                className="w-full"
              >
                Fermer
              </ModernButton>
            </div>
          ) : (
            <ModernForm onSubmit={handleResetPassword}>
              <div className="space-y-4">
                <ModernAccessibleInput
                  type="email"
                  label="Adresse email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                />

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="flex space-x-3">
                  <ModernButton
                    type="button"
                    variant="secondary"
                    onClick={handleClose}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Annuler
                  </ModernButton>
                  <ModernButton
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    loading={isLoading}
                    disabled={!email}
                  >
                    {isLoading ? 'Envoi...' : 'Envoyer le lien'}
                  </ModernButton>
                </div>
              </div>
            </ModernForm>
          )}
        </div>
      </ModernCard>
    </ModernModal>
  )
}





