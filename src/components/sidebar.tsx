'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

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
    href: '/budget-salaire', 
    label: 'Budget Salaire', 
    icon: '📅',
    description: 'Budgets mensuels autonomes'
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

  if (!user) return null

  return (
    <div className="hidden md:flex fixed left-0 top-0 h-full w-64 sidebar-dark flex-col py-4 px-4">
      {/* Logo/Brand */}
      <div className="mb-8 px-2">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          B
        </div>
      </div>

      {/* Navigation principale */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {sidebarItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "w-full h-12 rounded-xl flex items-center gap-3 px-3 transition-all duration-300 relative group hover:scale-[1.02]",
              pathname === item.href
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg text-white"
                : "bg-white/10 backdrop-blur-lg hover:bg-white/20 text-slate-300"
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

      {/* Navigation secondaire */}
      <div className="space-y-2 mb-4">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "w-full h-12 rounded-xl flex items-center gap-3 px-3 transition-all duration-300 text-slate-300 hover:text-white bg-white/5 backdrop-blur-lg hover:bg-white/10 relative group hover:scale-[1.02]",
              pathname === item.href && "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
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

      {/* User avatar */}
      <div className="group relative px-2">
        <div className="w-full h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center gap-3 px-3 text-white font-semibold cursor-pointer shadow-lg hover:scale-[1.02] transition-transform duration-300">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
            {user.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium truncate">{user.email?.split('@')[0] || 'Utilisateur'}</span>
            <span className="text-xs opacity-80 truncate">{user.email || ''}</span>
          </div>
        </div>
        
        {/* User menu dropdown */}
        <div className="absolute left-full ml-2 bottom-0 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
          <div className="font-medium mb-2">{user.email}</div>
          <Button
            onClick={signOut}
            variant="ghost"
            size="sm"
            className="text-xs text-red-400 hover:text-red-300 p-0 h-auto w-full justify-start"
          >
            Déconnexion
          </Button>
        </div>
      </div>
    </div>
  )
}

