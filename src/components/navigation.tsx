'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  CreditCard, 
  TrendingUp, 
  FileText, 
  Settings, 
  LogOut,
  Database,
  Activity,
  BarChart3
} from 'lucide-react'

const navigation = [
  { name: 'Accueil', href: '/accueil', icon: Home },
  { name: 'Recettes', href: '/recettes', icon: TrendingUp },
  { name: 'Dépenses', href: '/depenses', icon: CreditCard },
  { name: 'Budgets', href: '/budgets', icon: FileText },
  { name: 'Journal', href: '/journal-activite', icon: Activity },
  { name: 'Monitoring', href: '/monitoring', icon: BarChart3 },
  { name: 'Sauvegardes', href: '/backup', icon: Database },
  { name: 'Debug', href: '/debug', icon: Settings },
]

export default function Navigation() {
  const pathname = usePathname()
  const { user, signOut, loading } = useAuth()

  if (loading) {
    return (
      <nav className="bg-white shadow-sm border-r h-full">
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </nav>
    )
  }

  if (!user) {
    return null
  }

  return (
    <nav className="bg-white shadow-sm border-r h-full">
      <div className="p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">Eddo Budget</h1>
          <p className="text-sm text-gray-600">Gestion Financière</p>
        </div>

        <div className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </div>

        <div className="mt-8 pt-4 border-t">
          <div className="mb-4">
            <p className="text-sm text-gray-600">Connecté en tant que:</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.email}
            </p>
          </div>
          
          <Button
            onClick={signOut}
            variant="outline"
            className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Se déconnecter
          </Button>
        </div>
      </div>
    </nav>
  )
}
