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
    href: '/backup', 
    label: 'Sauvegardes', 
    icon: '🛡️',
    description: 'Protection des données'
  },
  { 
    href: '/backup-complete', 
    label: 'Sauvegarde Complète', 
    icon: '💾',
    description: 'Toutes les tables'
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
    <div className="hidden md:flex fixed left-0 top-0 h-full w-16 sidebar-dark flex-col items-center py-4">
      {/* Logo/Brand */}
      <div className="mb-8">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          B
        </div>
      </div>

      {/* Navigation principale */}
      <div className="flex-1 space-y-4">
        {sidebarItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative group hover:scale-105",
              pathname === item.href
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg"
                : "bg-white/10 backdrop-blur-lg hover:bg-white/20"
            )}
            title={item.label}
          >
            <span className="text-2xl">{item.icon}</span>
            
            {/* Tooltip */}
            <div className="absolute left-14 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
              <div className="font-medium">{item.label}</div>
              {item.description && (
                <div className="text-xs text-gray-300">{item.description}</div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Navigation secondaire */}
      <div className="space-y-4 mb-4">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 text-slate-400 hover:text-white relative group hover:scale-105 bg-white/5 backdrop-blur-lg hover:bg-white/10"
            title={item.label}
          >
            <span className="text-2xl">{item.icon}</span>
            
            {/* Tooltip */}
            <div className="absolute left-14 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
              <div className="font-medium">{item.label}</div>
              {item.description && (
                <div className="text-xs text-gray-300">{item.description}</div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* User avatar */}
      <div className="group relative">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center text-white font-semibold text-lg cursor-pointer shadow-lg hover:scale-105 transition-transform duration-300">
          {user.email?.[0]?.toUpperCase() || 'U'}
        </div>
        
        {/* User menu tooltip */}
        <div className="absolute left-14 bottom-0 bg-gray-800 text-white px-3 py-2 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
          <div className="font-medium">{user.email}</div>
          <Button
            onClick={signOut}
            variant="ghost"
            size="sm"
            className="text-xs text-red-400 hover:text-red-300 p-0 h-auto mt-1"
          >
            Déconnexion
          </Button>
        </div>
      </div>
    </div>
  )
}

