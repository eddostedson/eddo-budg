import { useState, useEffect } from 'react'
import { backupService, BackupInfo, BackupLog } from '@/lib/backup-service'

export function useBackup() {
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [logs, setLogs] = useState<BackupLog[]>([])
  const [loading, setLoading] = useState(true)
  const [serviceStatus, setServiceStatus] = useState({ isRunning: false, nextBackup: undefined as Date | undefined })

  const loadData = async () => {
    try {
      const [backupsData, logsData] = await Promise.all([
        backupService.getBackups(),
        backupService.getBackupLogs()
      ])
      setBackups(backupsData)
      setLogs(logsData)
      setServiceStatus(backupService.getStatus())
    } catch (error) {
      console.error('Erreur lors du chargement des données de sauvegarde:', error)
    } finally {
      setLoading(false)
    }
  }

  const createBackup = async (name?: string) => {
    setLoading(true)
    try {
      const backup = await backupService.createBackup(name)
      if (backup) {
        await loadData()
        return backup
      }
      return null
    } catch (error) {
      console.error('Erreur lors de la création de la sauvegarde:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  const restoreBackup = async (backupId: string) => {
    setLoading(true)
    try {
      const success = await backupService.restoreBackup(backupId)
      if (success) {
        await loadData()
      }
      return success
    } catch (error) {
      console.error('Erreur lors de la restauration:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const deleteBackup = async (backupId: string) => {
    setLoading(true)
    try {
      const success = await backupService.deleteBackup(backupId)
      if (success) {
        await loadData()
      }
      return success
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const startAutoBackup = async (intervalMinutes: number = 30) => {
    try {
      await backupService.startAutoBackup(intervalMinutes)
      setServiceStatus(backupService.getStatus())
      return true
    } catch (error) {
      console.error('Erreur lors du démarrage du service:', error)
      return false
    }
  }

  const stopAutoBackup = () => {
    backupService.stopAutoBackup()
    setServiceStatus(backupService.getStatus())
  }

  useEffect(() => {
    loadData()
    
    // Actualiser les données toutes les 30 secondes
    const interval = setInterval(loadData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return {
    backups,
    logs,
    loading,
    serviceStatus,
    createBackup,
    restoreBackup,
    deleteBackup,
    startAutoBackup,
    stopAutoBackup,
    refresh: loadData
  }
}





























