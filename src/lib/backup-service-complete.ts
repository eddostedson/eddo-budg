import { createClient } from './supabase/browser'

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

export class CompleteBackupService {
  private static instance: CompleteBackupService
  private backupInterval: NodeJS.Timeout | null = null
  private isRunning = false

  static getInstance(): CompleteBackupService {
    if (!CompleteBackupService.instance) {
      CompleteBackupService.instance = new CompleteBackupService()
    }
    return CompleteBackupService.instance
  }

  // Obtenir toutes les tables avec des données
  private async getAllTablesWithData(): Promise<string[]> {
    try {
      // Liste des tables connues de l'application
      const knownTables = [
        'notes_depenses',
        'depenses', 
        'recettes',
        'categories',
        'goals',
        'transactions',
        'budgets',
        'transferts'
      ]
      
      const tablesWithData: string[] = []

      // Vérifier chaque table connue pour voir si elle contient des données
      for (const tableName of knownTables) {
        try {
          console.log(`🔍 Vérification de la table: ${tableName}`)
          
          const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })

          if (countError) {
            console.log(`❌ Erreur table ${tableName}:`, countError.message)
            console.log(`   Détails:`, countError)
          } else if (count && count > 0) {
            tablesWithData.push(tableName)
            console.log(`✅ Table ${tableName}: ${count} enregistrements`)
          } else {
            console.log(`⚠️ Table ${tableName}: ${count || 0} enregistrements`)
          }
        } catch (err: any) {
          console.log(`❌ Table ${tableName}: erreur -`, err.message)
        }
      }

      console.log(`📊 Tables avec des données trouvées: ${tablesWithData.length} (${tablesWithData.join(', ')})`)
      return tablesWithData
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des tables:', error)
      return []
    }
  }

  // Sauvegarder toutes les tables avec des données
  async createCompleteBackup(name?: string): Promise<BackupInfo | null> {
    const startTime = Date.now()
    const backupName = name || `complete_backup_${new Date().toISOString().replace(/[:.]/g, '-')}`
    
    try {
      console.log('🔄 Début de la sauvegarde complète depuis l\'application...')
      
      // Utiliser la fonction RPC pour tout faire automatiquement
      const { data, error } = await supabase.rpc('create_complete_backup_with_rls', {
        backup_name: backupName
      })

      if (error) {
        console.error('❌ Erreur RPC:', error)
        throw new Error(`Erreur sauvegarde RPC: ${error.message}`)
      }

      if (!data || !data.success) {
        throw new Error('Échec de la sauvegarde RPC')
      }

      console.log('✅ Sauvegarde RPC réussie:', data)

      const duration = Date.now() - startTime
      const backupInfo: BackupInfo = {
        id: data.backup_id,
        name: data.backup_name,
        timestamp: new Date(),
        size: JSON.stringify(data).length,
        status: 'success',
        tables: Object.keys(data.tables),
        error: undefined
      }

      console.log('✅ Sauvegarde complète créée et confirmée:', backupInfo)
      return backupInfo

    } catch (error: any) {
      const duration = Date.now() - startTime
      console.error('❌ Erreur lors de la sauvegarde complète:', error)
      
      await this.logBackupEvent('error', `Erreur sauvegarde complète: ${error.message}`, undefined, duration)
      
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

  // Démarrer le service de sauvegarde automatique
  async startAutoBackup(intervalMinutes: number = 30): Promise<void> {
    if (this.isRunning) {
      console.log('🔄 Service de sauvegarde complète déjà en cours')
      return
    }

    this.isRunning = true
    console.log(`🛡️ Démarrage du service de sauvegarde complète (${intervalMinutes}min)`)

    // Sauvegarde immédiate
    await this.createCompleteBackup()

    // Programmer les sauvegardes suivantes
    this.backupInterval = setInterval(async () => {
      await this.createCompleteBackup()
    }, intervalMinutes * 60 * 1000)

    await this.logBackupEvent('started', `Service de sauvegarde complète démarré (${intervalMinutes}min)`)
  }

  // Arrêter le service
  stopAutoBackup(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval)
      this.backupInterval = null
    }
    this.isRunning = false
    console.log('⏹️ Service de sauvegarde complète arrêté')
  }

  // Récupérer les sauvegardes
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

  // Récupérer les logs
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

  // Restaurer une sauvegarde
  async restoreBackup(backupId: string): Promise<boolean> {
    try {
      console.log('🔄 Restauration de la sauvegarde complète...')
      await this.logBackupEvent('started', `Début de la restauration: ${backupId}`)

      // 1. Récupérer la sauvegarde
      const { data: backup, error: fetchError } = await supabase
        .from('backups')
        .select('*')
        .eq('id', backupId)
        .single()

      if (fetchError) throw fetchError

      // 2. Restaurer chaque table
      for (const [tableName, tableData] of Object.entries(backup.data)) {
        if (Array.isArray(tableData) && tableData.length > 0) {
          try {
            // Vider la table actuelle
            await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000')
            
            // Insérer les données sauvegardées
            const { error: insertError } = await supabase
              .from(tableName)
              .insert(tableData)

            if (insertError) {
              console.error(`❌ Erreur restauration table ${tableName}:`, insertError)
            } else {
              console.log(`✅ Table ${tableName} restaurée: ${tableData.length} enregistrements`)
            }
          } catch (err) {
            console.error(`❌ Erreur lors de la restauration de ${tableName}:`, err)
          }
        }
      }

      await this.logBackupEvent('success', `Restauration complète terminée: ${backup.name}`)
      console.log('✅ Restauration complète terminée')
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

      if (data) {
        console.log(`✅ Log enregistré avec succès: ${data.id}`)
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement du log:', error)
    }
  }

  // Désactiver RLS temporairement
  private async disableRLSTemporarily(): Promise<void> {
    try {
      const { error } = await supabase.rpc('disable_rls_for_backup')
      if (error) {
        console.log('⚠️ Impossible de désactiver RLS via RPC, tentative directe...')
        // Fallback: essayer de désactiver RLS directement
        await this.disableRLSDirect()
      } else {
        console.log('✅ RLS désactivé via RPC')
      }
    } catch (error) {
      console.log('⚠️ Erreur RPC, tentative directe...')
      await this.disableRLSDirect()
    }
  }

  // Désactiver RLS directement
  private async disableRLSDirect(): Promise<void> {
    const tables = ['depenses', 'recettes', 'notes_depenses', 'categories', 'goals', 'transactions', 'budgets', 'transferts']
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          console.log(`✅ Accès à ${table} réussi`)
        }
      } catch (err) {
        console.log(`⚠️ Table ${table}: ${err}`)
      }
    }
  }

  // Réactiver RLS
  private async enableRLS(): Promise<void> {
    try {
      const { error } = await supabase.rpc('enable_rls_for_backup')
      if (error) {
        console.log('⚠️ Impossible de réactiver RLS via RPC')
      } else {
        console.log('✅ RLS réactivé via RPC')
      }
    } catch (error) {
      console.log('⚠️ Erreur lors de la réactivation de RLS:', error)
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
export const completeBackupService = CompleteBackupService.getInstance()
