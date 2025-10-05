'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export function ModernNavbar() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-xl">💰</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Compta MVP
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-300 hover:scale-105"
            >
              🏠 Accueil
            </Link>
            <Link 
              href="/budgets" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-300 hover:scale-105"
            >
              💰 Budgets
            </Link>
            <Link 
              href="/transactions" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-300 hover:scale-105"
            >
              📊 Transactions
            </Link>
            <Link 
              href="/reports" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-300 hover:scale-105"
            >
              📈 Rapports
            </Link>
            <Link 
              href="/settings" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-300 hover:scale-105"
            >
              ⚙️ Paramètres
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-2 rounded-2xl hover:from-red-600 hover:to-pink-700 transition-all duration-300 hover:scale-105 shadow-lg shadow-red-500/25 font-medium"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <Link 
                href="/auth"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25 font-medium"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

