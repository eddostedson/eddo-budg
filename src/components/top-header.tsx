'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useScroll } from '@/hooks/useScroll'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ForgotPasswordModal } from './forgot-password-modal'

export function TopHeader() {
  const { user, signOut } = useAuth()
  const { isScrolled, scrollY } = useScroll()
  const [searchQuery, setSearchQuery] = useState('')
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)

  if (!user) return null

  return (
    <header className={`fixed top-0 left-0 md:left-16 right-0 h-16 top-header z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-gradient-to-r from-slate-900/98 via-purple-900/98 to-slate-900/98 backdrop-blur-2xl shadow-2xl border-b border-white/20' 
        : 'bg-gradient-to-r from-slate-800/95 via-purple-800/95 to-slate-800/95 backdrop-blur-xl border-b border-white/10 shadow-xl'
    }`}>
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side - Title and navigation */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <h1 className="text-white font-semibold text-lg">Budget Manager</h1>
            <span className="text-white/60 text-sm">24</span>
          </div>
          
          {/* Navigation tabs */}
          <nav className="hidden md:flex items-center gap-4">
            <Link href="/accueil" className="text-white/80 hover:text-white text-sm flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-all duration-300 group">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                <span className="text-2xl">🏠</span>
              </div>
              <span className="font-medium">Accueil</span>
            </Link>
            <Link href="/recettes" className="text-white/80 hover:text-white text-sm flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-all duration-300 group">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                <span className="text-2xl">💰</span>
              </div>
              <span className="font-medium">Recettes</span>
            </Link>
            <Link href="/depenses" className="text-white/80 hover:text-white text-sm flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-all duration-300 group">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                <span className="text-2xl">💸</span>
              </div>
              <span className="font-medium">Dépenses</span>
            </Link>
            <Link href="/notes" className="text-white/80 hover:text-white text-sm flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-all duration-300 group">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                <span className="text-2xl">📝</span>
              </div>
              <span className="font-medium">Notes</span>
            </Link>
            <Link href="/rapports" className="text-white/80 hover:text-white text-sm flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-all duration-300 group">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                <span className="text-2xl">📊</span>
              </div>
              <span className="font-medium">Rapports</span>
            </Link>
          </nav>
        </div>

        {/* Center - Search - caché sur mobile */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60">
              🔍
            </span>
            <Input
              type="text"
              placeholder="chercher un employé, un docu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 search-input text-white placeholder:text-white/60 w-full bg-white/20 border-white/30"
            />
          </div>
        </div>

        {/* Right side - Time, status, profile */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Time - caché sur mobile */}
          <div className="hidden md:block text-white font-medium">
            {new Date().toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>

          {/* Status - caché sur mobile */}
          <div className="hidden md:flex items-center gap-2 text-white/80">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm">EN TRAVAIL</span>
          </div>

          {/* Profile - version mobile */}
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 md:px-3 py-2">
            <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-sm">
              <div className="text-white font-medium">
                {user.email?.split('@')[0] || 'Utilisateur'}
              </div>
            </div>
            <span className="hidden md:block text-white/60 text-xs">▼</span>
          </div>

          {/* Bouton de déconnexion - version mobile */}
          <Button 
            onClick={signOut}
            className="bg-red-500/80 hover:bg-red-600 text-white border-none rounded-lg px-2 md:px-4 py-2 transition-colors text-xs md:text-sm"
          >
            <span className="hidden sm:inline">Déconnexion</span>
            <span className="sm:hidden">×</span>
          </Button>

          {/* Bouton mot de passe oublié */}
          <button
            onClick={() => setShowForgotPasswordModal(true)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            title="Mot de passe oublié"
          >
            Mot de passe oublié ?
          </button>
        </div>
      </div>

      {/* Modal de réinitialisation de mot de passe */}
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
      
      {/* Indicateur de scroll */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50"></div>
    </header>
  )
}

