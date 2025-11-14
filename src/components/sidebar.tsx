'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  Home,
  TrendingUp,
  TrendingDown,
  Building2,
  Receipt,
  Bot,
  MessageSquare,
  BarChart3,
  CreditCard,
  LineChart,
  FolderOpen,
  StickyNote,
  Target,
  Download,
  RotateCcw,
  FileText,
  Settings,
  HelpCircle,
} from 'lucide-react'

const sidebarItems = [
  { 
    href: '/accueil', 
    label: 'Accueil', 
    icon: Home,
    description: 'Dashboard'
  },
  { 
    href: '/recettes', 
    label: 'Recettes', 
    icon: TrendingUp,
    description: 'Vos revenus'
  },
  { 
    href: '/depenses', 
    label: 'Dépenses', 
    icon: TrendingDown,
    description: 'Vos sorties'
  },
  { 
    href: '/comptes-bancaires', 
    label: 'Comptes Bancaires', 
    icon: Building2,
    description: 'Gestion bancaire'
  },
  { 
    href: '/receipts', 
    label: 'Reçus', 
    icon: Receipt,
    description: 'Gestion des reçus'
  },
  { 
    href: '/ai-insights', 
    label: 'Assistant IA', 
    icon: Bot,
    description: 'Analyses intelligentes'
  },
  { 
    href: '/ai-chat', 
    label: 'Chat IA', 
    icon: MessageSquare,
    description: 'Discussion financière'
  },
  { 
    href: '/rapports', 
    label: 'Rapports', 
    icon: BarChart3,
    description: 'États financiers'
  },
  { 
    href: '/transactions', 
    label: 'Transactions', 
    icon: CreditCard,
    description: ''
  },
  { 
    href: '/ai-analysis', 
    label: 'Analytics', 
    icon: LineChart,
    description: ''
  },
  { 
    href: '/categories', 
    label: 'Catégories', 
    icon: FolderOpen,
    description: ''
  },
  { 
    href: '/notes', 
    label: 'Notes', 
    icon: StickyNote,
    description: 'Dépenses futures'
  },
  { 
    href: '/goals', 
    label: 'Objectifs', 
    icon: Target,
    description: ''
  },
  { 
    href: '/export', 
    label: 'Export CSV', 
    icon: Download,
    description: 'Exporter les données'
  },
  { 
    href: '/restore', 
    label: 'Restaurer', 
    icon: RotateCcw,
    description: 'Restaurer depuis JSON'
  },
  { 
    href: '/journal-activite', 
    label: 'Journal', 
    icon: FileText,
    description: 'Journal d\'activité'
  },
]

const bottomItems = [
  { 
    href: '/settings', 
    label: 'Paramètres', 
    icon: Settings,
    description: 'Configuration'
  },
  { 
    href: '/help', 
    label: 'Aide', 
    icon: HelpCircle,
    description: 'Support'
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  if (!user) return null

  return (
    <div className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-slate-50 to-slate-100 border-r border-slate-200/50 flex-col py-4 px-4 z-50 shadow-lg">
      {/* Logo/Brand */}
      <div className="mb-8 px-2">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
          B
        </div>
      </div>

      {/* Navigation principale */}
      <div className="flex-1 space-y-1.5 overflow-y-auto pr-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "w-full min-h-[56px] rounded-xl flex items-center gap-3 px-4 transition-all duration-200 relative group",
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 text-white"
                  : "bg-white/80 backdrop-blur-sm hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/60 hover:border-slate-300 shadow-sm hover:shadow-md"
              )}
            >
              <div className={cn(
                "flex-shrink-0 transition-transform duration-200",
                isActive ? "scale-110" : "group-hover:scale-105"
              )}>
                <Icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2.2}
                  className={cn(
                    isActive ? "text-white" : "text-slate-600 group-hover:text-slate-900"
                  )}
                />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className={cn(
                  "font-semibold text-sm truncate leading-tight",
                  isActive ? "text-white" : "text-slate-700 group-hover:text-slate-900"
                )}>
                  {item.label}
                </span>
                {item.description && (
                  <span className={cn(
                    "text-xs truncate leading-tight mt-0.5",
                    isActive ? "text-white/90" : "text-slate-500 group-hover:text-slate-700"
                  )}>
                    {item.description}
                  </span>
                )}
              </div>
              {isActive && (
                <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              )}
            </Link>
          )
        })}
      </div>

      {/* Navigation secondaire */}
      <div className="space-y-1.5 mb-4">
        {bottomItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "w-full min-h-[56px] rounded-xl flex items-center gap-3 px-4 transition-all duration-200 text-slate-700 hover:text-slate-900 bg-white/80 backdrop-blur-sm hover:bg-white border border-slate-200/60 hover:border-slate-300 shadow-sm hover:shadow-md relative group",
                isActive && "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 border-transparent"
              )}
            >
              <div className={cn(
                "flex-shrink-0 transition-transform duration-200",
                isActive ? "scale-110" : "group-hover:scale-105"
              )}>
                <Icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2.2}
                  className={cn(
                    isActive ? "text-white" : "text-slate-600 group-hover:text-slate-900"
                  )}
                />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className={cn(
                  "font-semibold text-sm truncate leading-tight",
                  isActive ? "text-white" : "text-slate-700 group-hover:text-slate-900"
                )}>
                  {item.label}
                </span>
                {item.description && (
                  <span className={cn(
                    "text-xs truncate leading-tight mt-0.5",
                    isActive ? "text-white/90" : "text-slate-500 group-hover:text-slate-700"
                  )}>
                    {item.description}
                  </span>
                )}
              </div>
              {isActive && (
                <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              )}
            </Link>
          )
        })}
      </div>

      {/* User avatar */}
      <div className="group relative px-2">
        <div className="w-full min-h-[64px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center gap-3 px-4 text-white font-semibold cursor-pointer shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] transition-all duration-300 border border-white/20">
          <div className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center text-base font-bold flex-shrink-0 border border-white/30">
            {user.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-semibold truncate leading-tight">{user.email?.split('@')[0] || 'Utilisateur'}</span>
            <span className="text-xs opacity-95 truncate leading-tight mt-0.5">{user.email || ''}</span>
          </div>
        </div>
        
        {/* User menu dropdown */}
        <div className="absolute left-full ml-2 bottom-0 bg-white/95 backdrop-blur-md text-slate-800 px-4 py-3 rounded-xl text-sm opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 shadow-2xl border border-slate-200">
          <div className="font-semibold mb-2 text-slate-900">{user.email}</div>
          <Button
            onClick={signOut}
            variant="ghost"
            size="sm"
            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 p-0 h-auto w-full justify-start font-medium"
          >
            Déconnexion
          </Button>
        </div>
      </div>
    </div>
  )
}

