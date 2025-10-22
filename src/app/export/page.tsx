'use client'

import { useState, useEffect } from 'react'
import { ExportService, ExportStats } from '@/lib/supabase/export-service'
import { BackupRestoreService } from '@/lib/supabase/backup-restore-service'
import { BackupHistoryService, BackupHistory } from '@/lib/supabase/backup-history-service'
import { useNotifications } from '@/contexts/notification-context'

export default function ExportPage() {
  const [isExporting, setIsExporting] = useState(false)
  const [exportStats, setExportStats] = useState<ExportStats[]>([])
  const [lastExportDate, setLastExportDate] = useState<string | null>(null)
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([])
  const [backupStats, setBackupStats] = useState<any>(null)
  const { showSuccess, showError } = useNotifications()

  // Charger l'historique au montage du composant
  useEffect(() => {
    const history = BackupHistoryService.getBackupHistory()
    const stats = BackupHistoryService.getBackupStats()
    setBackupHistory(history)
    setBackupStats(stats)
  }, [])

  const handleExportCSV = async () => {
    try {
      setIsExporting(true)
      console.log('📊 Début de l\'export CSV...')
      
      const { csvContent, stats } = await ExportService.exportAllDataToCSV()
      
      // Télécharger le fichier
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `eddo-budg-export-${timestamp}.csv`
      ExportService.downloadCSV(csvContent, filename)
      
      // Mettre à jour les statistiques
      setExportStats(stats)
      setLastExportDate(new Date().toLocaleString('fr-FR'))
      
      // Sauvegarder dans l'historique
      await BackupHistoryService.saveBackupHistory(
        filename,
        csvContent.length,
        stats.map(stat => ({ name: stat.tableName, count: stat.count, data: stat.data })),
        'csv'
      )
      
      // Recharger l'historique
      const history = BackupHistoryService.getBackupHistory()
      const stats_global = BackupHistoryService.getBackupStats()
      setBackupHistory(history)
      setBackupStats(stats_global)
      
      // Calculer le total des enregistrements
      const totalRecords = stats.reduce((sum, stat) => sum + stat.count, 0)
      
      // Afficher la notification de succès
      showSuccess(
        "✅ Export CSV réussi !",
        `Fichier téléchargé: ${filename}\nTotal: ${totalRecords} enregistrements exportés`
      )
      
      console.log('✅ Export CSV terminé avec succès')
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'export CSV:', error)
      showError(
        "Erreur d'export CSV",
        "Une erreur est survenue lors de l'export CSV. Veuillez réessayer."
      )
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportJSON = async () => {
    try {
      setIsExporting(true)
      console.log('📊 Début de l\'export JSON...')
      
      const backupData = await BackupRestoreService.exportCompleteBackup()
      
      // Télécharger le fichier JSON
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `eddo-budg-backup-${timestamp}.json`
      BackupRestoreService.downloadBackupJSON(backupData, filename)
      
      // Mettre à jour les statistiques
      const stats: ExportStats[] = [
        { tableName: 'recettes', count: backupData.recettes.length, data: backupData.recettes },
        { tableName: 'depenses', count: backupData.depenses.length, data: backupData.depenses },
        { tableName: 'budgets', count: backupData.budgets.length, data: backupData.budgets },
        { tableName: 'transactions', count: backupData.transactions.length, data: backupData.transactions },
        { tableName: 'categories', count: backupData.categories.length, data: backupData.categories },
        { tableName: 'notes_depenses', count: backupData.notes_depenses.length, data: backupData.notes_depenses }
      ]
      setExportStats(stats)
      setLastExportDate(new Date().toLocaleString('fr-FR'))
      
      // Sauvegarder dans l'historique
      await BackupHistoryService.saveBackupHistory(
        filename,
        JSON.stringify(backupData).length,
        stats.map(stat => ({ name: stat.tableName, count: stat.count, data: stat.data })),
        'json'
      )
      
      // Recharger l'historique
      const history = BackupHistoryService.getBackupHistory()
      const stats_global = BackupHistoryService.getBackupStats()
      setBackupHistory(history)
      setBackupStats(stats_global)
      
      // Afficher la notification de succès
      showSuccess(
        "✅ Export JSON réussi !",
        `Fichier téléchargé: ${filename}\nTotal: ${backupData.metadata.totalRecords} enregistrements exportés\n✅ Compatible pour restauration`
      )
      
      console.log('✅ Export JSON terminé avec succès')
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'export JSON:', error)
      showError(
        "Erreur d'export JSON",
        "Une erreur est survenue lors de l'export JSON. Veuillez réessayer."
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Export des Données</h1>
              <p className="text-gray-600">Exporter toutes vos données en format CSV</p>
            </div>
          </div>

          {/* Boutons d'export */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <button
              onClick={handleExportJSON}
              disabled={isExporting}
              className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center gap-3 ${
                isExporting
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {isExporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Export en cours...
                </>
              ) : (
                <>
                  <span className="text-xl">💾</span>
                  Export JSON (Recommandé)
                </>
              )}
            </button>

            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center gap-3 ${
                isExporting
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {isExporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Export en cours...
                </>
              ) : (
                <>
                  <span className="text-xl">📊</span>
                  Export CSV (Lecture seule)
                </>
              )}
            </button>

            {lastExportDate && (
              <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
                Dernier export: {lastExportDate}
              </div>
            )}
          </div>
        </div>

        {/* Statistiques globales */}
        {backupStats && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="text-2xl">📈</span>
              Statistiques Globales
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{backupStats.totalBackups}</div>
                <div className="text-sm text-gray-600">Sauvegardes totales</div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {BackupHistoryService.formatFileSize(backupStats.totalSize)}
                </div>
                <div className="text-sm text-gray-600">Taille totale</div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                <div className="text-2xl font-bold text-purple-600">
                  {backupStats.totalRecords.toLocaleString('fr-FR')}
                </div>
                <div className="text-sm text-gray-600">Enregistrements</div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-200">
                <div className="text-2xl font-bold text-orange-600">
                  {backupStats.mostActiveTable || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Table la plus active</div>
              </div>
            </div>
          </div>
        )}

        {/* Historique des sauvegardes */}
        {backupHistory.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="text-2xl">📚</span>
              Historique des Sauvegardes
            </h2>
            
            <div className="space-y-4">
              {backupHistory.map((backup, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${backup.metadata.exportType === 'json' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                      <h3 className="text-lg font-semibold text-gray-800">{backup.filename}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        backup.metadata.exportType === 'json' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {backup.metadata.exportType.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {BackupHistoryService.formatDate(backup.exportDate)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{backup.totalRecords}</div>
                      <div className="text-sm text-gray-600">Enregistrements</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{backup.tables.length}</div>
                      <div className="text-sm text-gray-600">Tables</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">
                        {BackupHistoryService.formatFileSize(backup.fileSize)}
                      </div>
                      <div className="text-sm text-gray-600">Taille</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                    {backup.tables.map((table, tableIndex) => (
                      <div key={tableIndex} className="bg-white rounded-lg p-3 text-center border-2 border-gray-200 hover:border-blue-300 transition-colors">
                        <div className="text-sm font-medium text-gray-800 capitalize mb-2">
                          {table.name.replace('_', ' ')}
                        </div>
                        <div className="text-lg font-bold text-blue-600 mb-1">{table.count}</div>
                        <div className="text-xs text-gray-500 mb-3">
                          {BackupHistoryService.formatFileSize(table.size)}
                        </div>
                        {table.csvContent && (
                          <button
                            onClick={() => BackupHistoryService.downloadTableCSV(table.csvContent!, table.name, backup.exportDate)}
                            className="w-full px-2 py-1 bg-green-500 text-white rounded-md text-xs hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
                          >
                            <span className="text-sm">📄</span>
                            CSV
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistiques des tables */}
        {exportStats.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="text-2xl">📈</span>
              Statistiques des Données
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {exportStats.map((stat, index) => (
                <div
                  key={stat.tableName}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    stat.count > 0
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 capitalize">
                      {stat.tableName.replace('_', ' ')}
                    </h3>
                    <span className={`text-2xl ${
                      stat.count > 0 ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {stat.count > 0 ? '✅' : '📭'}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {stat.count.toLocaleString('fr-FR')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.count === 1 ? 'enregistrement' : 'enregistrements'}
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Total des enregistrements</h3>
                  <p className="text-gray-600">Toutes les tables confondues</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {exportStats.reduce((sum, stat) => sum + stat.count, 0).toLocaleString('fr-FR')}
                  </div>
                  <div className="text-sm text-gray-600">enregistrements</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Informations sur l'export */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="text-2xl">ℹ️</span>
            Informations sur l'Export
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Tables exportées :</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span>Recettes (revenus)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span>Dépenses</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span>Budgets</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span>Transactions</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span>Catégories</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span>Notes de dépenses</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Format du fichier :</h3>
              <div className="space-y-2 text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">📄</span>
                  <span>Format CSV (Comma Separated Values)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">📊</span>
                  <span>Compatible Excel, LibreOffice, Google Sheets</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">🔒</span>
                  <span>Données sécurisées et complètes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">📅</span>
                  <span>Horodatage automatique</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
