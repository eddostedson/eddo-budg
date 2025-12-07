'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const sidebarItems = [
  { 
    href: '/accueil', 
    label: 'Accueil', 
    icon: '🏠',
    description: 'Dashboard'
  },
  { 
    href: '/recettes', 
    label: 'Recettes', 
    icon: '💰',
    description: 'Vos revenus'
  },
  { 
    href: '/depenses', 
    label: 'Dépenses', 
    icon: '💸',
    description: 'Vos sorties'
  },
  { 
    href: '/facbl', 
    label: 'Proformas', 
    icon: '📄',
    description: 'Proformas & documents FACBL'
  },
  { 
    href: '/ai-insights', 
    label: 'Assistant IA', 
    icon: '🤖',
    description: 'Analyses intelligentes'
  },
  { 
    href: '/ai-chat', 
    label: 'Chat IA', 
    icon: '💬',
    description: 'Discussion financière'
  },
  { 
    href: '/rapports', 
    label: 'Rapports', 
    icon: '📊',
    description: 'États financiers'
  },
  { 
    href: '/transactions', 
    label: 'Transactions', 
    icon: '💳',
    description: ''
  },
  { 
    href: '/ai-analysis', 
    label: 'Analytics', 
    icon: '📈',
    description: ''
  },
  { 
    href: '/categories', 
    label: 'Catégories', 
    icon: '📂',
    description: ''
  },
  { 
    href: '/goals', 
    label: 'Objectifs', 
    icon: '🎯',
    description: ''
  },
]

const bottomItems = [
  { 
    href: '/settings', 
    label: 'Paramètres', 
    icon: '⚙️',
    description: 'Configuration'
  },
  { 
    href: '/help', 
    label: 'Aide', 
    icon: '❓',
    description: 'Support'
  },
]

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  // Fermer le menu quand on change de page
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Empêcher le scroll du body quand le menu est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!user) return null

  return (
    <>
      {/* Bouton hamburger - visible seulement sur mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg flex items-center justify-center transition-all duration-200"
      >
        <span className="text-2xl">☰</span>
      </button>

      {/* Overlay - visible seulement sur mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu mobile - visible seulement sur mobile */}
      <div className={cn(
        "md:hidden fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl transform transition-all duration-300 ease-out z-50",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header du menu mobile */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold">
              B
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Budget Manager</h2>
              <p className="text-slate-400 text-sm">Gestion financière</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-10 h-10 bg-slate-700 hover:bg-slate-600 text-white rounded-xl flex items-center justify-center transition-colors"
          >
            <span className="text-xl">×</span>
          </button>
        </div>

        {/* Navigation principale */}
        <div className="flex-1 overflow-y-auto py-6">
          <div className="px-6 space-y-2">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group",
                  pathname === item.href
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                )}
              >
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  {item.description && (
                    <div className="text-sm opacity-70">{item.description}</div>
                  )}
                </div>
                {pathname === item.href && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </Link>
            ))}
          </div>

          {/* Séparateur */}
          <div className="mx-6 my-6 border-t border-slate-700"></div>

          {/* Navigation secondaire */}
          <div className="px-6 space-y-2">
            {bottomItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200 group"
              >
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  {item.description && (
                    <div className="text-sm opacity-70">{item.description}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer du menu mobile */}
        <div className="border-t border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <div className="text-white font-medium">{user.email}</div>
              <div className="text-slate-400 text-sm">Utilisateur connecté</div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-medium transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </>
  )
}
