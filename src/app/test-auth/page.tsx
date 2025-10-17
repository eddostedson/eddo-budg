'use client'

import { useAuth } from '@/hooks/useAuth'
import { AuthErrorBoundary } from '@/components/auth-error-boundary'

export default function TestAuthPage() {
  const { user, loading, error } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Test de l'authentification...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthErrorBoundary>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Test d'authentification
          </h1>
          
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">État de l'authentification</h2>
              <div className="space-y-2">
                <p><strong>Chargement:</strong> {loading ? 'Oui' : 'Non'}</p>
                <p><strong>Utilisateur connecté:</strong> {user ? 'Oui' : 'Non'}</p>
                <p><strong>Authentifié:</strong> {user ? 'Oui' : 'Non'}</p>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-red-800"><strong>Erreur:</strong> {error}</p>
                  </div>
                )}
              </div>
            </div>

            {user && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Informations utilisateur</h3>
                <div className="bg-gray-50 rounded p-3">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Dernière connexion:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <a 
                href="/auth" 
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Aller à la page d'authentification
              </a>
            </div>
          </div>
        </div>
      </div>
    </AuthErrorBoundary>
  )
}







