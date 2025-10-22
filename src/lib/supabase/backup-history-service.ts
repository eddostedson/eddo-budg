import { createClient } from './browser'

const supabase = createClient()

export interface BackupHistory {
  id: string
  filename: string
  exportDate: string
  fileSize: number
  totalRecords: number
  tables: {
    name: string
    count: number
    size: number
    csvContent?: string // Contenu CSV de cette table
  }[]
  metadata: {
    version: string
    userEmail?: string
    exportType: 'json' | 'csv'
  }
  fileContent?: string // Contenu du fichier principal
}

export class BackupHistoryService {
  // Sauvegarder l'historique d'un export
  static async saveBackupHistory(
    filename: string,
    fileSize: number,
    tables: { name: string; count: number; data: any[] }[],
    exportType: 'json' | 'csv' = 'json',
    fileContent?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const backupHistory: Omit<BackupHistory, 'id'> = {
        filename,
        exportDate: new Date().toISOString(),
        fileSize,
        totalRecords: tables.reduce((sum, table) => sum + table.count, 0),
        tables: tables.map(table => ({
          name: table.name,
          count: table.count,
          size: JSON.stringify(table.data).length,
          csvContent: this.convertTableToCSV(table.data, table.name) // Générer le CSV de chaque table
        })),
        metadata: {
          version: '1.0',
          userEmail: user?.email,
          exportType
        },
        fileContent // Stocker le contenu du fichier principal
      }

      // Stocker dans localStorage pour l'instant (en production, utiliser une vraie base)
      const existingHistory = this.getBackupHistory()
      const newHistory = [backupHistory, ...existingHistory].slice(0, 50) // Garder les 50 derniers
      
      localStorage.setItem('eddo-budg-backup-history', JSON.stringify(newHistory))
      
      console.log('✅ Historique de sauvegarde enregistré:', backupHistory)
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de l\'historique:', error)
    }
  }

  // Récupérer l'historique des sauvegardes
  static getBackupHistory(): BackupHistory[] {
    try {
      const history = localStorage.getItem('eddo-budg-backup-history')
      return history ? JSON.parse(history) : []
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'historique:', error)
      return []
    }
  }

  // Supprimer une sauvegarde de l'historique
  static deleteBackupFromHistory(id: string): void {
    try {
      const history = this.getBackupHistory()
      const newHistory = history.filter(backup => backup.id !== id)
      localStorage.setItem('eddo-budg-backup-history', JSON.stringify(newHistory))
      console.log('✅ Sauvegarde supprimée de l\'historique')
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error)
    }
  }

  // Nettoyer l'historique (supprimer les anciennes sauvegardes)
  static cleanOldBackups(keepLast: number = 20): void {
    try {
      const history = this.getBackupHistory()
      const cleanedHistory = history.slice(0, keepLast)
      localStorage.setItem('eddo-budg-backup-history', JSON.stringify(cleanedHistory))
      console.log(`✅ Historique nettoyé, ${cleanedHistory.length} sauvegardes conservées`)
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error)
    }
  }

  // Obtenir les statistiques globales
  static getBackupStats(): {
    totalBackups: number
    totalSize: number
    totalRecords: number
    lastBackup?: string
    mostActiveTable?: string
  } {
    const history = this.getBackupHistory()
    
    if (history.length === 0) {
      return {
        totalBackups: 0,
        totalSize: 0,
        totalRecords: 0
      }
    }

    const totalSize = history.reduce((sum, backup) => sum + backup.fileSize, 0)
    const totalRecords = history.reduce((sum, backup) => sum + backup.totalRecords, 0)
    
    // Trouver la table la plus sauvegardée
    const tableCounts: { [key: string]: number } = {}
    history.forEach(backup => {
      backup.tables.forEach(table => {
        tableCounts[table.name] = (tableCounts[table.name] || 0) + table.count
      })
    })
    
    const mostActiveTable = Object.entries(tableCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0]

    return {
      totalBackups: history.length,
      totalSize,
      totalRecords,
      lastBackup: history[0]?.exportDate,
      mostActiveTable
    }
  }

  // Formater la taille en unités lisibles
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Formater la date
  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Convertir une table en CSV
  static convertTableToCSV(data: any[], tableName: string): string {
    if (!data || data.length === 0) {
      return `# Table: ${tableName}\n# Aucune donnée\n\n`
    }

    const columns = Object.keys(data[0])
    const header = `# Table: ${tableName}\n# Nombre d'enregistrements: ${data.length}\n# Date d'export: ${new Date().toLocaleString('fr-FR')}\n\n${columns.join(',')}\n`
    
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col]
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value || ''
      }).join(',')
    ).join('\n')
    
    return header + rows + '\n\n'
  }

  // Télécharger le CSV d'une table spécifique
  static downloadTableCSV(csvContent: string, tableName: string, exportDate: string): void {
    const timestamp = exportDate.split('T')[0]
    const filename = `${tableName}-${timestamp}.csv`
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
}
