import { createClient } from './browser'

const supabase = createClient()

export interface BackupData {
  recettes: any[]
  depenses: any[]
  budgets: any[]
  transactions: any[]
  categories: any[]
  notes_depenses: any[]
  metadata: {
    exportDate: string
    totalRecords: number
    version: string
  }
}

export class BackupRestoreService {
  // Export complet avec relations préservées
  static async exportCompleteBackup(): Promise<BackupData> {
    console.log('📊 Début de l\'export complet...')
    
    try {
      // Récupérer toutes les données dans l'ordre correct
      const [recettes, depenses, budgets, transactions, categories, notes] = await Promise.all([
        this.getTableData('recettes'),
        this.getTableData('depenses'),
        this.getTableData('budgets'),
        this.getTableData('transactions'),
        this.getTableData('categories'),
        this.getTableData('notes_depenses')
      ])

      const totalRecords = recettes.length + depenses.length + budgets.length + transactions.length + categories.length + notes.length

      const backupData: BackupData = {
        recettes,
        depenses,
        budgets,
        transactions,
        categories,
        notes_depenses: notes,
        metadata: {
          exportDate: new Date().toISOString(),
          totalRecords,
          version: '1.0'
        }
      }

      console.log('✅ Export complet terminé:', {
        recettes: recettes.length,
        depenses: depenses.length,
        budgets: budgets.length,
        transactions: transactions.length,
        categories: categories.length,
        notes: notes.length,
        total: totalRecords
      })

      return backupData
    } catch (error) {
      console.error('❌ Erreur lors de l\'export:', error)
      throw error
    }
  }

  // Récupérer les données d'une table
  private static async getTableData(tableName: string): Promise<any[]> {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error(`❌ Erreur lors de la récupération de ${tableName}:`, error)
      return []
    }

    return data || []
  }

  // Télécharger le backup en JSON (plus facile à restaurer)
  static downloadBackupJSON(backupData: BackupData, filename: string = 'eddo-budg-backup.json') {
    const jsonContent = JSON.stringify(backupData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
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

  // Télécharger le backup en CSV (compatible avec l'ancien système)
  static downloadBackupCSV(backupData: BackupData, filename: string = 'eddo-budg-backup.csv') {
    let csvContent = `# BACKUP COMPLET EDDO-BUDG\n`
    csvContent += `# Date: ${backupData.metadata.exportDate}\n`
    csvContent += `# Version: ${backupData.metadata.version}\n`
    csvContent += `# Total enregistrements: ${backupData.metadata.totalRecords}\n\n`

    // Ajouter chaque table
    const tables = [
      { name: 'recettes', data: backupData.recettes },
      { name: 'depenses', data: backupData.depenses },
      { name: 'budgets', data: backupData.budgets },
      { name: 'transactions', data: backupData.transactions },
      { name: 'categories', data: backupData.categories },
      { name: 'notes_depenses', data: backupData.notes_depenses }
    ]

    for (const table of tables) {
      if (table.data.length > 0) {
        csvContent += this.convertTableToCSV(table.data, table.name)
      }
    }

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

  // Convertir une table en CSV
  private static convertTableToCSV(data: any[], tableName: string): string {
    if (!data || data.length === 0) {
      return `# Table: ${tableName}\n# Aucune donnée\n\n`
    }

    const columns = Object.keys(data[0])
    const header = `# Table: ${tableName}\n# Nombre d'enregistrements: ${data.length}\n\n${columns.join(',')}\n`
    
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

  // Restaurer depuis un fichier JSON
  static async restoreFromJSON(jsonContent: string): Promise<{ success: boolean, message: string }> {
    try {
      const backupData: BackupData = JSON.parse(jsonContent)
      
      console.log('🔄 Début de la restauration...')
      console.log('📊 Données à restaurer:', {
        recettes: backupData.recettes.length,
        depenses: backupData.depenses.length,
        budgets: backupData.budgets.length,
        transactions: backupData.transactions.length,
        categories: backupData.categories.length,
        notes: backupData.notes_depenses.length
      })

      // Vider les tables existantes (ATTENTION: DESTRUCTIF!)
      await this.clearAllTables()

      // Insérer dans l'ordre correct pour respecter les contraintes
      const results = await Promise.all([
        this.insertTableData('categories', backupData.categories),
        this.insertTableData('budgets', backupData.budgets),
        this.insertTableData('recettes', backupData.recettes),
        this.insertTableData('transactions', backupData.transactions),
        this.insertTableData('depenses', backupData.depenses),
        this.insertTableData('notes_depenses', backupData.notes_depenses)
      ])

      const totalRestored = results.reduce((sum, count) => sum + count, 0)

      console.log('✅ Restauration terminée:', { totalRestored })

      return {
        success: true,
        message: `Restauration réussie: ${totalRestored} enregistrements restaurés`
      }
    } catch (error) {
      console.error('❌ Erreur lors de la restauration:', error)
      return {
        success: false,
        message: `Erreur lors de la restauration: ${error}`
      }
    }
  }

  // Vider toutes les tables
  private static async clearAllTables(): Promise<void> {
    const tables = ['notes_depenses', 'depenses', 'transactions', 'recettes', 'budgets', 'categories']
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Supprimer tous les enregistrements
      
      if (error) {
        console.warn(`⚠️ Erreur lors du nettoyage de ${table}:`, error)
      }
    }
  }

  // Insérer les données d'une table
  private static async insertTableData(tableName: string, data: any[]): Promise<number> {
    if (!data || data.length === 0) {
      return 0
    }

    const { error } = await supabase
      .from(tableName)
      .insert(data)

    if (error) {
      console.error(`❌ Erreur lors de l'insertion dans ${tableName}:`, error)
      return 0
    }

    return data.length
  }
}


