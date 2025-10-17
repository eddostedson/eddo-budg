'use client'

import { useState, useEffect } from 'react'
import { completeBackupService, BackupInfo, BackupLog } from '@/lib/backup-service-complete'
import { useNotifications } from '@/contexts/notification-context'
import { useConfirm } from '@/components/modern-confirm'

export default function BackupPage() {
  const { showSuccess, showError, showWarning } = useNotifications()
  const { confirm, ConfirmDialog } = useConfirm()
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [logs, setLogs] = useState<BackupLog[]>([])
  const [loading, setLoading] = useState(true)
  const [serviceStatus, setServiceStatus] = useState({ isRunning: false, nextBackup: undefined as Date | undefined })

  // Charger les données
  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000) // Actualiser toutes les 30 secondes
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const [backupsData, logsData] = await Promise.all([
        completeBackupService.getBackups(),
        completeBackupService.getBackupLogs()
      ])
      setBackups(backupsData)
      setLogs(logsData)
      setServiceStatus(completeBackupService.getStatus())
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  // Démarrer le service de sauvegarde automatique
  const startAutoBackup = async () => {
    try {
      await completeBackupService.startAutoBackup(30)
      showSuccess("Service démarré", "Sauvegarde automatique activée (toutes les 30 minutes)")
      loadData()
    } catch (error) {
      showError("Erreur", "Impossible de démarrer le service de sauvegarde")
    }
  }

  // Arrêter le service de sauvegarde automatique
  const stopAutoBackup = () => {
    completeBackupService.stopAutoBackup()
    showSuccess("Service arrêté", "Sauvegarde automatique désactivée")
    loadData()
  }

  // Créer une sauvegarde manuelle
  const createManualBackup = async () => {
    try {
      setLoading(true)
      const backup = await completeBackupService.createCompleteBackup()
      if (backup) {
        showSuccess("Sauvegarde créée", `Sauvegarde "${backup.name}" créée avec succès`)
        loadData()
      } else {
        showError("Erreur", "Impossible de créer la sauvegarde")
      }
    } catch (error) {
      showError("Erreur", "Erreur lors de la création de la sauvegarde")
    } finally {
      setLoading(false)
    }
  }

  // Restaurer une sauvegarde
  const restoreBackup = async (backup: BackupInfo) => {
    const confirmed = await confirm(
      'Restaurer la sauvegarde',
      `Êtes-vous sûr de vouloir restaurer la sauvegarde "${backup.name}" ? Toutes les données actuelles seront remplacées.`,
      {
        confirmText: 'Restaurer',
        cancelText: 'Annuler',
        type: 'warning'
      }
    )

    if (confirmed) {
      try {
        setLoading(true)
        const success = await completeBackupService.restoreBackup(backup.id)
        if (success) {
          showSuccess("Restauration terminée", `Données restaurées depuis "${backup.name}"`)
          loadData()
        } else {
          showError("Erreur", "Impossible de restaurer la sauvegarde")
        }
      } catch (error) {
        showError("Erreur", "Erreur lors de la restauration")
      } finally {
        setLoading(false)
      }
    }
  }

  // Supprimer une sauvegarde
  const deleteBackup = async (backup: BackupInfo) => {
    const confirmed = await confirm(
      'Supprimer la sauvegarde',
      `Êtes-vous sûr de vouloir supprimer la sauvegarde "${backup.name}" ?`,
      {
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
      }
    )

    if (confirmed) {
      try {
        const success = await completeBackupService.deleteBackup(backup.id)
        if (success) {
          showSuccess("Sauvegarde supprimée", `Sauvegarde "${backup.name}" supprimée`)
          loadData()
        } else {
          showError("Erreur", "Impossible de supprimer la sauvegarde")
        }
      } catch (error) {
        showError("Erreur", "Erreur lors de la suppression")
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des sauvegardes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-2xl p-8 mb-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <span className="text-5xl">🛡️</span>
                Sauvegardes
              </h1>
              <p className="text-blue-100 text-lg">Gérez vos sauvegardes automatiques et manuelles</p>
            </div>
            <div className="flex gap-4">
              {serviceStatus.isRunning ? (
                <button
                  onClick={stopAutoBackup}
                  className="bg-red-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                >
                  <span className="text-2xl">⏹️</span>
                  Arrêter Auto
                </button>
              ) : (
                <button
                  onClick={startAutoBackup}
                  className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                >
                  <span className="text-2xl">▶️</span>
                  Démarrer Auto
                </button>
              )}
              <button
                onClick={createManualBackup}
                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                <span className="text-2xl">💾</span>
                Sauvegarde Manuelle
              </button>
            </div>
          </div>
        </div>

        {/* Statut du service */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-3xl">📊</span>
            Statut du Service
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${serviceStatus.isRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {serviceStatus.isRunning ? 'Service Actif' : 'Service Inactif'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {serviceStatus.isRunning ? 'Sauvegarde automatique activée' : 'Sauvegarde automatique désactivée'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{backups.length}</p>
                <p className="text-sm text-gray-600">Sauvegardes disponibles</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {serviceStatus.nextBackup ? formatDate(serviceStatus.nextBackup) : 'N/A'}
                </p>
                <p className="text-sm text-gray-600">Prochaine sauvegarde</p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des sauvegardes */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-3xl">💾</span>
              Sauvegardes Disponibles
            </h2>
          </div>
          <div className="p-6">
            {backups.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune sauvegarde</h3>
                <p className="text-gray-600 mb-6">Créez votre première sauvegarde pour protéger vos données</p>
                <button
                  onClick={createManualBackup}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Créer une sauvegarde
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{backup.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            backup.status === 'success' ? 'bg-green-100 text-green-800' :
                            backup.status === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {backup.status === 'success' ? '✅ Réussi' :
                             backup.status === 'error' ? '❌ Erreur' : '⏳ En cours'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-semibold">Date:</span> {formatDate(backup.timestamp)}
                          </div>
                          <div>
                            <span className="font-semibold">Taille:</span> {formatFileSize(backup.size)}
                          </div>
                          <div>
                            <span className="font-semibold">Tables:</span> {backup.tables.join(', ')}
                          </div>
                        </div>
                        {backup.error && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            <span className="font-semibold">Erreur:</span> {backup.error}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => restoreBackup(backup)}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          disabled={backup.status !== 'success'}
                        >
                          🔄 Restaurer
                        </button>
                        <button
                          onClick={() => deleteBackup(backup)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Logs de sauvegarde */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-3xl">📋</span>
              Logs de Sauvegarde
            </h2>
          </div>
          <div className="p-6">
            {logs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📝</div>
                <p className="text-gray-600">Aucun log disponible</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className={`w-3 h-3 rounded-full mt-1 ${
                      log.status === 'success' ? 'bg-green-500' :
                      log.status === 'error' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 break-words">
                        {log.message.includes('|') ? (
                          <div className="space-y-1">
                            {log.message.split('|').map((part, index) => (
                              <div key={index} className={index === 0 ? "font-semibold text-gray-900" : "text-gray-600"}>
                                {part.trim()}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p>{log.message}</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(log.timestamp)}
                        {log.duration && ` • ${log.duration}ms`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog />
    </div>
  )
}
