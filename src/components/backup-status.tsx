'use client'

import { useState, useEffect } from 'react'
import { backupService } from '@/lib/backup-service'
import Link from 'next/link'

export function BackupStatus() {
  const [status, setStatus] = useState({ isRunning: false, nextBackup: undefined as Date | undefined })
  const [lastBackup, setLastBackup] = useState<Date | null>(null)

  useEffect(() => {
    const updateStatus = () => {
      setStatus(backupService.getStatus())
    }

    // Mettre à jour le statut immédiatement
    updateStatus()

    // Mettre à jour toutes les 30 secondes
    const interval = setInterval(updateStatus, 30000)

    // Récupérer la dernière sauvegarde
    backupService.getBackups().then(backups => {
      if (backups.length > 0) {
        setLastBackup(backups[0].timestamp)
      }
    })

    return () => clearInterval(interval)
  }, [])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl transform rotate-1 group-hover:rotate-2 transition-all duration-300"></div>
      <div className="relative bg-white rounded-2xl p-5 shadow-xl transform -rotate-1 group-hover:-rotate-2 group-hover:scale-105 transition-all duration-300 border-2 border-cyan-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg transform rotate-6">
              <span className="text-xl">🛡️</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Sauvegardes</h3>
              <div className="text-xs text-gray-600">Protection des données</div>
            </div>
          </div>
          <Link 
            href="/backup"
            className="text-blue-600 hover:text-blue-800 text-xs font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-all"
          >
            Gérer
          </Link>
        </div>
      
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium">Service:</span>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${status.isRunning ? 'bg-green-500' : 'bg-red-500'} shadow-lg`}></div>
              <span className={`font-bold ${status.isRunning ? 'text-green-600' : 'text-red-600'}`}>
                {status.isRunning ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
          
          {status.isRunning && status.nextBackup && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Prochaine:</span>
              <span className="text-gray-800 font-semibold">{formatDate(status.nextBackup)}</span>
            </div>
          )}
          
          {lastBackup && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Dernière:</span>
              <span className="text-gray-800 font-semibold">{formatDate(lastBackup)}</span>
            </div>
          )}
          
          {!status.isRunning && (
            <div className="text-sm text-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-xl border border-amber-200 font-medium">
              ⚠️ Sauvegarde automatique désactivée
            </div>
          )}
        </div>
      </div>
    </div>
  )
}






















