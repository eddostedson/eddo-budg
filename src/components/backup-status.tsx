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
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-lg">🛡️</span>
          Sauvegardes
        </h3>
        <Link 
          href="/backup"
          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
        >
          Gérer
        </Link>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Service:</span>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${status.isRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={status.isRunning ? 'text-green-600' : 'text-red-600'}>
              {status.isRunning ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>
        
        {status.isRunning && status.nextBackup && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Prochaine:</span>
            <span className="text-gray-900">{formatDate(status.nextBackup)}</span>
          </div>
        )}
        
        {lastBackup && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Dernière:</span>
            <span className="text-gray-900">{formatDate(lastBackup)}</span>
          </div>
        )}
        
        {!status.isRunning && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            ⚠️ Sauvegarde automatique désactivée
          </div>
        )}
      </div>
    </div>
  )
}


