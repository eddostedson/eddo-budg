'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
// import { useState } from 'react'

interface ModernSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function ModernSidebar({ isOpen, onClose }: ModernSidebarProps) {
  const pathname = usePathname()

  const navigationItems = [
    { href: '/', label: 'Accueil', icon: '🏠' },
    { href: '/budgets', label: 'Budgets', icon: '💰' },
    { href: '/transactions', label: 'Transactions', icon: '📊' },
    { href: '/reports', label: 'Rapports', icon: '📈' },
    { href: '/settings', label: 'Paramètres', icon: '⚙️' }
  ]

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/95 backdrop-blur-xl border-r border-white/30 shadow-2xl transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-xl">💰</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Compta MVP
              </span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden w-8 h-8 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 hover:scale-105 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200/50">
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Développé avec ❤️
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Compta MVP v1.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

interface ModernMobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function ModernMobileMenu({ isOpen, onClose }: ModernMobileMenuProps) {
  const pathname = usePathname()

  const navigationItems = [
    { href: '/', label: 'Accueil', icon: '🏠' },
    { href: '/budgets', label: 'Budgets', icon: '💰' },
    { href: '/transactions', label: 'Transactions', icon: '📊' },
    { href: '/reports', label: 'Rapports', icon: '📈' },
    { href: '/settings', label: 'Paramètres', icon: '⚙️' }
  ]

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Mobile Menu */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-white/30 shadow-2xl transform transition-transform duration-300 ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="p-4">
          <div className="grid grid-cols-5 gap-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex flex-col items-center space-y-1 p-3 rounded-2xl transition-all duration-300 hover:scale-105 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

