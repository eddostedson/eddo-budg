'use client'

import { useState } from 'react'
import { ModernCard, ModernForm, ModernButton, ModernModal } from './index'
import { ModernAccessibleInput } from '@/components/modern-accessibility'
// Composant de validation de mot de passe simple
const PasswordValidator = ({ password, confirmPassword, showStrength = false }: { 
  password: string; 
  confirmPassword: string; 
  showStrength?: boolean 
}) => {
  const isMatch = password === confirmPassword && password.length > 0
  const isStrong = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)
  
  return (
    <div className="space-y-2">
      {showStrength && (
        <div className="text-sm">
          <div className={`${isStrong ? 'text-green-600' : 'text-red-600'}`}>
            Force: {isStrong ? 'Forte' : 'Faible'}
          </div>
        </div>
      )}
      <div className={`text-sm ${isMatch ? 'text-green-600' : 'text-red-600'}`}>
        {password.length > 0 && !isMatch && 'Les mots de passe ne correspondent pas'}
        {isMatch && 'Les mots de passe correspondent'}
      </div>
    </div>
  )
}
import { createClient } from '@/lib/supabase/browser'
import { useToast } from '@/contexts/toast-context'

interface ResetPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ResetPasswordModal({ isOpen, onClose }: ResetPasswordModalProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'sent' | 'error'>('email')
  const { showSuccess, showError } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        setStep('error')
        showError('Erreur', error.message)
      } else {
        setStep('sent')
        showSuccess('Email envoyé !', 'Vérifiez votre boîte mail pour réinitialiser votre mot de passe.')
      }
    } catch {
      setStep('error')
      showError('Erreur', 'Une erreur est survenue lors de l&apos;envoi de l&apos;email.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setStep('email')
    setEmail('')
    onClose()
  }

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Réinitialisation du mot de passe"
      size="md"
    >
      <ModernCard variant="glass" className="p-0">
        {step === 'email' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl">🔐</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Mot de passe oublié ?
              </h3>
              <p className="text-gray-600">
                Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
            </div>

            <ModernForm onSubmit={handleSubmit}>
              <ModernAccessibleInput
                label="Adresse email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />

              <div className="flex space-x-3">
                <ModernButton
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Annuler
                </ModernButton>
                <ModernButton
                  type="submit"
                  variant="primary"
                  loading={isLoading}
                  disabled={!email || isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Envoi...' : 'Envoyer le lien'}
                </ModernButton>
              </div>
            </ModernForm>
          </div>
        )}

        {step === 'sent' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Email envoyé !
              </h3>
              <p className="text-gray-600 mb-4">
                Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.
              </p>
            </div>
            <ModernButton
              variant="primary"
              onClick={handleClose}
              className="w-full"
            >
              Compris
            </ModernButton>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
              <span className="text-2xl">❌</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Erreur
              </h3>
              <p className="text-gray-600 mb-4">
                Impossible d&apos;envoyer l&apos;email de réinitialisation.
              </p>
              <p className="text-sm text-gray-500">
                Vérifiez votre adresse email et réessayez.
              </p>
            </div>
            <div className="flex space-x-3">
              <ModernButton
                variant="secondary"
                onClick={() => setStep('email')}
                className="flex-1"
              >
                Réessayer
              </ModernButton>
              <ModernButton
                variant="primary"
                onClick={handleClose}
                className="flex-1"
              >
                Fermer
              </ModernButton>
            </div>
          </div>
        )}
      </ModernCard>
    </ModernModal>
  )
}

interface NewPasswordFormProps {
  token: string
  onSuccess: () => void
}

export function NewPasswordForm({ onSuccess }: NewPasswordFormProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const { showSuccess, showError } = useToast()
  const supabase = createClient()

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {}

    if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        showError('Erreur', error.message)
      } else {
        showSuccess('Succès !', 'Votre mot de passe a été mis à jour avec succès.')
        onSuccess()
      }
    } catch {
      showError('Erreur', 'Une erreur est survenue lors de la mise à jour du mot de passe.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <ModernCard variant="glass" className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Nouveau mot de passe
          </h1>
          <p className="text-gray-600">
            Créez un nouveau mot de passe sécurisé pour votre compte
          </p>
        </div>

        <ModernForm onSubmit={handleSubmit} className="space-y-6">
          <ModernAccessibleInput
            label="Nouveau mot de passe"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            error={errors.password}
            className="w-full"
          />

          <ModernAccessibleInput
            label="Confirmer le mot de passe"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            error={errors.confirmPassword}
            className="w-full"
          />

          <PasswordValidator 
            password={password} 
            confirmPassword={confirmPassword} 
            showStrength={true}
          />

          <ModernButton
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            disabled={!password || !confirmPassword || isLoading}
            className="w-full"
          >
            {isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </ModernButton>
        </ModernForm>
      </ModernCard>
    </div>
  )
}
