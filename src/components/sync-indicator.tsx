'use client'

import { useEffect, useState } from 'react'
import { OfflineDepenseService } from '@/lib/supabase/offline-depense-service'

export default function SyncIndicator() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    // Vérifier l'état de synchronisation toutes les secondes
    const interval = setInterval(() => {
      const hasPending = OfflineDepenseService.hasPendingSync()
      setPendingCount(hasPending ? 1 : 0)
      setIsSyncing(hasPending)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Ne rien afficher si tout est synchronisé
  if (!isSyncing && pendingCount === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-3 flex items-center gap-3 animate-slide-up">
        {isSyncing ? (
          <>
            {/* Animation de synchronisation */}
            <div className="relative">
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">
                Synchronisation en cours...
              </span>
              <span className="text-xs text-gray-500">
                {pendingCount} dépense(s) en attente
              </span>
            </div>
          </>
        ) : (
          <>
            {/* État synchronisé */}
            <div className="flex items-center justify-center w-5 h-5 bg-green-100 rounded-full">
              <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900">
              Synchronisé
            </span>
          </>
        )}
      </div>
    </div>
  )
}

