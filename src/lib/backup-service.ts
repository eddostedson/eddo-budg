import { createClient } from './supabase/browser'
import { useNotifications } from '@/contexts/notification-context'

const supabase = createClient()

export interface BackupInfo {
  id: string
  name: string
  timestamp: Date
  size: number
  status: 'success' | 'error' | 'in_progress'
  tables: string[]
  error?: string
}

export interface BackupLog {
  id: string
  timestamp: Date
  status: 'success' | 'error' | 'started'
  message: string
  backupId?: string
  duration?: number
}

export class BackupService {
  private static instance: BackupService
  private backupInterval: NodeJS.Timeout | null = null
  private isRunning = false

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService()
    }
    return BackupService.instance
  }

  // Démarrer le service de sauvegarde automatique
  async startAutoBackup(intervalMinutes: number = 30): Promise<void> {
    if (this.isRunning) {
      console.log('🔄 Service de sauvegarde déjà en cours')
      return
    }

    this.isRunning = true
    console.log(`🛡️ Démarrage du service de sauvegarde (${intervalMinutes}min)`)

    // Sauvegarde immédiate
    await this.createBackup()

    // Programmer les sauvegardes suivantes
    this.backupInterval = setInterval(async () => {
      await this.createBackup()
    }, intervalMinutes * 60 * 1000)

    // Enregistrer le démarrage dans les logs
    await this.logBackupEvent('started', `Service de sauvegarde démarré (${intervalMinutes}min)`)
  }

  // Arrêter le service de sauvegarde
  stopAutoBackup(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval)
      this.backupInterval = null
    }
    this.isRunning = false
    console.log('⏹️ Service de sauvegarde arrêté')
  }

  // Créer une sauvegarde manuelle
  async createBackup(name?: string): Promise<BackupInfo | null> {
    const startTime = Date.now()
    const backupName = name || `backup_${new Date().toISOString().replace(/[:.]/g, '-')}`
    
    try {
      console.log('🔄 Création de la sauvegarde...')
      await this.logBackupEvent('started', `Début de la sauvegarde: ${backupName}`)

      // 1. Sauvegarder notes_depenses
      const { data: notes, error: notesError } = await supabase
        .from('notes_depenses')
        .select('*')

      if (notesError) throw notesError

      // 2. Sauvegarder depenses
      const { data: depenses, error: depensesError } = await supabase
        .from('depenses')
        .select('*')

      if (depensesError) throw depensesError

      // 3. Sauvegarder recettes
      const { data: recettes, error: recettesError } = await supabase
        .from('recettes')
        .select('*')

      if (recettesError) throw recettesError

      // 4. Créer l'enregistrement de sauvegarde
      const backupData = {
        name: backupName,
        timestamp: new Date().toISOString(),
        status: 'success',
        tables: ['notes_depenses', 'depenses', 'recettes'],
        data: {
          notes_depenses: notes || [],
          depenses: depenses || [],
          recettes: recettes || []
        }
      }

      // 5. Sauvegarder dans la table des sauvegardes
      const { data: backupRecord, error: saveError } = await supabase
        .from('backups')
        .insert(backupData)
        .select()
        .single()

      if (saveError) {
        console.error('❌ Erreur lors de la sauvegarde en base:', saveError)
        throw new Error(`Erreur sauvegarde en base: ${saveError.message}`)
      }

      // 6. Vérifier que la sauvegarde a bien été créée
      const { data: verifyBackup, error: verifyError } = await supabase
        .from('backups')
        .select('id, name, timestamp, status')
        .eq('id', backupRecord.id)
        .single()

      if (verifyError || !verifyBackup) {
        console.error('❌ Erreur de vérification de la sauvegarde:', verifyError)
        throw new Error('Impossible de vérifier la sauvegarde créée')
      }

      const duration = Date.now() - startTime
      const backupInfo: BackupInfo = {
        id: backupRecord.id,
        name: backupName,
        timestamp: new Date(backupRecord.timestamp),
        size: JSON.stringify(backupData.data).length,
        status: 'success',
        tables: backupData.tables
      }

      // 7. Enregistrer le log de succès avec confirmation
      await this.logBackupEvent('success', `Sauvegarde confirmée: ${backupName} (${backupData.tables.length} tables, ${JSON.stringify(backupData.data).length} bytes)`, backupRecord.id, duration)
      console.log('✅ Sauvegarde créée et confirmée:', backupInfo)
      
      return backupInfo

    } catch (error: any) {
      const duration = Date.now() - startTime
      console.error('❌ Erreur lors de la sauvegarde:', error)
      await this.logBackupEvent('error', `Erreur sauvegarde: ${error.message}`, undefined, duration)
      
      return {
        id: '',
        name: backupName,
        timestamp: new Date(),
        size: 0,
        status: 'error',
        tables: [],
        error: error.message
      }
    }
  }

  // Récupérer la liste des sauvegardes
  async getBackups(): Promise<BackupInfo[]> {
    try {
      const { data, error } = await supabase
        .from('backups')
        .select('*')
        .order('timestamp', { ascending: false })

      if (error) throw error

      return data.map(backup => ({
        id: backup.id,
        name: backup.name,
        timestamp: new Date(backup.timestamp),
        size: JSON.stringify(backup.data).length,
        status: backup.status,
        tables: backup.tables,
        error: backup.error
      }))

    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des sauvegardes:', error)
      return []
    }
  }

  // Restaurer depuis une sauvegarde
  async restoreBackup(backupId: string): Promise<boolean> {
    try {
      console.log('🔄 Restauration de la sauvegarde...')
      await this.logBackupEvent('started', `Début de la restauration: ${backupId}`)

      // 1. Récupérer la sauvegarde
      const { data: backup, error: fetchError } = await supabase
        .from('backups')
        .select('*')
        .eq('id', backupId)
        .single()

      if (fetchError) throw fetchError

      // 2. Vider les tables actuelles
      await supabase.from('notes_depenses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('depenses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('recettes').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      // 3. Restaurer les données
      if (backup.data.notes_depenses.length > 0) {
        const { error: notesError } = await supabase
          .from('notes_depenses')
          .insert(backup.data.notes_depenses)

        if (notesError) throw notesError
      }

      if (backup.data.depenses.length > 0) {
        const { error: depensesError } = await supabase
          .from('depenses')
          .insert(backup.data.depenses)

        if (depensesError) throw depensesError
      }

      if (backup.data.recettes.length > 0) {
        const { error: recettesError } = await supabase
          .from('recettes')
          .insert(backup.data.recettes)

        if (recettesError) throw recettesError
      }

      await this.logBackupEvent('success', `Restauration terminée: ${backup.name}`)
      console.log('✅ Restauration terminée avec succès')
      return true

    } catch (error: any) {
      console.error('❌ Erreur lors de la restauration:', error)
      await this.logBackupEvent('error', `Erreur restauration: ${error.message}`)
      return false
    }
  }

  // Supprimer une sauvegarde
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('backups')
        .delete()
        .eq('id', backupId)

      if (error) throw error

      await this.logBackupEvent('success', `Sauvegarde supprimée: ${backupId}`)
      return true

    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression:', error)
      return false
    }
  }

  // Récupérer les logs de sauvegarde
  async getBackupLogs(): Promise<BackupLog[]> {
    try {
      const { data, error } = await supabase
        .from('backup_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100)

      if (error) throw error

      return data.map(log => ({
        id: log.id,
        timestamp: new Date(log.timestamp),
        status: log.status,
        message: log.message,
        backupId: log.backup_id,
        duration: log.duration
      }))

    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des logs:', error)
      return []
    }
  }

  // Enregistrer un événement dans les logs
  private async logBackupEvent(status: 'started' | 'success' | 'error', message: string, backupId?: string, duration?: number): Promise<void> {
    try {
      console.log(`📝 Enregistrement du log: ${status} - ${message}`)
      
      const { data, error } = await supabase
        .from('backup_logs')
        .insert({
          status,
          message,
          backup_id: backupId,
          duration,
          timestamp: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur lors de l\'enregistrement du log:', error)
        throw error
      }

      // Vérifier que le log a bien été créé
      if (data) {
        console.log(`✅ Log enregistré avec succès: ${data.id}`)
      } else {
        console.error('❌ Aucune donnée retournée lors de la création du log')
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement du log:', error)
      // Ne pas relancer l'erreur pour éviter les boucles infinies
    }
  }

  // Obtenir le statut du service
  getStatus(): { isRunning: boolean; nextBackup?: Date } {
    return {
      isRunning: this.isRunning,
      nextBackup: this.isRunning ? new Date(Date.now() + 30 * 60 * 1000) : undefined
    }
  }
}

// Instance singleton
export const backupService = BackupService.getInstance()
