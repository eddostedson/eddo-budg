'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

const sidebarItems = [
  { 
    href: '/', 
    label: 'Budgets', 
    icon: '💰',
    description: ''
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
    icon: '📊',
    description: ''
  },
  { 
    href: '/categories', 
    label: 'Catégories', 
    icon: '📂',
    description: ''
  },
  { 
    href: '/reports', 
    label: 'Rapports', 
    icon: '📈',
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

export function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  if (!user) return null

  return (
    <div className="fixed left-0 top-0 h-full w-16 sidebar-dark flex flex-col items-center py-4">
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
              "w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all duration-200 relative group",
              pathname === item.href
                ? "bg-blue-500 text-white"
                : "text-slate-400 hover:bg-slate-700 hover:text-white"
            )}
            title={item.label}
          >
            <span>{item.icon}</span>
            
            {/* Tooltip */}
            <div className="absolute left-14 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
              {item.label}
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
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all duration-200 text-slate-400 hover:bg-slate-700 hover:text-white relative group"
            title={item.label}
          >
            <span>{item.icon}</span>
            
            {/* Tooltip */}
            <div className="absolute left-14 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
              {item.label}
            </div>
          </Link>
        ))}
      </div>

      {/* User avatar */}
      <div className="group relative">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm cursor-pointer">
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

