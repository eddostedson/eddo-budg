import { createClient } from './browser'

const supabase = createClient()

export interface ExportStats {
  tableName: string
  count: number
  data: any[]
}

export class ExportService {
  // Récupérer toutes les données d'une table
  static async getTableData(tableName: string): Promise<ExportStats> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error(`❌ Erreur lors de la récupération de ${tableName}:`, error)
        return { tableName, count: 0, data: [] }
      }

      return {
        tableName,
        count: data?.length || 0,
        data: data || []
      }
    } catch (error) {
      console.error(`❌ Erreur inattendue pour ${tableName}:`, error)
      return { tableName, count: 0, data: [] }
    }
  }

  // Récupérer toutes les données de toutes les tables
  static async getAllData(): Promise<ExportStats[]> {
    const tables = [
      'recettes',
      'depenses', 
      'depenses_test',
      'budgets',
      'transactions',
      'categories',
      'notes_depenses'
    ]

    console.log('📊 Récupération de toutes les données...')
    
    const results = await Promise.all(
      tables.map(table => this.getTableData(table))
    )

    console.log('✅ Données récupérées:', results.map(r => `${r.tableName}: ${r.count} enregistrements`))
    
    return results
  }

  // Convertir les données en CSV
  static convertToCSV(data: any[], tableName: string): string {
    if (!data || data.length === 0) {
      return `# Table: ${tableName}\n# Aucune donnée\n\n`
    }

    // Obtenir les colonnes
    const columns = Object.keys(data[0])
    
    // Créer l'en-tête CSV
    const header = `# Table: ${tableName}\n# Nombre d'enregistrements: ${data.length}\n# Date d'export: ${new Date().toLocaleString('fr-FR')}\n\n${columns.join(',')}\n`
    
    // Créer les lignes de données
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col]
        // Échapper les virgules et guillemets dans les valeurs
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value || ''
      }).join(',')
    ).join('\n')
    
    return header + rows + '\n\n'
  }

  // Exporter toutes les données en CSV
  static async exportAllDataToCSV(): Promise<{ csvContent: string, stats: ExportStats[] }> {
    console.log('📊 Début de l\'export CSV...')
    
    const stats = await this.getAllData()
    
    let csvContent = `# EXPORT COMPLET DES DONNÉES EDDO-BUDG\n# Date: ${new Date().toLocaleString('fr-FR')}\n# Total des enregistrements: ${stats.reduce((sum, stat) => sum + stat.count, 0)}\n\n`
    
    // Ajouter les données de chaque table
    for (const stat of stats) {
      if (stat.count > 0) {
        csvContent += this.convertToCSV(stat.data, stat.tableName)
      }
    }
    
    console.log('✅ Export CSV terminé')
    
    return { csvContent, stats }
  }

  // Télécharger le fichier CSV
  static downloadCSV(csvContent: string, filename: string = 'eddo-budg-export.csv') {
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


