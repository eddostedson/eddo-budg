'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

// Menus toujours visibles
const baseSidebarItems = [
  { 
    href: '/accueil', 
    label: 'Accueil', 
    icon: '🏠',
    description: 'Dashboard'
  },
  { 
    href: '/comptes-bancaires', 
    label: 'Comptes Bancaires', 
    icon: '🏦',
    description: 'Gestion bancaire'
  },
  { 
    href: '/receipts', 
    label: 'Reçus', 
    icon: '🧾',
    description: 'Gestion des reçus'
  },
  { 
    href: '/facbl', 
    label: 'Proformas', 
    icon: '📄',
    description: 'Proformas & documents FACBL'
  },
  { 
    href: '/budget-salaire', 
    label: 'Budget Salaire', 
    icon: '📅',
    description: 'Budgets mensuels autonomes'
  },
  { 
    href: '/monitoring', 
    label: 'Monitoring', 
    icon: '📊',
    description: 'Performance & Analytics'
  },
]

// Menus avancés (optionnels) que l'on peut masquer / afficher
const advancedSidebarItems = [
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
    href: '/notes', 
    label: 'Notes', 
    icon: '📝',
    description: 'Dépenses futures'
  },
  { 
    href: '/goals', 
    label: 'Objectifs', 
    icon: '🎯',
    description: ''
  },
  { 
    href: '/export', 
    label: 'Export CSV', 
    icon: '📥',
    description: 'Exporter les données'
  },
  { 
    href: '/restore', 
    label: 'Restaurer', 
    icon: '🔄',
    description: 'Restaurer depuis JSON'
  },
  { 
    href: '/journal-activite', 
    label: 'Journal', 
    icon: '📝',
    description: 'Journal d\'activité'
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

export function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [visibleAdvancedMenus, setVisibleAdvancedMenus] = useState<Record<string, boolean>>({})
  const [showMenuManager, setShowMenuManager] = useState(false)

  // Charger la préférence depuis le localStorage (si dispo)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem('visibleAdvancedMenus')
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, boolean>
        setVisibleAdvancedMenus(parsed)
      }
    } catch {
      // ignore JSON errors et repartir sur une config vide
      setVisibleAdvancedMenus({})
    }
  }, [])

  // Sauvegarder la préférence
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('visibleAdvancedMenus', JSON.stringify(visibleAdvancedMenus))
    } catch {
      // ignore quota / private mode errors
    }
  }, [visibleAdvancedMenus])

  const toggleAdvancedMenu = (href: string) => {
    setVisibleAdvancedMenus((prev) => ({
      ...prev,
      [href]: !prev[href]
    }))
  }

  const showAllAdvancedMenus = () => {
    const next: Record<string, boolean> = {}
    advancedSidebarItems.forEach((item) => {
      next[item.href] = true
    })
    setVisibleAdvancedMenus(next)
  }

  const hideAllAdvancedMenus = () => {
    setVisibleAdvancedMenus({})
  }

  if (!user) return null

  const activeAdvancedItems = advancedSidebarItems.filter(
    (item) => visibleAdvancedMenus[item.href]
  )

  const allSidebarItems = [...baseSidebarItems, ...activeAdvancedItems]

  return (
    <div className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-slate-50 border-r border-slate-200 flex-col py-4 px-4 backdrop-blur-xl">
      {/* Logo/Brand */}
      <div className="mb-8 px-2">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          B
        </div>
      </div>

      {/* Navigation + gestion des menus (zone scrollable) */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {/* Navigation principale */}
        <div className="space-y-2">
          {allSidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "w-full h-12 rounded-xl flex items-center gap-3 px-3 transition-all duration-300 relative group hover:scale-[1.02] border",
                pathname === item.href
                  ? "bg-gradient-to-r from-indigo-500 to-sky-500 shadow-lg text-white border-transparent"
                  : "bg-white text-slate-800 hover:bg-slate-100 border-slate-200"
              )}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-medium text-sm truncate">{item.label}</span>
                {item.description && (
                  <span className="text-xs opacity-70 truncate">{item.description}</span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Gestion des menus avancés */}
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full h-10 rounded-xl text-xs text-slate-800 bg-white border-slate-200 hover:bg-slate-100"
            onClick={() => setShowMenuManager((prev) => !prev)}
          >
            {showMenuManager ? 'Fermer la gestion des menus' : 'Afficher / masquer des menus'}
          </Button>

          {showMenuManager && (
            <div className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-800 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Menus avancés
                </p>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="xs"
                    className="h-6 px-2 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                    onClick={showAllAdvancedMenus}
                  >
                    Tout afficher
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    className="h-6 px-2 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                    onClick={hideAllAdvancedMenus}
                  >
                    Tout masquer
                  </Button>
                </div>
              </div>

              <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                {advancedSidebarItems.map((item) => {
                  const enabled = !!visibleAdvancedMenus[item.href]
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => toggleAdvancedMenu(item.href)}
                      className={cn(
                        'w-full flex items-center justify-between rounded-lg px-2 py-1.5 text-[11px] transition-colors border',
                        enabled
                          ? 'bg-indigo-50 text-slate-800 border-indigo-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">{item.icon}</span>
                        <span>{item.label}</span>
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                          enabled
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-700'
                        )}
                      >
                        {enabled ? 'Affiché' : 'Masqué'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Menus secondaires (Paramètres / Aide) */}
        <div className="space-y-2 mb-2">
          {bottomItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "w-full h-12 rounded-xl flex items-center gap-3 px-3 transition-all duration-300 text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 relative group hover:scale-[1.02]",
                pathname === item.href && "bg-gradient-to-r from-indigo-500 to-sky-500 text-white border-transparent"
              )}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-medium text-sm truncate">{item.label}</span>
                {item.description && (
                  <span className="text-xs opacity-70 truncate">{item.description}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

