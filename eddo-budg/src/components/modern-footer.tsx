'use client'

import Link from 'next/link'

export function ModernFooter() {
  return (
    <footer className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl">
                <span className="text-2xl">💰</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Compta MVP
              </span>
            </div>
            <p className="text-gray-300 text-lg leading-relaxed max-w-md">
              Votre solution complète de gestion budgétaire. Organisez, suivez et optimisez vos finances avec style et simplicité.
            </p>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-yellow-400">Navigation</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 hover:scale-105 inline-block">
                  🏠 Accueil
                </Link>
              </li>
              <li>
                <Link href="/budgets" className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 hover:scale-105 inline-block">
                  💰 Budgets
                </Link>
              </li>
              <li>
                <Link href="/transactions" className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 hover:scale-105 inline-block">
                  📊 Transactions
                </Link>
              </li>
              <li>
                <Link href="/reports" className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 hover:scale-105 inline-block">
                  📈 Rapports
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-yellow-400">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/settings" className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 hover:scale-105 inline-block">
                  ⚙️ Paramètres
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 hover:scale-105 inline-block">
                  📞 Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 hover:scale-105 inline-block">
                  ❓ Aide
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 hover:scale-105 inline-block">
                  📋 Conditions
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Ligne de séparation */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Compta MVP. Tous droits réservés.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <span className="text-gray-400 text-sm">Développé avec ❤️ par l&apos;équipe Compta MVP</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

