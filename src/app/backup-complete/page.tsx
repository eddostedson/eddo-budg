'use client'

import { useState, useEffect } from 'react'
import { completeBackupService, BackupInfo, BackupLog } from '@/lib/backup-service-complete'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  Play, 
  Square, 
  Download, 
  Trash2, 
  RotateCcw, 
  Clock, 
  Database,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

export default function CompleteBackupPage() {
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [logs, setLogs] = useState<BackupLog[]>([])
  const [status, setStatus] = useState<{ isRunning: boolean; nextBackup?: Date }>({ isRunning: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Charger les données
  const loadData = async () => {
    try {
      setLoading(true)
      const [backupsData, logsData] = await Promise.all([
        completeBackupService.getBackups(),
        completeBackupService.getBackupLogs()
      ])
      setBackups(backupsData)
      setLogs(logsData)
      setStatus(completeBackupService.getStatus())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Démarrer la sauvegarde automatique
  const handleStartAutoBackup = async () => {
    try {
      setLoading(true)
      await completeBackupService.startAutoBackup(30) // 30 minutes
      await loadData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Arrêter la sauvegarde automatique
  const handleStopAutoBackup = () => {
    completeBackupService.stopAutoBackup()
    setStatus({ isRunning: false })
  }

  // Créer une sauvegarde manuelle
  const handleCreateBackup = async () => {
    try {
      setLoading(true)
      setError(null)
      await completeBackupService.createCompleteBackup()
      await loadData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Restaurer une sauvegarde
  const handleRestoreBackup = async (backupId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir restaurer cette sauvegarde ? Cela va remplacer toutes les données actuelles.')) {
      return
    }

    try {
      setLoading(true)
      const success = await completeBackupService.restoreBackup(backupId)
      if (success) {
        await loadData()
      } else {
        setError('Erreur lors de la restauration')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Supprimer une sauvegarde
  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette sauvegarde ?')) {
      return
    }

    try {
      setLoading(true)
      const success = await completeBackupService.deleteBackup(backupId)
      if (success) {
        await loadData()
      } else {
        setError('Erreur lors de la suppression')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getLogIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'started': return <Clock className="h-4 w-4 text-yellow-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Sauvegarde Complète
          </h1>
          <p className="text-gray-600 mt-2">
            Sauvegarde automatique de toutes les tables avec des données
          </p>
        </div>
        <Button onClick={loadData} variant="outline" disabled={loading}>
          <Database className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statut du service */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {status.isRunning ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <Play className="h-3 w-3 mr-1" />
                  Actif
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Square className="h-3 w-3 mr-1" />
                  Inactif
                </Badge>
              )}
            </div>
            {status.nextBackup && (
              <p className="text-xs text-gray-500 mt-1">
                Prochaine: {formatDate(status.nextBackup)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Sauvegardes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{backups.length}</p>
            <p className="text-xs text-gray-500">Disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Dernière activité
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length > 0 ? (
              <p className="text-sm">{formatDate(logs[0].timestamp)}</p>
            ) : (
              <p className="text-sm text-gray-500">Aucune</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Gérer les sauvegardes automatiques et manuelles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {!status.isRunning ? (
              <Button onClick={handleStartAutoBackup} disabled={loading}>
                <Play className="h-4 w-4 mr-2" />
                Démarrer Auto (30min)
              </Button>
            ) : (
              <Button onClick={handleStopAutoBackup} variant="destructive">
                <Square className="h-4 w-4 mr-2" />
                Arrêter Auto
              </Button>
            )}
            
            <Button onClick={handleCreateBackup} disabled={loading} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Sauvegarde Manuelle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des sauvegardes */}
      <Card>
        <CardHeader>
          <CardTitle>Sauvegardes Disponibles</CardTitle>
          <CardDescription>
            Toutes les sauvegardes de votre base de données
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune sauvegarde disponible</p>
          ) : (
            <div className="space-y-4">
              {backups.map((backup) => (
                <div key={backup.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(backup.status)}
                      <span className="font-medium">{backup.name}</span>
                      <Badge variant={backup.status === 'success' ? 'default' : 'destructive'}>
                        {backup.status === 'success' ? 'Réussi' : 'Erreur'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestoreBackup(backup.id)}
                        disabled={loading || backup.status !== 'success'}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Restaurer
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteBackup(backup.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Date:</span> {formatDate(backup.timestamp)}
                    </div>
                    <div>
                      <span className="font-medium">Taille:</span> {formatSize(backup.size)}
                    </div>
                    <div>
                      <span className="font-medium">Tables:</span> {backup.tables.length}
                    </div>
                    <div>
                      <span className="font-medium">Détails:</span> {backup.tables.join(', ')}
                    </div>
                  </div>

                  {backup.error && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{backup.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs de sauvegarde */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Sauvegarde</CardTitle>
          <CardDescription>
            Historique des opérations de sauvegarde
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun log disponible</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getLogIcon(log.status)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium break-words">
                      {log.message.includes('|') ? (
                        <div className="space-y-1">
                          {log.message.split('|').map((part, index) => (
                            <div key={index} className={index === 0 ? "font-semibold" : "text-gray-600"}>
                              {part.trim()}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>{log.message}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span>{formatDate(log.timestamp)}</span>
                      {log.duration && <span>• {log.duration}ms</span>}
                      {log.backupId && <span>• ID: {log.backupId.slice(0, 8)}...</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
